<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductoAlmacen extends Model
{
    protected $table = 'productos_almacen';

    protected $fillable = [
        'empresa_id', 'categoria_id', 'codigo', 'nombre',
        'descripcion', 'precio_venta', 'activo',
    ];

    protected $casts = [
        'activo'       => 'boolean',
        'precio_venta' => 'decimal:2',
    ];

    public function empresa()          { return $this->belongsTo(Empresa::class); }
    public function categoria()        { return $this->belongsTo(CategoriaAlmacen::class, 'categoria_id'); }
    public function productoUnidades() { return $this->hasMany(ProductoUnidad::class, 'producto_id'); }
    public function unidades()         { return $this->belongsToMany(UnidadMedida::class, 'producto_unidades', 'producto_id', 'unidad_medida_id')->withPivot('es_principal', 'factor_conversion'); }
    public function inventarios()      { return $this->hasMany(Inventario::class, 'producto_id'); }
    public function entradasDetalle()  { return $this->hasMany(EntradaAlmacenDetalle::class, 'producto_id'); }
    public function salidasDetalle()   { return $this->hasMany(SalidaAlmacenDetalle::class, 'producto_id'); }

    // Último precio de costo registrado en entradas
    public function getUltimoCostoAttribute(): float
    {
        $ultimo = $this->entradasDetalle()
            ->orderByDesc('created_at')
            ->first();
        return $ultimo ? (float) $ultimo->precio_unitario : 0;
    }

    public function getTienePrecioVentaAttribute(): bool
    {
        return !is_null($this->precio_venta);
    }
}