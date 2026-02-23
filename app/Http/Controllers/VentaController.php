<?php
namespace App\Http\Controllers;

use App\Models\Venta;
use App\Models\VentaDetalle;
use App\Models\Inventario;
use App\Models\SalidaAlmacen;
use App\Models\SalidaAlmacenDetalle;
use App\Models\Recepcion;
use App\Models\Servicio;
use App\Models\ProductoAlmacen;
use App\Models\Local;
use App\Models\Empresa;
use App\Models\Cliente;
use App\Models\Correlativo;
use App\Helpers\FechaHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class VentaController extends Controller
{
    private function getDatosFormulario(?int $empresaId, bool $esSuperAdmin): array
    {
        $empresas = $esSuperAdmin
            ? Empresa::where('activo', 1)->orderBy('nombre')->get()
            : collect();

        $locales = Local::where('activo', 1)
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('nombre')->get();

        $clientes = Cliente::where('activo', 1)
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('nombre')->get();

        $servicios = Servicio::where('activo', 1)
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('nombre')->get();

        $productos = ProductoAlmacen::with('productoUnidades.unidadMedida')
            ->where('activo', 1)
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('nombre')->get();

        // Inventario con precio promedio y stock por local
        $inventario = Inventario::with(['unidadMedida'])
            ->where('stock', '>', 0)
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->get()
            ->map(function ($inv) {
                $precioPromedio = \App\Models\EntradaAlmacenDetalle::where('producto_id',      $inv->producto_id)
                    ->where('unidad_medida_id', $inv->unidad_medida_id)
                    ->whereHas('entrada', fn($q) => $q->where('local_id', $inv->local_id)->where('activo', 1))
                    ->avg('precio_unitario') ?? 0;
                $inv->precio_promedio = round((float) $precioPromedio, 4);
                return $inv;
            })->values();

        // Recepciones pendientes de entrega (recibido o listo)
        $recepciones = Recepcion::with('cliente')
            ->whereIn('estado', ['recibido', 'en_proceso', 'listo'])
            ->where('activo', 1)
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderByDesc('id')
            ->get()
            ->map(fn($r) => [
                'id'     => $r->id,
                'codigo' => $r->codigo,
                'label'  => "{$r->codigo} — {$r->cliente?->nombre} ({$r->tipo_equipo} {$r->marca})",
            ]);

        return compact('empresas', 'locales', 'clientes', 'servicios', 'productos', 'inventario', 'recepciones');
    }

    public function index()
    {
        $user      = auth()->user();
        $empresaId = $user->esSuperAdmin() ? null : $user->empresa_id;

        $ventas = Venta::with(['cliente', 'local', 'usuario', 'recepcion', 'detalles'])
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderByDesc('id')
            ->get();

        return Inertia::render('Ventas/Index', [
            'ventas' => $ventas,
        ]);
    }

    public function create()
    {
        $user      = auth()->user();
        $empresaId = $user->esSuperAdmin() ? null : $user->empresa_id;

        return Inertia::render('Ventas/Create', $this->getDatosFormulario($empresaId, $user->esSuperAdmin()));
    }

    public function store(Request $request)
    {
        $user = auth()->user();

        $data = $request->validate([
            'empresa_id'                      => 'nullable|exists:empresas,id',
            'local_id'                        => 'required|exists:locales,id',
            'cliente_id'                      => 'nullable|exists:clientes,id',
            'recepcion_id'                    => 'nullable|exists:recepciones,id',
            'observaciones'                   => 'nullable|string',
            'descuento'                       => 'nullable|numeric|min:0',
            'fecha'                           => 'required|date',
            'detalles'                        => 'required|array|min:1',
            'detalles.*.tipo'                 => 'required|in:servicio,producto',
            'detalles.*.servicio_id'          => 'nullable|exists:servicios,id',
            'detalles.*.producto_id'          => 'nullable|exists:productos_almacen,id',
            'detalles.*.unidad_medida_id'     => 'nullable|exists:unidades_medida,id',
            'detalles.*.descripcion'          => 'required|string|max:255',
            'detalles.*.cantidad'             => 'required|numeric|min:0.0001',
            'detalles.*.precio_unitario'      => 'required|numeric|min:0',
        ]);

        $empresaId = $user->esSuperAdmin()
            ? ($data['empresa_id'] ?? Local::find($data['local_id'])->empresa_id)
            : $user->empresa_id;

        DB::transaction(function () use ($data, $empresaId, $user) {
            // Verificar stock para productos
            foreach ($data['detalles'] as $detalle) {
                if ($detalle['tipo'] === 'producto' && !empty($detalle['producto_id'])) {
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
            }

            // Calcular totales
            $subtotal = collect($data['detalles'])->sum(fn($d) =>
                (float) $d['cantidad'] * (float) $d['precio_unitario']
            );
            $descuento = (float) ($data['descuento'] ?? 0);
            $total     = $subtotal - $descuento;

            // Crear venta
            $venta = Venta::create([
                'codigo'        => Correlativo::siguiente($empresaId, 'VEN'),
                'empresa_id'    => $empresaId,
                'local_id'      => $data['local_id'],
                'cliente_id'    => $data['cliente_id']   ?? null,
                'recepcion_id'  => $data['recepcion_id'] ?? null,
                'user_id'       => $user->id,
                'observaciones' => $data['observaciones'] ?? null,
                'subtotal'      => $subtotal,
                'descuento'     => $descuento,
                'total'         => $total,
                'estado'        => 'pagado',
                'fecha'         => $data['fecha'],
            ]);

            // Crear salida de inventario para productos
            $productosParaSalida = collect($data['detalles'])
                ->filter(fn($d) => $d['tipo'] === 'producto' && !empty($d['producto_id']));

            if ($productosParaSalida->isNotEmpty()) {
                $salida = SalidaAlmacen::create([
                    'codigo'          => Correlativo::siguiente($empresaId, 'SAL'),
                    'empresa_id'      => $empresaId,
                    'local_id'        => $data['local_id'],
                    'user_id'         => $user->id,
                    'tipo'            => 'venta',
                    'motivo'          => 'Venta',
                    'referencia_id'   => $venta->id,
                    'referencia_tipo' => 'venta',
                    'total'           => 0,
                    'fecha'           => $data['fecha'],
                ]);

                $totalSalida = 0;

                foreach ($productosParaSalida as $detalle) {
                    $precioPromedio = (float) \App\Models\EntradaAlmacenDetalle::where('producto_id',      $detalle['producto_id'])
                        ->where('unidad_medida_id', $detalle['unidad_medida_id'])
                        ->whereHas('entrada', fn($q) => $q->where('local_id', $data['local_id'])->where('activo', 1))
                        ->avg('precio_unitario') ?? 0;

                    $subtotalSalida = (float) $detalle['cantidad'] * $precioPromedio;
                    $totalSalida += $subtotalSalida;

                    SalidaAlmacenDetalle::create([
                        'salida_id'        => $salida->id,
                        'producto_id'      => $detalle['producto_id'],
                        'unidad_medida_id' => $detalle['unidad_medida_id'],
                        'cantidad'         => $detalle['cantidad'],
                        'precio_unitario'  => $precioPromedio,
                        'tipo_precio'      => 'costo',
                        'subtotal'         => $subtotalSalida,
                    ]);

                    // Descontar stock
                    Inventario::where('empresa_id',      $empresaId)
                        ->where('local_id',        $data['local_id'])
                        ->where('producto_id',      $detalle['producto_id'])
                        ->where('unidad_medida_id', $detalle['unidad_medida_id'])
                        ->decrement('stock', $detalle['cantidad']);
                }

                $salida->update(['total' => $totalSalida]);
            }

            // Crear detalles de venta
            foreach ($data['detalles'] as $detalle) {
                $precioCostoRef = 0;
                if ($detalle['tipo'] === 'producto' && !empty($detalle['producto_id'])) {
                    $precioCostoRef = (float) \App\Models\EntradaAlmacenDetalle::where('producto_id',      $detalle['producto_id'])
                        ->where('unidad_medida_id', $detalle['unidad_medida_id'] ?? null)
                        ->whereHas('entrada', fn($q) => $q->where('local_id', $data['local_id'])->where('activo', 1))
                        ->avg('precio_unitario') ?? 0;
                }

                VentaDetalle::create([
                    'venta_id'         => $venta->id,
                    'tipo'             => $detalle['tipo'],
                    'servicio_id'      => $detalle['servicio_id']      ?? null,
                    'producto_id'      => $detalle['producto_id']      ?? null,
                    'unidad_medida_id' => $detalle['unidad_medida_id'] ?? null,
                    'descripcion'      => $detalle['descripcion'],
                    'cantidad'         => $detalle['cantidad'],
                    'precio_costo_ref' => $precioCostoRef,
                    'precio_unitario'  => $detalle['precio_unitario'],
                    'subtotal'         => (float) $detalle['cantidad'] * (float) $detalle['precio_unitario'],
                ]);
            }

            // Marcar recepción como entregado
            if (!empty($data['recepcion_id'])) {
                Recepcion::where('id', $data['recepcion_id'])->update([
                    'estado'             => 'entregado',
                    'fecha_entrega_real' => FechaHelper::ahora(),
                ]);
            }
        });

        return redirect()->route('ventas.index')
            ->with('success', 'Venta registrada correctamente.');
    }

    public function show(Venta $venta)
    {
        $venta->load(['cliente', 'local', 'usuario', 'recepcion.cliente', 'detalles.servicio', 'detalles.producto', 'detalles.unidadMedida']);
        return response()->json($venta);
    }

    public function edit(Venta $venta)
    {
        $user      = auth()->user();
        $empresaId = $user->esSuperAdmin() ? null : $user->empresa_id;

        if (!$user->esSuperAdmin() && $venta->empresa_id !== $user->empresa_id) abort(403);

        $venta->load(['detalles.servicio', 'detalles.producto', 'detalles.unidadMedida']);

        $datos = $this->getDatosFormulario($empresaId, $user->esSuperAdmin());

        return Inertia::render('Ventas/Edit', [
            ...$datos,
            'venta' => $venta,
        ]);
    }

    public function toggleActivo(Venta $venta)
    {
        $venta->update(['activo' => !$venta->activo, 'estado' => 'anulado']);
        return back()->with('success', 'Venta anulada.');
    }
}