<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Correlativo;

class Venta extends Model
{
    protected $table = 'ventas';

    protected $fillable = [
        'codigo', 'empresa_id', 'local_id', 'cliente_id',
        'recepcion_id', 'user_id', 'observaciones',
        'subtotal', 'descuento', 'total', 'estado',
        'fecha', 'activo',
    ];

    protected $casts = [
        'activo'    => 'boolean',
        'subtotal'  => 'decimal:2',
        'descuento' => 'decimal:2',
        'total'     => 'decimal:2',
        'fecha'     => 'datetime',
    ];

    public function empresa()   { return $this->belongsTo(Empresa::class); }
    public function local()     { return $this->belongsTo(Local::class); }
    public function cliente()   { return $this->belongsTo(Cliente::class); }
    public function recepcion() { return $this->belongsTo(Recepcion::class); }
    public function usuario()   { return $this->belongsTo(User::class, 'user_id'); }
    public function detalles()  { return $this->hasMany(VentaDetalle::class); }

    public static function generarCodigo(int $empresaId): string
    {
        return Correlativo::siguiente($empresaId, 'VEN');
    }
}