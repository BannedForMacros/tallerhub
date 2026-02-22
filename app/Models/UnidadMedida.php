<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UnidadMedida extends Model
{
    protected $table = 'unidades_medida';

    protected $fillable = ['nombre', 'abreviatura', 'activo'];

    protected $casts = ['activo' => 'boolean'];

    public function productoUnidades() { return $this->hasMany(ProductoUnidad::class); }
    public function productos()        { return $this->belongsToMany(ProductoAlmacen::class, 'producto_unidades', 'unidad_medida_id', 'producto_id'); }
}