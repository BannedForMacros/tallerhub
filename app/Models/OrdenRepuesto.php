<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrdenRepuesto extends Model
{
    protected $table = 'orden_repuestos';

    protected $fillable = [
        'orden_id', 'nombre_repuesto',
        'cantidad', 'precio_unitario', 'subtotal',
    ];

    protected $casts = [
        'precio_unitario' => 'decimal:2',
        'subtotal'        => 'decimal:2',
    ];

    public function orden() { return $this->belongsTo(OrdenServicio::class, 'orden_id'); }
}