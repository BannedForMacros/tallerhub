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
