<?php
namespace App\Http\Controllers\Almacen;

use App\Http\Controllers\Controller;
use App\Models\SalidaAlmacen;
use App\Models\SalidaAlmacenDetalle;
use App\Models\Inventario;
use App\Models\ProductoAlmacen;
use App\Models\Local;
use App\Models\Empresa;
use App\Models\Correlativo;
use App\Helpers\FechaHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SalidaAlmacenController extends Controller
{
    public static function motivosDisponibles(): array
    {
        return [
            'ajuste'             => 'Ajuste de inventario',
            'devolucion_defecto' => 'Devolución por defecto',
            'otro'               => 'Otro',
        ];
    }

    private function getDatosFormulario(int|null $empresaId, bool $esSuperAdmin): array
    {
        $empresas = $esSuperAdmin
            ? Empresa::where('activo', 1)->orderBy('nombre')->get()
            : collect();

        $locales = Local::where('activo', 1)
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('nombre')->get();

        // Productos con su stock disponible por local
        $productos = ProductoAlmacen::with('productoUnidades.unidadMedida')
            ->where('activo', 1)
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('nombre')->get();

        // Stock disponible: inventario agrupado por producto+unidad+local
        $inventario = Inventario::where('stock', '>', 0)
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->get()
            ->groupBy(fn($i) => $i->local_id . '_' . $i->producto_id . '_' . $i->unidad_medida_id)
            ->map(fn($grupo) => $grupo->first());

        return compact('empresas', 'locales', 'productos', 'inventario');
    }

    public function index()
    {
        $user      = auth()->user();
        $empresaId = $user->esSuperAdmin() ? null : $user->empresa_id;

        $salidas = SalidaAlmacen::with(['local', 'usuario', 'detalles.producto', 'detalles.unidadMedida'])
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderByDesc('id')
            ->get();

        return Inertia::render('Almacen/Salidas/Index', [
            'salidas' => $salidas,
        ]);
    }

    public function create()
    {
        $user      = auth()->user();
        $empresaId = $user->esSuperAdmin() ? null : $user->empresa_id;

        $datos = $this->getDatosFormulario($empresaId, $user->esSuperAdmin());

        return Inertia::render('Almacen/Salidas/Create', [
            ...$datos,
            'motivos' => self::motivosDisponibles(),
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();

        $motivosValidos = implode(',', array_keys(self::motivosDisponibles()));

        $data = $request->validate([
            'empresa_id'                  => 'nullable|exists:empresas,id',
            'local_id'                    => 'required|exists:locales,id',
            'tipo'                        => "required|string|in:{$motivosValidos}",
            'observaciones'               => 'nullable|string',
            'fecha'                       => 'required|date',
            'detalles'                    => 'required|array|min:1',
            'detalles.*.producto_id'      => 'required|exists:productos_almacen,id',
            'detalles.*.unidad_medida_id' => 'required|exists:unidades_medida,id',
            'detalles.*.cantidad'         => 'required|numeric|min:0.0001',
            'detalles.*.precio_unitario'  => 'required|numeric|min:0',
            'detalles.*.tipo_precio'      => 'required|in:costo,venta',
            'detalles.*.subtotal'         => 'required|numeric|min:0',
        ]);

        $empresaId = $user->esSuperAdmin()
            ? ($data['empresa_id'] ?? Local::find($data['local_id'])->empresa_id)
            : $user->empresa_id;

        DB::transaction(function () use ($data, $empresaId, $user) {
            // Verificar stock suficiente
            foreach ($data['detalles'] as $detalle) {
                $inv = Inventario::where('empresa_id',      $empresaId)
                    ->where('local_id',        $data['local_id'])
                    ->where('producto_id',      $detalle['producto_id'])
                    ->where('unidad_medida_id', $detalle['unidad_medida_id'])
                    ->first();

                $stockDisponible = $inv ? $inv->stock : 0;

                if ($detalle['cantidad'] > $stockDisponible) {
                    $producto = ProductoAlmacen::find($detalle['producto_id']);
                    throw new \Exception("Stock insuficiente para '{$producto->nombre}'. Disponible: {$stockDisponible}");
                }
            }

            $total = collect($data['detalles'])->sum(fn($d) => $d['subtotal']);

            $salida = SalidaAlmacen::create([
                'codigo'        => Correlativo::siguiente($empresaId, 'SAL'),
                'empresa_id'    => $empresaId,
                'local_id'      => $data['local_id'],
                'user_id'       => $user->id,
                'tipo'          => $data['tipo'],
                'motivo'        => self::motivosDisponibles()[$data['tipo']] ?? $data['tipo'],
                'observaciones' => $data['observaciones'] ?? null,
                'total'         => $total,
                'fecha'         => $data['fecha'],
            ]);

            foreach ($data['detalles'] as $detalle) {
                SalidaAlmacenDetalle::create([
                    'salida_id'        => $salida->id,
                    'producto_id'      => $detalle['producto_id'],
                    'unidad_medida_id' => $detalle['unidad_medida_id'],
                    'cantidad'         => $detalle['cantidad'],
                    'precio_unitario'  => $detalle['precio_unitario'],
                    'tipo_precio'      => $detalle['tipo_precio'],
                    'subtotal'         => $detalle['subtotal'],
                ]);

                // Descontar stock
                Inventario::where('empresa_id',      $empresaId)
                    ->where('local_id',        $data['local_id'])
                    ->where('producto_id',      $detalle['producto_id'])
                    ->where('unidad_medida_id', $detalle['unidad_medida_id'])
                    ->decrement('stock', $detalle['cantidad']);
            }
        });

        return redirect()->route('almacen.salidas.index')
            ->with('success', 'Salida registrada correctamente.');
    }

    public function edit(SalidaAlmacen $salidaAlmacen)
    {
        $user      = auth()->user();
        $empresaId = $user->esSuperAdmin() ? null : $user->empresa_id;

        if (!$user->esSuperAdmin() && $salidaAlmacen->empresa_id !== $user->empresa_id) abort(403);

        $salidaAlmacen->load(['detalles.producto', 'detalles.unidadMedida']);

        $datos = $this->getDatosFormulario($empresaId, $user->esSuperAdmin());

        return Inertia::render('Almacen/Salidas/Edit', [
            ...$datos,
            'salida'  => $salidaAlmacen,
            'motivos' => self::motivosDisponibles(),
        ]);
    }

    public function update(Request $request, SalidaAlmacen $salidaAlmacen)
    {
        $user = auth()->user();
        if (!$user->esSuperAdmin() && $salidaAlmacen->empresa_id !== $user->empresa_id) abort(403);

        $motivosValidos = implode(',', array_keys(self::motivosDisponibles()));

        $data = $request->validate([
            'local_id'                    => 'required|exists:locales,id',
            'tipo'                        => "required|string|in:{$motivosValidos}",
            'observaciones'               => 'nullable|string',
            'fecha'                       => 'required|date',
            'detalles'                    => 'required|array|min:1',
            'detalles.*.producto_id'      => 'required|exists:productos_almacen,id',
            'detalles.*.unidad_medida_id' => 'required|exists:unidades_medida,id',
            'detalles.*.cantidad'         => 'required|numeric|min:0.0001',
            'detalles.*.precio_unitario'  => 'required|numeric|min:0',
            'detalles.*.tipo_precio'      => 'required|in:costo,venta',
            'detalles.*.subtotal'         => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($data, $salidaAlmacen) {
            $empresaId = $salidaAlmacen->empresa_id;

            // Devolver stock anterior
            foreach ($salidaAlmacen->detalles as $detalleAnterior) {
                Inventario::where('empresa_id',      $empresaId)
                    ->where('local_id',        $salidaAlmacen->local_id)
                    ->where('producto_id',      $detalleAnterior->producto_id)
                    ->where('unidad_medida_id', $detalleAnterior->unidad_medida_id)
                    ->increment('stock', $detalleAnterior->cantidad);
            }

            // Verificar nuevo stock
            foreach ($data['detalles'] as $detalle) {
                $inv = Inventario::where('empresa_id',      $empresaId)
                    ->where('local_id',        $data['local_id'])
                    ->where('producto_id',      $detalle['producto_id'])
                    ->where('unidad_medida_id', $detalle['unidad_medida_id'])
                    ->first();

                $stockDisponible = $inv ? $inv->stock : 0;

                if ($detalle['cantidad'] > $stockDisponible) {
                    $producto = ProductoAlmacen::find($detalle['producto_id']);
                    throw new \Exception("Stock insuficiente para '{$producto->nombre}'. Disponible: {$stockDisponible}");
                }
            }

            $salidaAlmacen->detalles()->delete();

            $total = collect($data['detalles'])->sum(fn($d) => $d['subtotal']);

            $salidaAlmacen->update([
                'local_id'      => $data['local_id'],
                'tipo'          => $data['tipo'],
                'motivo'        => self::motivosDisponibles()[$data['tipo']] ?? $data['tipo'],
                'observaciones' => $data['observaciones'] ?? null,
                'total'         => $total,
                'fecha'         => $data['fecha'],
            ]);

            foreach ($data['detalles'] as $detalle) {
                SalidaAlmacenDetalle::create([
                    'salida_id'        => $salidaAlmacen->id,
                    'producto_id'      => $detalle['producto_id'],
                    'unidad_medida_id' => $detalle['unidad_medida_id'],
                    'cantidad'         => $detalle['cantidad'],
                    'precio_unitario'  => $detalle['precio_unitario'],
                    'tipo_precio'      => $detalle['tipo_precio'],
                    'subtotal'         => $detalle['subtotal'],
                ]);

                Inventario::where('empresa_id',      $empresaId)
                    ->where('local_id',        $data['local_id'])
                    ->where('producto_id',      $detalle['producto_id'])
                    ->where('unidad_medida_id', $detalle['unidad_medida_id'])
                    ->decrement('stock', $detalle['cantidad']);
            }
        });

        return redirect()->route('almacen.salidas.index')
            ->with('success', 'Salida actualizada correctamente.');
    }

    public function toggleActivo(SalidaAlmacen $salidaAlmacen)
    {
        $salidaAlmacen->update(['activo' => !$salidaAlmacen->activo]);
        return back()->with('success', 'Estado actualizado.');
    }
}