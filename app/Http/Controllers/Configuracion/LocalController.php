<?php
namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Models\Local;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LocalController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        $locales = Local::with('empresa')
            ->when(!$user->esSuperAdmin(), fn($q) =>
                $q->where('empresa_id', $user->empresa_id)
            )
            ->orderBy('nombre')
            ->get();

        $empresas = $user->esSuperAdmin()
            ? \App\Models\Empresa::where('activo', 1)->orderBy('nombre')->get()
            : collect();

        return Inertia::render('Configuracion/Locales/Index', [
            'locales'  => $locales,
            'empresas' => $empresas,
        ]);
    }
    

    public function store(Request $request)
    {
        $user = auth()->user();

        $data = $request->validate([
            'nombre'       => 'required|string|max:255',
            'direccion'    => 'nullable|string|max:255',
            'telefono'     => 'nullable|string|max:20',
            'departamento' => 'required|string|max:100',
            'provincia'    => 'required|string|max:100',
            'distrito'     => 'required|string|max:100',
            'empresa_id'   => 'nullable|exists:empresas,id',
        ]);

        $data['empresa_id'] = $user->esSuperAdmin()
            ? ($data['empresa_id'] ?? null)
            : $user->empresa_id;

        Local::create($data);
        return back()->with('success', 'Local creado correctamente.');
    }

    public function update(Request $request, Local $local)
    {
        $this->verificarPropiedad($local);

        $data = $request->validate([
            'nombre'       => 'required|string|max:255',
            'direccion'    => 'nullable|string|max:255',
            'telefono'     => 'nullable|string|max:20',
            'departamento' => 'required|string|max:100',
            'provincia'    => 'required|string|max:100',
            'distrito'     => 'required|string|max:100',
        ]);

        $local->update($data);

        return back()->with('success', 'Local actualizado correctamente.');
    }

    public function toggleActivo(Local $local)
    {
        $this->verificarPropiedad($local);
        $local->update(['activo' => !$local->activo]);
        return back()->with('success', 'Estado actualizado.');
    }

    private function verificarPropiedad(Local $local): void
    {
        $user = auth()->user();
        if ($user->esSuperAdmin()) return;
        if ($local->empresa_id !== $user->empresa_id) abort(403);
    }
}