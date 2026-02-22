<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalidaAlmacenDetalle extends Model
{
    protected $table = 'salidas_almacen_detalle';

    protected $fillable = [
        'salida_id', 'producto_id', 'unidad_medida_id',
        'cantidad', 'precio_unitario', 'tipo_precio', 'subtotal',
    ];

    protected $casts = [
        'cantidad'        => 'decimal:4',
        'precio_unitario' => 'decimal:2',
        'subtotal'        => 'decimal:2',
    ];

    public function salida()       { return $this->belongsTo(SalidaAlmacen::class); }
    public function producto()     { return $this->belongsTo(ProductoAlmacen::class, 'producto_id'); }
    public function unidadMedida() { return $this->belongsTo(UnidadMedida::class); }
}