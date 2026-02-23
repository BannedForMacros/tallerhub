<?php
namespace App\Http\Controllers\Almacen;

use App\Http\Controllers\Controller;
use App\Models\SalidaAlmacen;
use App\Models\SalidaAlmacenDetalle;
use App\Models\EntradaAlmacenDetalle;
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

    private function getPrecioPromedio(int $productoId, int $unidadMedidaId, int $localId): float
    {
        return (float) EntradaAlmacenDetalle::where('producto_id',      $productoId)
            ->where('unidad_medida_id', $unidadMedidaId)
            ->whereHas('entrada', fn($q) => $q->where('local_id', $localId)->where('activo', 1))
            ->avg('precio_unitario') ?? 0;
    }

    private function getDatosFormulario(?int $empresaId, bool $esSuperAdmin): array
    {
        $empresas = $esSuperAdmin
            ? Empresa::where('activo', 1)->orderBy('nombre')->get()
            : collect();

        $locales = Local::where('activo', 1)
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('nombre')->get();

        $productos = ProductoAlmacen::with('productoUnidades.unidadMedida')
            ->where('activo', 1)
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('nombre')->get();

        $inventario = Inventario::with(['producto', 'unidadMedida'])
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->get()
            ->map(function ($inv) {
                $inv->precio_promedio = $this->getPrecioPromedio(
                    $inv->producto_id,
                    $inv->unidad_medida_id,
                    $inv->local_id
                );
                return $inv;
            })
            ->values();

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
            'empresa_id'                      => 'nullable|exists:empresas,id',
            'local_id'                        => 'required|exists:locales,id',
            'tipo'                            => "required|string|in:{$motivosValidos}",
            'observaciones'                   => 'nullable|string',
            'fecha'                           => 'required|date',
            'detalles'                        => 'required|array|min:1',
            'detalles.*.producto_id'          => 'required|exists:productos_almacen,id',
            'detalles.*.unidad_medida_id'     => 'required|exists:unidades_medida,id',
            'detalles.*.cantidad'             => 'required|numeric|min:0.0001',
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

                $stockDisponible = $inv ? (float) $inv->stock : 0;

                if ((float) $detalle['cantidad'] > $stockDisponible) {
                    $producto = ProductoAlmacen::find($detalle['producto_id']);
                    throw new \Exception("Stock insuficiente para '{$producto->nombre}'. Disponible: {$stockDisponible}");
                }
            }

            // Crear cabecera con total 0 primero
            $salida = SalidaAlmacen::create([
                'codigo'        => Correlativo::siguiente($empresaId, 'SAL'),
                'empresa_id'    => $empresaId,
                'local_id'      => $data['local_id'],
                'user_id'       => $user->id,
                'tipo'          => $data['tipo'],
                'motivo'        => self::motivosDisponibles()[$data['tipo']] ?? $data['tipo'],
                'observaciones' => $data['observaciones'] ?? null,
                'total'         => 0,
                'fecha'         => $data['fecha'],
            ]);

            $totalSalida = 0;

            foreach ($data['detalles'] as $detalle) {
                // Calcular precio promedio de entradas
                $precioPromedio = $this->getPrecioPromedio(
                    $detalle['producto_id'],
                    $detalle['unidad_medida_id'],
                    $data['local_id']
                );

                $subtotal = (float) $detalle['cantidad'] * $precioPromedio;
                $totalSalida += $subtotal;

                SalidaAlmacenDetalle::create([
                    'salida_id'        => $salida->id,
                    'producto_id'      => $detalle['producto_id'],
                    'unidad_medida_id' => $detalle['unidad_medida_id'],
                    'cantidad'         => $detalle['cantidad'],
                    'precio_unitario'  => $precioPromedio,
                    'tipo_precio'      => 'costo',
                    'subtotal'         => $subtotal,
                ]);

                // Descontar stock
                Inventario::where('empresa_id',      $empresaId)
                    ->where('local_id',        $data['local_id'])
                    ->where('producto_id',      $detalle['producto_id'])
                    ->where('unidad_medida_id', $detalle['unidad_medida_id'])
                    ->decrement('stock', $detalle['cantidad']);
            }

            // Actualizar total real
            $salida->update(['total' => $totalSalida]);
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

            // Verificar nuevo stock disponible
            foreach ($data['detalles'] as $detalle) {
                $inv = Inventario::where('empresa_id',      $empresaId)
                    ->where('local_id',        $data['local_id'])
                    ->where('producto_id',      $detalle['producto_id'])
                    ->where('unidad_medida_id', $detalle['unidad_medida_id'])
                    ->first();

                $stockDisponible = $inv ? (float) $inv->stock : 0;

                if ((float) $detalle['cantidad'] > $stockDisponible) {
                    $producto = ProductoAlmacen::find($detalle['producto_id']);
                    throw new \Exception("Stock insuficiente para '{$producto->nombre}'. Disponible: {$stockDisponible}");
                }
            }

            // Eliminar detalles anteriores
            $salidaAlmacen->detalles()->delete();

            $totalSalida = 0;

            $salidaAlmacen->update([
                'local_id'      => $data['local_id'],
                'tipo'          => $data['tipo'],
                'motivo'        => self::motivosDisponibles()[$data['tipo']] ?? $data['tipo'],
                'observaciones' => $data['observaciones'] ?? null,
                'fecha'         => $data['fecha'],
            ]);

            foreach ($data['detalles'] as $detalle) {
                $precioPromedio = $this->getPrecioPromedio(
                    $detalle['producto_id'],
                    $detalle['unidad_medida_id'],
                    $data['local_id']
                );

                $subtotal = (float) $detalle['cantidad'] * $precioPromedio;
                $totalSalida += $subtotal;

                SalidaAlmacenDetalle::create([
                    'salida_id'        => $salidaAlmacen->id,
                    'producto_id'      => $detalle['producto_id'],
                    'unidad_medida_id' => $detalle['unidad_medida_id'],
                    'cantidad'         => $detalle['cantidad'],
                    'precio_unitario'  => $precioPromedio,
                    'tipo_precio'      => 'costo',
                    'subtotal'         => $subtotal,
                ]);

                Inventario::where('empresa_id',      $empresaId)
                    ->where('local_id',        $data['local_id'])
                    ->where('producto_id',      $detalle['producto_id'])
                    ->where('unidad_medida_id', $detalle['unidad_medida_id'])
                    ->decrement('stock', $detalle['cantidad']);
            }

            $salidaAlmacen->update(['total' => $totalSalida]);
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