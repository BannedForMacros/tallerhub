<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrdenServicio extends Model
{
    protected $table = 'ordenes_servicio';

    protected $fillable = [
        'empresa_id', 'local_id', 'recepcion_id', 'tecnico_id',
        'codigo', 'diagnostico', 'trabajo_realizado',
        'costo_mano_obra', 'costo_repuestos', 'costo_total',
        'estado', 'activo',
    ];

    protected $casts = [
        'activo'          => 'boolean',
        'costo_mano_obra' => 'decimal:2',
        'costo_repuestos' => 'decimal:2',
        'costo_total'     => 'decimal:2',
    ];

    const ESTADOS = [
        'pendiente', 'en_proceso',
        'completado', 'cancelado',
    ];

    public function empresa()   { return $this->belongsTo(Empresa::class); }
    public function local()     { return $this->belongsTo(Local::class); }
    public function recepcion() { return $this->belongsTo(Recepcion::class); }
    public function tecnico()   { return $this->belongsTo(User::class, 'tecnico_id'); }
    public function repuestos() { return $this->hasMany(OrdenRepuesto::class, 'orden_id'); }
}