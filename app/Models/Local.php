<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Local extends Model
{
    protected $fillable = [
        'empresa_id', 'nombre', 'direccion', 'telefono',
        'departamento', 'provincia', 'distrito', 'activo',
    ];

    protected $casts = ['activo' => 'boolean'];

    public function empresa()     { return $this->belongsTo(Empresa::class); }
    public function usuarios()    { return $this->hasMany(User::class); }
    public function recepciones() { return $this->hasMany(Recepcion::class); }
    public function servicios()   { return $this->hasMany(Servicio::class); }
    public function gastos()      { return $this->hasMany(Gasto::class); }
}