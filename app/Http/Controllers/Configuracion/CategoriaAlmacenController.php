<?php
namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Models\CategoriaAlmacen;
use App\Models\Empresa;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoriaAlmacenController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        $categorias = CategoriaAlmacen::with('empresa')
            ->when(!$user->esSuperAdmin(), fn($q) => $q->where('empresa_id', $user->empresa_id))
            ->orderBy('nombre')
            ->get();

        $empresas = $user->esSuperAdmin()
            ? Empresa::where('activo', 1)->orderBy('nombre')->get()
            : collect();

        return Inertia::render('Configuracion/CategoriasAlmacen/Index', [
            'categorias' => $categorias,
            'empresas'   => $empresas,
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

        CategoriaAlmacen::create($data);
        return back()->with('success', 'Categoría creada.');
    }

    public function update(Request $request, CategoriaAlmacen $categoriaAlmacen)
    {
        $data = $request->validate([
            'nombre' => 'required|string|max:100',
        ]);

        $categoriaAlmacen->update($data);
        return back()->with('success', 'Categoría actualizada.');
    }

    public function toggleActivo(CategoriaAlmacen $categoriaAlmacen)
    {
        $user = auth()->user();
        if (!$user->esSuperAdmin() && $categoriaAlmacen->empresa_id !== $user->empresa_id) abort(403);
        $categoriaAlmacen->update(['activo' => !$categoriaAlmacen->activo]);
        return back()->with('success', 'Estado actualizado.');
    }
}