<?php

namespace App\Http\Controllers;

use App\Models\Gasto;
use App\Models\Local;
use App\Models\Empresa;
use App\Models\MetodoPago;
use App\Models\CuentaPago;
use App\Models\TipoGasto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class GastoController extends Controller
{
    /**
     * Carga datos comunes para los formularios de Crear y Editar.
     */
    private function getDatosFormulario(?int $empresaId, bool $esSuperAdmin): array
    {
        $empresas = $esSuperAdmin
            ? Empresa::where('activo', 1)->orderBy('nombre')->get()
            : collect();

        $locales = Local::where('activo', 1)
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('nombre')->get();

        // Relación: clasificaciones -> descripciones (según modelo ClasificacionGasto)
        $tipos = TipoGasto::with([
            'clasificaciones.descripciones' => fn($q) => $q->where('activo', 1)
        ])
            ->where('activo', 1)
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('nombre')->get();

        // Métodos de pago con sus cuentas activas
        $metodosPago = MetodoPago::with(['cuentasActivas'])
            ->where('activo', 1)
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('nombre')->get();

        return compact('empresas', 'locales', 'tipos', 'metodosPago');
    }

    /**
     * Lista principal de gastos con relaciones anidadas corregidas.
     */
    public function index()
    {
        $user      = auth()->user();
        $empresaId = $user->esSuperAdmin() ? null : $user->empresa_id;

        // Relación corregida: tipoGasto (según modelo ClasificacionGasto)
        $gastos = Gasto::with([
            'local', 
            'usuario', 
            'descripcionGasto.clasificacion.tipoGasto', 
            'metodoPago', 
            'cuentaPago',
        ])
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderByDesc('fecha')
            ->orderByDesc('id')
            ->get();

        return Inertia::render('Gastos/Index', [
            'gastos' => $gastos,
        ]);
    }

    public function create()
    {
        $user      = auth()->user();
        $empresaId = $user->esSuperAdmin() ? null : $user->empresa_id;

        return Inertia::render('Gastos/Create',
            $this->getDatosFormulario($empresaId, $user->esSuperAdmin())
        );
    }

    /**
     * Registro masivo de gastos con validación de tabla corregida.
     */
    public function store(Request $request)
    {
        $user = auth()->user();

        $data = $request->validate([
            'gastos'                               => 'required|array|min:1',
            'gastos.*.empresa_id'                  => 'nullable|exists:empresas,id',
            'gastos.*.local_id'                    => 'nullable|exists:locales,id',
            // Tabla real en PostgreSQL: descripciones_gasto
            'gastos.*.descripcion_gasto_id'        => 'required|exists:descripciones_gasto,id',
            'gastos.*.monto'                       => 'required|numeric|min:0.01',
            'gastos.*.fecha'                       => 'required|date',
            'gastos.*.comprobante_numero'          => 'nullable|string|max:100',
            'gastos.*.observaciones'               => 'nullable|string',
            'gastos.*.metodo_pago_id'              => 'nullable|exists:metodos_pago,id',
            'gastos.*.cuenta_pago_id'              => 'nullable|exists:cuentas_pago,id',
        ]);

        $empresaId = $user->esSuperAdmin() ? null : $user->empresa_id;

        DB::transaction(function () use ($data, $user, $empresaId) {
            foreach ($data['gastos'] as $g) {
                Gasto::create([
                    'empresa_id'           => $empresaId ?? ($g['empresa_id'] ?? null),
                    'local_id'             => $g['local_id']             ?? null,
                    'user_id'              => $user->id,
                    'descripcion_gasto_id' => $g['descripcion_gasto_id'],
                    'monto'                => $g['monto'],
                    'fecha'                => $g['fecha'],
                    'comprobante_numero'   => $g['comprobante_numero']   ?? null,
                    'observaciones'        => $g['observaciones']        ?? null,
                    'metodo_pago_id'       => $g['metodo_pago_id']       ?? null,
                    'cuenta_pago_id'       => $g['cuenta_pago_id']       ?? null,
                    'activo'               => 1,
                ]);
            }
        });

        return redirect()->route('gastos.index')
            ->with('success', 'Gastos registrados correctamente.');
    }

    public function edit(Gasto $gasto)
    {
        $user      = auth()->user();
        $empresaId = $user->esSuperAdmin() ? null : $user->empresa_id;

        if (!$user->esSuperAdmin() && $gasto->empresa_id !== $user->empresa_id) abort(403);

        // Carga de relación corregida: tipoGasto
        $gasto->load(['descripcionGasto.clasificacion.tipoGasto', 'metodoPago', 'cuentaPago']);

        $datos = $this->getDatosFormulario($empresaId, $user->esSuperAdmin());

        return Inertia::render('Gastos/Edit', [
            ...$datos,
            'gasto' => $gasto,
        ]);
    }

    public function update(Request $request, Gasto $gasto)
    {
        $user = auth()->user();
        if (!$user->esSuperAdmin() && $gasto->empresa_id !== $user->empresa_id) abort(403);

        $data = $request->validate([
            'local_id'             => 'nullable|exists:locales,id',
            // Tabla real en PostgreSQL: descripciones_gasto
            'descripcion_gasto_id' => 'required|exists:descripciones_gasto,id',
            'monto'                => 'required|numeric|min:0.01',
            'fecha'                => 'required|date',
            'comprobante_numero'   => 'nullable|string|max:100',
            'observaciones'        => 'nullable|string',
            'metodo_pago_id'       => 'nullable|exists:metodos_pago,id',
            'cuenta_pago_id'       => 'nullable|exists:cuentas_pago,id',
        ]);

        $gasto->update($data);

        return redirect()->route('gastos.index')
            ->with('success', 'Gasto actualizado correctamente.');
    }

    public function toggleActivo(Gasto $gasto)
    {
        $gasto->update(['activo' => !$gasto->activo]);
        return back()->with('success', 'Estado actualizado.');
    }
}