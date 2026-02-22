<?php
namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Models\DescripcionGasto;
use Illuminate\Http\Request;

class DescripcionGastoController extends Controller
{
    public function store(Request $request)
    {
        $user = auth()->user();

        $data = $request->validate([
            'nombre'                 => 'required|string|max:255',
            'clasificacion_gasto_id' => 'required|exists:clasificaciones_gasto,id',
            'empresa_id'             => 'nullable|exists:empresas,id',
        ]);

        $data['empresa_id'] = $user->esSuperAdmin()
            ? ($data['empresa_id'] ?? null)
            : $user->empresa_id;

        DescripcionGasto::create($data);
        return back()->with('success', 'Descripción creada.');
    }

    public function update(Request $request, DescripcionGasto $descripcionGasto)
    {
        $this->verificarPropiedad($descripcionGasto);

        $data = $request->validate([
            'nombre'                 => 'required|string|max:255',
            'clasificacion_gasto_id' => 'required|exists:clasificaciones_gasto,id',
        ]);

        $descripcionGasto->update($data);
        return back()->with('success', 'Descripción actualizada.');
    }

    public function toggleActivo(DescripcionGasto $descripcionGasto)
    {
        $this->verificarPropiedad($descripcionGasto);
        $descripcionGasto->update(['activo' => !$descripcionGasto->activo]);
        return back()->with('success', 'Estado actualizado.');
    }

    private function verificarPropiedad(DescripcionGasto $descripcionGasto): void
    {
        $user = auth()->user();
        if ($user->esSuperAdmin()) return;
        if ($descripcionGasto->empresa_id !== $user->empresa_id) abort(403);
    }
}