import { useState, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    PageProps, Empresa, Local, ReporteVentaDia,
    BalanceResumen, BalanceVenta, BalanceVentaItem, BalanceEntrada,
    BalanceGasto, BalanceMetodoPago, BalancePorProducto,
    BalancePorClasificacion,
} from '@/types';

const fmt    = (n: number) => `S/ ${n.toFixed(2)}`;
const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
const COLORS  = ['#2563EB','#16A34A','#D97706','#DC2626','#7C3AED','#0891B2','#DB2777','#059669'];

// ── Styles ────────────────────────────────────────────────────────────────────
const card: React.CSSProperties  = { background:'#fff', border:'1px solid #E2E8F0', borderRadius:12, padding:'20px 24px', marginBottom:16 };
const title: React.CSSProperties = { fontSize:14, fontWeight:700, color:'#1E293B', margin:'0 0 14px' };
const inp: React.CSSProperties   = { border:'1px solid #E2E8F0', borderRadius:8, padding:'8px 12px', fontSize:13, color:'#1E293B', background:'#fff', outline:'none' };
const lbl: React.CSSProperties   = { fontSize:11, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.5px', display:'block', marginBottom:4 };
const th: React.CSSProperties    = { fontSize:11, fontWeight:700, color:'#64748B', textTransform:'uppercase', padding:'9px 12px', background:'#F8FAFC', borderBottom:'1px solid #E2E8F0', textAlign:'left', whiteSpace:'nowrap' };
const td: React.CSSProperties    = { fontSize:13, color:'#1E293B', padding:'9px 12px', borderBottom:'1px solid #F1F5F9', verticalAlign:'middle' };

// ── Types ─────────────────────────────────────────────────────────────────────
interface FiltrosState { empresa_id:string; local_id:string; desde:string; hasta:string; }

interface Props extends PageProps {
    empresas:     Empresa[];
    locales:      Local[];
    filtros:      { empresa_id:number|null; local_id:number|null; desde:string; hasta:string };
    esSuperAdmin: boolean;
    resumen:      BalanceResumen;
    ventas:       { lista:BalanceVenta[]; por_metodo:BalanceMetodoPago[]; por_dia:ReporteVentaDia[] };
    entradas:     { lista:BalanceEntrada[]; por_producto:BalancePorProducto[] };
    gastos:       { lista:BalanceGasto[]; por_tipo:{ nombre:string; total:number }[]; por_clasificacion:BalancePorClasificacion[] };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const calcGananciaVenta = (v: BalanceVenta) => {
    const items = v.detalles.filter(d => d.tipo === 'producto' && d.precio_costo_ref > 0);
    if (!items.length) return null;
    return items.reduce((s, d) => s + (d.precio_unitario - d.precio_costo_ref) * d.cantidad, 0);
};
const calcGananciaItem = (d: BalanceVentaItem) =>
    (d.tipo === 'producto' && d.precio_costo_ref > 0)
        ? (d.precio_unitario - d.precio_costo_ref) * d.cantidad
        : null;
const calcPctItem = (d: BalanceVentaItem) =>
    (d.tipo === 'producto' && d.precio_costo_ref > 0)
        ? (d.precio_unitario - d.precio_costo_ref) / d.precio_costo_ref * 100
        : null;

// ── Main component ────────────────────────────────────────────────────────────
export default function Estadisticas({
    auth, empresas, locales, filtros: fi, esSuperAdmin,
    resumen: rInit, ventas: vInit, entradas: eInit, gastos: gInit,
}: Props) {
    // global filters
    const [filtros, setFiltros] = useState<FiltrosState>({
        empresa_id: fi.empresa_id?.toString() ?? '',
        local_id:   fi.local_id?.toString()   ?? '',
        desde: fi.desde, hasta: fi.hasta,
    });
    const [cargando, setCargando] = useState(false);

    // data
    const [resumen,  setResumen]  = useState(rInit);
    const [ventas,   setVentas]   = useState(vInit);
    const [entradas, setEntradas] = useState(eInit);
    const [gastos,   setGastos]   = useState(gInit);

    // tabs & modals
    const [tab,          setTab]          = useState<'ventas'|'entradas'|'gastos'>('ventas');
    const [modalVenta,   setModalVenta]   = useState<BalanceVenta|null>(null);
    const [modalEntrada, setModalEntrada] = useState<BalanceEntrada|null>(null);
    const [modalGasto,   setModalGasto]   = useState<BalanceGasto|null>(null);

    // section filters
    const [vMetodo,    setVMetodo]    = useState('');
    const [vTipo,      setVTipo]      = useState('');
    const [eProducto,  setEProducto]  = useState('');
    const [eProveedor, setEProveedor] = useState('');
    const [gTipo,      setGTipo]      = useState('');
    const [gClas,      setGClas]      = useState('');
    const [gMetodo,    setGMetodo]    = useState('');

    const localesFiltrados = (esSuperAdmin && filtros.empresa_id)
        ? locales.filter(l => l.empresa_id === parseInt(filtros.empresa_id))
        : locales;

    const aplicarFiltros = async () => {
        setCargando(true);
        try {
            const params = {
                empresa_id: filtros.empresa_id || undefined,
                local_id:   filtros.local_id   || undefined,
                desde: filtros.desde, hasta: filtros.hasta,
            };
            const { data } = await axios.get(route('reportes.balance-financiero'), { params });
            setResumen(data.resumen); setVentas(data.ventas);
            setEntradas(data.entradas); setGastos(data.gastos);
            setVMetodo(''); setVTipo(''); setEProducto(''); setEProveedor('');
            setGTipo(''); setGClas(''); setGMetodo('');
        } finally { setCargando(false); }
    };

    // section-level client filters
    const ventasFiltradas = useMemo(() => ventas.lista.filter(v => {
        if (vMetodo && !v.pagos.some(p => p.metodo === vMetodo)) return false;
        if (vTipo === 'servicio' && !v.detalles.some(d => d.tipo === 'servicio')) return false;
        if (vTipo === 'producto' && !v.detalles.some(d => d.tipo === 'producto')) return false;
        return true;
    }), [ventas.lista, vMetodo, vTipo]);

    const entradasFiltradas = useMemo(() => entradas.lista.filter(e => {
        if (eProducto  && !e.detalles.some(d => d.producto  === eProducto))  return false;
        if (eProveedor && !e.detalles.some(d => d.proveedor === eProveedor)) return false;
        return true;
    }), [entradas.lista, eProducto, eProveedor]);

    const gastosFiltrados = useMemo(() => gastos.lista.filter(g => {
        if (gTipo   && g.tipo           !== gTipo)   return false;
        if (gClas   && g.clasificacion  !== gClas)   return false;
        if (gMetodo && g.metodo_pago    !== gMetodo) return false;
        return true;
    }), [gastos.lista, gTipo, gClas, gMetodo]);

    // dropdown option lists
    const metodosVenta      = useMemo(() => [...new Set(ventas.lista.flatMap(v => v.pagos.map(p => p.metodo)))].sort(), [ventas.lista]);
    const productosEntrada  = useMemo(() => [...new Set(entradas.lista.flatMap(e => e.detalles.map(d => d.producto)))].sort(), [entradas.lista]);
    const proveedoresEntrada = useMemo(() => [...new Set(entradas.lista.flatMap(e => e.detalles.map(d => d.proveedor)).filter(Boolean) as string[])].sort(), [entradas.lista]);
    const tiposGasto        = useMemo(() => [...new Set(gastos.lista.map(g => g.tipo))].sort(), [gastos.lista]);
    const clasGasto         = useMemo(() => {
        const base = gTipo ? gastos.lista.filter(g => g.tipo === gTipo) : gastos.lista;
        return [...new Set(base.map(g => g.clasificacion))].sort();
    }, [gastos.lista, gTipo]);
    const metodosGasto = useMemo(() => [...new Set(gastos.lista.map(g => g.metodo_pago).filter(Boolean) as string[])].sort(), [gastos.lista]);

    const totalMetodos = ventas.por_metodo.reduce((s, m) => s + m.total, 0);

    return (
        <AuthenticatedLayout>
            <Head title="Estadísticas Financieras" />

            {/* Header */}
            <div style={{ marginBottom:20 }}>
                <h1 style={{ fontSize:22, fontWeight:800, color:'#1E293B', margin:0 }}>Estadísticas Financieras</h1>
                <p style={{ fontSize:14, color:'#94A3B8', marginTop:4 }}>Balance de ingresos, compras de almacén y gastos del período</p>
            </div>

            {/* ── Filtros globales ── */}
            <div style={{ ...card, display:'flex', flexWrap:'wrap', gap:12, alignItems:'flex-end' }}>
                {esSuperAdmin && (
                    <div>
                        <label style={lbl}>Empresa</label>
                        <select value={filtros.empresa_id} onChange={e => setFiltros(f => ({ ...f, empresa_id:e.target.value, local_id:'' }))} style={inp}>
                            <option value="">Todas</option>
                            {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                        </select>
                    </div>
                )}
                <div>
                    <label style={lbl}>Local</label>
                    <select value={filtros.local_id} onChange={e => setFiltros(f => ({ ...f, local_id:e.target.value }))} style={inp}>
                        <option value="">Todos</option>
                        {localesFiltrados.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                    </select>
                </div>
                <div>
                    <label style={lbl}>Desde</label>
                    <input type="date" value={filtros.desde} onChange={e => setFiltros(f => ({ ...f, desde:e.target.value }))} style={inp} />
                </div>
                <div>
                    <label style={lbl}>Hasta</label>
                    <input type="date" value={filtros.hasta} onChange={e => setFiltros(f => ({ ...f, hasta:e.target.value }))} style={inp} />
                </div>
                <button onClick={aplicarFiltros} disabled={cargando} style={{ padding:'9px 22px', background: cargando ? '#93C5FD' : '#2563EB', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor: cargando ? 'not-allowed' : 'pointer' }}>
                    {cargando ? 'Cargando...' : 'Aplicar'}
                </button>
            </div>

            {/* ── KPI Strip ── */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:12, marginBottom:20 }}>
                <KpiCard label="Ingresos Neto"    value={fmt(resumen.ingresos_neto)}    sub={`${resumen.cantidad_ventas} ventas`}           color="#16A34A" bg="#F0FDF4" />
                <KpiCard label="Clientes"         value={`${resumen.clientes_unicos}`}  sub="clientes únicos"                               color="#2563EB" bg="#EFF6FF" />
                <KpiCard
                    label="Ganancia Bruta"
                    value={fmt(resumen.ganancia_bruta)}
                    sub={`${fmtPct(resumen.margen_pct)} margen en productos`}
                    color={resumen.ganancia_bruta >= 0 ? '#059669' : '#DC2626'}
                    bg={resumen.ganancia_bruta >= 0 ? '#ECFDF5' : '#FEF2F2'}
                />
                <KpiCard label="Compras Almacén"  value={fmt(resumen.compras_almacen)} sub={`${entradas.lista.length} entradas`}            color="#D97706" bg="#FFF7ED" />
                <KpiCard label="Gastos"           value={fmt(resumen.gastos)}          sub={`${gastos.lista.length} registros`}             color="#DC2626" bg="#FEF2F2" />
                {/* Resultado – special card */}
                <div style={{ background: resumen.resultado >= 0 ? '#ECFDF5' : '#FEF2F2', border:`2px solid ${resumen.resultado >= 0 ? '#16A34A' : '#DC2626'}`, borderRadius:12, padding:'14px 16px' }}>
                    <p style={{ fontSize:10, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.5px', margin:'0 0 4px' }}>Resultado</p>
                    <p style={{ fontSize:18, fontWeight:800, color: resumen.resultado >= 0 ? '#16A34A' : '#DC2626', margin:'0 0 2px', lineHeight:1.2 }}>{fmt(resumen.resultado)}</p>
                    <p style={{ fontSize:10, color:'#94A3B8', margin:0 }}>Ing − Compras − Gastos</p>
                </div>
            </div>

            {/* Descuentos notice */}
            {resumen.descuentos > 0 && (
                <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:10, padding:'10px 16px', marginBottom:16, fontSize:13, display:'flex', gap:16, alignItems:'center' }}>
                    <span style={{ fontWeight:700, color:'#92400E' }}>Descuentos aplicados:</span>
                    <span style={{ color:'#B45309', fontWeight:600 }}>{fmt(resumen.descuentos)}</span>
                    <span style={{ color:'#78716C' }}>— Ingresos brutos: {fmt(resumen.ingresos_bruto)}</span>
                </div>
            )}

            {/* ── Tabs ── */}
            <div style={{ display:'flex', gap:4, marginBottom:16, background:'#F1F5F9', borderRadius:10, padding:4, width:'fit-content' }}>
                {([
                    { key:'ventas',   label:`Ventas (${ventas.lista.length})` },
                    { key:'entradas', label:`Entradas Almacén (${entradas.lista.length})` },
                    { key:'gastos',   label:`Gastos (${gastos.lista.length})` },
                ] as const).map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)} style={{ padding:'8px 18px', borderRadius:8, border:'none', fontSize:13, fontWeight:600, cursor:'pointer', background: tab === t.key ? '#fff' : 'transparent', color: tab === t.key ? '#1E293B' : '#64748B', boxShadow: tab === t.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition:'all 0.15s' }}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ════════════ TAB VENTAS ════════════ */}
            {tab === 'ventas' && (<>
                {/* Section filters */}
                <div style={{ ...card, display:'flex', flexWrap:'wrap', gap:10, alignItems:'flex-end', padding:'14px 18px' }}>
                    <div>
                        <label style={lbl}>Método de pago</label>
                        <select value={vMetodo} onChange={e => setVMetodo(e.target.value)} style={{ ...inp, minWidth:150 }}>
                            <option value="">Todos</option>
                            {metodosVenta.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Tipo de ítem</label>
                        <select value={vTipo} onChange={e => setVTipo(e.target.value)} style={inp}>
                            <option value="">Todos</option>
                            <option value="servicio">Solo servicios</option>
                            <option value="producto">Solo productos</option>
                        </select>
                    </div>
                    {(vMetodo || vTipo) && <button onClick={() => { setVMetodo(''); setVTipo(''); }} style={{ ...inp, cursor:'pointer', color:'#64748B', fontSize:12 }}>Limpiar</button>}
                    <span style={{ fontSize:12, color:'#94A3B8', marginLeft:'auto' }}>{ventasFiltradas.length} resultado(s)</span>
                </div>

                {/* Charts */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                    {/* Tendencia diaria */}
                    <div style={card}>
                        <h2 style={title}>Tendencia diaria</h2>
                        {ventas.por_dia.length === 0 ? <EmptyChart /> : (
                            <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={ventas.por_dia} margin={{ top:8, right:16, left:0, bottom:0 }}>
                                    <defs>
                                        <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                                    <XAxis dataKey="dia" tick={{ fontSize:10 }} tickFormatter={(d:string) => d.slice(5)} />
                                    <YAxis tick={{ fontSize:10 }} tickFormatter={(v:number) => `S/${v}`} />
                                    <Tooltip formatter={(v) => fmt(Number(v ?? 0))} labelFormatter={(l) => `Fecha: ${l}`} />
                                    <Area type="monotone" dataKey="total" name="Total" stroke="#2563EB" fill="url(#gv)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Desglose por método de pago */}
                    <div style={card}>
                        <h2 style={title}>Desglose por método de pago</h2>
                        <p style={{ fontSize:11, color:'#94A3B8', margin:'-10px 0 12px' }}>Lo que debería haber en cada método al cierre del período</p>
                        {ventas.por_metodo.length === 0 ? <EmptyChart /> : (<>
                            <ResponsiveContainer width="100%" height={130}>
                                <PieChart>
                                    <Pie data={ventas.por_metodo} dataKey="total" nameKey="nombre" cx="50%" cy="50%" outerRadius={58} innerRadius={28}>
                                        {ventas.por_metodo.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(v) => fmt(Number(v ?? 0))} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{ marginTop:10 }}>
                                {ventas.por_metodo.map((m, i) => {
                                    const pct = totalMetodos > 0 ? (m.total / totalMetodos * 100).toFixed(1) : '0';
                                    return (
                                        <div key={m.nombre} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 0', borderBottom:'1px solid #F1F5F9' }}>
                                            <div style={{ width:10, height:10, borderRadius:'50%', background:COLORS[i % COLORS.length], flexShrink:0 }} />
                                            <span style={{ fontSize:13, color:'#374151', fontWeight:500, flex:1 }}>{m.nombre}</span>
                                            <span style={{ fontSize:11, color:'#94A3B8', marginRight:6 }}>{pct}%</span>
                                            <span style={{ fontSize:14, fontWeight:800, color:COLORS[i % COLORS.length] }}>{fmt(m.total)}</span>
                                        </div>
                                    );
                                })}
                                <div style={{ marginTop:10, padding:'8px 12px', background:'#EFF6FF', borderRadius:8, fontSize:12, color:'#1D4ED8', lineHeight:1.5 }}>
                                    Estos montos representan el total cobrado por cada método en el período seleccionado.
                                </div>
                            </div>
                        </>)}
                    </div>
                </div>

                {/* Sales table */}
                <div style={card}>
                    <h2 style={title}>Listado de ventas</h2>
                    {ventasFiltradas.length === 0 ? <EmptyChart /> : (
                        <div style={{ overflowX:'auto' }}>
                            <table style={{ width:'100%', borderCollapse:'collapse' }}>
                                <thead><tr>
                                    <th style={th}>Código</th>
                                    <th style={th}>Fecha / Hora</th>
                                    <th style={th}>Cliente</th>
                                    <th style={th}>Métodos de pago</th>
                                    <th style={{ ...th, textAlign:'right' }}>Total</th>
                                    <th style={{ ...th, textAlign:'right' }}>Ganancia</th>
                                    <th style={{ ...th, textAlign:'center' }}>Ver</th>
                                </tr></thead>
                                <tbody>
                                    {ventasFiltradas.map(v => {
                                        const gan = calcGananciaVenta(v);
                                        return (
                                            <tr key={v.id} onMouseEnter={e => (e.currentTarget.style.background='#FAFAFA')} onMouseLeave={e => (e.currentTarget.style.background='')}>
                                                <td style={td}><span style={{ fontWeight:700, color:'#16A34A' }}>{v.codigo}</span></td>
                                                <td style={td}>
                                                    <span style={{ fontSize:12 }}>{v.fecha}</span><br />
                                                    <span style={{ fontSize:11, color:'#94A3B8' }}>{v.hora}</span>
                                                </td>
                                                <td style={td}>{v.cliente ?? <span style={{ color:'#94A3B8' }}>Sin cliente</span>}</td>
                                                <td style={td}>
                                                    <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                                                        {v.pagos.map((p, i) => (
                                                            <span key={i} style={{ fontSize:11, padding:'2px 7px', borderRadius:5, background:'#EFF6FF', color:'#2563EB', fontWeight:600, whiteSpace:'nowrap' }}>
                                                                {p.metodo} {fmt(p.monto)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td style={{ ...td, textAlign:'right', fontWeight:700 }}>{fmt(v.total)}</td>
                                                <td style={{ ...td, textAlign:'right' }}>
                                                    {gan === null
                                                        ? <span style={{ color:'#CBD5E1', fontSize:12 }}>—</span>
                                                        : <span style={{ fontWeight:700, color: gan >= 0 ? '#059669' : '#DC2626' }}>{gan >= 0 ? '+' : ''}{fmt(gan)}</span>
                                                    }
                                                </td>
                                                <td style={{ ...td, textAlign:'center' }}>
                                                    <button onClick={() => setModalVenta(v)} style={{ background:'#F1F5F9', border:'none', borderRadius:6, padding:'5px 12px', cursor:'pointer', fontSize:12, color:'#475569', fontWeight:600 }}>Ver</button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </>)}

            {/* ════════════ TAB ENTRADAS ════════════ */}
            {tab === 'entradas' && (<>
                {/* Section filters */}
                <div style={{ ...card, display:'flex', flexWrap:'wrap', gap:10, alignItems:'flex-end', padding:'14px 18px' }}>
                    <div>
                        <label style={lbl}>Producto</label>
                        <select value={eProducto} onChange={e => setEProducto(e.target.value)} style={{ ...inp, minWidth:180 }}>
                            <option value="">Todos</option>
                            {productosEntrada.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Proveedor</label>
                        <select value={eProveedor} onChange={e => setEProveedor(e.target.value)} style={{ ...inp, minWidth:160 }}>
                            <option value="">Todos</option>
                            {proveedoresEntrada.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    {(eProducto || eProveedor) && <button onClick={() => { setEProducto(''); setEProveedor(''); }} style={{ ...inp, cursor:'pointer', color:'#64748B', fontSize:12 }}>Limpiar</button>}
                    <span style={{ fontSize:12, color:'#94A3B8', marginLeft:'auto' }}>{entradasFiltradas.length} resultado(s)</span>
                </div>

                {/* Chart */}
                <div style={card}>
                    <h2 style={title}>Top productos por inversión</h2>
                    {entradas.por_producto.length === 0 ? <EmptyChart /> : (
                        <ResponsiveContainer width="100%" height={Math.max(180, entradas.por_producto.length * 34)}>
                            <BarChart layout="vertical" data={entradas.por_producto} margin={{ top:0, right:20, left:130, bottom:0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize:10 }} tickFormatter={(v:number) => `S/${v}`} />
                                <YAxis type="category" dataKey="nombre" tick={{ fontSize:11 }} width={130} />
                                <Tooltip formatter={(v) => fmt(Number(v ?? 0))} />
                                <Bar dataKey="total" name="Total invertido" fill="#D97706" radius={[0,4,4,0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Entries table */}
                <div style={card}>
                    <h2 style={title}>Listado de entradas de almacén</h2>
                    {entradasFiltradas.length === 0 ? <EmptyChart /> : (
                        <div style={{ overflowX:'auto' }}>
                            <table style={{ width:'100%', borderCollapse:'collapse' }}>
                                <thead><tr>
                                    <th style={th}>Código</th>
                                    <th style={th}>Fecha</th>
                                    <th style={th}>Motivo</th>
                                    <th style={th}>Usuario</th>
                                    <th style={{ ...th, textAlign:'right' }}>Total</th>
                                    <th style={{ ...th, textAlign:'center' }}>Ver</th>
                                </tr></thead>
                                <tbody>
                                    {entradasFiltradas.map(e => (
                                        <tr key={e.id} onMouseEnter={ev => (ev.currentTarget.style.background='#FAFAFA')} onMouseLeave={ev => (ev.currentTarget.style.background='')}>
                                            <td style={td}><span style={{ fontWeight:700, color:'#D97706' }}>{e.codigo}</span></td>
                                            <td style={td}>{e.fecha}</td>
                                            <td style={td}>{e.motivo ?? <span style={{ color:'#94A3B8' }}>—</span>}</td>
                                            <td style={td}>{e.usuario ?? '—'}</td>
                                            <td style={{ ...td, textAlign:'right', fontWeight:700 }}>{fmt(e.total)}</td>
                                            <td style={{ ...td, textAlign:'center' }}>
                                                <button onClick={() => setModalEntrada(e)} style={{ background:'#FFF7ED', border:'none', borderRadius:6, padding:'5px 12px', cursor:'pointer', fontSize:12, color:'#B45309', fontWeight:600 }}>Ver</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </>)}

            {/* ════════════ TAB GASTOS ════════════ */}
            {tab === 'gastos' && (<>
                {/* Section filters */}
                <div style={{ ...card, display:'flex', flexWrap:'wrap', gap:10, alignItems:'flex-end', padding:'14px 18px' }}>
                    <div>
                        <label style={lbl}>Tipo de gasto</label>
                        <select value={gTipo} onChange={e => { setGTipo(e.target.value); setGClas(''); }} style={{ ...inp, minWidth:150 }}>
                            <option value="">Todos</option>
                            {tiposGasto.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Clasificación</label>
                        <select value={gClas} onChange={e => setGClas(e.target.value)} style={{ ...inp, minWidth:160 }}>
                            <option value="">Todas</option>
                            {clasGasto.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Método de pago</label>
                        <select value={gMetodo} onChange={e => setGMetodo(e.target.value)} style={{ ...inp, minWidth:150 }}>
                            <option value="">Todos</option>
                            {metodosGasto.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    {(gTipo || gClas || gMetodo) && <button onClick={() => { setGTipo(''); setGClas(''); setGMetodo(''); }} style={{ ...inp, cursor:'pointer', color:'#64748B', fontSize:12 }}>Limpiar</button>}
                    <span style={{ fontSize:12, color:'#94A3B8', marginLeft:'auto' }}>{gastosFiltrados.length} resultado(s)</span>
                </div>

                {/* Charts row */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                    <div style={card}>
                        <h2 style={title}>Por tipo / clasificación</h2>
                        {gastos.por_clasificacion.length === 0 ? <EmptyChart /> : (
                            <ResponsiveContainer width="100%" height={Math.max(180, gastos.por_clasificacion.length * 34)}>
                                <BarChart layout="vertical" data={gastos.por_clasificacion} margin={{ top:0, right:16, left:140, bottom:0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize:10 }} tickFormatter={(v:number) => `S/${v}`} />
                                    <YAxis type="category" dataKey="clasificacion" tick={{ fontSize:10 }} width={140} />
                                    <Tooltip formatter={(v) => fmt(Number(v ?? 0))} />
                                    <Bar dataKey="total" name="Total" fill="#DC2626" radius={[0,4,4,0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                    <div style={card}>
                        <h2 style={title}>Resumen por categoría</h2>
                        {gastos.por_clasificacion.length === 0 ? <EmptyChart /> : (
                            <table style={{ width:'100%', borderCollapse:'collapse' }}>
                                <thead><tr>
                                    <th style={th}>Tipo / Clasificación</th>
                                    <th style={{ ...th, textAlign:'center' }}>Cant.</th>
                                    <th style={{ ...th, textAlign:'right' }}>Total</th>
                                </tr></thead>
                                <tbody>
                                    {gastos.por_clasificacion.map((c, i) => (
                                        <tr key={i}>
                                            <td style={td}>
                                                <span style={{ fontSize:11, color:'#94A3B8' }}>{c.tipo} / </span>
                                                <span style={{ fontWeight:600 }}>{c.clasificacion}</span>
                                            </td>
                                            <td style={{ ...td, textAlign:'center', color:'#64748B' }}>{c.cantidad}</td>
                                            <td style={{ ...td, textAlign:'right', fontWeight:700, color:'#DC2626' }}>{fmt(c.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Expenses table */}
                <div style={card}>
                    <h2 style={title}>Listado de gastos</h2>
                    {gastosFiltrados.length === 0 ? <EmptyChart /> : (
                        <div style={{ overflowX:'auto' }}>
                            <table style={{ width:'100%', borderCollapse:'collapse' }}>
                                <thead><tr>
                                    <th style={th}>Fecha</th>
                                    <th style={th}>Tipo</th>
                                    <th style={th}>Clasificación</th>
                                    <th style={th}>Descripción</th>
                                    <th style={th}>Comprobante</th>
                                    <th style={th}>Método</th>
                                    <th style={{ ...th, textAlign:'right' }}>Monto</th>
                                    <th style={{ ...th, textAlign:'center' }}>Ver</th>
                                </tr></thead>
                                <tbody>
                                    {gastosFiltrados.map(g => (
                                        <tr key={g.id} onMouseEnter={e => (e.currentTarget.style.background='#FAFAFA')} onMouseLeave={e => (e.currentTarget.style.background='')}>
                                            <td style={td}>{g.fecha}</td>
                                            <td style={td}><span style={{ fontSize:11, padding:'2px 7px', borderRadius:4, background:'#FEF2F2', color:'#DC2626', fontWeight:600 }}>{g.tipo}</span></td>
                                            <td style={td}>{g.clasificacion}</td>
                                            <td style={td}>{g.descripcion_gasto}</td>
                                            <td style={td}>{g.comprobante_numero ?? <span style={{ color:'#CBD5E1' }}>—</span>}</td>
                                            <td style={td}>{g.metodo_pago ?? '—'}</td>
                                            <td style={{ ...td, textAlign:'right', fontWeight:700, color:'#DC2626' }}>{fmt(g.monto)}</td>
                                            <td style={{ ...td, textAlign:'center' }}>
                                                <button onClick={() => setModalGasto(g)} style={{ background:'#FEF2F2', border:'none', borderRadius:6, padding:'5px 12px', cursor:'pointer', fontSize:12, color:'#B91C1C', fontWeight:600 }}>Ver</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </>)}

            {/* ════════════ MODAL VENTA ════════════ */}
            {modalVenta && (
                <Overlay onClose={() => setModalVenta(null)}>
                    <ModalHeader
                        title={modalVenta.codigo}
                        sub={`${modalVenta.fecha}  ${modalVenta.hora}`}
                        badge={modalVenta.estado}
                        badgeColor={modalVenta.estado === 'pagado' ? { bg:'#DCFCE7', text:'#16A34A' } : { bg:'#FEF9C3', text:'#CA8A04' }}
                        onClose={() => setModalVenta(null)}
                    />

                    {/* Info */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16, padding:'12px 14px', background:'#F8FAFC', borderRadius:10 }}>
                        <InfoCell label="Cliente"  value={modalVenta.cliente  ?? 'Sin cliente'} />
                        <InfoCell label="DNI"      value={modalVenta.cliente_dni ?? '—'} />
                    </div>

                    {/* Items */}
                    <SectionLabel text="Ítems" />
                    <div style={{ overflowX:'auto', marginBottom:16 }}>
                        <table style={{ width:'100%', borderCollapse:'collapse' }}>
                            <thead><tr>
                                <th style={th}>Descripción</th>
                                <th style={{ ...th, textAlign:'center' }}>Tipo</th>
                                <th style={{ ...th, textAlign:'right' }}>Cant</th>
                                <th style={{ ...th, textAlign:'right' }}>P.Costo</th>
                                <th style={{ ...th, textAlign:'right' }}>P.Venta</th>
                                <th style={{ ...th, textAlign:'right' }}>Subtotal</th>
                                <th style={{ ...th, textAlign:'right' }}>Ganancia</th>
                            </tr></thead>
                            <tbody>
                                {modalVenta.detalles.map((d, i) => {
                                    const gan = calcGananciaItem(d);
                                    const pct = calcPctItem(d);
                                    return (
                                        <tr key={i}>
                                            <td style={td}>{d.descripcion}</td>
                                            <td style={{ ...td, textAlign:'center' }}>
                                                <span style={{ fontSize:10, padding:'2px 6px', borderRadius:4, background: d.tipo==='servicio' ? '#EFF6FF' : '#FFF7ED', color: d.tipo==='servicio' ? '#2563EB' : '#D97706', fontWeight:700 }}>
                                                    {d.tipo === 'servicio' ? 'Serv.' : 'Prod.'}
                                                </span>
                                            </td>
                                            <td style={{ ...td, textAlign:'right' }}>{d.cantidad}</td>
                                            <td style={{ ...td, textAlign:'right', color:'#94A3B8' }}>{d.precio_costo_ref > 0 ? fmt(d.precio_costo_ref) : '—'}</td>
                                            <td style={{ ...td, textAlign:'right' }}>{fmt(d.precio_unitario)}</td>
                                            <td style={{ ...td, textAlign:'right', fontWeight:600 }}>{fmt(d.subtotal)}</td>
                                            <td style={{ ...td, textAlign:'right' }}>
                                                {gan === null ? <span style={{ color:'#CBD5E1' }}>—</span> : (
                                                    <div>
                                                        <span style={{ fontWeight:700, color: gan >= 0 ? '#059669' : '#DC2626' }}>{gan >= 0 ? '+' : ''}{fmt(gan)}</span><br />
                                                        <span style={{ fontSize:10, color: pct! >= 0 ? '#059669' : '#DC2626' }}>{fmtPct(pct!)}</span>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagos */}
                    <SectionLabel text="Pagos" />
                    <div style={{ marginBottom:16 }}>
                        {modalVenta.pagos.map((p, i) => (
                            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #F1F5F9' }}>
                                <span style={{ fontSize:13, color:'#374151' }}>{p.metodo}{p.cuenta ? ` — ${p.cuenta}` : ''}</span>
                                <span style={{ fontSize:13, fontWeight:700 }}>{fmt(p.monto)}</span>
                            </div>
                        ))}
                    </div>

                    {/* Totals */}
                    <div style={{ background:'#F8FAFC', borderRadius:10, padding:'12px 16px' }}>
                        <TotalRow label="Subtotal"  value={fmt(modalVenta.subtotal)} />
                        {modalVenta.descuento > 0 && <TotalRow label="Descuento" value={`−${fmt(modalVenta.descuento)}`} color="#D97706" />}
                        <div style={{ borderTop:'1px solid #E2E8F0', marginTop:6, paddingTop:8, display:'flex', justifyContent:'space-between' }}>
                            <span style={{ fontSize:15, fontWeight:800 }}>Total</span>
                            <span style={{ fontSize:15, fontWeight:800, color:'#16A34A' }}>{fmt(modalVenta.total)}</span>
                        </div>
                    </div>
                </Overlay>
            )}

            {/* ════════════ MODAL ENTRADA ════════════ */}
            {modalEntrada && (
                <Overlay onClose={() => setModalEntrada(null)}>
                    <ModalHeader
                        title={modalEntrada.codigo}
                        sub={`${modalEntrada.fecha}  ·  ${modalEntrada.usuario ?? '—'}`}
                        onClose={() => setModalEntrada(null)}
                    />
                    {modalEntrada.motivo && (
                        <div style={{ marginBottom:14, padding:'8px 12px', background:'#FFF7ED', borderRadius:8, fontSize:13, color:'#92400E' }}>
                            <strong>Motivo:</strong> {modalEntrada.motivo}
                        </div>
                    )}
                    <SectionLabel text="Productos recibidos" />
                    <div style={{ overflowX:'auto', marginBottom:16 }}>
                        <table style={{ width:'100%', borderCollapse:'collapse' }}>
                            <thead><tr>
                                <th style={th}>Producto</th>
                                <th style={th}>Unidad</th>
                                <th style={th}>Proveedor</th>
                                <th style={{ ...th, textAlign:'right' }}>Cant.</th>
                                <th style={{ ...th, textAlign:'right' }}>P. Unit.</th>
                                <th style={{ ...th, textAlign:'right' }}>Subtotal</th>
                            </tr></thead>
                            <tbody>
                                {modalEntrada.detalles.map((d, i) => (
                                    <tr key={i}>
                                        <td style={{ ...td, fontWeight:600 }}>{d.producto}</td>
                                        <td style={td}>{d.unidad ?? '—'}</td>
                                        <td style={td}>{d.proveedor ?? <span style={{ color:'#94A3B8' }}>—</span>}</td>
                                        <td style={{ ...td, textAlign:'right' }}>{d.cantidad}</td>
                                        <td style={{ ...td, textAlign:'right' }}>{fmt(d.precio_unitario)}</td>
                                        <td style={{ ...td, textAlign:'right', fontWeight:700 }}>{fmt(d.subtotal)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ background:'#FFF7ED', borderRadius:10, padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <span style={{ fontSize:14, fontWeight:700, color:'#92400E' }}>Total invertido</span>
                        <span style={{ fontSize:18, fontWeight:800, color:'#D97706' }}>{fmt(modalEntrada.total)}</span>
                    </div>
                </Overlay>
            )}

            {/* ════════════ MODAL GASTO ════════════ */}
            {modalGasto && (
                <Overlay onClose={() => setModalGasto(null)}>
                    <ModalHeader
                        title={`Gasto #${modalGasto.id}`}
                        sub={`${modalGasto.fecha}  ·  ${modalGasto.usuario ?? '—'}`}
                        onClose={() => setModalGasto(null)}
                    />
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
                        {([
                            ['Tipo',           modalGasto.tipo],
                            ['Clasificación',  modalGasto.clasificacion],
                            ['Descripción',    modalGasto.descripcion_gasto],
                            ['Comprobante',    modalGasto.comprobante_numero ?? '—'],
                            ['Método de pago', modalGasto.metodo_pago ?? '—'],
                            ['Cuenta',         modalGasto.cuenta_pago  ?? '—'],
                        ] as [string,string][]).map(([k, v]) => (
                            <div key={k} style={{ padding:'10px 14px', background:'#F8FAFC', borderRadius:8 }}>
                                <span style={{ fontSize:10, fontWeight:700, color:'#94A3B8', textTransform:'uppercase' }}>{k}</span><br />
                                <span style={{ fontSize:13, fontWeight:600, color:'#1E293B' }}>{v}</span>
                            </div>
                        ))}
                    </div>
                    {modalGasto.descripcion && (
                        <div style={{ marginBottom:10, padding:'10px 14px', background:'#F8FAFC', borderRadius:8, fontSize:13 }}>
                            <span style={{ fontSize:10, fontWeight:700, color:'#94A3B8', textTransform:'uppercase' }}>Nota</span><br />
                            {modalGasto.descripcion}
                        </div>
                    )}
                    {modalGasto.observaciones && (
                        <div style={{ marginBottom:10, padding:'10px 14px', background:'#FFFBEB', borderRadius:8, fontSize:13, color:'#92400E' }}>
                            <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase' }}>Observaciones</span><br />
                            {modalGasto.observaciones}
                        </div>
                    )}
                    <div style={{ background:'#FEF2F2', borderRadius:10, padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:4 }}>
                        <span style={{ fontSize:14, fontWeight:700, color:'#991B1B' }}>Monto del gasto</span>
                        <span style={{ fontSize:22, fontWeight:800, color:'#DC2626' }}>{fmt(modalGasto.monto)}</span>
                    </div>
                </Overlay>
            )}
        </AuthenticatedLayout>
    );
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, bg }: { label:string; value:string; sub:string; color:string; bg:string }) {
    return (
        <div style={{ background:bg, border:`1px solid ${color}33`, borderRadius:12, padding:'14px 16px' }}>
            <p style={{ fontSize:10, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.5px', margin:'0 0 4px' }}>{label}</p>
            <p style={{ fontSize:17, fontWeight:800, color, margin:'0 0 2px', lineHeight:1.2 }}>{value}</p>
            <p style={{ fontSize:11, color:'#94A3B8', margin:0 }}>{sub}</p>
        </div>
    );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
    return (
        <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
            <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:16, padding:'24px', width:'100%', maxWidth:740, maxHeight:'88vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
                {children}
            </div>
        </div>
    );
}

function ModalHeader({ title, sub, badge, badgeColor, onClose }: { title:string; sub:string; badge?:string; badgeColor?:{ bg:string; text:string }; onClose:() => void }) {
    return (
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
            <div>
                <h3 style={{ margin:'0 0 4px', fontSize:18, fontWeight:800, color:'#1E293B' }}>{title}</h3>
                <span style={{ fontSize:12, color:'#64748B' }}>{sub}</span>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                {badge && badgeColor && (
                    <span style={{ fontSize:11, padding:'3px 10px', borderRadius:5, fontWeight:700, background:badgeColor.bg, color:badgeColor.text }}>
                        {badge.toUpperCase()}
                    </span>
                )}
                <button onClick={onClose} style={{ background:'#F1F5F9', border:'none', borderRadius:6, width:28, height:28, cursor:'pointer', fontSize:18, color:'#64748B', lineHeight:'28px', textAlign:'center' }}>×</button>
            </div>
        </div>
    );
}

function SectionLabel({ text }: { text:string }) {
    return <h4 style={{ fontSize:11, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.5px', margin:'0 0 8px' }}>{text}</h4>;
}

function InfoCell({ label, value }: { label:string; value:string }) {
    return (
        <div>
            <span style={{ fontSize:10, fontWeight:700, color:'#94A3B8', textTransform:'uppercase' }}>{label}</span><br />
            <span style={{ fontSize:13, fontWeight:600, color:'#1E293B' }}>{value}</span>
        </div>
    );
}

function TotalRow({ label, value, color = '#64748B' }: { label:string; value:string; color?:string }) {
    return (
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color, marginBottom:4 }}>
            <span>{label}</span><span>{value}</span>
        </div>
    );
}

function EmptyChart() {
    return (
        <div style={{ height:160, display:'flex', alignItems:'center', justifyContent:'center', color:'#94A3B8', fontSize:13 }}>
            Sin datos para el período seleccionado
        </div>
    );
}
