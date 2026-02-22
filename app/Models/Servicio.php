<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Servicio extends Model
{
    protected $fillable = [
        'empresa_id', 'local_id', 'nombre',
        'descripcion', 'precio', 'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
        'precio' => 'decimal:2',
    ];

    public function empresa() { return $this->belongsTo(Empresa::class); }
    public function local()   { return $this->belongsTo(Local::class); }
}