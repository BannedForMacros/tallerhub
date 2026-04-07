<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:Arial,sans-serif; font-size:11px; color:#000; }
.page { padding:24px 28px; }
h1 { font-size:16px; font-weight:900; text-transform:uppercase; border-bottom:2px solid #000; padding-bottom:8px; margin-bottom:12px; }
h2 { font-size:12px; font-weight:900; text-transform:uppercase; border-bottom:1px solid #000; padding-bottom:4px; margin:14px 0 8px; }
.filtros { font-size:10px; color:#555; margin-bottom:12px; }
table { width:100%; border-collapse:collapse; font-size:11px; margin-bottom:12px; }
th { background:#1E293B; color:#fff; padding:6px 8px; text-align:left; font-size:10px; }
th.r { text-align:right; }
td { padding:5px 8px; border-bottom:1px solid #eee; }
td.r { text-align:right; }
tr.alt { background:#f8f8f8; }
.footer { border-top:1px solid #000; margin-top:16px; padding-top:6px; font-size:9px; color:#555; }
</style>
</head>
<body>
<div class="page">
<h1>Reporte de Ventas</h1>
<div class="filtros">
    Período: {{ $filtros['desde'] }} al {{ $filtros['hasta'] }} |
    Local: {{ $localNombre }}
</div>

<h2>Ventas por día</h2>
<table>
    <thead><tr><th>Fecha</th><th class="r">Cantidad</th><th class="r">Total</th></tr></thead>
    <tbody>
    @foreach($ventasPorFecha as $i => $r)
    <tr class="{{ $i%2===1?'alt':'' }}">
        <td>{{ $r['dia'] }}</td><td class="r">{{ $r['cantidad'] }}</td><td class="r">S/ {{ number_format($r['total'],2) }}</td>
    </tr>
    @endforeach
    @if(empty($ventasPorFecha))<tr><td colspan="3" style="text-align:center;color:#999">Sin datos</td></tr>@endif
    </tbody>
</table>

<h2>Top Servicios</h2>
<table>
    <thead><tr><th>Servicio</th><th class="r">Cant.</th><th class="r">Total</th></tr></thead>
    <tbody>
    @foreach($serviciosTop as $i => $r)
    <tr class="{{ $i%2===1?'alt':'' }}">
        <td>{{ $r['nombre'] }}</td><td class="r">{{ $r['cantidad_vendida'] }}</td><td class="r">S/ {{ number_format($r['total_facturado'],2) }}</td>
    </tr>
    @endforeach
    @if(empty($serviciosTop))<tr><td colspan="3" style="text-align:center;color:#999">Sin datos</td></tr>@endif
    </tbody>
</table>

<h2>Top Productos</h2>
<table>
    <thead><tr><th>Producto</th><th class="r">Cant.</th><th class="r">Total</th></tr></thead>
    <tbody>
    @foreach($productosTop as $i => $r)
    <tr class="{{ $i%2===1?'alt':'' }}">
        <td>{{ $r['nombre'] }}</td><td class="r">{{ $r['cantidad_vendida'] }}</td><td class="r">S/ {{ number_format($r['total_facturado'],2) }}</td>
    </tr>
    @endforeach
    @if(empty($productosTop))<tr><td colspan="3" style="text-align:center;color:#999">Sin datos</td></tr>@endif
    </tbody>
</table>

<h2>Top Clientes</h2>
<table>
    <thead><tr><th>Cliente</th><th>DNI</th><th class="r">Ventas</th><th class="r">Total gastado</th></tr></thead>
    <tbody>
    @foreach($clientesTop as $i => $r)
    <tr class="{{ $i%2===1?'alt':'' }}">
        <td>{{ $r['nombre'] }}</td><td>{{ $r['dni'] ?? '—' }}</td><td class="r">{{ $r['num_ventas'] }}</td><td class="r">S/ {{ number_format($r['total_gastado'],2) }}</td>
    </tr>
    @endforeach
    @if(empty($clientesTop))<tr><td colspan="4" style="text-align:center;color:#999">Sin datos</td></tr>@endif
    </tbody>
</table>

<h2>Métodos de Pago</h2>
<table>
    <thead><tr><th>Método</th><th class="r">Total</th></tr></thead>
    <tbody>
    @foreach($metodosPago as $i => $r)
    <tr class="{{ $i%2===1?'alt':'' }}">
        <td>{{ $r['nombre'] }}</td><td class="r">S/ {{ number_format($r['total'],2) }}</td>
    </tr>
    @endforeach
    @if(empty($metodosPago))<tr><td colspan="2" style="text-align:center;color:#999">Sin datos</td></tr>@endif
    </tbody>
</table>

@if($tiempoServicio)
<h2>Tiempo de Servicio</h2>
<table>
    <thead><tr><th>Promedio</th><th>Mínimo</th><th>Máximo</th><th>Casos</th></tr></thead>
    <tbody>
    <tr><td>{{ $tiempoServicio['promedio_horas'] }}h</td><td>{{ $tiempoServicio['min_horas'] }}h</td><td>{{ $tiempoServicio['max_horas'] }}h</td><td>{{ $tiempoServicio['total_casos'] }}</td></tr>
    </tbody>
</table>
@endif

<div class="footer">Generado el {{ now()->format('d/m/Y H:i') }}</div>
</div>
</body>
</html>
