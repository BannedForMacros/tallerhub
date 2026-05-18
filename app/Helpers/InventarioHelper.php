<?php
namespace App\Helpers;

use App\Models\Correlativo;
use App\Models\EntradaAlmacen;
use App\Models\EntradaAlmacenDetalle;
use App\Models\Inventario;
use App\Models\ProductoAlmacen;
use App\Models\SalidaAlmacen;
use App\Models\SalidaAlmacenDetalle;
use App\Models\Venta;
use Illuminate\Validation\ValidationException;

class InventarioHelper
{
    /**
     * Sincroniza el inventario de una venta de forma idempotente.
     *
     * Compara las cantidades actualmente registradas en SalidaAlmacen con las
     * nuevas deseadas, aplica solo el delta necesario al stock, y reconstruye
     * los registros de salida. Puede llamarse N veces con los mismos datos sin
     * producir movimientos duplicados.
     *
     * Flujo:
     *   anterior = lo que ya está en SalidaAlmacen para esta venta
     *   nuevo    = los detalles tipo 'producto' que vienen en $detalles
     *   delta    = nuevo - anterior
     *
     *   delta > 0 → se vende más de ese producto  → decrementar stock
     *   delta < 0 → se vende menos o se eliminó   → incrementar stock (devolución)
     *   delta = 0 → sin cambio                    → no se toca el inventario
     */
    public static function sincronizarVenta(
        Venta  $venta,
        int    $empresaId,
        int    $localId,
        array  $detalles,
        int    $userId,
        string $fecha
    ): void {
        // ── 1. Cantidades actualmente registradas para esta venta ──────────────
        $salidaActual = SalidaAlmacen::where('referencia_id', $venta->id)
            ->where('referencia_tipo', 'venta')
            ->with('detalles')
            ->first();

        // clave: "productoId:unidadId" => cantidad_descontada
        $cantAnterior = [];
        if ($salidaActual) {
            foreach ($salidaActual->detalles as $det) {
                $k = "{$det->producto_id}:{$det->unidad_medida_id}";
                $cantAnterior[$k] = ($cantAnterior[$k] ?? 0) + (float) $det->cantidad;
            }
        }

        // ── 2. Cantidades deseadas según los nuevos detalles ──────────────────
        $cantNueva = [];
        foreach ($detalles as $det) {
            if (($det['tipo'] ?? '') !== 'producto' || empty($det['producto_id'])) {
                continue;
            }
            $k = "{$det['producto_id']}:{$det['unidad_medida_id']}";
            $cantNueva[$k] = ($cantNueva[$k] ?? 0) + (float) $det['cantidad'];
        }

        // ── 3. Calcular deltas ────────────────────────────────────────────────
        $todasLasClaves = array_unique(array_merge(
            array_keys($cantAnterior),
            array_keys($cantNueva)
        ));

        $deltas = [];
        foreach ($todasLasClaves as $k) {
            $delta = ($cantNueva[$k] ?? 0) - ($cantAnterior[$k] ?? 0);
            if (abs($delta) > 0.00001) {
                $deltas[$k] = $delta;
            }
        }

        // ── 4. Verificar stock suficiente para los deltas positivos ───────────
        foreach ($deltas as $k => $delta) {
            if ($delta <= 0) continue;
            [$productoId, $unidadId] = explode(':', $k);
            $inv = Inventario::where('empresa_id', $empresaId)
                ->where('local_id', $localId)
                ->where('producto_id', $productoId)
                ->where('unidad_medida_id', $unidadId)
                ->first();
            $disponible = $inv ? (float) $inv->stock : 0;
            if ($delta > $disponible) {
                $prod = ProductoAlmacen::find($productoId);
                throw ValidationException::withMessages([
                    'stock' => "Stock insuficiente para '{$prod->nombre}'. Disponible: {$disponible}, se necesita: {$delta}.",
                ]);
            }
        }

        // ── 5. Aplicar deltas al inventario ───────────────────────────────────
        foreach ($deltas as $k => $delta) {
            [$productoId, $unidadId] = explode(':', $k);
            $q = Inventario::where('empresa_id', $empresaId)
                ->where('local_id', $localId)
                ->where('producto_id', $productoId)
                ->where('unidad_medida_id', $unidadId);
            if ($delta > 0) {
                $q->decrement('stock', $delta);
            } else {
                $q->increment('stock', abs($delta));
            }
        }

        // ── 6. Actualizar/crear registros de SalidaAlmacen ────────────────────
        if (empty($cantNueva)) {
            // La venta ya no tiene productos → eliminar la salida si existía
            if ($salidaActual) {
                $salidaActual->detalles()->delete();
                $salidaActual->delete();
            }
            return;
        }

        if (!$salidaActual) {
            $salidaActual = SalidaAlmacen::create([
                'codigo'          => Correlativo::siguiente($empresaId, 'SAL'),
                'empresa_id'      => $empresaId,
                'local_id'        => $localId,
                'user_id'         => $userId,
                'tipo'            => 'venta',
                'motivo'          => 'Venta',
                'referencia_id'   => $venta->id,
                'referencia_tipo' => 'venta',
                'total'           => 0,
                'fecha'           => $fecha,
            ]);
        }

        // Reconstruir los detalles de la salida con las cantidades finales
        $salidaActual->detalles()->delete();
        $totalSalida = 0;

        foreach ($cantNueva as $k => $cantidad) {
            [$productoId, $unidadId] = explode(':', $k);

            $precioPromedio = (float) EntradaAlmacenDetalle::where('producto_id', $productoId)
                ->where('unidad_medida_id', $unidadId)
                ->whereHas('entrada', fn($q) => $q->where('local_id', $localId)->where('activo', 1))
                ->avg('precio_unitario') ?? 0;

            $subtotal     = $cantidad * $precioPromedio;
            $totalSalida += $subtotal;

            SalidaAlmacenDetalle::create([
                'salida_id'        => $salidaActual->id,
                'producto_id'      => $productoId,
                'unidad_medida_id' => $unidadId,
                'cantidad'         => $cantidad,
                'precio_unitario'  => $precioPromedio,
                'tipo_precio'      => 'costo',
                'subtotal'         => $subtotal,
            ]);
        }

        $salidaActual->update(['total' => $totalSalida, 'fecha' => $fecha]);
    }

