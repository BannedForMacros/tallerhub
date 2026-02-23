<?php
namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Models\MetodoPago;
use App\Models\Empresa;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MetodoPagoController extends Controller
{
    public function index()
    {
        $user      = auth()->user();
        $empresaId = $user->esSuperAdmin() ? null : $user->empresa_id;

        $metodos = MetodoPago::with(['empresa', 'cuentas'])
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('nombre')->get();

        $empresas = $user->esSuperAdmin()
            ? Empresa::where('activo', 1)->orderBy('nombre')->get()
            : collect();

        return Inertia::render('Configuracion/MetodosPago/Index', [
            'metodos'  => $metodos,
            'empresas' => $empresas,
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();

        $data = $request->validate([
            'empresa_id' => 'nullable|exists:empresas,id',
            'nombre'     => 'required|string|max:100',
            'icono'      => 'nullable|string|max:50',
        ]);

        $data['empresa_id'] = $user->esSuperAdmin()
            ? ($data['empresa_id'] ?? null)
            : $user->empresa_id;

        MetodoPago::create($data);

        return back()->with('success', 'Método de pago creado.');
    }

    public function update(Request $request, MetodoPago $metodoPago)
    {
        $data = $request->validate([
            'nombre' => 'required|string|max:100',
            'icono'  => 'nullable|string|max:50',
        ]);

        $metodoPago->update($data);
        return back()->with('success', 'Método de pago actualizado.');
    }

    public function toggleActivo(MetodoPago $metodoPago)
    {
        $metodoPago->update(['activo' => !$metodoPago->activo]);
        return back()->with('success', 'Estado actualizado.');
    }

    // Endpoint JSON para selects
    public function lista(Request $request)
    {
        $user      = auth()->user();
        $empresaId = $user->esSuperAdmin()
            ? $request->empresa_id
            : $user->empresa_id;

        $metodos = MetodoPago::with('cuentasActivas')
            ->where('activo', 1)
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('nombre')->get();

        return response()->json($metodos);
    }
}