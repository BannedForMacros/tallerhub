<?php
namespace App\Http\Controllers\Almacen;

use App\Http\Controllers\Controller;
use App\Models\EntradaAlmacen;
use App\Models\EntradaAlmacenDetalle;
use App\Models\Inventario;
use App\Models\ProductoAlmacen;
use App\Models\Proveedor;
use App\Models\Local;
use App\Models\Empresa;
use App\Models\Correlativo;
use App\Helpers\FechaHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class EntradaAlmacenController extends Controller
{
    public function index()
    {
        $user      = auth()->user();
        $empresaId = $user->esSuperAdmin() ? null : $user->empresa_id;

        $entradas = EntradaAlmacen::with(['local', 'usuario', 'detalles.producto', 'detalles.proveedor', 'detalles.unidadMedida'])
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderByDesc('id')
            ->get();

        return Inertia::render('Almacen/Entradas/Index', [
            'entradas' => $entradas,
        ]);
    }

    public function create()
    {
        $user      = auth()->user();
        $empresaId = $user->esSuperAdmin() ? null : $user->empresa_id;

        $empresas = $user->esSuperAdmin()
            ? Empresa::where('activo', 1)->orderBy('nombre')->get()
            : collect();

        $locales = Local::where('activo', 1)
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('nombre')->get();

        $productos = ProductoAlmacen::with('productoUnidades.unidadMedida')
            ->where('activo', 1)
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('nombre')->get();

        $proveedores = Proveedor::where('activo', 1)
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('nombre')->get();

        return Inertia::render('Almacen/Entradas/Create', [
            'empresas'    => $empresas,
            'locales'     => $locales,
            'productos'   => $productos,
            'proveedores' => $proveedores,
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();

        $data = $request->validate([
            'empresa_id'                      => 'nullable|exists:empresas,id',
            'local_id'                        => 'required|exists:locales,id',
            'motivo'                          => 'nullable|string|max:255',
            'observaciones'                   => 'nullable|string',
            'fecha'                           => 'required|date',
            'detalles'                        => 'required|array|min:1',
            'detalles.*.producto_id'          => 'required|exists:productos_almacen,id',
            'detalles.*.unidad_medida_id'     => 'required|exists:unidades_medida,id',
            'detalles.*.proveedor_id'         => 'nullable|exists:proveedores,id',
            'detalles.*.cantidad'             => 'required|numeric|min:0.0001',
            'detalles.*.precio_unitario'      => 'required|numeric|min:0',
            'detalles.*.subtotal'             => 'required|numeric|min:0',
        ]);

        $empresaId = $user->esSuperAdmin()
            ? ($data['empresa_id'] ?? Local::find($data['local_id'])->empresa_id)
            : $user->empresa_id;

        DB::transaction(function () use ($data, $empresaId, $user) {
            $total = collect($data['detalles'])->sum(fn($d) => $d['subtotal']);

            $entrada = EntradaAlmacen::create([
                'codigo'        => Correlativo::siguiente($empresaId, 'ENT'),
                'empresa_id'    => $empresaId,
                'local_id'      => $data['local_id'],
                'user_id'       => $user->id,
                'motivo'        => $data['motivo']        ?? null,
                'observaciones' => $data['observaciones'] ?? null,
                'total'         => $total,
                'fecha'         => $data['fecha'],
            ]);

            foreach ($data['detalles'] as $detalle) {
                EntradaAlmacenDetalle::create([
                    'entrada_id'       => $entrada->id,
                    'producto_id'      => $detalle['producto_id'],
                    'unidad_medida_id' => $detalle['unidad_medida_id'],
                    'proveedor_id'     => $detalle['proveedor_id'] ?? null,
                    'cantidad'         => $detalle['cantidad'],
                    'precio_unitario'  => $detalle['precio_unitario'],
                    'subtotal'         => $detalle['subtotal'],
                ]);

                // Actualizar inventario
                $inv = Inventario::where('empresa_id',       $empresaId)
                    ->where('local_id',          $data['local_id'])
                    ->where('producto_id',        $detalle['producto_id'])
                    ->where('unidad_medida_id',   $detalle['unidad_medida_id'])
                    ->first();

                if ($inv) {
                    $inv->increment('stock', $detalle['cantidad']);
                } else {
                    Inventario::create([
                        'empresa_id'       => $empresaId,
                        'local_id'         => $data['local_id'],
                        'producto_id'      => $detalle['producto_id'],
                        'unidad_medida_id' => $detalle['unidad_medida_id'],
                        'stock'            => $detalle['cantidad'],
                        'stock_minimo'     => 0,
                    ]);
                }
            }
        });

        return redirect()->route('almacen.entradas.index')
            ->with('success', 'Entrada registrada correctamente.');
    }

    public function edit(EntradaAlmacen $entradaAlmacen)
    {
        $user      = auth()->user();
        $empresaId = $user->esSuperAdmin() ? null : $user->empresa_id;

        if (!$user->esSuperAdmin() && $entradaAlmacen->empresa_id !== $user->empresa_id) abort(403);

        $entradaAlmacen->load(['detalles.producto', 'detalles.unidadMedida', 'detalles.proveedor']);

        $empresas = $user->esSuperAdmin()
            ? Empresa::where('activo', 1)->orderBy('nombre')->get()
            : collect();

        $locales = Local::where('activo', 1)
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('nombre')->get();

        $productos = ProductoAlmacen::with('productoUnidades.unidadMedida')
            ->where('activo', 1)
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('nombre')->get();

        $proveedores = Proveedor::where('activo', 1)
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('nombre')->get();

        return Inertia::render('Almacen/Entradas/Edit', [
            'entrada'     => $entradaAlmacen,
            'empresas'    => $empresas,
            'locales'     => $locales,
            'productos'   => $productos,
            'proveedores' => $proveedores,
        ]);
    }

    public function update(Request $request, EntradaAlmacen $entradaAlmacen)
    {
        $user = auth()->user();
        if (!$user->esSuperAdmin() && $entradaAlmacen->empresa_id !== $user->empresa_id) abort(403);

        $data = $request->validate([
            'local_id'                    => 'required|exists:locales,id',
            'motivo'                      => 'nullable|string|max:255',
            'observaciones'               => 'nullable|string',
            'fecha'                       => 'required|date',
            'detalles'                    => 'required|array|min:1',
            'detalles.*.producto_id'      => 'required|exists:productos_almacen,id',
            'detalles.*.unidad_medida_id' => 'required|exists:unidades_medida,id',
            'detalles.*.proveedor_id'     => 'nullable|exists:proveedores,id',
            'detalles.*.cantidad'         => 'required|numeric|min:0.0001',
            'detalles.*.precio_unitario'  => 'required|numeric|min:0',
            'detalles.*.subtotal'         => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($data, $entradaAlmacen) {
            $empresaId = $entradaAlmacen->empresa_id;

            // Revertir stock anterior
            foreach ($entradaAlmacen->detalles as $detalleAnterior) {
                $inv = Inventario::where('empresa_id',      $empresaId)
                    ->where('local_id',         $entradaAlmacen->local_id)
                    ->where('producto_id',       $detalleAnterior->producto_id)
                    ->where('unidad_medida_id',  $detalleAnterior->unidad_medida_id)
                    ->first();
                if ($inv) {
                    $inv->decrement('stock', $detalleAnterior->cantidad);
                }
            }

            // Eliminar detalles anteriores
            $entradaAlmacen->detalles()->delete();

            $total = collect($data['detalles'])->sum(fn($d) => $d['subtotal']);

            $entradaAlmacen->update([
                'local_id'      => $data['local_id'],
                'motivo'        => $data['motivo']        ?? null,
                'observaciones' => $data['observaciones'] ?? null,
                'total'         => $total,
                'fecha'         => $data['fecha'],
            ]);

            // Crear nuevos detalles y actualizar stock
            foreach ($data['detalles'] as $detalle) {
                EntradaAlmacenDetalle::create([
                    'entrada_id'       => $entradaAlmacen->id,
                    'producto_id'      => $detalle['producto_id'],
                    'unidad_medida_id' => $detalle['unidad_medida_id'],
                    'proveedor_id'     => $detalle['proveedor_id'] ?? null,
                    'cantidad'         => $detalle['cantidad'],
                    'precio_unitario'  => $detalle['precio_unitario'],
                    'subtotal'         => $detalle['subtotal'],
                ]);

                $inv = Inventario::where('empresa_id',     $empresaId)
                    ->where('local_id',        $data['local_id'])
                    ->where('producto_id',      $detalle['producto_id'])
                    ->where('unidad_medida_id', $detalle['unidad_medida_id'])
                    ->first();

                if ($inv) {
                    $inv->increment('stock', $detalle['cantidad']);
                } else {
                    Inventario::create([
                        'empresa_id'       => $empresaId,
                        'local_id'         => $data['local_id'],
                        'producto_id'      => $detalle['producto_id'],
                        'unidad_medida_id' => $detalle['unidad_medida_id'],
                        'stock'            => $detalle['cantidad'],
                        'stock_minimo'     => 0,
                    ]);
                }
            }
        });

        return redirect()->route('almacen.entradas.index')
            ->with('success', 'Entrada actualizada correctamente.');
    }

    public function show(EntradaAlmacen $entradaAlmacen)
    {
        $entradaAlmacen->load(['local', 'usuario', 'detalles.producto', 'detalles.proveedor', 'detalles.unidadMedida']);
        return response()->json($entradaAlmacen);
    }

    public function toggleActivo(EntradaAlmacen $entradaAlmacen)
    {
        $entradaAlmacen->update(['activo' => !$entradaAlmacen->activo]);
        return back()->with('success', 'Estado actualizado.');
    }
}