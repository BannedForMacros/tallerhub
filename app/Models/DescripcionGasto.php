<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DescripcionGasto extends Model
{
    protected $table    = 'descripciones_gasto';
    protected $fillable = ['empresa_id', 'clasificacion_gasto_id', 'nombre', 'activo'];
    protected $casts    = ['activo' => 'boolean'];

    public function empresa()        { return $this->belongsTo(Empresa::class); }
    public function clasificacion()  { return $this->belongsTo(ClasificacionGasto::class, 'clasificacion_gasto_id'); }
    public function gastos()         { return $this->hasMany(Gasto::class, 'descripcion_gasto_id'); }
}