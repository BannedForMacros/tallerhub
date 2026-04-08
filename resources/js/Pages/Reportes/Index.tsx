import { useState } from 'react';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/Button';
import { PageProps, Empresa, Local, ReporteVentaDia, ReporteTopItem, ReporteMetodoPago, ReporteClienteTop, ReporteTiempoServicio } from '@/types';

interface FiltrosState {
    empresa_id: string;
    local_id:   string;
    desde:      string;
    hasta:      string;
    top:        number;
}

interface Props extends PageProps {
    empresas:       Empresa[];
    locales:        Local[];
    filtros:        { empresa_id: number | null; local_id: number | null; desde: string; hasta: string; top: number };
    ventasPorFecha: ReporteVentaDia[];
    serviciosTop:   ReporteTopItem[];
    productosTop:   ReporteTopItem[];
    metodosPago:    ReporteMetodoPago[];
    clientesTop:    ReporteClienteTop[];
    tiempoServicio: ReporteTiempoServicio | null;
}

const COLORS = ['#2563EB', '#16A34A', '#D97706', '#DC2626', '#7C3AED', '#0891B2', '#DB2777'];

const fmt = (n: number) => `S/ ${n.toFixed(2)}`;

export default function ReportesIndex({
    auth, empresas, locales, filtros: filtrosIniciales,
    ventasPorFecha: vpfInit, serviciosTop: stInit, productosTop: ptInit,
    metodosPago: mpInit, clientesTop: ctInit, tiempoServicio: tsInit,
}: Props) {
    const esSuperAdmin = auth.user.esSuperAdmin;

    const [filtros, setFiltros] = useState<FiltrosState>({
        empresa_id: filtrosIniciales.empresa_id?.toString() ?? '',
        local_id:   filtrosIniciales.local_id?.toString()   ?? '',
        desde:      filtrosIniciales.desde,
        hasta:      filtrosIniciales.hasta,
        top:        filtrosIniciales.top,
    });

    const [ventasPorFecha, setVentasPorFecha] = useState<ReporteVentaDia[]>(vpfInit);
    const [serviciosTop,   setServiciosTop]   = useState<ReporteTopItem[]>(stInit);
    const [productosTop,   setProductosTop]   = useState<ReporteTopItem[]>(ptInit);
    const [metodosPago,    setMetodosPago]     = useState<ReporteMetodoPago[]>(mpInit);
    const [clientesTop,    setClientesTop]     = useState<ReporteClienteTop[]>(ctInit);
    const [tiempoServicio, setTiempoServicio]  = useState<ReporteTiempoServicio | null>(tsInit);
    const [cargando,       setCargando]        = useState(false);

    const localesFiltrados = esSuperAdmin && filtros.empresa_id
        ? locales.filter(l => l.empresa_id === parseInt(filtros.empresa_id))
        : locales;

    const params = () => ({
        empresa_id: filtros.empresa_id || undefined,
        local_id:   filtros.local_id   || undefined,
        desde:      filtros.desde,
        hasta:      filtros.hasta,
        top:        filtros.top,
    });

    const aplicarFiltros = async () => {
        setCargando(true);
        try {
            const p = params();
            const [vpf, st, pt, mp, ct, ts] = await Promise.all([
                axios.get(route('reportes.ventas-por-fecha'), { params: p }),
                axios.get(route('reportes.servicios-top'),   { params: p }),
                axios.get(route('reportes.productos-top'),   { params: p }),
                axios.get(route('reportes.metodos-pago'),    { params: p }),
                axios.get(route('reportes.clientes-top'),    { params: p }),
                axios.get(route('reportes.tiempo-servicio'), { params: p }),
            ]);
            setVentasPorFecha(vpf.data);
            setServiciosTop(st.data);
            setProductosTop(pt.data);
            setMetodosPago(mp.data);
            setClientesTop(ct.data);
            setTiempoServicio(ts.data);
        } finally {
            setCargando(false);
        }
    };

    const totalVentas    = ventasPorFecha.reduce((s, d) => s + d.total, 0);
    const totalCantidad  = ventasPorFecha.reduce((s, d) => s + d.cantidad, 0);
    const ticketPromedio = totalCantidad > 0 ? totalVentas / totalCantidad : 0;
    const totalServicios = serviciosTop.reduce((s, i) => s + i.total_facturado, 0);
    const totalProductos = productosTop.reduce((s, i) => s + i.total_facturado, 0);

    const pdfUrl = () => {
        const p = params();
        const qs = new URLSearchParams(Object.entries(p).filter(([, v]) => v !== undefined) as [string, string][]).toString();
        return route('reportes.pdf') + '?' + qs;
    };

    const inputStyle: React.CSSProperties = {
        border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#1E293B', backgroundColor: '#fff', outline: 'none',
    };

    return (
        <AuthenticatedLayout>
            <Head title="Reportes" />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', margin: 0 }}>Reportes y KPIs</h1>
                    <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 4 }}>Análisis de ventas, servicios y clientes</p>
                </div>
                <a href={pdfUrl()} target="_blank" rel="noreferrer">
                    <Button variant="cancel" size="md">Exportar PDF</Button>
                </a>
            </div>

            {/* Filtros */}
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
                {esSuperAdmin && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <label style={labelStyle}>Empresa</label>
                        <select value={filtros.empresa_id} onChange={e => setFiltros(f => ({ ...f, empresa_id: e.target.value, local_id: '' }))} style={inputStyle}>
                            <option value="">Todas</option>
                            {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                        </select>
                    </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={labelStyle}>Local</label>
                    <select value={filtros.local_id} onChange={e => setFiltros(f => ({ ...f, local_id: e.target.value }))} style={inputStyle}>
                        <option value="">Todos</option>
                        {localesFiltrados.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                    </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={labelStyle}>Desde</label>
                    <input type="date" value={filtros.desde} onChange={e => setFiltros(f => ({ ...f, desde: e.target.value }))} style={inputStyle} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={labelStyle}>Hasta</label>
                    <input type="date" value={filtros.hasta} onChange={e => setFiltros(f => ({ ...f, hasta: e.target.value }))} style={inputStyle} />
                </div>
                <Button variant="primary" size="md" onClick={aplicarFiltros} disabled={cargando}>
                    {cargando ? 'Cargando...' : 'Aplicar'}
                </Button>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                {[
                    { label: 'Total ventas', value: fmt(totalVentas), color: '#16A34A', bg: '#F0FDF4' },
                    { label: 'En servicios', value: fmt(totalServicios), color: '#2563EB', bg: '#EFF6FF' },
                    { label: 'En productos', value: fmt(totalProductos), color: '#D97706', bg: '#FFF7ED' },
                    { label: 'Ticket promedio', value: fmt(ticketPromedio), color: '#7C3AED', bg: '#F5F3FF' },
                ].map(card => (
                    <div key={card.label} style={{ background: card.bg, border: `1px solid ${card.color}22`, borderRadius: 12, padding: '16px 20px' }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', margin: '0 0 6px' }}>{card.label}</p>
                        <p style={{ fontSize: 20, fontWeight: 800, color: card.color, margin: 0 }}>{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Gráfica: Ventas por día */}
            <div style={cardStyle}>
                <h2 style={cardTitleStyle}>Ventas por día</h2>
                {ventasPorFecha.length === 0 ? (
                    <EmptyChart />
                ) : (
                    <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={ventasPorFecha} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                            <XAxis dataKey="dia" tick={{ fontSize: 11 }} tickFormatter={(d: string) => d.slice(5)} />
                            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `S/${v}`} />
                            <Tooltip formatter={(v: number) => fmt(v)} labelFormatter={(l: string) => `Fecha: ${l}`} />
                            <Area type="monotone" dataKey="total" name="Total" stroke="#2563EB" fill="url(#colorTotal)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Gráficas: Top servicios y productos */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div style={cardStyle}>
                    <h2 style={cardTitleStyle}>Top servicios</h2>
                    {serviciosTop.length === 0 ? <EmptyChart /> : (
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart layout="vertical" data={serviciosTop} margin={{ top: 0, right: 20, left: 80, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `S/${v}`} />
                                <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11 }} width={80} />
                                <Tooltip formatter={(v: number) => fmt(v)} />
                                <Bar dataKey="total_facturado" name="Total" fill="#2563EB" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
                <div style={cardStyle}>
                    <h2 style={cardTitleStyle}>Top productos</h2>
                    {productosTop.length === 0 ? <EmptyChart /> : (
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart layout="vertical" data={productosTop} margin={{ top: 0, right: 20, left: 80, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `S/${v}`} />
                                <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11 }} width={80} />
                                <Tooltip formatter={(v: number) => fmt(v)} />
                                <Bar dataKey="total_facturado" name="Total" fill="#D97706" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Gráficas: Métodos de pago y Top clientes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div style={cardStyle}>
                    <h2 style={cardTitleStyle}>Métodos de pago</h2>
                    {metodosPago.length === 0 ? <EmptyChart /> : (
                        <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                                <Pie data={metodosPago} dataKey="total" nameKey="nombre" cx="50%" cy="50%" outerRadius={90} label={({ nombre, percent }: { nombre: string; percent: number }) => `${nombre} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                    {metodosPago.map((_, idx) => (
                                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: number) => fmt(v)} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
                <div style={cardStyle}>
                    <h2 style={cardTitleStyle}>Top clientes</h2>
                    {clientesTop.length === 0 ? <EmptyChart /> : (
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart layout="vertical" data={clientesTop} margin={{ top: 0, right: 20, left: 100, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `S/${v}`} />
                                <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11 }} width={100} />
                                <Tooltip formatter={(v: number) => fmt(v)} />
                                <Bar dataKey="total_gastado" name="Total gastado" fill="#7C3AED" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Tiempo de servicio */}
            {tiempoServicio && (
                <div style={{ ...cardStyle, marginBottom: 0 }}>
                    <h2 style={cardTitleStyle}>Tiempo de servicio (recepciones → venta)</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 4 }}>
                        {[
                            { label: 'Promedio', value: `${tiempoServicio.promedio_horas}h` },
                            { label: 'Mínimo',   value: `${tiempoServicio.min_horas}h` },
                            { label: 'Máximo',   value: `${tiempoServicio.max_horas}h` },
                            { label: 'Casos',    value: tiempoServicio.total_casos.toString() },
                        ].map(stat => (
                            <div key={stat.label} style={{ background: '#F8FAFC', borderRadius: 10, padding: '14px 18px', textAlign: 'center' }}>
                                <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', margin: '0 0 6px' }}>{stat.label}</p>
                                <p style={{ fontSize: 22, fontWeight: 800, color: '#0891B2', margin: 0 }}>{stat.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

function EmptyChart() {
    return (
        <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 13 }}>
            Sin datos para el período seleccionado
        </div>
    );
}

const cardStyle: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #E2E8F0',
    borderRadius: 12,
    padding: '20px 20px 16px',
    marginBottom: 16,
};

const cardTitleStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 700,
    color: '#1E293B',
    margin: '0 0 16px',
};

const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
};
