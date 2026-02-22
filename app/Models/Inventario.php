<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inventario extends Model
{
    protected $table = 'inventario';

    protected $fillable = [
        'empresa_id', 'local_id', 'producto_id', 'unidad_medida_id',
        'stock', 'stock_minimo',
    ];

    protected $casts = [
        'stock'        => 'decimal:4',
        'stock_minimo' => 'decimal:4',
    ];

    public function empresa()      { return $this->belongsTo(Empresa::class); }
    public function local()        { return $this->belongsTo(Local::class); }
    public function producto()     { return $this->belongsTo(ProductoAlmacen::class, 'producto_id'); }
    public function unidadMedida() { return $this->belongsTo(UnidadMedida::class); }

    // Verifica si el stock está bajo el mínimo
    public function getStockBajoAttribute(): bool
    {
        return $this->stock <= $this->stock_minimo;
    }
}