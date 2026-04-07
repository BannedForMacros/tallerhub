<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 11px; color: #000; }
        .page { padding: 24px 28px; }

        .header { width: 100%; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
        .header table { width: 100%; }
        .header td { vertical-align: middle; }
        .header .logo-cell { width: 120px; }
        .header .logo-cell img { max-height: 65px; max-width: 110px; }
        .header .logo-cell .sin-logo { width: 65px; height: 65px; border: 2px solid #000; font-size: 24px; font-weight: 900; text-align: center; line-height: 65px; }
        .header .empresa-cell { text-align: center; padding: 0 10px; }
        .header .empresa-cell h1 { font-size: 14px; font-weight: 900; text-transform: uppercase; }
        .header .codigo-cell { text-align: right; width: 150px; }
        .header .codigo-cell .titulo-doc { font-size: 9px; font-weight: 700; text-transform: uppercase; border: 1px solid #000; padding: 3px 6px; margin-bottom: 4px; }
        .header .codigo-cell .fecha { font-size: 12px; font-weight: 900; }
        .header .codigo-cell .sub { font-size: 9px; margin-top: 2px; }

        .titulo-central { text-align: center; font-size: 13px; font-weight: 900; text-transform: uppercase;
            letter-spacing: 2px; border-top: 2px solid #000; border-bottom: 2px solid #000;
            padding: 6px 0; margin-bottom: 12px; }

        .seccion { margin-bottom: 12px; }
        .seccion-titulo { font-size: 10px; font-weight: 900; text-transform: uppercase;
            border-bottom: 1.5px solid #000; padding-bottom: 3px; margin-bottom: 6px; letter-spacing: 0.5px; }

        .resumen-grid { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        .resumen-grid td { padding: 5px 8px; border: 1px solid #ddd; font-size: 11px; }
        .resumen-grid td.label { font-weight: 700; background: #f5f5f5; width: 40%; }
        .resumen-grid td.valor { text-align: right; }
        .resumen-grid tr.total td { font-weight: 900; background: #f0f0f0; font-size: 12px; }

        table.pagos { width: 100%; border-collapse: collapse; font-size: 11px; }
        table.pagos th { background: #1E293B; color: #fff; padding: 7px 8px; text-align: left; font-size: 10px; text-transform: uppercase; }
        table.pagos th.right { text-align: right; }
        table.pagos td { padding: 6px 8px; border-bottom: 1px solid #eee; }
        table.pagos td.right { text-align: right; }
        table.pagos tr.alt { background: #f8f8f8; }
        table.pagos tr.total-row td { font-weight: 900; background: #f0f0f0; border-top: 2px solid #000; }
        .dif-neg { color: #cc0000; }
        .dif-pos { color: #007700; }

        table.ventas { width: 100%; border-collapse: collapse; font-size: 10px; }
        table.ventas th { background: #475569; color: #fff; padding: 6px 7px; text-align: left; font-size: 9px; text-transform: uppercase; }
        table.ventas td { padding: 5px 7px; border-bottom: 1px solid #eee; }
        table.ventas tr.alt { background: #f8f8f8; }

        .footer-line { border-top: 1.5px solid #000; margin-top: 16px; padding-top: 6px; font-size: 9px; color: #555; }
    </style>
</head>
<body>
<div class="page">

    {{-- HEADER --}}
    <div class="header">
        <table>
            <tr>
                <td class="logo-cell">
                    @if($logoBase64)
                        <img src="{{ $logoBase64 }}" alt="Logo">
                    @else
                        <div class="sin-logo">{{ strtoupper(substr($cierreCaja->empresa->nombre, 0, 1)) }}</div>
                    @endif
                </td>
                <td class="empresa-cell">
                    <h1>{{ $cierreCaja->empresa->nombre }}</h1>
                    @if($cierreCaja->empresa->ruc) <p>RUC: {{ $cierreCaja->empresa->ruc }}</p> @endif
                    @if($cierreCaja->local) <p>Local: {{ $cierreCaja->local->nombre }}</p> @endif
                </td>
                <td class="codigo-cell">
                    <div class="titulo-doc">Cierre de Caja</div>
                    <div class="fecha">{{ \Carbon\Carbon::parse($cierreCaja->fecha)->format('d/m/Y') }}</div>
                    <div class="sub">Estado: {{ strtoupper($cierreCaja->estado) }}</div>
                    @if($cierreCaja->cerrado_at)
                        <div class="sub">Cerrado: {{ \Carbon\Carbon::parse($cierreCaja->cerrado_at)->format('d/m/Y H:i') }}</div>
                    @endif
                </td>
            </tr>
        </table>
    </div>

    <div class="titulo-central">Cierre de Caja Diario</div>

    {{-- RESUMEN DE VENTAS --}}
    <div class="seccion">
        <div class="seccion-titulo">1. Resumen del Día</div>
        <table class="resumen-grid">
            <tr>
                <td class="label">Servicios vendidos ({{ $cierreCaja->servicios_cantidad }})</td>
                <td class="valor">S/ {{ number_format($cierreCaja->servicios_total, 2) }}</td>
                <td class="label">Productos vendidos ({{ $cierreCaja->productos_cantidad }})</td>
                <td class="valor">S/ {{ number_format($cierreCaja->productos_total, 2) }}</td>
            </tr>
            <tr>
                <td class="label">Descuentos</td>
                <td class="valor">- S/ {{ number_format($cierreCaja->descuentos_total, 2) }}</td>
                <td class="label">Total ventas neto</td>
                <td class="valor"><strong>S/ {{ number_format($cierreCaja->ventas_neto, 2) }}</strong></td>
            </tr>
        </table>
    </div>

    {{-- CONSOLIDADO MÉTODOS DE PAGO --}}
    <div class="seccion">
        <div class="seccion-titulo">2. Consolidado por Método de Pago</div>
        <table class="pagos">
            <thead>
                <tr>
                    <th>Método de pago</th>
                    <th>Cuenta</th>
                    <th class="right">Esperado</th>
                    <th class="right">Entregado</th>
                    <th class="right">Diferencia</th>
                </tr>
            </thead>
            <tbody>
                @foreach($cierreCaja->pagos as $i => $pago)
                <tr class="{{ $i % 2 === 1 ? 'alt' : '' }}">
                    <td>{{ $pago->metodoPago?->nombre ?? '—' }}</td>
                    <td style="color:#555">
                        @if($pago->cuentaPago)
                            {{ $pago->cuentaPago->nombre }}
                            @if($pago->cuentaPago->numero_cuenta)
                                ({{ $pago->cuentaPago->numero_cuenta }})
                            @endif
                        @else
                            Sin cuenta
                        @endif
                    </td>
                    <td class="right">S/ {{ number_format($pago->monto_esperado, 2) }}</td>
                    <td class="right">S/ {{ number_format($pago->monto_entregado, 2) }}</td>
                    <td class="right {{ $pago->diferencia < 0 ? 'dif-neg' : ($pago->diferencia > 0 ? 'dif-pos' : '') }}">
                        {{ $pago->diferencia >= 0 ? '+' : '' }}S/ {{ number_format($pago->diferencia, 2) }}
                    </td>
                </tr>
                @endforeach
            </tbody>
            <tfoot>
                @php
                    $difTotal = $cierreCaja->total_entregado - $cierreCaja->total_esperado;
                @endphp
                <tr class="total-row">
                    <td colspan="2" style="text-align:right">TOTALES</td>
                    <td class="right">S/ {{ number_format($cierreCaja->total_esperado, 2) }}</td>
                    <td class="right">S/ {{ number_format($cierreCaja->total_entregado, 2) }}</td>
                    <td class="right {{ $difTotal < 0 ? 'dif-neg' : ($difTotal > 0 ? 'dif-pos' : '') }}">
                        {{ $difTotal >= 0 ? '+' : '' }}S/ {{ number_format($difTotal, 2) }}
                    </td>
                </tr>
            </tfoot>
        </table>
    </div>

    {{-- VENTAS DEL DÍA --}}
    @if($ventas->count() > 0)
    <div class="seccion">
        <div class="seccion-titulo">3. Detalle de Ventas del Día ({{ $ventas->count() }})</div>
        <table class="ventas">
            <thead>
                <tr>
                    <th>Código</th>
                    <th>Cliente</th>
                    <th>Ítems</th>
                    <th style="text-align:right">Descuento</th>
                    <th style="text-align:right">Total</th>
                    <th>Método pago</th>
                </tr>
            </thead>
            <tbody>
                @foreach($ventas as $i => $venta)
                <tr class="{{ $i % 2 === 1 ? 'alt' : '' }}">
                    <td style="font-weight:700; color:#16A34A">{{ $venta->codigo }}</td>
                    <td>{{ $venta->cliente?->nombre ?? '—' }}</td>
                    <td style="text-align:center">{{ $venta->detalles?->count() ?? 0 }}</td>
                    <td style="text-align:right; color:#cc0000">
                        {{ $venta->descuento > 0 ? '- S/ '.number_format($venta->descuento,2) : '—' }}
                    </td>
                    <td style="text-align:right; font-weight:700">S/ {{ number_format($venta->total, 2) }}</td>
                    <td style="font-size:10px; color:#555">
                        {{ $venta->pagos?->map(fn($p) => $p->metodoPago?->nombre)->filter()->implode(', ') ?? '—' }}
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif

    {{-- OBSERVACIONES --}}
    @if($cierreCaja->observaciones)
    <div class="seccion">
        <div class="seccion-titulo">Observaciones</div>
        <p>{{ $cierreCaja->observaciones }}</p>
    </div>
    @endif

    {{-- FOOTER --}}
    <div class="footer-line">
        Generado por: {{ $cierreCaja->usuario?->name ?? '—' }} —
        Documento generado el {{ now()->format('d/m/Y H:i') }}
    </div>

</div>
</body>
</html>
