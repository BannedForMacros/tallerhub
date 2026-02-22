<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TipoGasto extends Model
{
    protected $table = 'tipos_gasto';
    protected $fillable = ['empresa_id', 'nombre', 'activo'];
    protected $casts    = ['activo' => 'boolean'];

    public function empresa()         { return $this->belongsTo(Empresa::class); }
    public function clasificaciones() { return $this->hasMany(ClasificacionGasto::class); }
}