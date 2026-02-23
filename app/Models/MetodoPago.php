<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MetodoPago extends Model
{
    protected $table = 'metodos_pago';
    protected $fillable = ['empresa_id', 'nombre', 'icono', 'activo'];
    protected $casts = ['activo' => 'boolean'];

    public function empresa()  { return $this->belongsTo(Empresa::class); }
    public function cuentas()  { return $this->hasMany(CuentaPago::class); }

    // Cuentas activas
    public function cuentasActivas()
    {
        return $this->hasMany(CuentaPago::class)->where('activo', 1);
    }
}