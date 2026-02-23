import { useMemo } from 'react';
import { Plus, Trash2, Calculator, Save, ArrowLeft } from 'lucide-react';
import { Link } from '@inertiajs/react';
import Button from '@/Components/Button';
import InputField from '@/Components/InputField';
import SelectField from '@/Components/SelectField';
import { ProductoAlmacen, Proveedor, Local, Empresa } from '@/types';

interface DetalleForm {
    producto_id:      string;
    unidad_medida_id: string;
    proveedor_id:     string;
    cantidad:         string;
    subtotal:         string;
    precio_unitario:  string;
}

interface Props {
    data: {
        empresa_id:    string;
        local_id:      string;
        motivo:        string;
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
    proveedores:  Proveedor[];
    esSuperAdmin: boolean;
    esEdicion?:   boolean;
    onGuardar:    () => void;
}

export const detalleVacio = (): DetalleForm => ({
    producto_id: '', unidad_medida_id: '', proveedor_id: '',
    cantidad: '', subtotal: '', precio_unitario: '0.0000',
});

export default function EntradaForm({
    data, setData, errors, processing,
    empresas, locales, productos, proveedores,
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

    const proveedoresFiltrados = useMemo(() =>
        esSuperAdmin && data.empresa_id
            ? proveedores.filter(p => p.empresa_id === Number(data.empresa_id))
            : proveedores
    , [data.empresa_id, proveedores]);

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
        if (campo === 'producto_id' && valor) {
            const prod = productos.find(p => p.id === Number(valor));
            const unidadPrincipal = prod?.producto_unidades?.find(u => u.es_principal);
            if (unidadPrincipal) nuevos[i].unidad_medida_id = String(unidadPrincipal.unidad_medida_id);
        }
        const cant = parseFloat(nuevos[i].cantidad) || 0;
        const sub  = parseFloat(nuevos[i].subtotal)  || 0;
        nuevos[i].precio_unitario = cant > 0 ? (sub / cant).toFixed(4) : '0.0000';
        setData('detalles', nuevos);
    };

    const totalEntrada = useMemo(() =>
        data.detalles.reduce((acc: number, d: DetalleForm) => acc + (parseFloat(d.subtotal) || 0), 0)
    , [data.detalles]);

    // Breakpoint simple via window — para saber si mostrar tabla o cards
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Link href={route('almacen.entradas.index')}>
                        <button style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: 'none', border: '1px solid #E2E8F0',
                            borderRadius: 10, padding: '8px 14px',
                            cursor: 'pointer', fontSize: 13, color: '#64748B',
                        }}>
                            <ArrowLeft size={15} /> Volver
                        </button>
                    </Link>
                    <div>
                        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1E293B', margin: 0 }}>
                            {esEdicion ? 'Editar Entrada' : 'Nueva Entrada de Almacén'}
                        </h1>
                        <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 2 }}>
                            {esEdicion ? 'Modifica los datos de la entrada' : 'Registra el ingreso de productos al inventario'}
                        </p>
                    </div>
                </div>
                <Button variant="primary" size="md" icon={<Save size={15} />} loading={processing} onClick={onGuardar}>
                    {esEdicion ? 'Guardar Cambios' : 'Registrar Entrada'}
                </Button>
            </div>

            {/* Datos generales */}
            <div style={{
                backgroundColor: '#fff', borderRadius: 14,
                border: '1px solid #E2E8F0', padding: 20, marginBottom: 16,
            }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: '0 0 14px' }}>
                    Datos Generales
                </h2>
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
                        label="Local destino" name="local_id" value={data.local_id}
                        onChange={e => setData('local_id', e.target.value)}
                        options={localesFiltrados.map(l => ({ value: l.id, label: l.nombre }))}
                        placeholder="Selecciona local" error={errors.local_id} required
                    />
                    <InputField
                        label="Fecha" name="fecha" value={data.fecha} type="date"
                        onChange={e => setData('fecha', e.target.value)}
                        error={errors.fecha} required
                    />
                    <InputField
                        label="Motivo" name="motivo" value={data.motivo}
                        onChange={e => setData('motivo', e.target.value)}
                        error={errors.motivo} placeholder="Ej. Compra, Devolución"
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
            <div style={{
                backgroundColor: '#fff', borderRadius: 14,
                border: '1px solid #E2E8F0', padding: 20, marginBottom: 16,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                    <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: 0 }}>
                        Productos <span style={{ color: '#EF4444' }}>*</span>
                        <span style={{ fontSize: 11, fontWeight: 400, color: '#94A3B8', marginLeft: 8 }}>
                            Ingresa monto total → el precio unitario se calcula solo
                        </span>
                    </h2>
                    <button onClick={agregarDetalle} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        fontSize: 13, color: '#2563EB', background: 'none',
                        border: '1px solid #2563EB', borderRadius: 8,
                        padding: '6px 14px', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap',
                    }}>
                        <Plus size={14} /> Agregar producto
                    </button>
                </div>

                {/* ── TABLA (scroll horizontal en pantallas pequeñas) ── */}
                <div style={{ overflowX: 'auto' }}>
                    {/* Header */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '220px 90px 160px 90px 110px 85px 36px',
                        gap: 8, padding: '10px 12px',
                        backgroundColor: '#1E293B', borderRadius: '10px 10px 0 0',
                        minWidth: 800,
                    }}>
                        {['Producto', 'Unidad', 'Proveedor', 'Cantidad', 'Total (S/)', 'P. Unit.', ''].map(h => (
                            <span key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>{h}</span>
                        ))}
                    </div>

                    {/* Filas */}
                    <div style={{
                        border: '1px solid #E2E8F0', borderTop: 'none',
                        borderRadius: '0 0 10px 10px', minWidth: 800,
                    }}>
                        {data.detalles.map((d: DetalleForm, i: number) => {
                            const prod     = productos.find(p => p.id === Number(d.producto_id));
                            const unidades = prod?.producto_unidades ?? [];

                            return (
                                <div key={i} style={{
                                    display: 'grid',
                                    gridTemplateColumns: '220px 90px 160px 90px 110px 85px 36px',
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
                                    {/* Proveedor */}
                                    <SelectField
                                        label="" name={`pr_${i}`} value={d.proveedor_id}
                                        onChange={e => actualizarDetalle(i, 'proveedor_id', e.target.value)}
                                        options={proveedoresFiltrados.map((p: Proveedor) => ({ value: p.id, label: p.nombre }))}
                                        placeholder="Proveedor"
                                    />
                                    {/* Cantidad */}
                                    <input
                                        type="number" value={d.cantidad} min="0" step="0.01" placeholder="0"
                                        onWheel={e => e.currentTarget.blur()}
                                        onChange={e => actualizarDetalle(i, 'cantidad', e.target.value)}
                                        style={{
                                            width: '100%', padding: '10px 8px', borderRadius: 10,
                                            border: '1.5px solid #E2E8F0', fontSize: 13,
                                            outline: 'none', boxSizing: 'border-box', textAlign: 'right',
                                        }}
                                    />
                                    {/* Subtotal — campo principal azul */}
                                    <input
                                        type="number" value={d.subtotal} min="0" step="0.01" placeholder="0.00"
                                        onWheel={e => e.currentTarget.blur()}
                                        onChange={e => actualizarDetalle(i, 'subtotal', e.target.value)}
                                        style={{
                                            width: '100%', padding: '10px 8px', borderRadius: 10,
                                            border: '1.5px solid #2563EB', fontSize: 13, fontWeight: 700,
                                            outline: 'none', boxSizing: 'border-box', textAlign: 'right',
                                            backgroundColor: '#EFF6FF',
                                        }}
                                    />
                                    {/* Precio unitario calculado — solo lectura */}
                                    <div style={{
                                        padding: '10px 8px', borderRadius: 10,
                                        backgroundColor: '#F1F5F9',
                                        border: '1.5px solid #E2E8F0',
                                        fontSize: 11, color: '#64748B',
                                        textAlign: 'right', fontWeight: 600,
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {d.precio_unitario !== '0.0000' ? `S/${d.precio_unitario}` : '—'}
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

            {/* Resumen total */}
            <div style={{
                backgroundColor: '#F0FDF4', borderRadius: 14,
                border: '1px solid #BBF7D0', padding: '14px 20px',
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Calculator size={18} color="#16A34A" />
                    <div>
                        <p style={{ margin: 0, fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                            {data.detalles.filter((d: DetalleForm) => d.producto_id).length} producto(s)
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: '#94A3B8' }}>
                            {data.fecha || 'Sin fecha'} · {data.local_id ? locales.find(l => l.id === Number(data.local_id))?.nombre : 'Sin local'}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Detalle por ítem */}
                    <div style={{ textAlign: 'right', marginRight: 16 }}>
                        {data.detalles.map((d: DetalleForm, i: number) => {
                            const prod = productos.find(p => p.id === Number(d.producto_id));
                            const sub  = parseFloat(d.subtotal) || 0;
                            if (!prod || sub === 0) return null;
                            return (
                                <p key={i} style={{ margin: '0 0 2px', fontSize: 11, color: '#64748B' }}>
                                    {prod.nombre.length > 20 ? prod.nombre.substring(0, 20) + '...' : prod.nombre}
                                    <span style={{ fontWeight: 700, color: '#1E293B', marginLeft: 8 }}>S/ {sub.toFixed(2)}</span>
                                </p>
                            );
                        })}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: 11, color: '#64748B', fontWeight: 600 }}>TOTAL ENTRADA</p>
                        <p style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#16A34A', lineHeight: 1 }}>
                            S/ {totalEntrada.toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Botones */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <Link href={route('almacen.entradas.index')}>
                    <Button variant="cancel" size="md">Cancelar</Button>
                </Link>
                <Button variant="primary" size="md" icon={<Save size={15} />} loading={processing} onClick={onGuardar}>
                    {esEdicion ? 'Guardar Cambios' : 'Registrar Entrada'}
                </Button>
            </div>
        </div>
    );
}