    /**
     * Recalcula el stock real de un producto contando todos los movimientos
     * registrados: entradas activas menos salidas activas.
     * Útil para auditorías y para detectar inconsistencias.
     */
    public static function recalcularStockReal(
        int $empresaId,
        int $localId,
        int $productoId,
        int $unidadMedidaId
    ): float {
        $entradas = (float) EntradaAlmacenDetalle::where('producto_id', $productoId)
            ->where('unidad_medida_id', $unidadMedidaId)
            ->whereHas('entrada', fn($q) => $q
                ->where('empresa_id', $empresaId)
                ->where('local_id', $localId)
                ->where('activo', 1))
            ->sum('cantidad');

        $salidas = (float) SalidaAlmacenDetalle::where('producto_id', $productoId)
            ->where('unidad_medida_id', $unidadMedidaId)
            ->whereHas('salida', fn($q) => $q
                ->where('empresa_id', $empresaId)
                ->where('local_id', $localId)
                ->where('activo', 1))
            ->sum('cantidad');

        return $entradas - $salidas;
    }

    /**
     * Corrige el campo stock de la tabla inventario para que coincida con el
     * total real calculado desde los movimientos. Si la fila inventario no
     * existe la crea. Garantiza self-healing ante datos históricos inconsistentes.
     */
    public static function sincronizarStockDesdeMovimientos(
        int $empresaId,
        int $localId,
        int $productoId,
        int $unidadMedidaId
    ): float {
        $stockReal = self::recalcularStockReal($empresaId, $localId, $productoId, $unidadMedidaId);
        $stockFinal = max(0, $stockReal);

        $inv = Inventario::where('empresa_id', $empresaId)
            ->where('local_id', $localId)
            ->where('producto_id', $productoId)
            ->where('unidad_medida_id', $unidadMedidaId)
            ->first();

        if ($inv) {
            $inv->update(['stock' => $stockFinal]);
        } else {
            Inventario::create([
                'empresa_id'       => $empresaId,
                'local_id'         => $localId,
                'producto_id'      => $productoId,
                'unidad_medida_id' => $unidadMedidaId,
                'stock'            => $stockFinal,
                'stock_minimo'     => 0,
            ]);
        }

        return $stockFinal;
    }

    /**
     * Agrupa los detalles de un movimiento por (producto, unidad) sumando
     * cantidades. Útil cuando un mismo producto aparece varias veces en una
     * entrada o salida.
     */
    private static function agruparDetallesPorClave(iterable $detalles): array
    {
        $agrupado = [];
        foreach ($detalles as $det) {
            $k = "{$det->producto_id}:{$det->unidad_medida_id}";
            $agrupado[$k] = ($agrupado[$k] ?? 0) + (float) $det->cantidad;
        }
        return $agrupado;
    }

