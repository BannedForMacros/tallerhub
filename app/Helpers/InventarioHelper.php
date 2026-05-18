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
     * calculado desde los movimientos reales. Para recuperación de datos.
     */
    public static function sincronizarStockDesdeMovimientos(
        int $empresaId,
        int $localId,
        int $productoId,
        int $unidadMedidaId
    ): void {
        $stockReal = self::recalcularStockReal($empresaId, $localId, $productoId, $unidadMedidaId);

        Inventario::where('empresa_id', $empresaId)
            ->where('local_id', $localId)
            ->where('producto_id', $productoId)
            ->where('unidad_medida_id', $unidadMedidaId)
            ->update(['stock' => max(0, $stockReal)]);
    }

    /**
     * Anula una entrada de almacén: revierte el stock de cada detalle.
     * Bloquea la operación si el stock actual no alcanza para revertir
     * (típicamente porque ya hubo salidas/ventas que consumieron ese lote).
     */
    public static function anularEntrada(EntradaAlmacen $entrada): void
    {
        if (!$entrada->activo) return;

        $entrada->loadMissing('detalles');

        foreach ($entrada->detalles as $det) {
            $inv = Inventario::where('empresa_id',       $entrada->empresa_id)
                ->where('local_id',         $entrada->local_id)
                ->where('producto_id',      $det->producto_id)
                ->where('unidad_medida_id', $det->unidad_medida_id)
                ->first();

            $disponible = $inv ? (float) $inv->stock : 0;
            if ((float) $det->cantidad > $disponible) {
                $prod = ProductoAlmacen::find($det->producto_id);
                throw ValidationException::withMessages([
                    'stock' => "No se puede anular: el stock actual de '{$prod->nombre}' ({$disponible}) es menor a la cantidad ingresada en esta entrada ({$det->cantidad}). Anule primero las salidas o ventas que consumieron este lote.",
                ]);
            }
        }

        foreach ($entrada->detalles as $det) {
            Inventario::where('empresa_id',       $entrada->empresa_id)
                ->where('local_id',         $entrada->local_id)
                ->where('producto_id',      $det->producto_id)
                ->where('unidad_medida_id', $det->unidad_medida_id)
                ->decrement('stock', $det->cantidad);
        }

        $entrada->update(['activo' => false]);
    }

    /**
     * Reactiva una entrada previamente anulada: vuelve a sumar el stock.
     */
    public static function reactivarEntrada(EntradaAlmacen $entrada): void
    {
        if ($entrada->activo) return;

        $entrada->loadMissing('detalles');

        foreach ($entrada->detalles as $det) {
            $inv = Inventario::where('empresa_id',       $entrada->empresa_id)
                ->where('local_id',         $entrada->local_id)
                ->where('producto_id',      $det->producto_id)
                ->where('unidad_medida_id', $det->unidad_medida_id)
                ->first();

            if ($inv) {
                $inv->increment('stock', $det->cantidad);
            } else {
                Inventario::create([
                    'empresa_id'       => $entrada->empresa_id,
                    'local_id'         => $entrada->local_id,
                    'producto_id'      => $det->producto_id,
                    'unidad_medida_id' => $det->unidad_medida_id,
                    'stock'            => $det->cantidad,
                    'stock_minimo'     => 0,
                ]);
            }
        }

        $entrada->update(['activo' => true]);
    }

    /**
     * Anula una salida de almacén: devuelve el stock al inventario.
     */
    public static function anularSalida(SalidaAlmacen $salida): void
    {
        if (!$salida->activo) return;

        $salida->loadMissing('detalles');

        foreach ($salida->detalles as $det) {
            $inv = Inventario::where('empresa_id',       $salida->empresa_id)
                ->where('local_id',         $salida->local_id)
                ->where('producto_id',      $det->producto_id)
                ->where('unidad_medida_id', $det->unidad_medida_id)
                ->first();

            if ($inv) {
                $inv->increment('stock', $det->cantidad);
            } else {
                Inventario::create([
                    'empresa_id'       => $salida->empresa_id,
                    'local_id'         => $salida->local_id,
                    'producto_id'      => $det->producto_id,
                    'unidad_medida_id' => $det->unidad_medida_id,
                    'stock'            => $det->cantidad,
                    'stock_minimo'     => 0,
                ]);
            }
        }

        $salida->update(['activo' => false]);
    }

    /**
     * Reactiva una salida previamente anulada: vuelve a descontar el stock.
     * Bloquea si el stock actual no alcanza.
     */
    public static function reactivarSalida(SalidaAlmacen $salida): void
    {
        if ($salida->activo) return;

        $salida->loadMissing('detalles');

        foreach ($salida->detalles as $det) {
            $inv = Inventario::where('empresa_id',       $salida->empresa_id)
                ->where('local_id',         $salida->local_id)
                ->where('producto_id',      $det->producto_id)
                ->where('unidad_medida_id', $det->unidad_medida_id)
                ->first();

            $disponible = $inv ? (float) $inv->stock : 0;
            if ((float) $det->cantidad > $disponible) {
                $prod = ProductoAlmacen::find($det->producto_id);
                throw ValidationException::withMessages([
                    'stock' => "Stock insuficiente para reactivar la salida de '{$prod->nombre}'. Disponible: {$disponible}, se necesita: {$det->cantidad}.",
                ]);
            }
        }

        foreach ($salida->detalles as $det) {
            Inventario::where('empresa_id',       $salida->empresa_id)
                ->where('local_id',         $salida->local_id)
                ->where('producto_id',      $det->producto_id)
                ->where('unidad_medida_id', $det->unidad_medida_id)
                ->decrement('stock', $det->cantidad);
        }

        $salida->update(['activo' => true]);
    }
}
