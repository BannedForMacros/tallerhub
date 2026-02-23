import { useState, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import { Layers, AlertTriangle, TrendingDown } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, Inventario, Local, CategoriaAlmacen, Empresa } from '@/types';

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

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', margin: 0 }}>Inventario</h1>
                    <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 4 }}>
                        Stock actual de productos por local
                    </p>
                </div>
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
                    gridTemplateColumns: '2.5fr 1.2fr 1fr 1fr 1fr 1fr',
                    gap: 8, padding: '12px 18px',
                    backgroundColor: '#1E293B',
                }}>
                    {['Producto', 'Categoría', 'Local', 'Unidad', 'Stock mínimo', 'Stock actual'].map(h => (
                        <span key={h} style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>{h}</span>
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
                                gridTemplateColumns: '2.5fr 1.2fr 1fr 1fr 1fr 1fr',
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
        </AuthenticatedLayout>
    );
}