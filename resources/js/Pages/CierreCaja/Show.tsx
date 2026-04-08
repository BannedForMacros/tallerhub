import { useState } from 'react';
import { router, Head } from '@inertiajs/react';
import { toast, Toaster } from 'react-hot-toast';
import { ChevronDown, ChevronUp, FileText, Lock, Save } from 'lucide-react';
import { formatFecha, parseFechaLocal } from '@/helpers/fecha';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Badge from '@/Components/Badge';
import Button from '@/Components/Button';
import { PageProps, CierreCaja, CierreCajaPago, Venta } from '@/types';

interface Props extends PageProps {
    cierre: CierreCaja;
    pagos: CierreCajaPago[];
    ventas: Venta[];
    puedeVerEsperados: boolean;
    puedeEditar: boolean;
    puedeCerrar: boolean;
}

const fmt = (n: number | null | undefined) =>
    n === null || n === undefined ? '—' : `S/ ${Number(n).toFixed(2)}`;

const fmtNum = (n: number | null | undefined) =>
    n === null || n === undefined ? '—' : Number(n).toFixed(2);

export default function CierreCajaShow({ cierre, pagos, ventas, puedeVerEsperados, puedeEditar, puedeCerrar }: Props) {
    const [montos, setMontos] = useState<Record<number, string>>(
        Object.fromEntries(pagos.map(p => [p.id, fmtNum(p.monto_entregado)]))
    );
    const [ventasAbierto, setVentasAbierto] = useState(false);
    const [guardando, setGuardando] = useState(false);

    const handleGuardar = () => {
        const payload = pagos.map(p => ({
            id:               p.id,
            monto_entregado:  parseFloat(montos[p.id] || '0') || 0,
        }));

        setGuardando(true);
        router.put(route('cierre-caja.update', cierre.id), { pagos: payload }, {
            onSuccess: () => toast.success('Montos guardados correctamente.'),
            onError:   () => toast.error('Error al guardar los montos.'),
            onFinish:  () => setGuardando(false),
        });
    };

    const handleCerrar = () => {
        toast((t) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', margin: 0 }}>¿Cerrar el cierre de caja?</p>
                <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Una vez cerrado no se podrá modificar.</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => toast.dismiss(t.id)} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #E2E8F0', backgroundColor: '#fff', cursor: 'pointer', fontSize: 13 }}>
                        Cancelar
                    </button>
                    <button onClick={() => {
                        toast.dismiss(t.id);
                        router.patch(route('cierre-caja.cerrar', cierre.id), {}, {
                            onSuccess: () => toast.success('Cierre cerrado correctamente.'),
                            onError:   () => toast.error('Error al cerrar.'),
                        });
                    }} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', backgroundColor: '#1E293B', cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 600 }}>
                        Sí, cerrar
                    </button>
                </div>
            </div>
        ), { duration: 15000 });
    };

    const totalEntregado = pagos.reduce((sum, p) => sum + (parseFloat(montos[p.id] || '0') || 0), 0);
    const fechaStr = parseFechaLocal(cierre.fecha).toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <AuthenticatedLayout>
            <Head title={`Cierre ${fechaStr}`} />
            <Toaster position="top-right" />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', margin: 0 }}>
                            Cierre de Caja
                        </h1>
                        <Badge
                            label={cierre.estado === 'cerrado' ? 'Cerrado' : 'Borrador'}
                            variant={cierre.estado === 'cerrado' ? 'success' : 'warning'}
                        />
                    </div>
                    <p style={{ fontSize: 14, color: '#64748B', marginTop: 4, textTransform: 'capitalize' }}>
                        {fechaStr} — {cierre.local?.nombre ?? ''}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <a href={route('cierre-caja.pdf', cierre.id)} target="_blank" rel="noreferrer">
                        <Button variant="cancel" size="md" icon={<FileText size={15} />}>PDF</Button>
                    </a>
                    {puedeEditar && (
                        <Button variant="primary" size="md" icon={<Save size={15} />} onClick={handleGuardar} disabled={guardando}>
                            {guardando ? 'Guardando...' : 'Guardar entregas'}
                        </Button>
                    )}
                    {puedeCerrar && (
                        <Button variant="danger" size="md" icon={<Lock size={15} />} onClick={handleCerrar}>
                            Cerrar caja
                        </Button>
                    )}
                </div>
            </div>

            {/* Tarjetas resumen */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                {[
                    { label: 'Ventas neto', value: fmt(cierre.ventas_neto), color: '#16A34A', bg: '#F0FDF4' },
                    { label: `Servicios (${cierre.servicios_cantidad})`, value: fmt(cierre.servicios_total), color: '#2563EB', bg: '#EFF6FF' },
                    { label: `Productos (${cierre.productos_cantidad})`, value: fmt(cierre.productos_total), color: '#D97706', bg: '#FFF7ED' },
                    { label: 'Descuentos', value: `- ${fmt(cierre.descuentos_total)}`, color: '#EF4444', bg: '#FEF2F2' },
                ].map(card => (
                    <div key={card.label} style={{ background: card.bg, border: `1px solid ${card.color}22`, borderRadius: 12, padding: '16px 20px' }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', margin: '0 0 6px' }}>{card.label}</p>
                        <p style={{ fontSize: 20, fontWeight: 800, color: card.color, margin: 0 }}>{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Tabla de pagos */}
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, marginBottom: 24, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
                    <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', margin: 0 }}>Métodos de pago</h2>
                    {!puedeVerEsperados && (
                        <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
                            Ingresa el monto que estás entregando por cada método de pago.
                        </p>
                    )}
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                        <tr style={{ backgroundColor: '#1E293B' }}>
                            <th style={thStyle}>Método de pago</th>
                            <th style={thStyle}>Cuenta</th>
                            {puedeVerEsperados && <th style={{ ...thStyle, textAlign: 'right' }}>Esperado</th>}
                            <th style={{ ...thStyle, textAlign: 'right' }}>Entregado</th>
                            {puedeVerEsperados && <th style={{ ...thStyle, textAlign: 'right' }}>Diferencia</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {pagos.length === 0 && (
                            <tr>
                                <td colSpan={puedeVerEsperados ? 5 : 3} style={{ padding: '20px', textAlign: 'center', color: '#94A3B8' }}>
                                    No hay pagos registrados para este día.
                                </td>
                            </tr>
                        )}
                        {pagos.map((pago, i) => {
                            const entregadoNum = parseFloat(montos[pago.id] || '0') || 0;
                            const diferencia   = puedeVerEsperados && pago.monto_esperado !== null
                                ? entregadoNum - pago.monto_esperado
                                : null;
                            return (
                                <tr key={pago.id} style={{ backgroundColor: i % 2 === 0 ? '#F8FAFC' : '#fff' }}>
                                    <td style={tdStyle}>{pago.metodo_pago?.nombre ?? '—'}</td>
                                    <td style={{ ...tdStyle, color: '#64748B' }}>
                                        {pago.cuenta_pago ? (
                                            <span>
                                                {pago.cuenta_pago.nombre}
                                                {pago.cuenta_pago.numero_cuenta && (
                                                    <span style={{ fontSize: 11, color: '#94A3B8' }}> ({pago.cuenta_pago.numero_cuenta})</span>
                                                )}
                                            </span>
                                        ) : <span style={{ color: '#CBD5E1' }}>Sin cuenta</span>}
                                    </td>
                                    {puedeVerEsperados && (
                                        <td style={{ ...tdStyle, textAlign: 'right', color: '#2563EB', fontWeight: 600 }}>
                                            {fmt(pago.monto_esperado)}
                                        </td>
                                    )}
                                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                                        {puedeEditar ? (
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={montos[pago.id] ?? '0'}
                                                onChange={e => setMontos(prev => ({ ...prev, [pago.id]: e.target.value }))}
                                                style={{
                                                    width: 110,
                                                    textAlign: 'right',
                                                    border: '1px solid #E2E8F0',
                                                    borderRadius: 6,
                                                    padding: '5px 8px',
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                }}
                                            />
                                        ) : (
                                            <span style={{ fontWeight: 600 }}>S/ {fmtNum(pago.monto_entregado)}</span>
                                        )}
                                    </td>
                                    {puedeVerEsperados && (
                                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>
                                            {diferencia === null ? '—' : (
                                                <span style={{ color: diferencia < 0 ? '#EF4444' : diferencia > 0 ? '#16A34A' : '#64748B' }}>
                                                    {diferencia >= 0 ? '+' : ''}S/ {Math.abs(diferencia).toFixed(2)}
                                                </span>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr style={{ backgroundColor: '#F1F5F9', fontWeight: 700 }}>
                            <td colSpan={2} style={{ ...tdStyle, textAlign: 'right', color: '#475569' }}>TOTALES</td>
                            {puedeVerEsperados && (
                                <td style={{ ...tdStyle, textAlign: 'right', color: '#2563EB' }}>
                                    {fmt(cierre.total_esperado)}
                                </td>
                            )}
                            <td style={{ ...tdStyle, textAlign: 'right', color: '#1E293B' }}>
                                S/ {totalEntregado.toFixed(2)}
                            </td>
                            {puedeVerEsperados && (
                                <td style={{ ...tdStyle, textAlign: 'right' }}>
                                    {cierre.total_esperado !== null ? (() => {
                                        const d = totalEntregado - cierre.total_esperado;
                                        return (
                                            <span style={{ color: d < 0 ? '#EF4444' : d > 0 ? '#16A34A' : '#64748B', fontWeight: 800 }}>
                                                {d >= 0 ? '+' : ''}S/ {Math.abs(d).toFixed(2)}
                                            </span>
                                        );
                                    })() : '—'}
                                </td>
                            )}
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Detalle de ventas (colapsable) */}
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                <button
                    onClick={() => setVentasAbierto(!ventasAbierto)}
                    style={{ width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', borderBottom: ventasAbierto ? '1px solid #F1F5F9' : 'none' }}
                >
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#1E293B' }}>
                        Ventas del día ({ventas.length})
                    </span>
                    {ventasAbierto ? <ChevronUp size={16} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
                </button>

                {ventasAbierto && (
                    ventas.length === 0 ? (
                        <div style={{ padding: 24, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                            No hay ventas registradas para este día.
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr style={{ backgroundColor: '#F8FAFC' }}>
                                    {['Código', 'Cliente', 'Ítems', 'Descuento', 'Total', 'Pagado con', 'Registrado por'].map(h => (
                                        <th key={h} style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid #E2E8F0' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {ventas.map((v, i) => (
                                    <tr key={v.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#F8FAFC' }}>
                                        <td style={{ padding: '9px 12px', fontWeight: 700, color: '#16A34A' }}>{v.codigo}</td>
                                        <td style={{ padding: '9px 12px' }}>{v.cliente?.nombre ?? <span style={{ color: '#94A3B8' }}>Sin cliente</span>}</td>
                                        <td style={{ padding: '9px 12px', color: '#64748B' }}>{v.detalles?.length ?? 0}</td>
                                        <td style={{ padding: '9px 12px', color: Number(v.descuento) > 0 ? '#EF4444' : '#CBD5E1' }}>
                                            {Number(v.descuento) > 0 ? `- S/ ${Number(v.descuento).toFixed(2)}` : '—'}
                                        </td>
                                        <td style={{ padding: '9px 12px', fontWeight: 700, color: '#1E293B' }}>S/ {Number(v.total).toFixed(2)}</td>
                                        <td style={{ padding: '9px 12px', color: '#64748B', fontSize: 12 }}>
                                            {v.pagos?.map(p => p.metodo_pago?.nombre).filter(Boolean).join(', ') ?? '—'}
                                        </td>
                                        <td style={{ padding: '9px 12px', color: '#94A3B8', fontSize: 12 }}>{v.usuario?.name ?? '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )
                )}
            </div>
        </AuthenticatedLayout>
    );
}

const thStyle: React.CSSProperties = {
    padding: '10px 14px',
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    textAlign: 'left',
};

const tdStyle: React.CSSProperties = {
    padding: '10px 14px',
    borderBottom: '1px solid #F1F5F9',
};
