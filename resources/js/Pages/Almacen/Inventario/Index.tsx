import { useState, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import { Layers, AlertTriangle, TrendingDown, History, ArrowDownCircle, ArrowUpCircle, ExternalLink, RefreshCw } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import Button from '@/Components/Button';
import ActionButton from '@/Components/ActionButton';
import { formatFecha } from '@/helpers/fecha';
import { PageProps, Inventario, Local, CategoriaAlmacen, Empresa } from '@/types';

interface KardexMovimiento {
    id: string;
    tipo: 'entrada' | 'salida';
    subtipo: string | null;
    codigo: string | null;
    fecha: string | null;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    activo: boolean;
    motivo: string | null;
    observaciones: string | null;
    usuario: string | null;
    proveedor: string | null;
    numero_factura: string | null;
    referencia_id: number | null;
    referencia_tipo: string | null;
    venta_codigo: string | null;
    entrada_id: number | null;
    salida_id: number | null;
    saldo: number;
}

interface KardexData {
    inventario: {
        id: number;
        producto: { nombre: string; codigo: string | null } | null;
        unidad_medida: { nombre: string; abreviatura: string } | null;
        local: { nombre: string } | null;
        stock: number;
        stock_minimo: number;
    };
    movimientos: KardexMovimiento[];
}

const SUBTIPO_LABEL: Record<string, string> = {
    venta:               'Venta',
    ajuste:              'Ajuste',
    devolucion_defecto:  'Devolución',
    otro:                'Otro',
};

interface Props extends PageProps {
    inventario: Inventario[];
    locales: Local[];
    categorias: CategoriaAlmacen[];
    empresas: Empresa[];
}

export default function InventarioIndex({ inventario, locales, categorias, empresas }: Props) {
    const [filtroLocal,     setFiltroLocal]     = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState('');
    const [filtroEmpresa,   setFiltroEmpresa]   = useState('');
    const [filtroBusqueda,  setFiltroBusqueda]  = useState('');
    const [soloStockBajo,   setSoloStockBajo]   = useState(false);

    const [kardex,           setKardex]           = useState<KardexData | null>(null);
    const [kardexLoading,    setKardexLoading]    = useState(false);
    const [kardexError,      setKardexError]      = useState<string | null>(null);
    const [resyncLoading,    setResyncLoading]    = useState(false);
    const [resyncAllLoading, setResyncAllLoading] = useState(false);

    const cargarKardex = async (id: number) => {
        setKardexLoading(true);
        setKardexError(null);
        try {
            const { data } = await axios.get<KardexData>(route('almacen.inventario.kardex', id));
            setKardex(data);
        } catch (e: any) {
            setKardexError(e?.response?.data?.message ?? 'No se pudo cargar el kárdex.');
        } finally {
            setKardexLoading(false);
        }
    };

    const abrirKardex = (inv: Inventario) => {
        setKardex({ inventario: { id: inv.id, producto: null, unidad_medida: null, local: null, stock: 0, stock_minimo: 0 }, movimientos: [] });
        cargarKardex(inv.id);
    };

    const ejecutarRecalcularTodo = async () => {
        setResyncAllLoading(true);
        try {
            const { data } = await axios.post<{ total_revisados: number; total_corregidos: number; ajuste_neto: number }>(
                route('almacen.inventario.resincronizar-todo')
            );
            if (data.total_corregidos === 0) {
                toast.success(`Inventario verificado: ${data.total_revisados} ítems revisados, todos correctos.`, { duration: 5000 });
            } else {
                toast.success(
                    `Inventario recalculado: ${data.total_corregidos} de ${data.total_revisados} ítems corregidos (ajuste neto: ${data.ajuste_neto > 0 ? '+' : ''}${data.ajuste_neto.toFixed(2)}).`,
                    { duration: 7000 }
                );
            }
            router.reload({ only: ['inventario'] });
        } catch (e: any) {
            toast.error(e?.response?.data?.message ?? 'No se pudo recalcular el inventario.');
        } finally {
            setResyncAllLoading(false);
        }
    };

    const confirmarRecalcularTodo = () => {
        toast((t) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', margin: 0 }}>¿Recalcular todo el inventario?</p>
                <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
                    Se reemplazará el stock de cada ítem por la suma de sus entradas activas menos sus salidas activas.
                    Útil para corregir desfases. No afecta los movimientos en sí.
                </p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => toast.dismiss(t.id)} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #E2E8F0', backgroundColor: '#fff', cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
                    <button
                        onClick={() => { toast.dismiss(t.id); ejecutarRecalcularTodo(); }}
                        style={{ padding: '6px 14px', borderRadius: 8, border: 'none', backgroundColor: '#2563EB', cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 600 }}
                    >
                        Recalcular
                    </button>
                </div>
            </div>
        ), { duration: 12000 });
    };

    const recalcularStock = async () => {
        if (!kardex) return;
        const id = kardex.inventario.id;
        setResyncLoading(true);
        try {
            const { data } = await axios.post<{ stock_anterior: number; stock_nuevo: number; diferencia: number }>(
                route('almacen.inventario.resincronizar', id)
            );
            const diff = Number(data.diferencia);
            const msg = Math.abs(diff) < 0.0001
                ? `Stock ya estaba correcto: ${Number(data.stock_nuevo).toFixed(2)}.`
                : `Stock corregido: ${Number(data.stock_anterior).toFixed(2)} → ${Number(data.stock_nuevo).toFixed(2)} (${diff > 0 ? '+' : ''}${diff.toFixed(2)}).`;
            toast.success(msg, { duration: 5000 });
            await cargarKardex(id);
            router.reload({ only: ['inventario'] });
        } catch (e: any) {
            toast.error(e?.response?.data?.message ?? 'No se pudo recalcular el stock.');
        } finally {
            setResyncLoading(false);
        }
    };

    const datos = useMemo(() => {
        return inventario.filter(inv => {
            if (filtroLocal     && inv.local_id    !== Number(filtroLocal))                                  return false;
            if (filtroCategoria && inv.producto?.categoria_id !== Number(filtroCategoria))                   return false;
            if (filtroEmpresa   && inv.empresa_id  !== Number(filtroEmpresa))                                return false;
            if (soloStockBajo   && Number(inv.stock) > Number(inv.stock_minimo))                             return false;
            if (filtroBusqueda) {
                const q = filtroBusqueda.toLowerCase();
                const nombre = inv.producto?.nombre?.toLowerCase() ?? '';
                if (!nombre.includes(q)) return false;
            }
            return true;
        });
    }, [inventario, filtroLocal, filtroCategoria, filtroEmpresa, filtroBusqueda, soloStockBajo]);

    // Resumen
    const totalProductos   = datos.length;
    const stockBajoCount   = datos.filter(i => Number(i.stock) <= Number(i.stock_minimo)).length;
    const sinStockCount    = datos.filter(i => Number(i.stock) === 0).length;

    const stockColor = (inv: Inventario) => {
        const stock = Number(inv.stock);
        const min   = Number(inv.stock_minimo);
        if (stock === 0)    return { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' };
        if (stock <= min)   return { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' };
        return                     { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' };
    };

    const selectStyle = {
        padding: '9px 12px', borderRadius: 10, border: '1.5px solid #E2E8F0',
        fontSize: 13, outline: 'none', backgroundColor: '#fff', color: '#1E293B',
        cursor: 'pointer',
    };

    return (
        <AuthenticatedLayout>
            <Head title="Inventario" />
            <Toaster position="top-right" />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', margin: 0 }}>Inventario</h1>
                    <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 4 }}>
                        Stock actual de productos por local
                    </p>
                </div>
                <button
                    onClick={confirmarRecalcularTodo}
                    disabled={resyncAllLoading}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '10px 16px', borderRadius: 10,
                        border: '1.5px solid #2563EB',
                        backgroundColor: resyncAllLoading ? '#EFF6FF' : '#fff',
                        color: '#2563EB',
                        cursor: resyncAllLoading ? 'wait' : 'pointer',
                        fontSize: 13, fontWeight: 700,
                        opacity: resyncAllLoading ? 0.7 : 1,
                        whiteSpace: 'nowrap',
                    }}
                    title="Recalcula el stock de todos los ítems del inventario desde los movimientos reales"
                >
                    <RefreshCw size={15} className={resyncAllLoading ? 'animate-spin' : ''} />
                    {resyncAllLoading ? 'Recalculando…' : 'Recalcular inventario'}
                </button>
            </div>

            {/* Tarjetas resumen */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
                {[
                    {
                        label: 'Total ítems',
                        valor: totalProductos,
                        icon: <Layers size={18} color="#2563EB" />,
                        bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE',
                    },
                    {
                        label: 'Stock bajo mínimo',
                        valor: stockBajoCount,
                        icon: <TrendingDown size={18} color="#D97706" />,
                        bg: '#FFFBEB', color: '#D97706', border: '#FDE68A',
                    },
                    {
                        label: 'Sin stock',
                        valor: sinStockCount,
                        icon: <AlertTriangle size={18} color="#DC2626" />,
                        bg: '#FEF2F2', color: '#DC2626', border: '#FECACA',
                    },
                ].map(c => (
                    <div key={c.label} style={{
                        backgroundColor: c.bg, borderRadius: 12,
                        border: `1px solid ${c.border}`, padding: '14px 18px',
                        display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                        <div style={{
                            width: 38, height: 38, borderRadius: 10,
                            backgroundColor: '#fff', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                            {c.icon}
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: c.color, lineHeight: 1 }}>{c.valor}</p>
                            <p style={{ margin: 0, fontSize: 11, color: '#64748B', marginTop: 2 }}>{c.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filtros */}
            <div style={{
                backgroundColor: '#fff', borderRadius: 14,
                border: '1px solid #E2E8F0', padding: '14px 18px',
                marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center',
            }}>
                <input
                    type="text" placeholder="Buscar producto..." value={filtroBusqueda}
                    onChange={e => setFiltroBusqueda(e.target.value)}
                    style={{ ...selectStyle, minWidth: 200, flex: 1 }}
                />
                {locales.length > 0 && (
                    <select value={filtroLocal} onChange={e => setFiltroLocal(e.target.value)} style={selectStyle}>
                        <option value="">Todos los locales</option>
                        {locales.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                    </select>
                )}
                {categorias.length > 0 && (
                    <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} style={selectStyle}>
                        <option value="">Todas las categorías</option>
                        {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                )}
                {empresas.length > 0 && (
                    <select value={filtroEmpresa} onChange={e => setFiltroEmpresa(e.target.value)} style={selectStyle}>
                        <option value="">Todas las empresas</option>
                        {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                    </select>
                )}
                <button
                    onClick={() => setSoloStockBajo(!soloStockBajo)}
                    style={{
                        padding: '9px 14px', borderRadius: 10, cursor: 'pointer',
                        fontSize: 13, fontWeight: 600, border: 'none',
                        backgroundColor: soloStockBajo ? '#D97706' : '#F1F5F9',
                        color: soloStockBajo ? '#fff' : '#64748B',
                        display: 'flex', alignItems: 'center', gap: 6,
                        whiteSpace: 'nowrap',
                    }}
                >
                    <AlertTriangle size={14} /> Stock bajo
                </button>
            </div>

            {/* Tabla */}
            <div style={{
                backgroundColor: '#fff', borderRadius: 14,
                border: '1px solid #E2E8F0', overflow: 'hidden',
            }}>
                {/* Header */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '2.5fr 1.2fr 1fr 1fr 1fr 1fr 70px',
                    gap: 8, padding: '12px 18px',
                    backgroundColor: '#1E293B',
                }}>
                    {['Producto', 'Categoría', 'Local', 'Unidad', 'Stock mínimo', 'Stock actual', ''].map((h, idx) => (
                        <span key={idx} style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>{h}</span>
                    ))}
                </div>

                {datos.length === 0 ? (
                    <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                        <Layers size={40} color="#CBD5E1" style={{ margin: '0 auto 12px' }} />
                        <p style={{ fontSize: 15, color: '#94A3B8', margin: 0, fontWeight: 600 }}>
                            No hay registros de inventario
                        </p>
                        <p style={{ fontSize: 13, color: '#CBD5E1', margin: '4px 0 0' }}>
                            El inventario se actualiza automáticamente con entradas y salidas
                        </p>
                    </div>
                ) : (
                    datos.map((inv, i) => {
                        const colores = stockColor(inv);
                        return (
                            <div key={inv.id} style={{
                                display: 'grid',
                                gridTemplateColumns: '2.5fr 1.2fr 1fr 1fr 1fr 1fr 70px',
                                gap: 8, padding: '12px 18px', alignItems: 'center',
                                backgroundColor: i % 2 === 0 ? '#F8FAFC' : '#fff',
                                borderBottom: i < datos.length - 1 ? '1px solid #F1F5F9' : 'none',
                            }}>
                                {/* Producto */}
                                <div>
                                    <p style={{ margin: 0, fontWeight: 600, color: '#1E293B', fontSize: 13 }}>
                                        {inv.producto?.nombre}
                                    </p>
                                    {inv.producto?.codigo && (
                                        <p style={{ margin: 0, fontSize: 11, color: '#94A3B8' }}>
                                            Cód: {inv.producto.codigo}
                                        </p>
                                    )}
                                </div>
                                {/* Categoría */}
                                <span style={{ fontSize: 12, color: '#64748B' }}>
                                    {inv.producto?.categoria?.nombre ?? '—'}
                                </span>
                                {/* Local */}
                                <span style={{ fontSize: 12, color: '#64748B' }}>
                                    {inv.local?.nombre ?? '—'}
                                </span>
                                {/* Unidad */}
                                <span style={{
                                    backgroundColor: '#F1F5F9', color: '#475569',
                                    padding: '3px 10px', borderRadius: 20,
                                    fontSize: 11, fontWeight: 700,
                                    display: 'inline-block',
                                }}>
                                    {inv.unidad_medida?.abreviatura ?? '—'}
                                </span>
                                {/* Stock mínimo */}
                                <span style={{ fontSize: 13, color: '#94A3B8' }}>
                                    {Number(inv.stock_minimo).toFixed(2)}
                                </span>
                                {/* Stock actual */}
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    backgroundColor: colores.bg, color: colores.color,
                                    border: `1.5px solid ${colores.border}`,
                                    padding: '5px 12px', borderRadius: 20,
                                    fontSize: 13, fontWeight: 800,
                                }}>
                                    {Number(inv.stock) === 0 && <AlertTriangle size={12} />}
                                    {Number(inv.stock) > 0 && Number(inv.stock) <= Number(inv.stock_minimo) && <TrendingDown size={12} />}
                                    {Number(inv.stock).toFixed(2)}
                                </div>
                                {/* Acciones */}
                                <ActionButton
                                    onClick={() => abrirKardex(inv)}
                                    icon={<History size={14} />}
                                    tooltip="Ver movimientos"
                                    color="blue"
                                />
                            </div>
                        );
                    })
                )}
            </div>

            {datos.length > 0 && (
                <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 10, textAlign: 'right' }}>
                    Mostrando {datos.length} de {inventario.length} registros
                </p>
            )}

            {/* Modal Kárdex */}
            {kardex && (
                <Modal
                    show={!!kardex}
                    onClose={() => setKardex(null)}
                    title={kardex.inventario.producto
                        ? `Kárdex — ${kardex.inventario.producto.nombre}`
                        : 'Kárdex de movimientos'}
                    maxWidth="4xl"
                >
                    <div>
                        {/* Cabecera con datos del item */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '8px 16px', marginBottom: 16,
                            padding: '12px 14px', backgroundColor: '#F8FAFC',
                            borderRadius: 10, border: '1px solid #E2E8F0',
                        }}>
                            {[
                                ['Producto',     kardex.inventario.producto?.nombre ?? '—'],
                                ['Código',       kardex.inventario.producto?.codigo ?? '—'],
                                ['Local',        kardex.inventario.local?.nombre ?? '—'],
                                ['Unidad',       kardex.inventario.unidad_medida?.abreviatura ?? '—'],
                                ['Stock actual', Number(kardex.inventario.stock).toFixed(2)],
                                ['Stock mínimo', Number(kardex.inventario.stock_minimo).toFixed(2)],
                                ['Movimientos', kardexLoading ? '…' : String(kardex.movimientos.length)],
                            ].map(([label, val]) => (
                                <div key={label}>
                                    <p style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', margin: '0 0 2px' }}>{label}</p>
                                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', margin: 0 }}>{val}</p>
                                </div>
                            ))}
                        </div>

                        {kardexError && (
                            <div style={{
                                padding: '10px 14px', borderRadius: 8, marginBottom: 12,
                                backgroundColor: '#FEF2F2', color: '#DC2626',
                                fontSize: 13, border: '1px solid #FECACA',
                            }}>
                                {kardexError}
                            </div>
                        )}

                        {/* Tabla de movimientos */}
                        <div style={{ maxHeight: 460, overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: 10 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                                    <tr style={{ backgroundColor: '#1E293B' }}>
                                        {['Fecha', 'Tipo', 'Código', 'Detalle', 'Cantidad', 'Costo U.', 'Subtotal', 'Saldo', 'Estado'].map(h => (
                                            <th key={h} style={{ padding: '8px 10px', color: '#fff', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', textAlign: 'left' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {kardexLoading && (
                                        <tr><td colSpan={9} style={{ padding: '24px', textAlign: 'center', color: '#94A3B8' }}>Cargando movimientos…</td></tr>
                                    )}
                                    {!kardexLoading && kardex.movimientos.length === 0 && (
                                        <tr><td colSpan={9} style={{ padding: '24px', textAlign: 'center', color: '#94A3B8' }}>
                                            Sin movimientos registrados para este ítem.
                                        </td></tr>
                                    )}
                                    {!kardexLoading && kardex.movimientos.map((m, i) => {
                                        const isEntrada = m.tipo === 'entrada';
                                        const rowBg     = i % 2 === 0 ? '#F8FAFC' : '#fff';
                                        const dimmed    = !m.activo;
                                        return (
                                            <tr key={m.id} style={{ backgroundColor: rowBg, opacity: dimmed ? 0.55 : 1 }}>
                                                <td style={{ padding: '7px 10px', color: '#64748B', whiteSpace: 'nowrap' }}>
                                                    {m.fecha ? formatFecha(m.fecha) : '—'}
                                                </td>
                                                <td style={{ padding: '7px 10px' }}>
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                                        backgroundColor: isEntrada ? '#F0FDF4' : '#FFF7ED',
                                                        color:           isEntrada ? '#16A34A' : '#D97706',
                                                        padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                                                    }}>
                                                        {isEntrada ? <ArrowDownCircle size={11} /> : <ArrowUpCircle size={11} />}
                                                        {isEntrada ? 'Entrada' : (SUBTIPO_LABEL[m.subtipo ?? ''] ?? 'Salida')}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '7px 10px', fontWeight: 700, color: isEntrada ? '#2563EB' : '#D97706' }}>
                                                    {m.codigo ?? '—'}
                                                </td>
                                                <td style={{ padding: '7px 10px', color: '#475569', fontSize: 12 }}>
                                                    {isEntrada ? (
                                                        <>
                                                            {m.proveedor && <div><span style={{ color: '#94A3B8' }}>Proveedor:</span> <strong>{m.proveedor}</strong></div>}
                                                            {m.numero_factura && <div><span style={{ color: '#94A3B8' }}>Factura:</span> {m.numero_factura}</div>}
                                                            {m.motivo && <div style={{ color: '#64748B' }}>{m.motivo}</div>}
                                                            {!m.proveedor && !m.numero_factura && !m.motivo && <span style={{ color: '#CBD5E1' }}>—</span>}
                                                        </>
                                                    ) : (
                                                        <>
                                                            {m.subtipo === 'venta' && m.venta_codigo && m.referencia_id ? (
                                                                <Link
                                                                    href={route('ventas.show', m.referencia_id)}
                                                                    style={{
                                                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                                                        color: '#2563EB', textDecoration: 'none', fontWeight: 700,
                                                                    }}
                                                                >
                                                                    {m.venta_codigo} <ExternalLink size={11} />
                                                                </Link>
                                                            ) : (
                                                                <span style={{ color: '#64748B' }}>{m.motivo ?? '—'}</span>
                                                            )}
                                                            {m.observaciones && <div style={{ color: '#94A3B8', fontSize: 11 }}>{m.observaciones}</div>}
                                                        </>
                                                    )}
                                                    {m.usuario && <div style={{ color: '#CBD5E1', fontSize: 10, marginTop: 2 }}>por {m.usuario}</div>}
                                                </td>
                                                <td style={{ padding: '7px 10px', fontWeight: 700, color: isEntrada ? '#16A34A' : '#DC2626', whiteSpace: 'nowrap' }}>
                                                    {isEntrada ? '+' : '−'}{Number(m.cantidad).toFixed(2)}
                                                </td>
                                                <td style={{ padding: '7px 10px', color: '#64748B', whiteSpace: 'nowrap' }}>
                                                    S/ {Number(m.precio_unitario).toFixed(4)}
                                                </td>
                                                <td style={{ padding: '7px 10px', color: '#64748B', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                    S/ {Number(m.subtotal).toFixed(2)}
                                                </td>
                                                <td style={{ padding: '7px 10px', fontWeight: 800, color: '#1E293B', whiteSpace: 'nowrap' }}>
                                                    {Number(m.saldo).toFixed(2)}
                                                </td>
                                                <td style={{ padding: '7px 10px' }}>
                                                    <span style={{
                                                        backgroundColor: m.activo ? '#F0FDF4' : '#FEF2F2',
                                                        color:           m.activo ? '#16A34A' : '#DC2626',
                                                        padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                                                    }}>
                                                        {m.activo ? 'Activo' : 'Anulado'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 8 }}>
                            El saldo acumulado considera únicamente movimientos activos. Los anulados se muestran en gris.
                            Si el "Stock actual" arriba no coincide con el último saldo, usa <strong>Recalcular stock real</strong> para corregirlo desde los movimientos.
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, gap: 8, flexWrap: 'wrap' }}>
                            <button
                                onClick={recalcularStock}
                                disabled={resyncLoading || kardexLoading}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    padding: '9px 14px', borderRadius: 10,
                                    border: '1.5px solid #2563EB',
                                    backgroundColor: resyncLoading ? '#EFF6FF' : '#fff',
                                    color: '#2563EB', cursor: resyncLoading ? 'wait' : 'pointer',
                                    fontSize: 13, fontWeight: 700,
                                    opacity: (resyncLoading || kardexLoading) ? 0.6 : 1,
                                }}
                                title="Reemplaza inventario.stock por el cálculo desde los movimientos activos"
                            >
                                <RefreshCw size={14} className={resyncLoading ? 'animate-spin' : ''} />
                                {resyncLoading ? 'Recalculando…' : 'Recalcular stock real'}
                            </button>
                            <Button variant="cancel" size="md" onClick={() => setKardex(null)}>Cerrar</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </AuthenticatedLayout>
    );
}