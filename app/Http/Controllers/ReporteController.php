<?php
namespace App\Http\Controllers;

use App\Models\Empresa;
use App\Models\Local;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class ReporteController extends Controller
{
    private function filtros(Request $request): array
    {
        $user = auth()->user();
        return [
            'empresa_id' => $user->esSuperAdmin()
                ? ($request->integer('empresa_id') ?: null)
                : $user->empresa_id,
            'local_id'   => $request->integer('local_id') ?: null,
            'desde'      => $request->input('desde', now()->startOfMonth()->toDateString()),
            'hasta'      => $request->input('hasta', now()->toDateString()),
            'top'        => $request->integer('top', 10),
        ];
    }

    private function queryVentasPorFecha(array $f): array
    {
        return DB::table('ventas')
            ->where('activo', true)
            ->where('estado', '!=', 'anulado')
            ->when($f['empresa_id'], fn($q) => $q->where('empresa_id', $f['empresa_id']))
            ->when($f['local_id'],   fn($q) => $q->where('local_id',   $f['local_id']))
            ->whereBetween(DB::raw("DATE(fecha)"), [$f['desde'], $f['hasta']])
            ->select(
                DB::raw("DATE(fecha) as dia"),
                DB::raw('SUM(total) as total'),
                DB::raw('COUNT(*) as cantidad')
            )
            ->groupBy(DB::raw('DATE(fecha)'))
            ->orderBy('dia')
            ->get()
            ->map(fn($r) => ['dia' => $r->dia, 'total' => (float)$r->total, 'cantidad' => (int)$r->cantidad])
            ->toArray();
    }

    private function queryServiciosTop(array $f): array
    {
        return DB::table('ventas_detalle')
            ->join('ventas', 'ventas.id', '=', 'ventas_detalle.venta_id')
            ->join('servicios', 'servicios.id', '=', 'ventas_detalle.servicio_id')
            ->where('ventas_detalle.tipo', 'servicio')
            ->where('ventas.activo', true)
            ->where('ventas.estado', '!=', 'anulado')
            ->when($f['empresa_id'], fn($q) => $q->where('ventas.empresa_id', $f['empresa_id']))
            ->when($f['local_id'],   fn($q) => $q->where('ventas.local_id',   $f['local_id']))
            ->whereBetween(DB::raw("DATE(ventas.fecha)"), [$f['desde'], $f['hasta']])
            ->select(
                'servicios.nombre',
                DB::raw('SUM(ventas_detalle.cantidad) as cantidad_vendida'),
                DB::raw('SUM(ventas_detalle.subtotal) as total_facturado')
            )
            ->groupBy('servicios.id', 'servicios.nombre')
            ->orderByDesc('total_facturado')
            ->limit($f['top'])
            ->get()
            ->map(fn($r) => [
                'nombre'           => $r->nombre,
                'cantidad_vendida' => (float)$r->cantidad_vendida,
                'total_facturado'  => (float)$r->total_facturado,
            ])
            ->toArray();
    }

    private function queryProductosTop(array $f): array
    {
        return DB::table('ventas_detalle')
            ->join('ventas', 'ventas.id', '=', 'ventas_detalle.venta_id')
            ->join('productos_almacen', 'productos_almacen.id', '=', 'ventas_detalle.producto_id')
            ->where('ventas_detalle.tipo', 'producto')
            ->where('ventas.activo', true)
            ->where('ventas.estado', '!=', 'anulado')
            ->when($f['empresa_id'], fn($q) => $q->where('ventas.empresa_id', $f['empresa_id']))
            ->when($f['local_id'],   fn($q) => $q->where('ventas.local_id',   $f['local_id']))
            ->whereBetween(DB::raw("DATE(ventas.fecha)"), [$f['desde'], $f['hasta']])
            ->select(
                'productos_almacen.nombre',
                DB::raw('SUM(ventas_detalle.cantidad) as cantidad_vendida'),
                DB::raw('SUM(ventas_detalle.subtotal) as total_facturado')
            )
            ->groupBy('productos_almacen.id', 'productos_almacen.nombre')
            ->orderByDesc('total_facturado')
            ->limit($f['top'])
            ->get()
            ->map(fn($r) => [
                'nombre'           => $r->nombre,
                'cantidad_vendida' => (float)$r->cantidad_vendida,
                'total_facturado'  => (float)$r->total_facturado,
            ])
            ->toArray();
    }

    private function queryMetodosPago(array $f): array
    {
        return DB::table('venta_pagos')
            ->join('ventas', 'ventas.id', '=', 'venta_pagos.venta_id')
            ->join('metodos_pago', 'metodos_pago.id', '=', 'venta_pagos.metodo_pago_id')
            ->where('ventas.activo', true)
            ->where('ventas.estado', '!=', 'anulado')
            ->when($f['empresa_id'], fn($q) => $q->where('ventas.empresa_id', $f['empresa_id']))
            ->when($f['local_id'],   fn($q) => $q->where('ventas.local_id',   $f['local_id']))
            ->whereBetween(DB::raw("DATE(ventas.fecha)"), [$f['desde'], $f['hasta']])
            ->select(
                'metodos_pago.nombre',
                DB::raw('SUM(venta_pagos.monto) as total')
            )
            ->groupBy('metodos_pago.id', 'metodos_pago.nombre')
            ->orderByDesc('total')
            ->get()
            ->map(fn($r) => ['nombre' => $r->nombre, 'total' => (float)$r->total])
            ->toArray();
    }

    private function queryClientesTop(array $f): array
    {
        return DB::table('ventas')
            ->join('clientes', 'clientes.id', '=', 'ventas.cliente_id')
            ->where('ventas.activo', true)
            ->where('ventas.estado', '!=', 'anulado')
            ->whereNotNull('ventas.cliente_id')
            ->when($f['empresa_id'], fn($q) => $q->where('ventas.empresa_id', $f['empresa_id']))
            ->when($f['local_id'],   fn($q) => $q->where('ventas.local_id',   $f['local_id']))
            ->whereBetween(DB::raw("DATE(ventas.fecha)"), [$f['desde'], $f['hasta']])
            ->select(
                'clientes.nombre',
                'clientes.dni',
                DB::raw('COUNT(ventas.id) as num_ventas'),
                DB::raw('SUM(ventas.total) as total_gastado')
            )
            ->groupBy('clientes.id', 'clientes.nombre', 'clientes.dni')
            ->orderByDesc('total_gastado')
            ->limit($f['top'])
            ->get()
            ->map(fn($r) => [
                'nombre'       => $r->nombre,
                'dni'          => $r->dni,
                'num_ventas'   => (int)$r->num_ventas,
                'total_gastado'=> (float)$r->total_gastado,
            ])
            ->toArray();
    }

    private function queryTiempoServicio(array $f): ?array
    {
        $row = DB::table('ventas')
            ->join('recepciones', 'recepciones.id', '=', 'ventas.recepcion_id')
            ->where('ventas.activo', true)
            ->where('ventas.estado', '!=', 'anulado')
            ->whereNotNull('ventas.recepcion_id')
            ->whereNotNull('recepciones.fecha_recepcion')
            ->when($f['empresa_id'], fn($q) => $q->where('ventas.empresa_id', $f['empresa_id']))
            ->when($f['local_id'],   fn($q) => $q->where('ventas.local_id',   $f['local_id']))
            ->whereBetween(DB::raw("DATE(ventas.fecha)"), [$f['desde'], $f['hasta']])
            ->select(
                DB::raw("AVG(EXTRACT(EPOCH FROM (ventas.fecha::timestamp - recepciones.fecha_recepcion::timestamp)) / 3600) as promedio_horas"),
                DB::raw("MIN(EXTRACT(EPOCH FROM (ventas.fecha::timestamp - recepciones.fecha_recepcion::timestamp)) / 3600) as min_horas"),
                DB::raw("MAX(EXTRACT(EPOCH FROM (ventas.fecha::timestamp - recepciones.fecha_recepcion::timestamp)) / 3600) as max_horas"),
                DB::raw('COUNT(*) as total_casos')
            )
            ->first();

        if (!$row || !$row->total_casos) return null;

        return [
            'promedio_horas' => round((float)$row->promedio_horas, 1),
            'min_horas'      => round((float)$row->min_horas, 1),
            'max_horas'      => round((float)$row->max_horas, 1),
            'total_casos'    => (int)$row->total_casos,
        ];
    }

    public function index(Request $request)
    {
        $user = auth()->user();

        $empresas = $user->esSuperAdmin()
            ? Empresa::where('activo', 1)->orderBy('nombre')->get()
            : collect();

        $empresaId = $user->esSuperAdmin() ? null : $user->empresa_id;

        $locales = Local::where('activo', 1)
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('nombre')
            ->get();

        $filtros = [
            'empresa_id' => $empresaId,
            'local_id'   => null,
            'desde'      => now()->startOfMonth()->toDateString(),
            'hasta'      => now()->toDateString(),
            'top'        => 10,
        ];

        return Inertia::render('Reportes/Index', [
            'empresas'        => $empresas,
            'locales'         => $locales,
            'filtros'         => $filtros,
            'ventasPorFecha'  => $this->queryVentasPorFecha($filtros),
            'serviciosTop'    => $this->queryServiciosTop($filtros),
            'productosTop'    => $this->queryProductosTop($filtros),
            'metodosPago'     => $this->queryMetodosPago($filtros),
            'clientesTop'     => $this->queryClientesTop($filtros),
            'tiempoServicio'  => $this->queryTiempoServicio($filtros),
        ]);
    }

    public function ventasPorFecha(Request $request)
    {
        return response()->json($this->queryVentasPorFecha($this->filtros($request)));
    }

    public function serviciosTop(Request $request)
    {
        return response()->json($this->queryServiciosTop($this->filtros($request)));
    }

    public function productosTop(Request $request)
    {
        return response()->json($this->queryProductosTop($this->filtros($request)));
    }

    public function metodosPago(Request $request)
    {
        return response()->json($this->queryMetodosPago($this->filtros($request)));
    }

    public function clientesTop(Request $request)
    {
        return response()->json($this->queryClientesTop($this->filtros($request)));
    }

    public function tiempoServicio(Request $request)
    {
        return response()->json($this->queryTiempoServicio($this->filtros($request)));
    }

    // ── ESTADÍSTICAS / BALANCE FINANCIERO ────────────────────────────────────

    public function estadisticas(Request $request)
    {
        $user      = auth()->user();
        $empresaId = $user->esSuperAdmin() ? null : $user->empresa_id;

        $empresas = $user->esSuperAdmin()
            ? Empresa::where('activo', 1)->orderBy('nombre')->get()
            : collect();

        $locales = Local::where('activo', 1)
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('nombre')
            ->get();

        $filtros = [
            'empresa_id' => $empresaId,
            'local_id'   => null,
            'desde'      => now()->startOfMonth()->toDateString(),
            'hasta'      => now()->toDateString(),
        ];

        return Inertia::render('Reportes/Estadisticas', [
            'empresas'     => $empresas,
            'locales'      => $locales,
            'filtros'      => $filtros,
            'esSuperAdmin' => $user->esSuperAdmin(),
            ...$this->queryBalance($filtros),
        ]);
    }

    public function balanceFinanciero(Request $request)
    {
        $f = $this->filtros($request);
        return response()->json($this->queryBalance($f));
    }

    private function queryBalance(array $f): array
    {
        // ── VENTAS ───────────────────────────────────────────────────────────
        $ventasConds = function ($q) use ($f) {
            $q->where('ventas.activo', true)
              ->where('ventas.estado', '!=', 'anulado')
              ->when($f['empresa_id'], fn($q) => $q->where('ventas.empresa_id', $f['empresa_id']))
              ->when($f['local_id'],   fn($q) => $q->where('ventas.local_id',   $f['local_id']))
              ->whereBetween(DB::raw("DATE(ventas.fecha)"), [$f['desde'], $f['hasta']]);
        };

        $resumenVentas = DB::table('ventas')
            ->tap($ventasConds)
            ->selectRaw('COALESCE(SUM(subtotal),0) as bruto, COALESCE(SUM(descuento),0) as descuento, COALESCE(SUM(total),0) as neto, COUNT(*) as cantidad, COUNT(DISTINCT cliente_id) as clientes_unicos')
            ->first();

        // Ganancia bruta (productos con precio_costo_ref > 0)
        $gananciaRow = DB::table('ventas_detalle')
            ->join('ventas', 'ventas.id', '=', 'ventas_detalle.venta_id')
            ->tap($ventasConds)
            ->where('ventas_detalle.tipo', 'producto')
            ->where('ventas_detalle.precio_costo_ref', '>', 0)
            ->selectRaw('
                COALESCE(SUM((ventas_detalle.precio_unitario - ventas_detalle.precio_costo_ref) * ventas_detalle.cantidad), 0) as ganancia,
                COALESCE(SUM(ventas_detalle.precio_unitario * ventas_detalle.cantidad), 0) as ingresos_productos
            ')
            ->first();

        $gananciaTotal    = (float)($gananciaRow->ganancia ?? 0);
        $ingresosProductos = (float)($gananciaRow->ingresos_productos ?? 0);
        $margenPct = $ingresosProductos > 0 ? round($gananciaTotal / $ingresosProductos * 100, 1) : 0;

        // Ventas por día
        $ventasPorDia = DB::table('ventas')
            ->tap($ventasConds)
            ->selectRaw("DATE(fecha) as dia, SUM(total) as total, COUNT(*) as cantidad")
            ->groupByRaw("DATE(fecha)")
            ->orderBy('dia')
            ->get()
            ->map(fn($r) => ['dia' => $r->dia, 'total' => (float)$r->total, 'cantidad' => (int)$r->cantidad])
            ->toArray();

        // Ventas por método de pago
        $ventasPorMetodo = DB::table('venta_pagos')
            ->join('ventas', 'ventas.id', '=', 'venta_pagos.venta_id')
            ->join('metodos_pago', 'metodos_pago.id', '=', 'venta_pagos.metodo_pago_id')
            ->tap($ventasConds)
            ->selectRaw('metodos_pago.id, metodos_pago.nombre, SUM(venta_pagos.monto) as total, COUNT(DISTINCT venta_pagos.venta_id) as cantidad_ventas')
            ->groupBy('metodos_pago.id', 'metodos_pago.nombre')
            ->orderByDesc('total')
            ->get()
            ->map(fn($r) => ['nombre' => $r->nombre, 'total' => (float)$r->total, 'cantidad_ventas' => (int)$r->cantidad_ventas])
            ->toArray();

        // Lista de ventas
        $ventasLista = DB::table('ventas')
            ->tap($ventasConds)
            ->leftJoin('clientes', 'clientes.id', '=', 'ventas.cliente_id')
            ->selectRaw("ventas.id, ventas.codigo, DATE(ventas.fecha) as fecha, TO_CHAR(ventas.fecha, 'HH24:MI') as hora, clientes.nombre as cliente, clientes.dni as cliente_dni, ventas.subtotal::float, ventas.descuento::float, ventas.total::float, ventas.estado")
            ->orderByDesc('ventas.fecha')
            ->get();

        $ventasIds = $ventasLista->pluck('id')->toArray();

        $ventasDetalles = $ventasIds
            ? DB::table('ventas_detalle')
                ->leftJoin('servicios', 'servicios.id', '=', 'ventas_detalle.servicio_id')
                ->leftJoin('productos_almacen', 'productos_almacen.id', '=', 'ventas_detalle.producto_id')
                ->leftJoin('unidades_medida', 'unidades_medida.id', '=', 'ventas_detalle.unidad_medida_id')
                ->whereIn('ventas_detalle.venta_id', $ventasIds)
                ->selectRaw("ventas_detalle.venta_id, ventas_detalle.tipo, ventas_detalle.descripcion, ventas_detalle.cantidad::float, ventas_detalle.precio_unitario::float, ventas_detalle.precio_costo_ref::float, ventas_detalle.subtotal::float, unidades_medida.nombre as unidad")
                ->get()->groupBy('venta_id')
            : collect();

        $ventasPagosDetalle = $ventasIds
            ? DB::table('venta_pagos')
                ->join('metodos_pago', 'metodos_pago.id', '=', 'venta_pagos.metodo_pago_id')
                ->leftJoin('cuentas_pago', 'cuentas_pago.id', '=', 'venta_pagos.cuenta_pago_id')
                ->whereIn('venta_pagos.venta_id', $ventasIds)
                ->selectRaw("venta_pagos.venta_id, metodos_pago.nombre as metodo, cuentas_pago.nombre as cuenta, venta_pagos.monto::float")
                ->get()->groupBy('venta_id')
            : collect();

        $ventasConDetalle = $ventasLista->map(fn($v) => array_merge(
            (array)$v,
            [
                'detalles' => ($ventasDetalles->get($v->id) ?? collect())->values()->map(fn($d) => (array)$d)->toArray(),
                'pagos'    => ($ventasPagosDetalle->get($v->id) ?? collect())->values()->map(fn($p) => (array)$p)->toArray(),
            ]
        ))->values()->toArray();

        // ── ENTRADAS ALMACÉN ─────────────────────────────────────────────────
        $entradasConds = function ($q) use ($f) {
            $q->where('entradas_almacen.activo', true)
              ->when($f['empresa_id'], fn($q) => $q->where('entradas_almacen.empresa_id', $f['empresa_id']))
              ->when($f['local_id'],   fn($q) => $q->where('entradas_almacen.local_id',   $f['local_id']))
              ->whereBetween(DB::raw("DATE(entradas_almacen.fecha)"), [$f['desde'], $f['hasta']]);
        };

        $totalCompras = (float)(DB::table('entradas_almacen')->tap($entradasConds)->sum('total') ?? 0);

        $entradasLista = DB::table('entradas_almacen')
            ->tap($entradasConds)
            ->leftJoin('users', 'users.id', '=', 'entradas_almacen.user_id')
            ->selectRaw("entradas_almacen.id, entradas_almacen.codigo, DATE(entradas_almacen.fecha) as fecha, entradas_almacen.motivo, entradas_almacen.total::float, users.name as usuario")
            ->orderByDesc('entradas_almacen.fecha')
            ->get();

        $entradasIds = $entradasLista->pluck('id')->toArray();

        $entradasDetalles = $entradasIds
            ? DB::table('entradas_almacen_detalle')
                ->join('productos_almacen', 'productos_almacen.id', '=', 'entradas_almacen_detalle.producto_id')
                ->leftJoin('unidades_medida', 'unidades_medida.id', '=', 'entradas_almacen_detalle.unidad_medida_id')
                ->leftJoin('proveedores', 'proveedores.id', '=', 'entradas_almacen_detalle.proveedor_id')
                ->whereIn('entradas_almacen_detalle.entrada_id', $entradasIds)
                ->selectRaw("entradas_almacen_detalle.entrada_id, productos_almacen.nombre as producto, unidades_medida.nombre as unidad, proveedores.nombre as proveedor, entradas_almacen_detalle.cantidad::float, entradas_almacen_detalle.precio_unitario::float, entradas_almacen_detalle.subtotal::float")
                ->get()->groupBy('entrada_id')
            : collect();

        $entradasConDetalle = $entradasLista->map(fn($e) => array_merge(
            (array)$e,
            ['detalles' => ($entradasDetalles->get($e->id) ?? collect())->values()->map(fn($d) => (array)$d)->toArray()]
        ))->values()->toArray();

        $entradasPorProducto = DB::table('entradas_almacen_detalle')
            ->join('entradas_almacen', 'entradas_almacen.id', '=', 'entradas_almacen_detalle.entrada_id')
            ->join('productos_almacen', 'productos_almacen.id', '=', 'entradas_almacen_detalle.producto_id')
            ->tap($entradasConds)
            ->selectRaw('productos_almacen.nombre, SUM(entradas_almacen_detalle.cantidad)::float as cantidad_total, SUM(entradas_almacen_detalle.subtotal)::float as total')
            ->groupBy('productos_almacen.id', 'productos_almacen.nombre')
            ->orderByDesc('total')
            ->limit(15)
            ->get()
            ->map(fn($r) => (array)$r)
            ->toArray();

        // ── GASTOS ───────────────────────────────────────────────────────────
        $gastosConds = function ($q) use ($f) {
            $q->where('gastos.activo', true)
              ->when($f['empresa_id'], fn($q) => $q->where('gastos.empresa_id', $f['empresa_id']))
              ->when($f['local_id'],   fn($q) => $q->where('gastos.local_id',   $f['local_id']))
              ->whereBetween('gastos.fecha', [$f['desde'], $f['hasta']]);
        };

        $totalGastos = (float)(DB::table('gastos')->tap($gastosConds)->sum('monto') ?? 0);

        $gastosLista = DB::table('gastos')
            ->tap($gastosConds)
            ->leftJoin('descripciones_gasto', 'descripciones_gasto.id', '=', 'gastos.descripcion_gasto_id')
            ->leftJoin('clasificaciones_gasto', 'clasificaciones_gasto.id', '=', 'descripciones_gasto.clasificacion_gasto_id')
            ->leftJoin('tipos_gasto', 'tipos_gasto.id', '=', 'clasificaciones_gasto.tipo_gasto_id')
            ->leftJoin('metodos_pago', 'metodos_pago.id', '=', 'gastos.metodo_pago_id')
            ->leftJoin('cuentas_pago', 'cuentas_pago.id', '=', 'gastos.cuenta_pago_id')
            ->leftJoin('users', 'users.id', '=', 'gastos.user_id')
            ->selectRaw("gastos.id, gastos.fecha::text, gastos.descripcion, gastos.comprobante_numero, gastos.observaciones, gastos.monto::float, COALESCE(tipos_gasto.nombre, 'Sin categoría') as tipo, COALESCE(clasificaciones_gasto.nombre, 'Sin clasificación') as clasificacion, COALESCE(descripciones_gasto.nombre, 'Sin descripción') as descripcion_gasto, metodos_pago.nombre as metodo_pago, cuentas_pago.nombre as cuenta_pago, users.name as usuario")
            ->orderByDesc('gastos.fecha')
            ->get()
            ->map(fn($r) => (array)$r)
            ->toArray();

        $gastosPorTipo = DB::table('gastos')
            ->tap($gastosConds)
            ->leftJoin('descripciones_gasto', 'descripciones_gasto.id', '=', 'gastos.descripcion_gasto_id')
            ->leftJoin('clasificaciones_gasto', 'clasificaciones_gasto.id', '=', 'descripciones_gasto.clasificacion_gasto_id')
            ->leftJoin('tipos_gasto', 'tipos_gasto.id', '=', 'clasificaciones_gasto.tipo_gasto_id')
            ->selectRaw("COALESCE(tipos_gasto.nombre, 'Sin categoría') as nombre, SUM(gastos.monto)::float as total")
            ->groupByRaw("tipos_gasto.id, tipos_gasto.nombre")
            ->orderByDesc('total')
            ->get()
            ->map(fn($r) => (array)$r)
            ->toArray();

        $gastosPorClasificacion = DB::table('gastos')
            ->tap($gastosConds)
            ->leftJoin('descripciones_gasto', 'descripciones_gasto.id', '=', 'gastos.descripcion_gasto_id')
            ->leftJoin('clasificaciones_gasto', 'clasificaciones_gasto.id', '=', 'descripciones_gasto.clasificacion_gasto_id')
            ->leftJoin('tipos_gasto', 'tipos_gasto.id', '=', 'clasificaciones_gasto.tipo_gasto_id')
            ->selectRaw("COALESCE(tipos_gasto.nombre, 'Sin categoría') as tipo, COALESCE(clasificaciones_gasto.nombre, 'Sin clasificación') as clasificacion, SUM(gastos.monto)::float as total, COUNT(*) as cantidad")
            ->groupByRaw("tipos_gasto.id, tipos_gasto.nombre, clasificaciones_gasto.id, clasificaciones_gasto.nombre")
            ->orderByDesc('total')
            ->get()
            ->map(fn($r) => (array)$r)
            ->toArray();

        // ── RESULTADO ────────────────────────────────────────────────────────
        $ingresoNeto = (float)($resumenVentas->neto ?? 0);

        return [
            'resumen' => [
                'ingresos_bruto'    => round((float)($resumenVentas->bruto ?? 0), 2),
                'descuentos'        => round((float)($resumenVentas->descuento ?? 0), 2),
                'ingresos_neto'     => round($ingresoNeto, 2),
                'cantidad_ventas'   => (int)($resumenVentas->cantidad ?? 0),
                'clientes_unicos'   => (int)($resumenVentas->clientes_unicos ?? 0),
                'ganancia_bruta'    => round($gananciaTotal, 2),
                'margen_pct'        => $margenPct,
                'compras_almacen'   => round($totalCompras, 2),
                'gastos'            => round($totalGastos, 2),
                'resultado'         => round($ingresoNeto - $totalCompras - $totalGastos, 2),
            ],
            'ventas' => [
                'lista'      => $ventasConDetalle,
                'por_metodo' => $ventasPorMetodo,
                'por_dia'    => $ventasPorDia,
            ],
            'entradas' => [
                'lista'        => $entradasConDetalle,
                'por_producto' => $entradasPorProducto,
            ],
            'gastos' => [
                'lista'             => $gastosLista,
                'por_tipo'          => $gastosPorTipo,
                'por_clasificacion' => $gastosPorClasificacion,
            ],
        ];
    }

    public function pdf(Request $request)
    {
        $user = auth()->user();
        $f    = $this->filtros($request);

        $empresas = $user->esSuperAdmin()
            ? Empresa::where('activo', 1)->orderBy('nombre')->get()
            : collect();

        $empresaId = $user->esSuperAdmin() ? null : $user->empresa_id;

        $locales = Local::where('activo', 1)
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('nombre')
            ->get();

        $data = [
            'filtros'        => $f,
            'ventasPorFecha' => $this->queryVentasPorFecha($f),
            'serviciosTop'   => $this->queryServiciosTop($f),
            'productosTop'   => $this->queryProductosTop($f),
            'metodosPago'    => $this->queryMetodosPago($f),
            'clientesTop'    => $this->queryClientesTop($f),
            'tiempoServicio' => $this->queryTiempoServicio($f),
            'localNombre'    => $f['local_id'] ? $locales->firstWhere('id', $f['local_id'])?->nombre : 'Todos los locales',
        ];

        $pdf = Pdf::loadView('pdf.reporte_ventas', $data)
            ->setPaper('a4', 'portrait');

        return $pdf->stream('reporte-ventas-' . $f['desde'] . '-al-' . $f['hasta'] . '.pdf');
    }
}
