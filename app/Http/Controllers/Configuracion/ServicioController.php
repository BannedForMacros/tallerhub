<?php
namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Models\Servicio;
use App\Models\Local;
use App\Models\Empresa;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ServicioController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        $servicios = Servicio::with('local')
            ->where('activo', 1)
            ->when(!$user->esSuperAdmin(), fn($q) => $q->where('empresa_id', $user->empresa_id))
            ->orderBy('nombre')
            ->get();

        $locales = $user->esSuperAdmin()
            ? Local::where('activo', 1)->orderBy('nombre')->get()
            : Local::where('empresa_id', $user->empresa_id)->where('activo', 1)->orderBy('nombre')->get();

        $empresas = $user->esSuperAdmin()
            ? Empresa::where('activo', 1)->orderBy('nombre')->get()
            : collect();

        return Inertia::render('Configuracion/Servicios/Index', [
            'servicios' => $servicios,
            'locales'   => $locales,
            'empresas'  => $empresas,
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();

        $data = $request->validate([
            'nombre'      => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'precio'      => 'required|numeric|min:0',
            'local_id'    => 'nullable|exists:locales,id',
            'empresa_id'  => 'nullable|exists:empresas,id',
        ]);

        $data['empresa_id'] = $user->esSuperAdmin()
            ? ($data['empresa_id'] ?? null)
            : $user->empresa_id;

        Servicio::create($data);
        return back()->with('success', 'Servicio creado correctamente.');
    }

    public function update(Request $request, Servicio $servicio)
    {
        $this->verificarPropiedad($servicio);

        $data = $request->validate([
            'nombre'      => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'precio'      => 'required|numeric|min:0',
            'local_id'    => 'nullable|exists:locales,id',
        ]);

        $servicio->update($data);
        return back()->with('success', 'Servicio actualizado correctamente.');
    }

    public function toggleActivo(Servicio $servicio)
    {
        $this->verificarPropiedad($servicio);
        $servicio->update(['activo' => !$servicio->activo]);
        return back()->with('success', 'Estado actualizado.');
    }

    private function verificarPropiedad(Servicio $servicio): void
    {
        $user = auth()->user();
        if ($user->esSuperAdmin()) return;
        if ($servicio->empresa_id !== $user->empresa_id) abort(403);
    }
}