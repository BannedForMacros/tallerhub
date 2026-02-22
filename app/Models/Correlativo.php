<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Correlativo extends Model
{
    protected $fillable = ['empresa_id', 'tipo', 'ultimo'];

    public static function siguiente(int $empresaId, string $tipo): string
    {
        // Bloqueo pesimista para evitar duplicados en concurrencia
        $correlativo = DB::transaction(function () use ($empresaId, $tipo) {
            $row = static::lockForUpdate()
                ->where('empresa_id', $empresaId)
                ->where('tipo', $tipo)
                ->first();

            if (!$row) {
                $row = static::create([
                    'empresa_id' => $empresaId,
                    'tipo'       => $tipo,
                    'ultimo'     => 0,
                ]);
            }

            $row->increment('ultimo');
            return $row->fresh();
        });

        return $tipo . '-' . str_pad($correlativo->ultimo, 6, '0', STR_PAD_LEFT);
    }
}