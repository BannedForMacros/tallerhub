<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClasificacionGasto extends Model
{
    protected $table    = 'clasificaciones_gasto';
    protected $fillable = ['empresa_id', 'tipo_gasto_id', 'nombre', 'activo'];
    protected $casts    = ['activo' => 'boolean'];

    public function empresa()      { return $this->belongsTo(Empresa::class); }
    public function tipoGasto()    { return $this->belongsTo(TipoGasto::class); }
    public function descripciones(){ return $this->hasMany(DescripcionGasto::class, 'clasificacion_gasto_id'); }
}