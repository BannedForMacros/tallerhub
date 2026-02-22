<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Gasto extends Model
{
    protected $fillable = [
        'empresa_id', 'local_id', 'user_id',
        'descripcion_gasto_id', 'monto',
        'descripcion', 'fecha', 'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
        'monto'  => 'decimal:2',
        'fecha'  => 'date',
    ];

    public function empresa()     { return $this->belongsTo(Empresa::class); }
    public function local()       { return $this->belongsTo(Local::class); }
    public function usuario()     { return $this->belongsTo(User::class, 'user_id'); }
    public function descripcion() { return $this->belongsTo(DescripcionGasto::class, 'descripcion_gasto_id'); }
}