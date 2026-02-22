<?php
namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Models\TipoGasto;
use App\Models\Empresa;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TipoGastoController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        $tipos = TipoGasto::with('clasificaciones.descripciones')
            ->when(!$user->esSuperAdmin(), fn($q) => $q->where('empresa_id', $user->empresa_id))
            ->orderBy('nombre')->get();

        $clasificaciones = \App\Models\ClasificacionGasto::with('tipoGasto')
            ->when(!$user->esSuperAdmin(), fn($q) => $q->where('empresa_id', $user->empresa_id))
            ->orderBy('nombre')->get();

        $descripciones = \App\Models\DescripcionGasto::with('clasificacion.tipoGasto')
            ->when(!$user->esSuperAdmin(), fn($q) => $q->where('empresa_id', $user->empresa_id))
            ->orderBy('nombre')->get();

        $empresas = $user->esSuperAdmin()
            ? Empresa::where('activo', 1)->orderBy('nombre')->get()
            : collect();

        return Inertia::render('Configuracion/Gastos/Index', [
            'tipos'           => $tipos,
            'clasificaciones' => $clasificaciones,
            'descripciones'   => $descripciones,
            'empresas'        => $empresas,
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();

        $data = $request->validate([
            'nombre'     => 'required|string|max:100',
            'empresa_id' => 'nullable|exists:empresas,id',
        ]);

        $data['empresa_id'] = $user->esSuperAdmin()
            ? ($data['empresa_id'] ?? null)
            : $user->empresa_id;

        TipoGasto::create($data);
        return back()->with('success', 'Tipo de gasto creado.');
    }

    public function update(Request $request, TipoGasto $tipoGasto)
    {
        $this->verificarPropiedad($tipoGasto);

        $data = $request->validate([
            'nombre' => 'required|string|max:100',
        ]);

        $tipoGasto->update($data);
        return back()->with('success', 'Tipo de gasto actualizado.');
    }

    public function toggleActivo(TipoGasto $tipoGasto)
    {
        $this->verificarPropiedad($tipoGasto);
        $tipoGasto->update(['activo' => !$tipoGasto->activo]);
        return back()->with('success', 'Estado actualizado.');
    }

    private function verificarPropiedad(TipoGasto $tipoGasto): void
    {
        $user = auth()->user();
        if ($user->esSuperAdmin()) return;
        if ($tipoGasto->empresa_id !== $user->empresa_id) abort(403);
    }
}