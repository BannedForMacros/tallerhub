<?php
namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Models\ClasificacionGasto;
use Illuminate\Http\Request;

class ClasificacionGastoController extends Controller
{
    public function store(Request $request)
    {
        $user = auth()->user();

        $data = $request->validate([
            'nombre'        => 'required|string|max:100',
            'tipo_gasto_id' => 'required|exists:tipos_gasto,id',
            'empresa_id'    => 'nullable|exists:empresas,id',
        ]);

        $data['empresa_id'] = $user->esSuperAdmin()
            ? ($data['empresa_id'] ?? null)
            : $user->empresa_id;

        ClasificacionGasto::create($data);
        return back()->with('success', 'Clasificación creada.');
    }

    public function update(Request $request, ClasificacionGasto $clasificacionGasto)
    {
        $this->verificarPropiedad($clasificacionGasto);

        $data = $request->validate([
            'nombre'        => 'required|string|max:100',
            'tipo_gasto_id' => 'required|exists:tipos_gasto,id',
        ]);

        $clasificacionGasto->update($data);
        return back()->with('success', 'Clasificación actualizada.');
    }

    public function toggleActivo(ClasificacionGasto $clasificacionGasto)
    {
        $this->verificarPropiedad($clasificacionGasto);
        $clasificacionGasto->update(['activo' => !$clasificacionGasto->activo]);
        return back()->with('success', 'Estado actualizado.');
    }

    private function verificarPropiedad(ClasificacionGasto $clasificacionGasto): void
    {
        $user = auth()->user();
        if ($user->esSuperAdmin()) return;
        if ($clasificacionGasto->empresa_id !== $user->empresa_id) abort(403);
    }
}