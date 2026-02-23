<?php
namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Models\CuentaPago;
use App\Models\MetodoPago;
use App\Models\Empresa;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CuentaPagoController extends Controller
{
    public function index()
    {
        $user      = auth()->user();
        $empresaId = $user->esSuperAdmin() ? null : $user->empresa_id;

        $cuentas = CuentaPago::with(['empresa', 'metodoPago'])
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('metodo_pago_id')->orderBy('nombre')->get();

        $metodos = MetodoPago::where('activo', 1)
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('nombre')->get();

        $empresas = $user->esSuperAdmin()
            ? Empresa::where('activo', 1)->orderBy('nombre')->get()
            : collect();

        return Inertia::render('Configuracion/CuentasPago/Index', [
            'cuentas'  => $cuentas,
            'metodos'  => $metodos,
            'empresas' => $empresas,
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();

        $data = $request->validate([
            'empresa_id'     => 'nullable|exists:empresas,id',
            'metodo_pago_id' => 'required|exists:metodos_pago,id',
            'nombre'         => 'required|string|max:100',
            'numero_cuenta'  => 'nullable|string|max:100',
            'titular'        => 'nullable|string|max:100',
            'moneda'         => 'required|in:PEN,USD',
        ]);

        $data['empresa_id'] = $user->esSuperAdmin()
            ? ($data['empresa_id'] ?? null)
            : $user->empresa_id;

        CuentaPago::create($data);
        return back()->with('success', 'Cuenta creada.');
    }

    public function update(Request $request, CuentaPago $cuentaPago)
    {
        $data = $request->validate([
            'metodo_pago_id' => 'required|exists:metodos_pago,id',
            'nombre'         => 'required|string|max:100',
            'numero_cuenta'  => 'nullable|string|max:100',
            'titular'        => 'nullable|string|max:100',
            'moneda'         => 'required|in:PEN,USD',
        ]);

        $cuentaPago->update($data);
        return back()->with('success', 'Cuenta actualizada.');
    }

    public function toggleActivo(CuentaPago $cuentaPago)
    {
        $cuentaPago->update(['activo' => !$cuentaPago->activo]);
        return back()->with('success', 'Estado actualizado.');
    }
}