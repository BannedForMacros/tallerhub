import { useMemo } from 'react';
import { Plus, Trash2, Save, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Link } from '@inertiajs/react';
import Button from '@/Components/Button';
import InputField from '@/Components/InputField';
import SelectField from '@/Components/SelectField';
import { ProductoAlmacen, Local, Empresa, Inventario } from '@/types';

interface DetalleForm {
    producto_id:      string;
    unidad_medida_id: string;
    cantidad:         string;
}

interface Props {
    data: {
        empresa_id:    string;
        local_id:      string;
        tipo:          string;
        observaciones: string;
        fecha:         string;
        detalles:      DetalleForm[];
    };
    setData:      (key: any, value: any) => void;
    errors:       Record<string, string>;
    processing:   boolean;
    empresas:     Empresa[];
    locales:      Local[];
    productos:    ProductoAlmacen[];
    inventario:   Inventario[];
    motivos:      Record<string, string>;
    esSuperAdmin: boolean;
    esEdicion?:   boolean;
    onGuardar:    () => void;
}

export const detalleVacio = (): DetalleForm => ({
    producto_id: '', unidad_medida_id: '', cantidad: '',
});

export default function SalidaForm({
    data, setData, errors, processing,
    empresas, locales, productos, inventario, motivos,
    esSuperAdmin, esEdicion = false, onGuardar,
}: Props) {

    const localesFiltrados = useMemo(() =>
        esSuperAdmin && data.empresa_id
            ? locales.filter(l => l.empresa_id === Number(data.empresa_id))
            : locales
    , [data.empresa_id, locales]);

    const productosFiltrados = useMemo(() =>
        esSuperAdmin && data.empresa_id
            ? productos.filter(p => p.empresa_id === Number(data.empresa_id))
            : productos
    , [data.empresa_id, productos]);

    // Obtener registro de inventario para producto+unidad+local
    const getInventario = (productoId: string, unidadId: string): Inventario | null => {
        if (!data.local_id || !productoId || !unidadId) return null;
        const lista = Array.isArray(inventario) ? inventario : (Object.values(inventario) as Inventario[]);
        return lista.find(
            (i) =>
                Number(i.local_id)         === Number(data.local_id) &&
                Number(i.producto_id)      === Number(productoId) &&
                Number(i.unidad_medida_id) === Number(unidadId)
        ) ?? null;
    };

    const agregarDetalle = () => {
        setData('detalles', [...data.detalles, detalleVacio()]);
    };

    const quitarDetalle = (i: number) => {
        if (data.detalles.length === 1) return;
        setData('detalles', data.detalles.filter((_: any, idx: number) => idx !== i));
    };

    const actualizarDetalle = (i: number, campo: keyof DetalleForm, valor: string) => {
        const nuevos = [...data.detalles];
        nuevos[i] = { ...nuevos[i], [campo]: valor };

        // Al cambiar producto precargar unidad principal
        if (campo === 'producto_id' && valor) {
            const prod = productos.find(p => p.id === Number(valor));
            const unidadPrincipal = prod?.producto_unidades?.find(u => u.es_principal);
            if (unidadPrincipal) {
                nuevos[i].unidad_medida_id = String(unidadPrincipal.unidad_medida_id);
            }
        }

        setData('detalles', nuevos);
    };

    // Total basado en precio promedio * cantidad
    const totalSalida = useMemo(() =>
        data.detalles.reduce((acc: number, d: DetalleForm) => {
            const inv    = getInventario(d.producto_id, d.unidad_medida_id);
            const precio = inv?.precio_promedio ?? 0;
            const cant   = parseFloat(d.cantidad) || 0;
            return acc + (precio * cant);
        }, 0)
    , [data.detalles, data.local_id, inventario]);

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Link href={route('almacen.salidas.index')}>
                        <button style={{
                            display: 'flex', alignItems: 'center', gap: 6, background: 'none',
                            border: '1px solid #E2E8F0', borderRadius: 10, padding: '8px 14px',
                            cursor: 'pointer', fontSize: 13, color: '#64748B',
                        }}>
                            <ArrowLeft size={15} /> Volver
                        </button>
                    </Link>
                    <div>
                        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1E293B', margin: 0 }}>
                            {esEdicion ? 'Editar Salida' : 'Nueva Salida de Almacén'}
                        </h1>
                        <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 2 }}>
                            {esEdicion ? 'Modifica los datos de la salida' : 'Registra la salida de productos del inventario'}
                        </p>
                    </div>
                </div>
                <Button variant="primary" size="md" icon={<Save size={15} />} loading={processing} onClick={onGuardar}>
                    {esEdicion ? 'Guardar Cambios' : 'Registrar Salida'}
                </Button>
            </div>

            {/* Datos generales */}
            <div style={{ backgroundColor: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: 20, marginBottom: 16 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: '0 0 14px' }}>Datos Generales</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 16px' }}>
                    {esSuperAdmin && !esEdicion && (
                        <div style={{ gridColumn: '1 / -1' }}>
                            <SelectField
                                label="Empresa" name="empresa_id" value={data.empresa_id}
                                onChange={e => {
                                    setData('empresa_id', e.target.value);
                                    setData('local_id', '');
                                    setData('detalles', [detalleVacio()]);
                                }}
                                options={empresas.map(e => ({ value: e.id, label: e.nombre }))}
                                placeholder="Selecciona empresa" error={errors.empresa_id} required
                            />
                        </div>
                    )}
                    <SelectField
                        label="Local origen" name="local_id" value={data.local_id}
                        onChange={e => {
                            setData('local_id', e.target.value);
                            setData('detalles', [detalleVacio()]);
                        }}
                        options={localesFiltrados.map(l => ({ value: l.id, label: l.nombre }))}
                        placeholder="Selecciona local" error={errors.local_id} required
                    />
                    <SelectField
                        label="Motivo" name="tipo" value={data.tipo}
                        onChange={e => setData('tipo', e.target.value)}
                        options={Object.entries(motivos).map(([k, v]) => ({ value: k, label: v }))}
                        placeholder="Selecciona motivo" error={errors.tipo} required
                    />
                    <InputField
                        label="Fecha" name="fecha" value={data.fecha} type="date"
                        onChange={e => setData('fecha', e.target.value)}
                        error={errors.fecha} required
                    />
                    <div style={{ gridColumn: '1 / -1' }}>
                        <InputField
                            label="Observaciones" name="observaciones" value={data.observaciones}
                            onChange={e => setData('observaciones', e.target.value)}
                            error={errors.observaciones} placeholder="Opcional"
                        />
                    </div>
                </div>
            </div>

            {/* Tabla productos */}
            <div style={{ backgroundColor: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: 20, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                    <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: 0 }}>
                        Productos <span style={{ color: '#EF4444' }}>*</span>
                        <span style={{ fontSize: 11, fontWeight: 400, color: '#94A3B8', marginLeft: 8 }}>
                            El precio se calcula automáticamente del promedio de entradas
                        </span>
                    </h2>
                    <button onClick={agregarDetalle} style={{
                        display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#2563EB',
                        background: 'none', border: '1px solid #2563EB', borderRadius: 8,
                        padding: '6px 14px', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap',
                    }}>
                        <Plus size={14} /> Agregar producto
                    </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    {/* Header */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '2.5fr 0.8fr 110px 110px 110px 36px',
                        gap: 8, padding: '10px 12px',
                        backgroundColor: '#1E293B', borderRadius: '10px 10px 0 0', minWidth: 680,
                    }}>
                        {['Producto', 'Unidad', 'Stock disp.', 'P. Promedio', 'Cantidad', ''].map(h => (
                            <span key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>{h}</span>
                        ))}
                    </div>

                    <div style={{ border: '1px solid #E2E8F0', borderTop: 'none', borderRadius: '0 0 10px 10px', minWidth: 680 }}>
                        {data.detalles.map((d: DetalleForm, i: number) => {
                            const prod              = productos.find(p => p.id === Number(d.producto_id));
                            const unidades          = prod?.producto_unidades ?? [];
                            const invItem           = getInventario(d.producto_id, d.unidad_medida_id);
                            const stock             = invItem ? Number(invItem.stock) : null;
                            const precioPromedio    = invItem?.precio_promedio ?? 0;
                            const cantidad          = parseFloat(d.cantidad) || 0;
                            const stockInsuficiente = stock !== null && d.cantidad !== '' && cantidad > stock;
                            const sinStock          = stock === 0;

                            // Color del stock
                            const stockBg     = stock === null ? '#F8FAFC' : stock === 0 ? '#FEF2F2' : stock <= 5 ? '#FFFBEB' : '#F0FDF4';
                            const stockColor  = stock === null ? '#94A3B8' : stock === 0 ? '#DC2626' : stock <= 5 ? '#D97706' : '#16A34A';
                            const stockBorder = stock === null ? '#E2E8F0' : stock === 0 ? '#FECACA' : stock <= 5 ? '#FDE68A' : '#BBF7D0';

                            return (
                                <div key={i} style={{
                                    display: 'grid',
                                    gridTemplateColumns: '2.5fr 0.8fr 110px 110px 110px 36px',
                                    gap: 8, padding: '10px 12px', alignItems: 'center',
                                    backgroundColor: i % 2 === 0 ? '#F8FAFC' : '#fff',
                                    borderBottom: i < data.detalles.length - 1 ? '1px solid #F1F5F9' : 'none',
                                }}>
                                    {/* Producto */}
                                    <SelectField
                                        label="" name={`p_${i}`} value={d.producto_id}
                                        onChange={e => actualizarDetalle(i, 'producto_id', e.target.value)}
                                        options={productosFiltrados.map((p: ProductoAlmacen) => ({ value: p.id, label: p.nombre }))}
                                        placeholder="Seleccionar"
                                    />
                                    {/* Unidad */}
                                    <SelectField
                                        label="" name={`u_${i}`} value={d.unidad_medida_id}
                                        onChange={e => actualizarDetalle(i, 'unidad_medida_id', e.target.value)}
                                        options={unidades.map((u: any) => ({
                                            value: u.unidad_medida_id,
                                            label: u.unidad_medida?.abreviatura ?? 'Und',
                                        }))}
                                        placeholder="Und"
                                    />
                                    {/* Stock disponible */}
                                    <div style={{
                                        padding: '10px 8px', borderRadius: 10, textAlign: 'center',
                                        backgroundColor: stockBg,
                                        border: `1.5px solid ${stockBorder}`,
                                        fontSize: 13, fontWeight: 700, color: stockColor,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                                    }}>
                                        {stock === null
                                            ? <span style={{ fontSize: 11, color: '#CBD5E1' }}>—</span>
                                            : <>
                                                {stock === 0 && <AlertTriangle size={12} />}
                                                {stock}
                                              </>
                                        }
                                    </div>
                                    {/* Precio promedio — solo lectura */}
                                    <div style={{
                                        padding: '10px 8px', borderRadius: 10,
                                        backgroundColor: '#F8FAFC', border: '1.5px solid #E2E8F0',
                                        fontSize: 12, color: '#64748B', textAlign: 'right', fontWeight: 600,
                                    }}>
                                        {precioPromedio > 0
                                            ? `S/ ${Number(precioPromedio).toFixed(4)}`
                                            : <span style={{ color: '#CBD5E1', fontSize: 11 }}>—</span>
                                        }
                                    </div>
                                    {/* Cantidad */}
                                    <div>
                                        <input
                                            type="number" value={d.cantidad} min="0" step="0.01"
                                            placeholder="0"
                                            disabled={sinStock}
                                            onWheel={e => e.currentTarget.blur()}
                                            onChange={e => actualizarDetalle(i, 'cantidad', e.target.value)}
                                            style={{
                                                width: '100%', padding: '10px 8px', borderRadius: 10,
                                                border: `1.5px solid ${stockInsuficiente ? '#EF4444' : '#E2E8F0'}`,
                                                fontSize: 13, outline: 'none',
                                                boxSizing: 'border-box', textAlign: 'right',
                                                backgroundColor: sinStock ? '#F8FAFC' : stockInsuficiente ? '#FEF2F2' : '#fff',
                                                cursor: sinStock ? 'not-allowed' : 'text',
                                            }}
                                        />
                                        {stockInsuficiente && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 3 }}>
                                                <AlertTriangle size={11} color="#EF4444" />
                                                <span style={{ fontSize: 10, color: '#EF4444', fontWeight: 600 }}>
                                                    Supera stock ({stock})
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    {/* Quitar */}
                                    <div style={{ textAlign: 'center' }}>
                                        {data.detalles.length > 1 && (
                                            <button onClick={() => quitarDetalle(i)} style={{
                                                background: 'none', border: 'none',
                                                color: '#EF4444', cursor: 'pointer', padding: 4,
                                            }}>
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Resumen */}
            <div style={{
                backgroundColor: '#FFF7ED', borderRadius: 14, border: '1px solid #FED7AA',
                padding: '14px 20px', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12,
            }}>
                <div>
                    <p style={{ margin: 0, fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                        {data.detalles.filter((d: DetalleForm) => d.producto_id).length} producto(s) — {data.fecha || 'Sin fecha'}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: '#94A3B8' }}>
                        {data.tipo ? motivos[data.tipo] : 'Sin motivo'} · {data.local_id ? locales.find(l => l.id === Number(data.local_id))?.nombre : 'Sin local'}
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: 10, color: '#CBD5E1' }}>
                        * Total referencial basado en precio promedio de entradas
                    </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: 11, color: '#64748B', fontWeight: 600 }}>TOTAL REFERENCIAL</p>
                    <p style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#D97706', lineHeight: 1 }}>
                        S/ {totalSalida.toFixed(2)}
                    </p>
                </div>
            </div>

            {/* Botones */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <Link href={route('almacen.salidas.index')}>
                    <Button variant="cancel" size="md">Cancelar</Button>
                </Link>
                <Button variant="primary" size="md" icon={<Save size={15} />} loading={processing} onClick={onGuardar}>
                    {esEdicion ? 'Guardar Cambios' : 'Registrar Salida'}
                </Button>
            </div>
        </div>
    );
}