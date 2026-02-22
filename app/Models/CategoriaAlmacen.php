<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CategoriaAlmacen extends Model
{
    protected $table = 'categorias_almacen';

    protected $fillable = ['empresa_id', 'nombre', 'activo'];

    protected $casts = ['activo' => 'boolean'];

    public function empresa()  { return $this->belongsTo(Empresa::class); }
    public function productos() { return $this->hasMany(ProductoAlmacen::class, 'categoria_id'); }
}