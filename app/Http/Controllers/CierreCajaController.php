<?php
namespace App\Http\Controllers;

use App\Models\CierreCaja;
use App\Models\CierreCajaPago;
use App\Models\Local;
use App\Models\Empresa;
use App\Models\Venta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class CierreCajaController extends Controller
{
    public function index()
    {
        $user      = auth()->user();
        $empresaId = $user->esSuperAdmin() ? null : $user->empresa_id;

        $cierres = CierreCaja::with(['local', 'usuario'])
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderByDesc('fecha')
            ->orderByDesc('id')
            ->get();

        $locales = Local::where('activo', 1)
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('nombre')
            ->get();

        $puedeVerEsperados = $user->puedeVerEsperados();

        // Ocultar montos esperados si el usuario no tiene permiso
        if (!$puedeVerEsperados) {
            $cierres = $cierres->map(function ($c) {
                $arr = $c->toArray();
                $arr['total_esperado'] = null;
                $arr['diferencia']     = null;
                return $arr;
            });
        }

        return Inertia::render('CierreCaja/Index', [
            'cierres'           => $cierres,
            'locales'           => $locales,
            'puedeVerEsperados' => $puedeVerEsperados,
        ]);
    }

    public function create()
    {
        $user      = auth()->user();
        $empresaId = $user->esSuperAdmin() ? null : $user->empresa_id;

        $locales = Local::where('activo', 1)
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('nombre')
            ->get();

        $empresas = $user->esSuperAdmin()
            ? Empresa::where('activo', 1)->orderBy('nombre')->get()
            : collect();

        return Inertia::render('CierreCaja/Create', [
            'locales'  => $locales,
            'empresas' => $empresas,
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();

        $data = $request->validate([
            'empresa_id'    => 'nullable|exists:empresas,id',
            'local_id'      => 'required|exists:locales,id',
            'fecha'         => 'required|date',
            'observaciones' => 'nullable|string',
        ]);

        $empresaId = $user->esSuperAdmin()
            ? ($data['empresa_id'] ?? Local::find($data['local_id'])->empresa_id)
            : $user->empresa_id;

        // Verificar si ya existe un cierre para ese día/local
        $existe = CierreCaja::where('empresa_id', $empresaId)
            ->where('local_id', $data['local_id'])
            ->whereDate('fecha', $data['fecha'])
            ->exists();

        if ($existe) {
            return back()->withErrors(['fecha' => 'Ya existe un cierre para este local y fecha.']);
        }

        DB::transaction(function () use ($data, $empresaId, $user) {
            // Calcular esperado por método/cuenta desde ventas del día
            $pagosAgrupados = DB::table('venta_pagos')
                ->join('ventas', 'ventas.id', '=', 'venta_pagos.venta_id')
                ->where('ventas.empresa_id', $empresaId)
                ->where('ventas.local_id', $data['local_id'])
                ->whereDate('ventas.fecha', $data['fecha'])
                ->where('ventas.activo', true)
                ->where('ventas.estado', '!=', 'anulado')
                ->select(
                    'venta_pagos.metodo_pago_id',
                    'venta_pagos.cuenta_pago_id',
                    DB::raw('SUM(venta_pagos.monto) as total')
                )
                ->groupBy('venta_pagos.metodo_pago_id', 'venta_pagos.cuenta_pago_id')
                ->get();

            $totalEsperado = $pagosAgrupados->sum('total');

            // Calcular resumen de ventas del día
            $resumen = DB::table('ventas_detalle')
                ->join('ventas', 'ventas.id', '=', 'ventas_detalle.venta_id')
                ->where('ventas.empresa_id', $empresaId)
                ->where('ventas.local_id', $data['local_id'])
                ->whereDate('ventas.fecha', $data['fecha'])
                ->where('ventas.activo', true)
                ->where('ventas.estado', '!=', 'anulado')
                ->select(
                    DB::raw("SUM(CASE WHEN ventas_detalle.tipo = 'servicio' THEN ventas_detalle.subtotal ELSE 0 END) as servicios_total"),
                    DB::raw("COUNT(CASE WHEN ventas_detalle.tipo = 'servicio' THEN 1 END) as servicios_cantidad"),
                    DB::raw("SUM(CASE WHEN ventas_detalle.tipo = 'producto' THEN ventas_detalle.subtotal ELSE 0 END) as productos_total"),
                    DB::raw("COUNT(CASE WHEN ventas_detalle.tipo = 'producto' THEN 1 END) as productos_cantidad")
                )
                ->first();

            $totalesVenta = DB::table('ventas')
                ->where('empresa_id', $empresaId)
                ->where('local_id', $data['local_id'])
                ->whereDate('fecha', $data['fecha'])
                ->where('activo', true)
                ->where('estado', '!=', 'anulado')
                ->select(
                    DB::raw('SUM(descuento) as descuentos_total'),
                    DB::raw('SUM(total) as ventas_neto')
                )
                ->first();

            $cierre = CierreCaja::create([
                'empresa_id'        => $empresaId,
                'local_id'          => $data['local_id'],
                'user_id'           => $user->id,
                'fecha'             => $data['fecha'],
                'estado'            => 'borrador',
                'observaciones'     => $data['observaciones'] ?? null,
                'total_esperado'    => (float) $totalEsperado,
                'total_entregado'   => 0,
                'servicios_cantidad'=> (int) ($resumen->servicios_cantidad ?? 0),
                'servicios_total'   => (float) ($resumen->servicios_total ?? 0),
                'productos_cantidad'=> (int) ($resumen->productos_cantidad ?? 0),
                'productos_total'   => (float) ($resumen->productos_total ?? 0),
                'descuentos_total'  => (float) ($totalesVenta->descuentos_total ?? 0),
                'ventas_neto'       => (float) ($totalesVenta->ventas_neto ?? 0),
            ]);

            foreach ($pagosAgrupados as $pago) {
                CierreCajaPago::create([
                    'cierre_id'       => $cierre->id,
                    'metodo_pago_id'  => $pago->metodo_pago_id,
                    'cuenta_pago_id'  => $pago->cuenta_pago_id,
                    'monto_esperado'  => (float) $pago->total,
                    'monto_entregado' => 0,
                ]);
            }
        });

        return redirect()->route('cierre-caja.index')
            ->with('success', 'Cierre de caja iniciado correctamente.');
    }

    public function show(CierreCaja $cierreCaja)
    {
        $user = auth()->user();

        if (!$user->esSuperAdmin() && $cierreCaja->empresa_id !== $user->empresa_id) {
            abort(403);
        }

        $puedeVerEsperados = $user->puedeVerEsperados();

        $cierreCaja->load(['pagos.metodoPago', 'pagos.cuentaPago', 'local', 'usuario']);

        $ventas = Venta::with(['cliente', 'detalles', 'pagos.metodoPago', 'pagos.cuentaPago'])
            ->where('empresa_id', $cierreCaja->empresa_id)
            ->where('local_id',   $cierreCaja->local_id)
            ->whereDate('fecha',  $cierreCaja->fecha)
            ->where('activo', true)
            ->where('estado', '!=', 'anulado')
            ->orderByDesc('id')
            ->get();

        $pagos = $cierreCaja->pagos->map(function ($pago) use ($puedeVerEsperados) {
            $arr = $pago->toArray();
            if (!$puedeVerEsperados) {
                $arr['monto_esperado'] = null;
                $arr['diferencia']     = null;
            }
            return $arr;
        });

        $cierreArr = $cierreCaja->toArray();
        if (!$puedeVerEsperados) {
            $cierreArr['total_esperado'] = null;
            $cierreArr['diferencia']     = null;
        }

        return Inertia::render('CierreCaja/Show', [
            'cierre'            => $cierreArr,
            'pagos'             => $pagos,
            'ventas'            => $ventas,
            'puedeVerEsperados' => $puedeVerEsperados,
            'puedeEditar'       => !$cierreCaja->esCerrado(),
            'puedeCerrar'       => !$cierreCaja->esCerrado() && $puedeVerEsperados,
        ]);
    }

    public function update(Request $request, CierreCaja $cierreCaja)
    {
        $user = auth()->user();

        if (!$user->esSuperAdmin() && $cierreCaja->empresa_id !== $user->empresa_id) {
            abort(403);
        }

        if ($cierreCaja->esCerrado()) {
            abort(403, 'El cierre ya está cerrado.');
        }

        $data = $request->validate([
            'pagos'                   => 'required|array',
            'pagos.*.id'              => 'required|exists:cierre_caja_pagos,id',
            'pagos.*.monto_entregado' => 'required|numeric|min:0',
            'observaciones'           => 'nullable|string',
        ]);

        DB::transaction(function () use ($data, $cierreCaja) {
            $totalEntregado = 0;

            foreach ($data['pagos'] as $pago) {
                $registro = CierreCajaPago::where('id', $pago['id'])
                    ->where('cierre_id', $cierreCaja->id)
                    ->firstOrFail();

                $registro->update(['monto_entregado' => $pago['monto_entregado']]);
                $totalEntregado += (float) $pago['monto_entregado'];
            }

            $cierreCaja->update([
                'total_entregado' => $totalEntregado,
                'observaciones'   => $data['observaciones'] ?? $cierreCaja->observaciones,
            ]);
        });

        return back()->with('success', 'Montos entregados guardados correctamente.');
    }

    public function cerrar(CierreCaja $cierreCaja)
    {
        $user = auth()->user();

        if (!$user->esSuperAdmin() && $cierreCaja->empresa_id !== $user->empresa_id) {
            abort(403);
        }

        if (!$user->puedeVerEsperados()) {
            abort(403, 'No tienes permiso para cerrar el cierre de caja.');
        }

        if ($cierreCaja->esCerrado()) {
            return back()->with('error', 'El cierre ya está cerrado.');
        }

        $cierreCaja->update([
            'estado'     => 'cerrado',
            'cerrado_at' => now(),
        ]);

        return back()->with('success', 'Cierre de caja cerrado correctamente.');
    }

    public function pdf(CierreCaja $cierreCaja)
    {
        $user = auth()->user();

        if (!$user->esSuperAdmin() && $cierreCaja->empresa_id !== $user->empresa_id) {
            abort(403);
        }

        $cierreCaja->load(['pagos.metodoPago', 'pagos.cuentaPago', 'local', 'usuario', 'empresa']);

        $ventas = Venta::with(['cliente', 'detalles', 'pagos.metodoPago'])
            ->where('empresa_id', $cierreCaja->empresa_id)
            ->where('local_id',   $cierreCaja->local_id)
            ->whereDate('fecha',  $cierreCaja->fecha)
            ->where('activo', true)
            ->where('estado', '!=', 'anulado')
            ->orderByDesc('id')
            ->get();

        $logoBase64 = null;
        if ($cierreCaja->empresa->logo) {
            $logoPath = storage_path('app/public/' . $cierreCaja->empresa->logo);
            if (file_exists($logoPath)) {
                $ext        = pathinfo($logoPath, PATHINFO_EXTENSION);
                $mime       = $ext === 'png' ? 'image/png' : 'image/jpeg';
                $logoBase64 = 'data:' . $mime . ';base64,' . base64_encode(file_get_contents($logoPath));
            }
        }

        $pdf = Pdf::loadView('pdf.cierre_caja', compact('cierreCaja', 'ventas', 'logoBase64'))
            ->setPaper('a4', 'portrait');

        return $pdf->stream('cierre-caja-' . $cierreCaja->fecha->format('Y-m-d') . '.pdf');
    }
}
