<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Proveedor extends Model
{
    protected $table = 'proveedores';

    protected $fillable = [
        'empresa_id', 'nombre', 'ruc', 'telefono',
        'email', 'direccion', 'contacto', 'activo',
    ];

    protected $casts = ['activo' => 'boolean'];

    public function empresa()         { return $this->belongsTo(Empresa::class); }
    public function entradasDetalle() { return $this->hasMany(EntradaAlmacenDetalle::class, 'proveedor_id'); }
}