<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductoUnidad extends Model
{
    protected $table = 'producto_unidades';

    protected $fillable = [
        'producto_id', 'unidad_medida_id', 'es_principal', 'factor_conversion',
    ];

    protected $casts = [
        'es_principal'      => 'boolean',
        'factor_conversion' => 'decimal:4',
    ];

    public function producto()     { return $this->belongsTo(ProductoAlmacen::class, 'producto_id'); }
    public function unidadMedida() { return $this->belongsTo(UnidadMedida::class); }
}