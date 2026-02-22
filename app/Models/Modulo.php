<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Modulo extends Model
{
    protected $fillable = [
        'nombre', 'slug', 'url', 'icono',
        'orden', 'parent_id', 'activo',
    ];

    protected $casts = ['activo' => 'boolean'];

    public function padre()    { return $this->belongsTo(Modulo::class, 'parent_id'); }
    public function hijos()    { return $this->hasMany(Modulo::class, 'parent_id')->orderBy('orden'); }
    public function permisos() { return $this->hasMany(PermisoPorRol::class); }
}