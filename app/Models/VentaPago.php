<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VentaPago extends Model
{
    protected $table = 'venta_pagos';

    protected $fillable = [
        'venta_id', 'metodo_pago_id', 'cuenta_pago_id', 'monto',
    ];

    protected $casts = [
        'monto' => 'decimal:2',
    ];

    public function venta()      { return $this->belongsTo(Venta::class); }
    public function metodoPago() { return $this->belongsTo(MetodoPago::class); }
    public function cuentaPago() { return $this->belongsTo(CuentaPago::class); }
}
