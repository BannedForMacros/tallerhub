<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 11px; color: #000; }
        .page { padding: 24px 28px; }

        /* HEADER */
        .header { width: 100%; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
        .header table { width: 100%; }
        .header td { vertical-align: middle; }
        .header .logo-cell { width: 120px; }
        .header .logo-cell img { max-height: 65px; max-width: 110px; }
        .header .logo-cell .sin-logo {
            width: 65px; height: 65px; border: 2px solid #000;
            font-size: 24px; font-weight: 900; color: #000;
            text-align: center; line-height: 65px;
        }
        .header .empresa-cell { text-align: center; padding: 0 10px; }
        .header .empresa-cell h1 { font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
        .header .empresa-cell p { font-size: 10px; margin-top: 2px; }
        .header .codigo-cell { text-align: right; width: 130px; }
        .header .codigo-cell .titulo-doc { font-size: 9px; font-weight: 700; text-transform: uppercase; border: 1px solid #000; padding: 3px 6px; margin-bottom: 4px; }
        .header .codigo-cell .num { font-size: 20px; font-weight: 900; }
        .header .codigo-cell .fecha { font-size: 9px; margin-top: 2px; }

        /* TÍTULO CENTRAL */
        .titulo-central { text-align: center; font-size: 13px; font-weight: 900; text-transform: uppercase;
            letter-spacing: 2px; border-top: 2px solid #000; border-bottom: 2px solid #000;
            padding: 6px 0; margin-bottom: 12px; }

        /* SECCIONES */
        .seccion { margin-bottom: 10px; }
        .seccion-titulo { font-size: 10px; font-weight: 900; text-transform: uppercase;
            border-bottom: 1.5px solid #000; padding-bottom: 3px; margin-bottom: 6px;
            letter-spacing: 0.5px; }
        table.datos { width: 100%; border-collapse: collapse; }
        table.datos td { padding: 3px 6px; font-size: 11px; vertical-align: top; }
        table.datos td.label { font-size: 9px; font-weight: 700; text-transform: uppercase;
            color: #000; width: 30%; white-space: nowrap; }
        table.datos td.valor { border-bottom: 1px solid #ccc; width: 70%; }
        table.datos td.label-sm { font-size: 9px; font-weight: 700; text-transform: uppercase; width: 18%; white-space: nowrap; }
        table.datos td.valor-sm { border-bottom: 1px solid #ccc; width: 15%; }

        /* ESTADO BADGE — solo color de texto, sin fondo para PDF */
        .estado { font-weight: 700; text-transform: uppercase; font-size: 10px; }
        .estado-recibido   { color: #000; }
        .estado-en_proceso { color: #000; }
        .estado-listo      { color: #000; }
        .estado-entregado  { color: #000; }

        /* CAJA TEXTO LARGO */
        .caja-texto { border: 1px solid #000; padding: 6px 8px; min-height: 45px;
            font-size: 11px; width: 100%; margin-top: 2px; }

        /* AVISO CONFORMIDAD */
        .aviso { border: 1px solid #000; padding: 8px 10px; font-size: 10px;
            margin-top: 8px; text-align: justify; }

        /* FIRMAS */
        .firmas-table { width: 100%; margin-top: 24px; border-collapse: collapse; }
        .firmas-table td { width: 50%; text-align: center; padding: 0 20px; vertical-align: bottom; }
        .firma-linea { border-top: 1.5px solid #000; padding-top: 5px; margin-top: 50px; }
        .firma-nombre { font-size: 10px; font-weight: 700; text-transform: uppercase; }
        .firma-cargo  { font-size: 9px; }

        /* FOOTER */
        .footer-line { border-top: 1.5px solid #000; margin-top: 14px; padding-top: 6px; }
        .footer-table { width: 100%; }
        .footer-table td { vertical-align: bottom; font-size: 9px; }
        .footer-table td.qr-td { width: 90px; text-align: right; }
        .footer-table td.qr-td img { width: 75px; height: 75px; }
        .footer-nota { font-size: 8px; color: #555; margin-top: 3px; }

        /* SEPARADOR */
        .sep { border: none; border-top: 1px dashed #999; margin: 8px 0; }
    </style>
</head>
<body>
<div class="page">

    {{-- ═══ HEADER ═══ --}}
    <div class="header">
        <table>
            <tr>
                <td class="logo-cell">
                    @if($logoBase64)
                        <img src="{{ $logoBase64 }}" alt="Logo">
                    @else
                        <div class="sin-logo">{{ strtoupper(substr($recepcion->empresa->nombre, 0, 1)) }}</div>
                    @endif
                </td>
                <td class="empresa-cell">
                    <h1>{{ $recepcion->empresa->nombre }}</h1>
                    <p>RUC: {{ $recepcion->empresa->ruc }}</p>
                    @if($recepcion->empresa->telefono)
                        <p>Telf.: {{ $recepcion->empresa->telefono }}</p>
                    @endif
                    @if($recepcion->empresa->email)
                        <p>{{ $recepcion->empresa->email }}</p>
                    @endif
                    @if($recepcion->local)
                        <p>{{ $recepcion->local->nombre }} — {{ $recepcion->local->distrito ?? '' }}, {{ $recepcion->local->provincia ?? '' }}</p>
                    @endif
                </td>
                <td class="codigo-cell">
                    <div class="titulo-doc">Orden de Recepción</div>
                    <div class="num">Nº {{ str_pad($recepcion->id, 4, '0', STR_PAD_LEFT) }}</div>
                    <div class="fecha">{{ \Carbon\Carbon::parse($recepcion->fecha_recepcion)->format('d/m/Y H:i') }}</div>
                    <div style="margin-top:4px; font-size:9px; font-weight:700;">
                        ESTADO:
                        <span class="estado estado-{{ $recepcion->estado }}">
                            {{ strtoupper(str_replace('_', ' ', $recepcion->estado)) }}
                        </span>
                    </div>
                </td>
            </tr>
        </table>
    </div>

    {{-- ═══ TÍTULO ═══ --}}
    <div class="titulo-central">Orden de Recepción de Equipo</div>

    {{-- ═══ DATOS DEL CLIENTE ═══ --}}
    <div class="seccion">
        <div class="seccion-titulo">1. Datos del Cliente</div>
        <table class="datos">
            <tr>
                <td class="label">Nombre / Razón social:</td>
                <td class="valor">{{ $recepcion->cliente->nombre }}</td>
                <td class="label-sm">DNI / RUC:</td>
                <td class="valor-sm">{{ $recepcion->cliente->dni ?? '—' }}</td>
            </tr>
            <tr>
                <td class="label">Teléfono:</td>
                <td class="valor">{{ $recepcion->cliente->telefono ?? '—' }}</td>
                <td class="label-sm">Email:</td>
                <td class="valor-sm">{{ $recepcion->cliente->email ?? '—' }}</td>
            </tr>
            <tr>
                <td class="label">Dirección:</td>
                <td class="valor" colspan="3">{{ $recepcion->cliente->direccion ?? '—' }}</td>
            </tr>
        </table>
    </div>

    {{-- ═══ DATOS DEL EQUIPO ═══ --}}
    <div class="seccion">
        <div class="seccion-titulo">2. Datos del Equipo</div>
        <table class="datos">
            <tr>
                <td class="label">Tipo de equipo:</td>
                <td class="valor">{{ $recepcion->tipo_equipo }}</td>
                <td class="label-sm">Marca:</td>
                <td class="valor-sm">{{ $recepcion->marca ?? '—' }}</td>
            </tr>
            <tr>
                <td class="label">Modelo:</td>
                <td class="valor">{{ $recepcion->modelo ?? '—' }}</td>
                <td class="label-sm">N° Serie:</td>
                <td class="valor-sm">{{ $recepcion->serie ?? '—' }}</td>
            </tr>
            <tr>
                <td class="label">Accesorios entregados:</td>
                <td class="valor" colspan="3">{{ $recepcion->accesorios ?? 'Ninguno' }}</td>
            </tr>
            <tr>
                <td class="label">Técnico asignado:</td>
                <td class="valor">{{ $recepcion->tecnico?->name ?? 'Sin asignar' }}</td>
                <td class="label-sm">F. estimada:</td>
                <td class="valor-sm">
                    {{ $recepcion->fecha_entrega_estimada
                        ? \Carbon\Carbon::parse($recepcion->fecha_entrega_estimada)->format('d/m/Y')
                        : '—' }}
                </td>
            </tr>
        </table>
    </div>

    {{-- ═══ DESCRIPCIÓN DE FALLA ═══ --}}
    <div class="seccion">
        <div class="seccion-titulo">3. Descripción de Falla Reportada por el Cliente</div>
        <div class="caja-texto">{{ $recepcion->descripcion_falla }}</div>
    </div>

    {{-- ═══ OBSERVACIONES ═══ --}}
    <div class="seccion">
        <div class="seccion-titulo">4. Observaciones del Técnico</div>
        <div class="caja-texto">{{ $recepcion->observaciones ?? ' ' }}</div>
    </div>

    {{-- ═══ AVISO DE CONFORMIDAD ═══ --}}
    <div class="aviso">
        He leído el contenido del presente documento. La firma en el presente acredita la recepción del equipo descrito
        y la conformidad con los datos consignados. El taller no se hace responsable por daños preexistentes no
        mencionados en este documento ni por accesorios no declarados al momento de la recepción.
        <strong>Conserve este documento para el retiro de su equipo.</strong>
    </div>

    {{-- ═══ FIRMAS ═══ --}}
    <table class="firmas-table">
        <tr>
            <td>
                <div class="firma-linea">
                    <div class="firma-nombre">Firma del Técnico Responsable</div>
                    <div class="firma-cargo">{{ $recepcion->tecnico?->name ?? '______________________________' }}</div>
                </div>
            </td>
            <td>
                <div class="firma-linea">
                    <div class="firma-nombre">Firma del Cliente</div>
                    <div class="firma-cargo">{{ $recepcion->cliente->nombre }}</div>
                    @if($recepcion->cliente->dni)
                        <div class="firma-cargo">DNI: {{ $recepcion->cliente->dni }}</div>
                    @endif
                </div>
            </td>
        </tr>
    </table>

    {{-- ═══ FOOTER CON QR ═══ --}}
    <div class="footer-line">
        <table class="footer-table">
            <tr>
                <td>
                    <strong>{{ $recepcion->codigo }}</strong><br>
                    Documento generado el {{ now()->format('d/m/Y H:i') }}<br>
                    <span class="footer-nota">Escanea el código QR para verificar la autenticidad de este documento.</span>
                </td>
                <td class="qr-td">
                    <img src="data:image/svg+xml;base64,{{ $qrBase64 }}" alt="QR Code">
                </td>
            </tr>
        </table>
    </div>

</div>
</body>
</html>