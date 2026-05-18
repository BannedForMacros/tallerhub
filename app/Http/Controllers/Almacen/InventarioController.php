<?php
namespace App\Http\Controllers\Almacen;

use App\Helpers\InventarioHelper;
use App\Http\Controllers\Controller;
use App\Models\EntradaAlmacenDetalle;
use App\Models\Inventario;
use App\Models\Local;
use App\Models\Empresa;
use App\Models\CategoriaAlmacen;
use App\Models\SalidaAlmacenDetalle;
use App\Models\Venta;
use Inertia\Inertia;

class InventarioController extends Controller
{
    public function index()
    {
        $user      = auth()->user();
        $empresaId = $user->esSuperAdmin() ? null : $user->empresa_id;

        $inventario = Inventario::with(['producto.categoria', 'unidadMedida', 'local'])
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('local_id')
            ->orderBy('producto_id')
            ->get();

        $locales = Local::where('activo', 1)
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('nombre')->get();

        $categorias = CategoriaAlmacen::where('activo', 1)
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('nombre')->get();

        $empresas = $user->esSuperAdmin()
            ? Empresa::where('activo', 1)->orderBy('nombre')->get()
            : collect();

        return Inertia::render('Almacen/Inventario/Index', [
            'inventario' => $inventario,
            'locales'    => $locales,
            'categorias' => $categorias,
            'empresas'   => $empresas,
        ]);
    }

    /**
     * Kárdex de un ítem de inventario (combinación empresa+local+producto+unidad).
     * Devuelve todas las entradas y salidas registradas para esa combinación,
     * ordenadas cronológicamente, con saldo acumulado calculado únicamente con
     * movimientos activos (los anulados aparecen pero no afectan el saldo).
     */
    public function kardex(Inventario $inventario)
    {
        $user = auth()->user();
        if (!$user->esSuperAdmin() && $inventario->empresa_id !== $user->empresa_id) abort(403);

        $inventario->load(['producto', 'unidadMedida', 'local']);

        $entradas = EntradaAlmacenDetalle::with(['entrada.usuario', 'proveedor'])
            ->where('producto_id',      $inventario->producto_id)
            ->where('unidad_medida_id', $inventario->unidad_medida_id)
            ->whereHas('entrada', fn($q) => $q
                ->where('empresa_id', $inventario->empresa_id)
                ->where('local_id',   $inventario->local_id))
            ->get()
            ->map(function ($d) {
                return [
                    'id'              => 'ent-' . $d->id,
                    'tipo'            => 'entrada',
                    'subtipo'         => null,
                    'codigo'          => $d->entrada?->codigo,
                    'fecha'           => $d->entrada?->fecha,
                    'cantidad'        => (float) $d->cantidad,
                    'precio_unitario' => (float) $d->precio_unitario,
                    'subtotal'        => (float) $d->subtotal,
                    'activo'          => (bool) ($d->entrada?->activo),
                    'motivo'          => $d->entrada?->motivo,
                    'observaciones'   => $d->entrada?->observaciones,
                    'usuario'         => $d->entrada?->usuario?->name,
                    'proveedor'       => $d->proveedor?->nombre,
                    'numero_factura'  => $d->numero_factura,
                    'referencia_id'   => null,
                    'referencia_tipo' => null,
                    'venta_codigo'    => null,
                    'entrada_id'      => $d->entrada_id,
                    'salida_id'       => null,
                ];
            });

        $salidas = SalidaAlmacenDetalle::with(['salida.usuario'])
            ->where('producto_id',      $inventario->producto_id)
            ->where('unidad_medida_id', $inventario->unidad_medida_id)
            ->whereHas('salida', fn($q) => $q
                ->where('empresa_id', $inventario->empresa_id)
                ->where('local_id',   $inventario->local_id))
            ->get();

        $ventaIds = $salidas
            ->filter(fn($d) => $d->salida?->referencia_tipo === 'venta' && $d->salida?->referencia_id)
            ->pluck('salida.referencia_id')
            ->unique()
            ->values();
        $ventas = Venta::whereIn('id', $ventaIds)->pluck('codigo', 'id');

        $salidas = $salidas->map(function ($d) use ($ventas) {
            $refId = $d->salida?->referencia_id;
            return [
                'id'              => 'sal-' . $d->id,
                'tipo'            => 'salida',
                'subtipo'         => $d->salida?->tipo,
                'codigo'          => $d->salida?->codigo,
                'fecha'           => $d->salida?->fecha,
                'cantidad'        => (float) $d->cantidad,
                'precio_unitario' => (float) $d->precio_unitario,
                'subtotal'        => (float) $d->subtotal,
                'activo'          => (bool) ($d->salida?->activo),
                'motivo'          => $d->salida?->motivo,
                'observaciones'   => $d->salida?->observaciones,
                'usuario'         => $d->salida?->usuario?->name,
                'proveedor'       => null,
                'numero_factura'  => null,
                'referencia_id'   => $refId,
                'referencia_tipo' => $d->salida?->referencia_tipo,
                'venta_codigo'    => $d->salida?->referencia_tipo === 'venta' ? ($ventas[$refId] ?? null) : null,
                'entrada_id'      => null,
                'salida_id'       => $d->salida_id,
            ];
        });

        // Orden cronológico ascendente; desempate por tipo (entrada antes que salida)
        // y por id, para mantener determinismo cuando dos movimientos comparten fecha.
        $movimientos = $entradas->merge($salidas)->sortBy([
            ['fecha', 'asc'],
            ['tipo',  'asc'],
            ['id',    'asc'],
        ])->values();

        $saldo = 0.0;
        $movimientos = $movimientos->map(function ($m) use (&$saldo) {
            if ($m['activo']) {
                $saldo += $m['tipo'] === 'entrada' ? $m['cantidad'] : -$m['cantidad'];
            }
            $m['saldo'] = round($saldo, 4);
            return $m;
        });

        // Mostrar de más reciente a más antiguo
        $movimientos = $movimientos->reverse()->values();

        return response()->json([
            'inventario' => [
                'id'             => $inventario->id,
                'producto'       => $inventario->producto ? [
                    'nombre' => $inventario->producto->nombre,
                    'codigo' => $inventario->producto->codigo,
                ] : null,
                'unidad_medida'  => $inventario->unidadMedida ? [
                    'nombre'      => $inventario->unidadMedida->nombre,
                    'abreviatura' => $inventario->unidadMedida->abreviatura,
                ] : null,
                'local'          => $inventario->local ? ['nombre' => $inventario->local->nombre] : null,
                'stock'          => (float) $inventario->stock,
                'stock_minimo'   => (float) $inventario->stock_minimo,
            ],
            'movimientos' => $movimientos,
        ]);
    }

    /**
     * Recalcula el campo `inventario.stock` desde los movimientos reales para
     * un único ítem. Sirve para corregir desfases dejados por bugs históricos
     * (p. ej. anular-sin-recalcular antes del fix de toggleActivo).
     */
    public function resincronizar(Inventario $inventario)
    {
        $user = auth()->user();
        if (!$user->esSuperAdmin() && $inventario->empresa_id !== $user->empresa_id) abort(403);

        $stockAnterior = (float) $inventario->stock;

        $stockNuevo = InventarioHelper::sincronizarStockDesdeMovimientos(
            $inventario->empresa_id,
            $inventario->local_id,
            $inventario->producto_id,
            $inventario->unidad_medida_id,
        );

        return response()->json([
            'stock_anterior' => $stockAnterior,
            'stock_nuevo'    => $stockNuevo,
            'diferencia'     => round($stockNuevo - $stockAnterior, 4),
        ]);
    }
}