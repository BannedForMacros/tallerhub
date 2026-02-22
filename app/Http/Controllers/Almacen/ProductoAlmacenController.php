<?php
namespace App\Http\Controllers\Almacen;

use App\Http\Controllers\Controller;
use App\Models\ProductoAlmacen;
use App\Models\CategoriaAlmacen;
use App\Models\UnidadMedida;
use App\Models\Empresa;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductoAlmacenController extends Controller
{
    public function index()
    {
        $user      = auth()->user();
        $empresaId = $user->esSuperAdmin() ? null : $user->empresa_id;

        $productos = ProductoAlmacen::with(['categoria', 'unidades'])
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('nombre')
            ->get();

        $categorias = CategoriaAlmacen::where('activo', 1)
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('nombre')->get();

        $unidades = UnidadMedida::where('activo', 1)->orderBy('nombre')->get();

        $empresas = $user->esSuperAdmin()
            ? Empresa::where('activo', 1)->orderBy('nombre')->get()
            : collect();

        return Inertia::render('Almacen/Productos/Index', [
            'productos'  => $productos,
            'categorias' => $categorias,
            'unidades'   => $unidades,
            'empresas'   => $empresas,
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();

        $data = $request->validate([
            'empresa_id'   => 'nullable|exists:empresas,id',
            'categoria_id' => 'nullable|exists:categorias_almacen,id',
            'codigo'       => 'nullable|string|max:50',
            'nombre'       => 'required|string|max:255',
            'descripcion'  => 'nullable|string',
            'precio_venta' => 'nullable|numeric|min:0',
            'unidades'     => 'required|array|min:1',
            'unidades.*.unidad_medida_id'  => 'required|exists:unidades_medida,id',
            'unidades.*.es_principal'      => 'required|boolean',
            'unidades.*.factor_conversion' => 'required|numeric|min:0.0001',
        ]);

        $data['empresa_id'] = $user->esSuperAdmin()
            ? ($data['empresa_id'] ?? null)
            : $user->empresa_id;

        $producto = ProductoAlmacen::create($data);

        foreach ($data['unidades'] as $unidad) {
            $producto->productoUnidades()->create([
                'unidad_medida_id'  => $unidad['unidad_medida_id'],
                'es_principal'      => $unidad['es_principal'],
                'factor_conversion' => $unidad['factor_conversion'],
            ]);
        }

        return back()->with('success', 'Producto creado correctamente.');
    }

    public function update(Request $request, ProductoAlmacen $productoAlmacen)
    {
        $data = $request->validate([
            'categoria_id' => 'nullable|exists:categorias_almacen,id',
            'codigo'       => 'nullable|string|max:50',
            'nombre'       => 'required|string|max:255',
            'descripcion'  => 'nullable|string',
            'precio_venta' => 'nullable|numeric|min:0',
            'unidades'     => 'required|array|min:1',
            'unidades.*.unidad_medida_id'  => 'required|exists:unidades_medida,id',
            'unidades.*.es_principal'      => 'required|boolean',
            'unidades.*.factor_conversion' => 'required|numeric|min:0.0001',
        ]);

        $productoAlmacen->update($data);

        $productoAlmacen->productoUnidades()->delete();
        foreach ($data['unidades'] as $unidad) {
            $productoAlmacen->productoUnidades()->create([
                'unidad_medida_id'  => $unidad['unidad_medida_id'],
                'es_principal'      => $unidad['es_principal'],
                'factor_conversion' => $unidad['factor_conversion'],
            ]);
        }

        return back()->with('success', 'Producto actualizado correctamente.');
    }

    public function toggleActivo(ProductoAlmacen $productoAlmacen)
    {
        $productoAlmacen->update(['activo' => !$productoAlmacen->activo]);
        return back()->with('success', 'Estado actualizado.');
    }
}