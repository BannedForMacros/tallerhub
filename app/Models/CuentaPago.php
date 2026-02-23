<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CuentaPago extends Model
{
    protected $table = 'cuentas_pago';
    protected $fillable = [
        'empresa_id', 'metodo_pago_id', 'nombre',
        'numero_cuenta', 'titular', 'moneda', 'activo',
    ];
    protected $casts = ['activo' => 'boolean'];

    public function empresa()    { return $this->belongsTo(Empresa::class); }
    public function metodoPago() { return $this->belongsTo(MetodoPago::class); }
}