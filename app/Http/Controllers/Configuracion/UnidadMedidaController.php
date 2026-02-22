<?php
namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Models\UnidadMedida;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UnidadMedidaController extends Controller
{
    public function index()
    {
        $unidades = UnidadMedida::orderBy('nombre')->get();

        return Inertia::render('Configuracion/UnidadesMedida/Index', [
            'unidades' => $unidades,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre'      => 'required|string|max:100',
            'abreviatura' => 'required|string|max:20',
        ]);

        UnidadMedida::create($request->only('nombre', 'abreviatura'));
        return back()->with('success', 'Unidad de medida creada.');
    }

    public function update(Request $request, UnidadMedida $unidadMedida)
    {
        $request->validate([
            'nombre'      => 'required|string|max:100',
            'abreviatura' => 'required|string|max:20',
        ]);

        $unidadMedida->update($request->only('nombre', 'abreviatura'));
        return back()->with('success', 'Unidad de medida actualizada.');
    }

    public function toggleActivo(UnidadMedida $unidadMedida)
    {
        $unidadMedida->update(['activo' => !$unidadMedida->activo]);
        return back()->with('success', 'Estado actualizado.');
    }
}