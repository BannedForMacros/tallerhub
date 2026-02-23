<?php
namespace App\Http\Controllers\Almacen;

use App\Http\Controllers\Controller;
use App\Models\Proveedor;
use App\Models\Empresa;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProveedorController extends Controller
{
    public function index()
    {
        $user      = auth()->user();
        $empresaId = $user->esSuperAdmin() ? null : $user->empresa_id;

        $proveedores = Proveedor::with('empresa')
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('nombre')
            ->get();

        $empresas = $user->esSuperAdmin()
            ? Empresa::where('activo', 1)->orderBy('nombre')->get()
            : collect();

        return Inertia::render('Almacen/Proveedores/Index', [
            'proveedores' => $proveedores,
            'empresas'    => $empresas,
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();

        $data = $request->validate([
            'empresa_id' => 'nullable|exists:empresas,id',
            'nombre'     => 'required|string|max:255',
            'ruc'        => 'nullable|string|max:20',
            'telefono'   => 'nullable|string|max:20',
            'email'      => 'nullable|email|max:100',
            'direccion'  => 'nullable|string',
            'contacto'   => 'nullable|string|max:100',
        ]);

        $data['empresa_id'] = $user->esSuperAdmin()
            ? ($data['empresa_id'] ?? null)
            : $user->empresa_id;

        Proveedor::create($data);
        return back()->with('success', 'Proveedor creado correctamente.');
    }

    public function update(Request $request, Proveedor $proveedor)
    {
        $data = $request->validate([
            'nombre'    => 'required|string|max:255',
            'ruc'       => 'nullable|string|max:20',
            'telefono'  => 'nullable|string|max:20',
            'email'     => 'nullable|email|max:100',
            'direccion' => 'nullable|string',
            'contacto'  => 'nullable|string|max:100',
        ]);

        $proveedor->update($data);
        return back()->with('success', 'Proveedor actualizado correctamente.');
    }

    public function toggleActivo(Proveedor $proveedor)
    {
        $user = auth()->user();
        if (!$user->esSuperAdmin() && $proveedor->empresa_id !== $user->empresa_id) abort(403);
        $proveedor->update(['activo' => !$proveedor->activo]);
        return back()->with('success', 'Estado actualizado.');
    }

    // Para uso en selects desde otras páginas (entradas)
    public function lista()
    {
        $user      = auth()->user();
        $empresaId = $user->esSuperAdmin() ? null : $user->empresa_id;

        return response()->json(
            Proveedor::where('activo', 1)
                ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
                ->orderBy('nombre')
                ->get(['id', 'nombre', 'ruc'])
        );
    }
}