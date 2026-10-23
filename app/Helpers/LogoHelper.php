<?php
namespace App\Helpers;

use Illuminate\Support\Facades\Cache;

/**
 * Prepara el logo de la empresa para los PDF sin exigir dimensiones al cliente:
 * - Recorta bordes vacíos (blancos o transparentes) que dejan el logo "pequeño".
 * - Lo reduce a un tamaño razonable y lo convierte a PNG (DomPDF no soporta WEBP).
 * - Calcula ancho/alto de impresión por "área visual" constante, para que un logo
 *   horizontal, uno cuadrado o uno vertical se vean con el mismo peso en el header.
 */
class LogoHelper
{
    /**
     * @return array{src: string, width: int, height: int}|null
     */
    public static function paraPdf(?string $logo, int $maxAncho = 170, int $maxAlto = 70, int $area = 7000): ?array
    {
        if (!$logo) return null;

        $path = storage_path('app/public/' . $logo);
        if (!is_file($path)) return null;

        $procesado = Cache::rememberForever(
            'logo_pdf_' . md5($path . filemtime($path)),
            fn() => self::procesar($path)
        );
        if (!$procesado) return null;

        [$src, $w, $h] = $procesado;

        // Tamaño por área visual constante, limitado a la caja disponible
        $ratio  = $w / $h;
        $ancho  = sqrt($area * $ratio);
        $alto   = sqrt($area / $ratio);
        $escala = min(1, $maxAncho / $ancho, $maxAlto / $alto);

        return [
            'src'    => $src,
            'width'  => (int) round($ancho * $escala),
            'height' => (int) round($alto * $escala),
        ];
    }

    /** @return array{0: string, 1: int, 2: int}|null */
    private static function procesar(string $path): ?array
    {
        $contenido = file_get_contents($path);

        if (!function_exists('imagecreatefromstring')) {
            $info = @getimagesizefromstring($contenido);
            if (!$info) return null;
            return ['data:' . $info['mime'] . ';base64,' . base64_encode($contenido), $info[0], $info[1]];
        }

        $img = @imagecreatefromstring($contenido);
        if (!$img) return null;

        if (!imageistruecolor($img)) imagepalettetotruecolor($img);
        imagealphablending($img, false);
        imagesavealpha($img, true);

        $img = self::recortarBordes($img);

        // Máximo 600px de lado: suficiente nitidez para impresión, PDF liviano
        $w = imagesx($img);
        $h = imagesy($img);
        $max = 600;
        if ($w > $max || $h > $max) {
            $f   = min($max / $w, $max / $h);
            $nw  = max(1, (int) round($w * $f));
            $nh  = max(1, (int) round($h * $f));
            $dst = imagecreatetruecolor($nw, $nh);
            imagealphablending($dst, false);
            imagesavealpha($dst, true);
            imagefill($dst, 0, 0, imagecolorallocatealpha($dst, 0, 0, 0, 127));
            imagecopyresampled($dst, $img, 0, 0, 0, 0, $nw, $nh, $w, $h);
            imagedestroy($img);
            $img = $dst;
            $w = $nw;
            $h = $nh;
        }

        ob_start();
        imagepng($img, null, 9);
        $png = ob_get_clean();
        imagedestroy($img);

        return ['data:image/png;base64,' . base64_encode($png), $w, $h];
    }

    /** Recorta los márgenes cuyo color es "fondo" (transparente o casi blanco). */
    private static function recortarBordes(\GdImage $img): \GdImage
    {
        $w = imagesx($img);
        $h = imagesy($img);

        $esFondo = function (int $x, int $y) use ($img): bool {
            $c = imagecolorat($img, $x, $y);
            $a = ($c >> 24) & 0x7F;
            if ($a > 110) return true; // casi transparente
            $r = ($c >> 16) & 0xFF;
            $g = ($c >> 8) & 0xFF;
            $b = $c & 0xFF;
            return $r > 240 && $g > 240 && $b > 240;
        };

        // Muestreo para que logos grandes no sean lentos
        $paso = max(1, (int) floor(max($w, $h) / 400));

        $filaVacia = function (int $y) use ($w, $paso, $esFondo): bool {
            for ($x = 0; $x < $w; $x += $paso) if (!$esFondo($x, $y)) return false;
            return true;
        };
        $colVacia = function (int $x, int $top, int $bottom) use ($paso, $esFondo): bool {
            for ($y = $top; $y <= $bottom; $y += $paso) if (!$esFondo($x, $y)) return false;
            return true;
        };

        $top = 0;
        while ($top < $h - 1 && $filaVacia($top)) $top++;
        $bottom = $h - 1;
        while ($bottom > $top && $filaVacia($bottom)) $bottom--;
        $left = 0;
        while ($left < $w - 1 && $colVacia($left, $top, $bottom)) $left++;
        $right = $w - 1;
        while ($right > $left && $colVacia($right, $top, $bottom)) $right--;

        // Imagen totalmente vacía o sin márgenes: no tocar
        if ($top >= $bottom || $left >= $right) return $img;
        if ($top === 0 && $left === 0 && $bottom === $h - 1 && $right === $w - 1) return $img;

        // Un pequeño respiro para no pegar el trazo al borde
        $pad    = (int) round(max($right - $left, $bottom - $top) * 0.02);
        $left   = max(0, $left - $pad);
        $top    = max(0, $top - $pad);
        $right  = min($w - 1, $right + $pad);
        $bottom = min($h - 1, $bottom + $pad);

        $recortada = imagecrop($img, [
            'x' => $left, 'y' => $top,
            'width' => $right - $left + 1, 'height' => $bottom - $top + 1,
        ]);
        if (!$recortada) return $img;

        imagealphablending($recortada, false);
        imagesavealpha($recortada, true);
        imagedestroy($img);
        return $recortada;
    }
}
