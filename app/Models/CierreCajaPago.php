<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CierreCajaPago extends Model
{
    protected $table = 'cierre_caja_pagos';

    protected $fillable = [
        'cierre_id', 'metodo_pago_id', 'cuenta_pago_id',
        'monto_esperado', 'monto_entregado',
    ];

    protected $casts = [
        'monto_esperado'  => 'decimal:2',
        'monto_entregado' => 'decimal:2',
        'diferencia'      => 'decimal:2',
    ];

    public function cierre()     { return $this->belongsTo(CierreCaja::class, 'cierre_id'); }
    public function metodoPago() { return $this->belongsTo(MetodoPago::class); }
    public function cuentaPago() { return $this->belongsTo(CuentaPago::class); }
}
