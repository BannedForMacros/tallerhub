import { useMemo, useState } from 'react';
import { Plus, Trash2, Save, ArrowLeft, Tag, Package, AlertTriangle, CreditCard, UserPlus } from 'lucide-react';
import { Link } from '@inertiajs/react';
import Button from '@/Components/Button';
import InputField from '@/Components/InputField';
import SelectField from '@/Components/SelectField';
import SearchableSelectField from '@/Components/SearchableSelectField';
import Modal from '@/Components/Modal';
import ClienteForm from '@/Components/ClienteForm';
import { ProductoAlmacen, Local, Empresa, Cliente, Servicio, Inventario, MetodoPago } from '@/types';

interface DetalleForm {
    tipo:               'servicio' | 'producto';
    servicio_id:        string;
    producto_id:        string;
    unidad_medida_id:   string;
    descripcion:        string;
    cantidad:           string;
    precio_unitario:    string;
    precio_referencial: string;
}

interface RecepcionOpcion {
    id:     number;
    codigo: string;
    label:  string;
}

interface PagoForm {
    metodo_pago_id: string;
    cuenta_pago_id: string;
    monto:          string;
}

interface Props {
    data: {
        empresa_id:    string;
        local_id:      string;
        cliente_id:    string;
        recepcion_id:  string;
        observaciones: string;
        descuento:     string;
        fecha:         string;
        detalles:      DetalleForm[];
        pagos:         PagoForm[];
    };
    setData:      (key: any, value: any) => void;
    errors:       Record<string, string>;
    processing:   boolean;
    empresas:     Empresa[];
    locales:      Local[];
    clientes:     Cliente[];
    servicios:    Servicio[];
    productos:    ProductoAlmacen[];
    inventario:   Inventario[];
    recepciones:  RecepcionOpcion[];
    metodosPago:      MetodoPago[];
    esSuperAdmin:     boolean;
    puedeEditarFecha: boolean;
    esEdicion?:       boolean;
    onGuardar:        () => void;
}

export const detalleVacio = (tipo: 'servicio' | 'producto' = 'servicio'): DetalleForm => ({
    tipo,
    servicio_id:        '',
    producto_id:        '',
    unidad_medida_id:   '',
    descripcion:        '',
    cantidad:           '1',
    precio_unitario:    '',
    precio_referencial: '',
});

export const pagoVacio = (): PagoForm => ({
    metodo_pago_id: '',
    cuenta_pago_id: '',
    monto: '',
});

