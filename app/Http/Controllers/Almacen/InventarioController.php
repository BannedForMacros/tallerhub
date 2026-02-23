<?php
namespace App\Http\Controllers\Almacen;

use App\Http\Controllers\Controller;
use App\Models\Inventario;
use App\Models\Local;
use App\Models\Empresa;
use App\Models\CategoriaAlmacen;
use Inertia\Inertia;

class InventarioController extends Controller
{
    public function index()
    {
        $user      = auth()->user();
        $empresaId = $user->esSuperAdmin() ? null : $user->empresa_id;

        $inventario = Inventario::with(['producto.categoria', 'unidadMedida', 'local'])
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('local_id')
            ->orderBy('producto_id')
            ->get();

        $locales = Local::where('activo', 1)
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('nombre')->get();

        $categorias = CategoriaAlmacen::where('activo', 1)
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('nombre')->get();

        $empresas = $user->esSuperAdmin()
            ? Empresa::where('activo', 1)->orderBy('nombre')->get()
            : collect();

        return Inertia::render('Almacen/Inventario/Index', [
            'inventario' => $inventario,
            'locales'    => $locales,
            'categorias' => $categorias,
            'empresas'   => $empresas,
        ]);
    }
}