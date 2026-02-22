<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PermisoPorRol extends Model
{
    protected $table = 'permisos_por_rol';

    protected $fillable = [
        'rol_id', 'modulo_id',
        'ver', 'crear', 'editar', 'eliminar',
    ];

    protected $casts = [
        'ver'      => 'boolean',
        'crear'    => 'boolean',
        'editar'   => 'boolean',
        'eliminar' => 'boolean',
    ];

    public function rol()    { return $this->belongsTo(Rol::class); }
    public function modulo() { return $this->belongsTo(Modulo::class); }
}