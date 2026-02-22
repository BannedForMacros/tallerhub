<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Recepcion extends Model
{
    protected $fillable = [
        'empresa_id', 'local_id', 'cliente_id', 'user_id',
        'codigo', 'tipo_equipo', 'marca', 'modelo', 'serie',
        'descripcion_falla', 'observaciones', 'accesorios',
        'estado', 'fecha_recepcion', 'fecha_entrega_estimada',
        'fecha_entrega_real', 'activo',
    ];

    protected $casts = [
        'activo'                => 'boolean',
        'fecha_recepcion'       => 'datetime',
        'fecha_entrega_estimada'=> 'date',
        'fecha_entrega_real'    => 'datetime',
    ];

    // Estados posibles
    const ESTADOS = [
        'recibido', 'en_diagnostico',
        'en_reparacion', 'listo',
        'entregado', 'sin_reparacion',
    ];

    public function empresa()       { return $this->belongsTo(Empresa::class); }
    public function local()         { return $this->belongsTo(Local::class); }
    public function cliente()       { return $this->belongsTo(Cliente::class); }
    public function usuario()       { return $this->belongsTo(User::class, 'user_id'); }
    public function ordenServicio() { return $this->hasOne(OrdenServicio::class); }
}