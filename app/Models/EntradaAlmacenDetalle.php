<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EntradaAlmacenDetalle extends Model
{
    protected $table = 'entradas_almacen_detalle';

    protected $fillable = [
        'entrada_id', 'producto_id', 'unidad_medida_id',
        'proveedor_id', 'cantidad', 'precio_unitario', 'subtotal',
    ];

    protected $casts = [
        'cantidad'        => 'decimal:4',
        'precio_unitario' => 'decimal:2',
        'subtotal'        => 'decimal:2',
    ];

    public function entrada()      { return $this->belongsTo(EntradaAlmacen::class); }
    public function producto()     { return $this->belongsTo(ProductoAlmacen::class, 'producto_id'); }
    public function unidadMedida() { return $this->belongsTo(UnidadMedida::class); }
    public function proveedor()    { return $this->belongsTo(Proveedor::class); }
}