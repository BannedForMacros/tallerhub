<?php
namespace App\Helpers;

use Carbon\Carbon;

class FechaHelper
{
    public static function ahora(): Carbon
    {
        return Carbon::now('America/Lima');
    }

    public static function formatear(string|Carbon|null $fecha, string $formato = 'd/m/Y H:i'): string
    {
        if (!$fecha) return '—';
        return Carbon::parse($fecha)->setTimezone('America/Lima')->format($formato);
    }

    public static function formatearFecha(string|Carbon|null $fecha): string
    {
        return static::formatear($fecha, 'd/m/Y');
    }

    public static function formatearFechaHora(string|Carbon|null $fecha): string
    {
        return static::formatear($fecha, 'd/m/Y H:i');
    }
}