<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cliente extends Model
{
    protected $fillable = [
        'empresa_id', 'nombre', 'dni',
        'telefono', 'email', 'direccion', 'activo',
    ];

    protected $casts = ['activo' => 'boolean'];

    public function empresa()     { return $this->belongsTo(Empresa::class); }
    public function recepciones() { return $this->hasMany(Recepcion::class); }
}