export default function VentaForm({
    data, setData, errors, processing,
    empresas, locales, clientes, servicios, productos, inventario, recepciones, metodosPago,
    esSuperAdmin, puedeEditarFecha, esEdicion = false, onGuardar,
}: Props) {

    // Modal nuevo cliente
    const [modalCliente, setModalCliente]         = useState(false);
    const [clientesExtra, setClientesExtra]       = useState<Cliente[]>([]);
    const [nuevoClienteData, setNuevoClienteData] = useState({ nombre: '', tipo_documento: 'DNI', dni: '', telefono: '', email: '', direccion: '', empresa_id: '' });
    const [clienteProcessing, setClienteProcessing] = useState(false);
    const [clienteErrors, setClienteErrors]       = useState<Partial<Record<string, string>>>({});

    const crearCliente = async () => {
        setClienteProcessing(true);
        setClienteErrors({});
        try {
            const csrfMeta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
            const res = await fetch(route('clientes.store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrfMeta ? { 'X-CSRF-TOKEN': csrfMeta.content } : {}),
                },
                body: JSON.stringify(nuevoClienteData),
            });
            const json = await res.json();
            if (!res.ok) {
                setClienteErrors(json.errors ?? { nombre: 'Error al crear cliente' });
                return;
            }
            const creado: Cliente = json;
            setClientesExtra(prev => [...prev, creado]);
            setData('cliente_id', String(creado.id));
            setModalCliente(false);
            setNuevoClienteData({ nombre: '', tipo_documento: 'DNI', dni: '', telefono: '', email: '', direccion: '', empresa_id: '' });
        } catch {
            setClienteErrors({ nombre: 'Error de conexión' });
        } finally {
            setClienteProcessing(false);
        }
    };

    const localesFiltrados = useMemo(() =>
        esSuperAdmin && data.empresa_id
            ? locales.filter(l => l.empresa_id === Number(data.empresa_id))
            : locales
    , [data.empresa_id, locales]);

    const todosClientes = useMemo(() => [...clientes, ...clientesExtra], [clientes, clientesExtra]);
    const clientesFiltrados = useMemo(() =>
        esSuperAdmin && data.empresa_id
            ? todosClientes.filter(c => c.empresa_id === Number(data.empresa_id))
            : todosClientes
    , [data.empresa_id, todosClientes]);

    const serviciosFiltrados = useMemo(() =>
        esSuperAdmin && data.empresa_id
            ? servicios.filter(s => s.empresa_id === Number(data.empresa_id))
            : servicios
    , [data.empresa_id, servicios]);

    const productosFiltrados = useMemo(() =>
        esSuperAdmin && data.empresa_id
            ? productos.filter(p => p.empresa_id === Number(data.empresa_id))
            : productos
    , [data.empresa_id, productos]);

    const getInventario = (productoId: string, unidadId: string): Inventario | null => {
        if (!data.local_id || !productoId || !unidadId) return null;
        const lista = Array.isArray(inventario) ? inventario : (Object.values(inventario) as Inventario[]);
        return lista.find(i =>
            Number(i.local_id)          === Number(data.local_id) &&
            Number(i.producto_id)       === Number(productoId) &&
            Number(i.unidad_medida_id)  === Number(unidadId)
        ) ?? null;
    };

    const agregarDetalle = (tipo: 'servicio' | 'producto') => {
        setData('detalles', [...data.detalles, detalleVacio(tipo)]);
    };

    const quitarDetalle = (i: number) => {
        if (data.detalles.length === 1) return;
        setData('detalles', data.detalles.filter((_: any, idx: number) => idx !== i));
    };

    const actualizarDetalle = (i: number, campo: keyof DetalleForm, valor: string) => {
        const nuevos = [...data.detalles];
        nuevos[i] = { ...nuevos[i], [campo]: valor };

        // Al seleccionar servicio: precargar descripción y precio referencial
        if (campo === 'servicio_id' && valor) {
            const srv = servicios.find(s => s.id === Number(valor));
            if (srv) {
                nuevos[i].descripcion        = srv.nombre;
                nuevos[i].precio_unitario    = String(srv.precio);
                nuevos[i].precio_referencial = String(srv.precio);
            }
        }
        // Al limpiar servicio: limpiar precio referencial
        if (campo === 'servicio_id' && !valor) {
            nuevos[i].precio_referencial = '';
        }

        // Al seleccionar producto: precargar unidad principal, descripción y precio de venta
        if (campo === 'producto_id' && valor) {
            const prod = productos.find(p => p.id === Number(valor));
            if (prod) {
                const unidadPrincipal = prod.producto_unidades?.find(u => u.es_principal);
                if (unidadPrincipal) nuevos[i].unidad_medida_id = String(unidadPrincipal.unidad_medida_id);
                nuevos[i].descripcion = prod.nombre;
                if (prod.precio_venta) nuevos[i].precio_unitario = String(prod.precio_venta);
            }
        }

        setData('detalles', nuevos);
    };

    const subtotalDetalle = (d: DetalleForm) =>
        (parseFloat(d.cantidad) || 0) * (parseFloat(d.precio_unitario) || 0);

    const subtotal  = useMemo(() => data.detalles.reduce((acc: number, d: DetalleForm) => acc + subtotalDetalle(d), 0), [data.detalles]);
    const descuento = parseFloat(data.descuento) || 0;
    const total     = subtotal - descuento;

    // Pagos
    const agregarPago = () => {
        setData('pagos', [...data.pagos, pagoVacio()]);
    };

    const quitarPago = (i: number) => {
        setData('pagos', data.pagos.filter((_: any, idx: number) => idx !== i));
    };

    const actualizarPago = (i: number, campo: keyof PagoForm, valor: string) => {
        const nuevos = [...data.pagos];
        nuevos[i] = { ...nuevos[i], [campo]: valor };
        // Al cambiar método, limpiar cuenta
        if (campo === 'metodo_pago_id') nuevos[i].cuenta_pago_id = '';
        setData('pagos', nuevos);
    };

    const totalPagado = useMemo(
        () => data.pagos.reduce((acc: number, p: PagoForm) => acc + (parseFloat(p.monto) || 0), 0),
        [data.pagos]
    );
    const restante = total - totalPagado;

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Link href={route('ventas.index')}>
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
                            {esEdicion ? 'Editar Venta' : 'Nueva Venta'}
                        </h1>
                        <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 2 }}>
                            {esEdicion ? 'Modifica los datos de la venta' : 'Registra servicios y productos vendidos'}
                        </p>
                    </div>
                </div>
                <Button variant="primary" size="md" icon={<Save size={15} />} loading={processing} onClick={onGuardar}>
                    {esEdicion ? 'Guardar Cambios' : 'Registrar Venta'}
                </Button>
            </div>

            {/* Datos generales */}
            <div style={{ backgroundColor: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: 20, marginBottom: 16 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: '0 0 14px' }}>Datos Generales</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                    {esSuperAdmin && !esEdicion && (
                        <div style={{ gridColumn: '1 / -1' }}>
                            <SelectField
                                label="Empresa" name="empresa_id" value={data.empresa_id}
                                onChange={e => {
                                    setData('empresa_id', e.target.value);
                                    setData('local_id', '');
                                    setData('cliente_id', '');
                                    setData('recepcion_id', '');
                                    setData('detalles', [detalleVacio('servicio')]);
                                }}
                                options={empresas.map(e => ({ value: e.id, label: e.nombre }))}
                                placeholder="Selecciona empresa" error={errors.empresa_id} required
                            />
                        </div>
                    )}
                    <SelectField
                        label="Local" name="local_id" value={data.local_id}
                        onChange={e => { setData('local_id', e.target.value); setData('detalles', [detalleVacio('servicio')]); }}
                        options={localesFiltrados.map(l => ({ value: l.id, label: l.nombre }))}
                        placeholder="Selecciona local" error={errors.local_id} required
                    />
                    {puedeEditarFecha ? (
                        <InputField
                            label="Fecha" name="fecha" value={data.fecha} type="date"
                            onChange={e => setData('fecha', e.target.value)}
                            error={errors.fecha} required
                        />
                    ) : (
                        <div style={{ marginBottom: 18 }}>
                            <label style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', display: 'block', marginBottom: 7 }}>
                                Fecha <span style={{ color: '#EF4444' }}>*</span>
                            </label>
                            <div style={{
                                padding: '11px 14px', borderRadius: 10, height: 46, boxSizing: 'border-box',
                                border: '1.5px solid #E2E8F0', backgroundColor: '#F8FAFC',
                                fontSize: 15, color: '#64748B', display: 'flex', alignItems: 'center',
                            }}>
                                {data.fecha}
                            </div>
                        </div>
                    )}
                    <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                            <label style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>Cliente</label>
                            <button
                                type="button"
                                onClick={() => setModalCliente(true)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 5,
                                    padding: '4px 10px', borderRadius: 8,
                                    border: '1.5px solid #2563EB', backgroundColor: '#EFF6FF',
                                    color: '#2563EB', cursor: 'pointer', fontSize: 12,
                                    fontWeight: 700, lineHeight: 1,
                                }}
                            >
                                <UserPlus size={13} /> Nuevo cliente
                            </button>
                        </div>
                        <SearchableSelectField
                            label=""
                            name="cliente_id" value={data.cliente_id}
                            onChange={e => setData('cliente_id', e.target.value)}
                            options={clientesFiltrados.map(c => ({ value: c.id, label: c.nombre }))}
                            placeholder="Cliente (opcional)"
                            searchPlaceholder="Buscar cliente..."
                        />
                    </div>
                    {/* Recepción vinculada */}
                    <div style={{ gridColumn: '1 / -1' }}>
                        <SearchableSelectField
                            label="Vincular a recepción de equipo (opcional)"
                            name="recepcion_id" value={data.recepcion_id}
                            onChange={e => setData('recepcion_id', e.target.value)}
                            options={recepciones.map(r => ({ value: r.id, label: r.label }))}
                            placeholder="Sin recepción vinculada"
                            searchPlaceholder="Buscar por código o cliente..."
                        />
                        {data.recepcion_id && (
                            <p style={{ fontSize: 11, color: '#16A34A', marginTop: 4, fontWeight: 600 }}>
                                ✓ Al registrar la venta, la recepción se marcará como entregada automáticamente
                            </p>
                        )}
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <InputField
                            label="Observaciones" name="observaciones" value={data.observaciones}
                            onChange={e => setData('observaciones', e.target.value)}
                            placeholder="Opcional"
                        />
                    </div>
                </div>
            </div>

            {/* Tabla ítems */}
            <div style={{ backgroundColor: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: 20, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                    <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: 0 }}>
                        Servicios y Productos <span style={{ color: '#EF4444' }}>*</span>
                    </h2>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => agregarDetalle('servicio')} style={{
                            display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
                            color: '#2563EB', background: 'none', border: '1px solid #2563EB',
                            borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 600,
                        }}>
                            <Tag size={13} /> Agregar servicio
                        </button>
                        <button onClick={() => agregarDetalle('producto')} style={{
                            display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
                            color: '#D97706', background: 'none', border: '1px solid #D97706',
                            borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 600,
                        }}>
                            <Package size={13} /> Agregar producto
                        </button>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    {/* Header */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '90px 180px 1fr 70px 70px 110px 100px 36px',
                        gap: 8, padding: '10px 12px',
                        backgroundColor: '#1E293B', borderRadius: '10px 10px 0 0', minWidth: 1000,
                    }}>
                        {['Tipo', 'Ítem', 'Descripción', 'Stock', 'Cant.', 'P. Costo Ref.', 'P. Venta (S/)', ''].map(h => (
                            <span key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>{h}</span>
                        ))}
                    </div>

                    <div style={{ border: '1px solid #E2E8F0', borderTop: 'none', borderRadius: '0 0 10px 10px', minWidth: 1000 }}>
                        {data.detalles.map((d: DetalleForm, i: number) => {
                            const esServicio  = d.tipo === 'servicio';
                            const prod        = productos.find(p => p.id === Number(d.producto_id));
                            const unidades    = prod?.producto_unidades ?? [];
                            const invItem     = getInventario(d.producto_id, d.unidad_medida_id);
                            const stock       = invItem ? Number(invItem.stock) : null;
                            const costoRef    = invItem?.precio_promedio ?? 0;
                            const cantidad    = parseFloat(d.cantidad) || 0;
                            const stockInsuf  = !esServicio && stock !== null && d.cantidad !== '' && cantidad > stock;
                            const precioRef   = esServicio && d.precio_referencial ? parseFloat(d.precio_referencial) : null;
                            const precioActual = parseFloat(d.precio_unitario);
                            const precioBajo  = precioRef !== null && !isNaN(precioActual) && precioActual < precioRef;
                            const precioAlto  = precioRef !== null && !isNaN(precioActual) && precioActual > precioRef;

                            return (
                                <div key={i} style={{
                                    display: 'grid',
                                    gridTemplateColumns: '90px 180px 1fr 70px 70px 110px 100px 36px',
                                    gap: 8, padding: '10px 12px', alignItems: 'start',
                                    backgroundColor: i % 2 === 0 ? '#F8FAFC' : '#fff',
                                    borderBottom: i < data.detalles.length - 1 ? '1px solid #F1F5F9' : 'none',
                                }}>
                                    {/* Tipo badge */}
                                    <div style={{ paddingTop: 12 }}>
                                        <span style={{
                                            padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                                            backgroundColor: esServicio ? '#EFF6FF' : '#FFF7ED',
                                            color: esServicio ? '#2563EB' : '#D97706',
                                        }}>
                                            {esServicio ? 'Servicio' : 'Producto'}
                                        </span>
                                    </div>

                                    {/* Ítem selector */}
                                    {esServicio ? (
                                        <SelectField
                                            label="" name={`srv_${i}`} value={d.servicio_id}
                                            onChange={e => actualizarDetalle(i, 'servicio_id', e.target.value)}
                                            options={serviciosFiltrados.map((s: Servicio) => ({ value: s.id, label: s.nombre }))}
                                            placeholder="Seleccionar"
                                        />
                                    ) : (
                                        <div>
                                            <SelectField
                                                label="" name={`prod_${i}`} value={d.producto_id}
                                                onChange={e => actualizarDetalle(i, 'producto_id', e.target.value)}
                                                options={productosFiltrados.map((p: ProductoAlmacen) => ({ value: p.id, label: p.nombre }))}
                                                placeholder="Seleccionar"
                                            />
                                            {d.producto_id && (
                                                <SelectField
                                                    label="" name={`uni_${i}`} value={d.unidad_medida_id}
                                                    onChange={e => actualizarDetalle(i, 'unidad_medida_id', e.target.value)}
                                                    options={unidades.map((u: any) => ({
                                                        value: u.unidad_medida_id,
                                                        label: u.unidad_medida?.abreviatura ?? 'Und',
                                                    }))}
                                                    placeholder="Unidad"
                                                />
                                            )}
                                        </div>
                                    )}

                                    {/* Descripción */}
                                    <input
                                        type="text" value={d.descripcion}
                                        onChange={e => actualizarDetalle(i, 'descripcion', e.target.value)}
                                        placeholder="Descripción del ítem"
                                        style={{
                                            width: '100%', padding: '10px 10px', borderRadius: 10,
                                            border: '1.5px solid #E2E8F0', fontSize: 13,
                                            outline: 'none', boxSizing: 'border-box',
                                        }}
                                    />

                                    {/* Stock */}
                                    <div style={{ paddingTop: 10, textAlign: 'center' }}>
                                        {esServicio ? (
                                            <span style={{ fontSize: 11, color: '#CBD5E1' }}>—</span>
                                        ) : (
                                            <span style={{
                                                fontSize: 12, fontWeight: 700,
                                                color: stock === null ? '#94A3B8' : stock === 0 ? '#DC2626' : stock <= 5 ? '#D97706' : '#16A34A',
                                            }}>
                                                {stock === null ? '—' : stock}
                                            </span>
                                        )}
                                    </div>

                                    {/* Cantidad */}
                                    <div>
                                        <input
                                            type="number" value={d.cantidad} min="0.01" step="0.01"
                                            placeholder="1"
                                            onWheel={e => e.currentTarget.blur()}
                                            onChange={e => actualizarDetalle(i, 'cantidad', e.target.value)}
                                            style={{
                                                width: '100%', padding: '10px 6px', borderRadius: 10,
                                                border: `1.5px solid ${stockInsuf ? '#EF4444' : '#E2E8F0'}`,
                                                fontSize: 13, outline: 'none',
                                                boxSizing: 'border-box', textAlign: 'right',
                                                backgroundColor: stockInsuf ? '#FEF2F2' : '#fff',
                                            }}
                                        />
                                        {stockInsuf && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                                                <AlertTriangle size={10} color="#EF4444" />
                                                <span style={{ fontSize: 10, color: '#EF4444', fontWeight: 600 }}>Stock insuf.</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Precio costo referencia — solo lectura */}
                                    <div style={{
                                        padding: '10px 8px', borderRadius: 10,
                                        backgroundColor: '#F8FAFC', border: '1.5px solid #E2E8F0',
                                        fontSize: 11, color: '#94A3B8', textAlign: 'right', fontWeight: 500,
                                    }}>
                                        {esServicio
                                            ? (d.precio_referencial ? `S/ ${Number(d.precio_referencial).toFixed(2)}` : '—')
                                            : (costoRef > 0 ? `S/ ${Number(costoRef).toFixed(2)}` : '—')
                                        }
                                    </div>

                                    {/* Precio venta — editable, resaltado */}
                                    <div>
                                        <input
                                            type="number" value={d.precio_unitario} min="0" step="0.01"
                                            placeholder="0.00"
                                            onWheel={e => e.currentTarget.blur()}
                                            onChange={e => actualizarDetalle(i, 'precio_unitario', e.target.value)}
                                            style={{
                                                width: '100%', padding: '10px 8px', borderRadius: 10,
                                                border: `1.5px solid ${precioBajo ? '#D97706' : precioAlto ? '#2563EB' : '#2563EB'}`,
                                                fontSize: 13, fontWeight: 700,
                                                outline: 'none', boxSizing: 'border-box',
                                                textAlign: 'right',
                                                backgroundColor: precioBajo ? '#FFFBEB' : '#EFF6FF',
                                            }}
                                        />
                                        {/* Aviso precio menor al referencial */}
                                        {precioBajo && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                                                <AlertTriangle size={10} color="#D97706" />
                                                <span style={{ fontSize: 10, color: '#D97706', fontWeight: 600 }}>
                                                    Menor al ref. S/ {Number(precioRef).toFixed(2)}
                                                </span>
                                            </div>
                                        )}
                                        {/* Aviso precio mayor al referencial */}
                                        {precioAlto && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                                                <AlertTriangle size={10} color="#2563EB" />
                                                <span style={{ fontSize: 10, color: '#2563EB', fontWeight: 600 }}>
                                                    Mayor al ref. S/ {Number(precioRef).toFixed(2)}
                                                </span>
                                            </div>
                                        )}
                                        {/* Subtotal por fila */}
                                        <p style={{ margin: '3px 0 0', fontSize: 11, color: '#64748B', textAlign: 'right' }}>
                                            = S/ {subtotalDetalle(d).toFixed(2)}
                                        </p>
                                    </div>

                                    {/* Quitar */}
                                    <div style={{ textAlign: 'center', paddingTop: 10 }}>
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

            {/* Resumen totales */}
            <div style={{
                backgroundColor: '#fff', borderRadius: 14,
                border: '1px solid #E2E8F0', padding: 20, marginBottom: 20,
                display: 'flex', justifyContent: 'flex-end',
            }}>
                <div style={{ minWidth: 280 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontSize: 13, color: '#64748B' }}>Subtotal</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>S/ {subtotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <span style={{ fontSize: 13, color: '#64748B' }}>Descuento (S/)</span>
                        <input
                            type="number" value={data.descuento} min="0" step="0.01"
                            placeholder="0.00"
                            onWheel={e => e.currentTarget.blur()}
                            onChange={e => setData('descuento', e.target.value)}
                            style={{
                                width: 120, padding: '8px 10px', borderRadius: 10,
                                border: '1.5px solid #E2E8F0', fontSize: 13,
                                outline: 'none', textAlign: 'right',
                            }}
                        />
                    </div>
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '12px 16px', backgroundColor: '#F0FDF4',
                        borderRadius: 10, border: '1px solid #BBF7D0',
                    }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: '#1E293B' }}>TOTAL</span>
                        <span style={{ fontSize: 24, fontWeight: 900, color: '#16A34A' }}>
                            S/ {total.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Métodos de Pago */}
            <div style={{ backgroundColor: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: 20, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CreditCard size={16} color="#2563EB" />
                        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: 0 }}>Métodos de Pago</h2>
                        <span style={{ fontSize: 12, color: '#94A3B8' }}>(opcional)</span>
                    </div>
                    <button
                        onClick={agregarPago}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
                            color: '#2563EB', background: 'none', border: '1px solid #2563EB',
                            borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 600,
                        }}
                    >
                        <Plus size={13} /> Agregar pago
                    </button>
                </div>

                {data.pagos.length === 0 ? (
                    <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '12px 0' }}>
                        Sin método de pago registrado
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {data.pagos.map((pago: PagoForm, i: number) => {
                            const metodo = metodosPago.find(m => m.id === Number(pago.metodo_pago_id));
                            const cuentas = metodo?.cuentas_activas ?? [];
                            return (
                                <div key={i} style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr 140px 36px',
                                    gap: 10, alignItems: 'start',
                                    backgroundColor: '#F8FAFC',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: 10, padding: '10px 14px',
                                }}>
                                    {/* Método */}
                                    <SelectField
                                        label="Método"
                                        name={`metodo_${i}`}
                                        value={pago.metodo_pago_id}
                                        onChange={e => actualizarPago(i, 'metodo_pago_id', e.target.value)}
                                        options={metodosPago.map(m => ({ value: m.id, label: m.nombre }))}
                                        placeholder="Selecciona método"
                                        error={errors[`pagos.${i}.metodo_pago_id`]}
                                    />

                                    {/* Cuenta */}
                                    <SelectField
                                        label="Cuenta"
                                        name={`cuenta_${i}`}
                                        value={pago.cuenta_pago_id}
                                        onChange={e => actualizarPago(i, 'cuenta_pago_id', e.target.value)}
                                        options={cuentas.map((c: any) => ({
                                            value: c.id,
                                            label: c.nombre + (c.numero_cuenta ? ` — ${c.numero_cuenta}` : ''),
                                        }))}
                                        placeholder={pago.metodo_pago_id ? (cuentas.length ? 'Selecciona cuenta' : 'Sin cuentas') : '— primero elige método —'}
                                        error={errors[`pagos.${i}.cuenta_pago_id`]}
                                    />

                                    {/* Monto */}
                                    <div>
                                        <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                                            Monto (S/)
                                        </label>
                                        <input
                                            type="number"
                                            value={pago.monto}
                                            min="0.01"
                                            step="0.01"
                                            placeholder="0.00"
                                            onWheel={e => e.currentTarget.blur()}
                                            onChange={e => actualizarPago(i, 'monto', e.target.value)}
                                            style={{
                                                width: '100%', padding: '10px 10px', borderRadius: 10,
                                                border: `1.5px solid ${errors[`pagos.${i}.monto`] ? '#EF4444' : '#E2E8F0'}`,
                                                fontSize: 13, fontWeight: 700,
                                                outline: 'none', boxSizing: 'border-box', textAlign: 'right',
                                            }}
                                        />
                                        {errors[`pagos.${i}.monto`] && (
                                            <p style={{ fontSize: 11, color: '#EF4444', marginTop: 2 }}>{errors[`pagos.${i}.monto`]}</p>
                                        )}
                                    </div>

                                    {/* Quitar */}
                                    <div style={{ paddingTop: 22, textAlign: 'center' }}>
                                        <button
                                            onClick={() => quitarPago(i)}
                                            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4 }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Resumen de pagos */}
                {data.pagos.length > 0 && (
                    <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ minWidth: 240 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ fontSize: 13, color: '#64748B' }}>Total venta</span>
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>S/ {total.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ fontSize: 13, color: '#64748B' }}>Total pagado</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#16A34A' }}>S/ {totalPagado.toFixed(2)}</span>
                            </div>
                            <div style={{
                                display: 'flex', justifyContent: 'space-between',
                                padding: '8px 12px', borderRadius: 8,
                                backgroundColor: restante > 0.005 ? '#FEF2F2' : restante < -0.005 ? '#FFF7ED' : '#F0FDF4',
                                border: `1px solid ${restante > 0.005 ? '#FECACA' : restante < -0.005 ? '#FED7AA' : '#BBF7D0'}`,
                            }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>
                                    {restante > 0.005 ? 'Pendiente' : restante < -0.005 ? 'Vuelto' : 'Saldado ✓'}
                                </span>
                                <span style={{
                                    fontSize: 13, fontWeight: 800,
                                    color: restante > 0.005 ? '#DC2626' : restante < -0.005 ? '#D97706' : '#16A34A',
                                }}>
                                    S/ {Math.abs(restante).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Botones */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <Link href={route('ventas.index')}>
                    <Button variant="cancel" size="md">Cancelar</Button>
                </Link>
                <Button variant="primary" size="md" icon={<Save size={15} />} loading={processing} onClick={onGuardar}>
                    {esEdicion ? 'Guardar Cambios' : 'Registrar Venta'}
                </Button>
            </div>

            {/* Modal nuevo cliente */}
            <Modal show={modalCliente} onClose={() => setModalCliente(false)} title="Nuevo Cliente" maxWidth="md">
                <ClienteForm
                    form={{
                        data: nuevoClienteData as any,
                        setData: (key: any, value: string) =>
                            setNuevoClienteData(prev => ({ ...prev, [key]: value })),
                        processing: clienteProcessing,
                        errors: clienteErrors,
                    }}
                    onGuardar={crearCliente}
                    onCancelar={() => setModalCliente(false)}
                    empresas={[]}
                    esSuperAdmin={false}
                />
            </Modal>
        </div>
    );
}