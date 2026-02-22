<?php
namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class EmpresaController extends Controller
{
    private function verificarSuperAdmin()
    {
        if (!auth()->user()->esSuperAdmin()) abort(403, 'Sin acceso.');
    }

    public function index()
    {
        $this->verificarSuperAdmin();

        $empresas = Empresa::orderBy('nombre')
            ->withCount('usuarios')
            ->withCount('locales')
            ->get();

        return Inertia::render('Configuracion/Empresas/Index', [
            'empresas' => $empresas,
        ]);
    }

    public function store(Request $request)
    {
        $this->verificarSuperAdmin();

        $data = $request->validate([
            'nombre'       => 'required|string|max:255',
            'ruc'          => 'required|string|size:11|unique:empresas',
            'direccion'    => 'nullable|string|max:255',
            'telefono'     => 'nullable|string|max:20',
            'email'        => 'nullable|email|max:255',
            'departamento' => 'required|string|max:100',
            'provincia'    => 'required|string|max:100',
            'distrito'     => 'required|string|max:100',
            'logo'         => 'nullable|image|mimes:png,jpg,jpeg,webp|max:2048',
        ]);

        if ($request->hasFile('logo')) {
            $data['logo'] = $request->file('logo')->store('logos', 'public');
        }

        Empresa::create($data);
        return back()->with('success', 'Empresa creada correctamente.');
    }

    public function update(Request $request, Empresa $empresa)
    {
        $this->verificarSuperAdmin();

        $data = $request->validate([
            'nombre'       => 'required|string|max:255',
            'ruc'          => 'required|string|size:11|unique:empresas,ruc,'.$empresa->id,
            'direccion'    => 'nullable|string|max:255',
            'telefono'     => 'nullable|string|max:20',
            'email'        => 'nullable|email|max:255',
            'departamento' => 'required|string|max:100',
            'provincia'    => 'required|string|max:100',
            'distrito'     => 'required|string|max:100',
            'logo'         => 'nullable|image|mimes:png,jpg,jpeg,webp|max:2048',
        ]);

        if ($request->hasFile('logo')) {
            if ($empresa->logo) {
                Storage::disk('public')->delete($empresa->logo);
            }
            $data['logo'] = $request->file('logo')->store('logos', 'public');
        } else {
            unset($data['logo']);
        }

        $empresa->update($data);
        return back()->with('success', 'Empresa actualizada correctamente.');
    }

    public function toggleActivo(Empresa $empresa)
    {
        $this->verificarSuperAdmin();
        $empresa->update(['activo' => !$empresa->activo]);
        return back()->with('success', 'Estado actualizado.');
    }
}