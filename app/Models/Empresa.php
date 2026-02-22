<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Empresa extends Model
{
    protected $fillable = [
        'nombre', 'ruc', 'direccion', 'telefono',
        'email', 'departamento', 'provincia', 'distrito',
        'logo', 'activo',
    ];

    protected $casts = ['activo' => 'boolean'];

    public function locales()    { return $this->hasMany(Local::class); }
    public function roles()      { return $this->hasMany(Rol::class); }
    public function usuarios()   { return $this->hasMany(User::class); }
    public function clientes()   { return $this->hasMany(Cliente::class); }
    public function servicios()  { return $this->hasMany(Servicio::class); }
    public function tiposGasto() { return $this->hasMany(TipoGasto::class); }
    public function gastos()     { return $this->hasMany(Gasto::class); }
}