    /**
     * Anula una entrada de almacén. Self-healing: tras marcar la entrada como
     * inactiva, recalcula el stock de cada producto afectado desde los
     * movimientos reales, así corrige cualquier desfase histórico en la tabla
     * inventario. Bloquea si la anulación dejaría algún producto en negativo
     * (sus unidades ya fueron vendidas/sacadas).
     */
    public static function anularEntrada(EntradaAlmacen $entrada): void
    {
        if (!$entrada->activo) return;

        $entrada->loadMissing('detalles');
        $agrupado = self::agruparDetallesPorClave($entrada->detalles);

        // Validar que ningún producto quede en negativo cuando se aplique
        // la anulación. Comparamos contra el stock REAL (no inventario.stock).
        foreach ($agrupado as $k => $cantidad) {
            [$productoId, $unidadId] = explode(':', $k);
            $stockReal = self::recalcularStockReal(
                $entrada->empresa_id, $entrada->local_id, (int) $productoId, (int) $unidadId
            );
            if ($stockReal - $cantidad < -0.00001) {
                $prod = ProductoAlmacen::find($productoId);
                throw ValidationException::withMessages([
                    'stock' => "No se puede anular: '{$prod->nombre}' quedaría con stock negativo (stock real actual: {$stockReal}, se restaría: {$cantidad}). Anule primero las salidas o ventas que consumieron este lote.",
                ]);
            }
        }

        $entrada->update(['activo' => false]);

        foreach (array_keys($agrupado) as $k) {
            [$productoId, $unidadId] = explode(':', $k);
            self::sincronizarStockDesdeMovimientos(
                $entrada->empresa_id, $entrada->local_id, (int) $productoId, (int) $unidadId
            );
        }
    }

    /**
     * Reactiva una entrada previamente anulada. Self-healing.
     */
    public static function reactivarEntrada(EntradaAlmacen $entrada): void
    {
        if ($entrada->activo) return;

        $entrada->loadMissing('detalles');
        $agrupado = self::agruparDetallesPorClave($entrada->detalles);

        $entrada->update(['activo' => true]);

        foreach (array_keys($agrupado) as $k) {
            [$productoId, $unidadId] = explode(':', $k);
            self::sincronizarStockDesdeMovimientos(
                $entrada->empresa_id, $entrada->local_id, (int) $productoId, (int) $unidadId
            );
        }
    }

    /**
     * Anula una salida de almacén: devuelve stock al inventario. Self-healing.
     */
    public static function anularSalida(SalidaAlmacen $salida): void
    {
        if (!$salida->activo) return;

        $salida->loadMissing('detalles');
        $agrupado = self::agruparDetallesPorClave($salida->detalles);

        $salida->update(['activo' => false]);

        foreach (array_keys($agrupado) as $k) {
            [$productoId, $unidadId] = explode(':', $k);
            self::sincronizarStockDesdeMovimientos(
                $salida->empresa_id, $salida->local_id, (int) $productoId, (int) $unidadId
            );
        }
    }

    /**
     * Reactiva una salida previamente anulada. Self-healing.
     * Bloquea si reactivarla dejaría algún producto en negativo.
     */
    public static function reactivarSalida(SalidaAlmacen $salida): void
    {
        if ($salida->activo) return;

        $salida->loadMissing('detalles');
        $agrupado = self::agruparDetallesPorClave($salida->detalles);

        foreach ($agrupado as $k => $cantidad) {
            [$productoId, $unidadId] = explode(':', $k);
            $stockReal = self::recalcularStockReal(
                $salida->empresa_id, $salida->local_id, (int) $productoId, (int) $unidadId
            );
            if ($stockReal - $cantidad < -0.00001) {
                $prod = ProductoAlmacen::find($productoId);
                throw ValidationException::withMessages([
                    'stock' => "Stock insuficiente para reactivar la salida de '{$prod->nombre}'. Stock real disponible: {$stockReal}, se necesita: {$cantidad}.",
                ]);
            }
        }

        $salida->update(['activo' => true]);

        foreach (array_keys($agrupado) as $k) {
            [$productoId, $unidadId] = explode(':', $k);
            self::sincronizarStockDesdeMovimientos(
                $salida->empresa_id, $salida->local_id, (int) $productoId, (int) $unidadId
            );
        }
    }
}
