<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rol extends Model
{
    protected $fillable = [
        'empresa_id', 'nombre', 'descripcion', 'activo',
    ];

    protected $casts = ['activo' => 'boolean'];

    public function empresa()        { return $this->belongsTo(Empresa::class); }
    public function usuarios()       { return $this->hasMany(User::class); }
    public function permisos()       { return $this->hasMany(PermisoPorRol::class); }

    // Verifica si este rol es superadmin
    public function esSuperAdmin(): bool
    {
        return $this->nombre === 'superadmin';
    }

    // Verifica si este rol es dueño
    public function esDueno(): bool
    {
        return $this->nombre === 'dueño';
    }
}