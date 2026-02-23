<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VentaDetalle extends Model
{
    protected $table = 'ventas_detalle';

    protected $fillable = [
        'venta_id', 'tipo', 'servicio_id', 'producto_id',
        'unidad_medida_id', 'descripcion', 'cantidad',
        'precio_costo_ref', 'precio_unitario', 'subtotal',
    ];

    protected $casts = [
        'cantidad'         => 'decimal:4',
        'precio_costo_ref' => 'decimal:2',
        'precio_unitario'  => 'decimal:2',
        'subtotal'         => 'decimal:2',
    ];

    public function venta()        { return $this->belongsTo(Venta::class); }
    public function servicio()     { return $this->belongsTo(Servicio::class); }
    public function producto()     { return $this->belongsTo(ProductoAlmacen::class, 'producto_id'); }
    public function unidadMedida() { return $this->belongsTo(UnidadMedida::class); }
}