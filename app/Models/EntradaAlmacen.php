<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Correlativo;

class EntradaAlmacen extends Model
{
    protected $table = 'entradas_almacen';

    protected $fillable = [
        'codigo', 'empresa_id', 'local_id', 'user_id',
        'motivo', 'observaciones', 'total', 'fecha', 'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
        'total'  => 'decimal:2',
        'fecha'  => 'datetime',
    ];

    public function empresa()  { return $this->belongsTo(Empresa::class); }
    public function local()    { return $this->belongsTo(Local::class); }
    public function usuario()  { return $this->belongsTo(User::class, 'user_id'); }
    public function detalles() { return $this->hasMany(EntradaAlmacenDetalle::class, 'entrada_id'); }

    public static function generarCodigo(int $empresaId): string
    {
        return Correlativo::siguiente($empresaId, 'ENT');
    }
}