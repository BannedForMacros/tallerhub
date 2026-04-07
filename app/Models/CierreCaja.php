<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CierreCaja extends Model
{
    protected $table = 'cierres_caja';

    protected $fillable = [
        'empresa_id', 'local_id', 'user_id', 'fecha', 'estado', 'observaciones',
        'total_esperado', 'total_entregado',
        'servicios_cantidad', 'servicios_total',
        'productos_cantidad', 'productos_total',
        'descuentos_total', 'ventas_neto',
        'cerrado_at',
    ];

    protected $casts = [
        'fecha'             => 'date',
        'cerrado_at'        => 'datetime',
        'total_esperado'    => 'decimal:2',
        'total_entregado'   => 'decimal:2',
        'diferencia'        => 'decimal:2',
        'servicios_total'   => 'decimal:2',
        'productos_total'   => 'decimal:2',
        'descuentos_total'  => 'decimal:2',
        'ventas_neto'       => 'decimal:2',
    ];

    public function empresa()  { return $this->belongsTo(Empresa::class); }
    public function local()    { return $this->belongsTo(Local::class); }
    public function usuario()  { return $this->belongsTo(User::class, 'user_id'); }
    public function pagos()    { return $this->hasMany(CierreCajaPago::class, 'cierre_id'); }

    public function esCerrado(): bool { return $this->estado === 'cerrado'; }
}
