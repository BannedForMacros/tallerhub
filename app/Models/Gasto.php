<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Gasto extends Model
{
    protected $table = 'gastos';

    protected $fillable = [
        'empresa_id', 'local_id', 'user_id',
        'descripcion_gasto_id', 'monto', 'descripcion',
        'fecha', 'comprobante_numero', 'observaciones',
        'metodo_pago_id', 'cuenta_pago_id', 'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
        'monto'  => 'decimal:2',
        'fecha'  => 'date',
    ];

    public function empresa()         { return $this->belongsTo(Empresa::class); }
    public function local()           { return $this->belongsTo(Local::class); }
    public function usuario()         { return $this->belongsTo(User::class, 'user_id'); }
    public function descripcionGasto(){ return $this->belongsTo(DescripcionGasto::class, 'descripcion_gasto_id'); }
    public function metodoPago()      { return $this->belongsTo(MetodoPago::class); }
    public function cuentaPago()      { return $this->belongsTo(CuentaPago::class, 'cuenta_pago_id'); }
}