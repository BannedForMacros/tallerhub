<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
USE App\Models\Correlativo;

class Recepcion extends Model
{
    protected $table = 'recepciones'; 
    protected $fillable = [
        'codigo', 'empresa_id', 'local_id', 'cliente_id', 'user_id',
        'tipo_equipo', 'marca', 'modelo', 'serie',
        'descripcion_falla', 'observaciones', 'accesorios', 'estado',
        'fecha_recepcion', 'fecha_entrega_estimada', 'fecha_entrega_real',
        'activo',
    ];

    protected $casts = [
        'activo'                => 'boolean',
        'fecha_recepcion'       => 'datetime',
        'fecha_entrega_estimada'=> 'date',
        'fecha_entrega_real'    => 'datetime',
    ];

    public function empresa() { return $this->belongsTo(Empresa::class); }
    public function local()   { return $this->belongsTo(Local::class); }
    public function cliente() { return $this->belongsTo(Cliente::class); }
    public function tecnico() { return $this->belongsTo(User::class, 'user_id'); }

    public static function generarCodigo(int $empresaId): string
    {
        return Correlativo::siguiente($empresaId, 'REC');
    }
}