import { useState } from 'react';
import { useForm, usePage, router } from '@inertiajs/react';
import { toast, Toaster } from 'react-hot-toast';
import { Plus, Pencil, Trash2, RotateCcw, Package, X } from 'lucide-react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Table from '@/Components/Table';
import Modal from '@/Components/Modal';
import Badge from '@/Components/Badge';
import Button from '@/Components/Button';
import InputField from '@/Components/InputField';
import SelectField from '@/Components/SelectField';
import ActionButton from '@/Components/ActionButton';
import { PageProps, ProductoAlmacen, CategoriaAlmacen, UnidadMedida, Empresa } from '@/types';

interface Props extends PageProps {
    productos: ProductoAlmacen[];
    categorias: CategoriaAlmacen[];
    unidades: UnidadMedida[];
    empresas: Empresa[];
}

interface UnidadForm {
    unidad_medida_id: string;
    es_principal: boolean;
    factor_conversion: string;
}

export default function ProductosIndex({ productos, categorias, unidades, empresas }: Props) {
    const { auth } = usePage<Props>().props;
    const esSuperAdmin = auth.user.esSuperAdmin;

    const [modal, setModal]       = useState(false);
    const [editando, setEditando] = useState<ProductoAlmacen | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        empresa_id:   '',
        categoria_id: '',
        codigo:       '',
        nombre:       '',
        descripcion:  '',
        precio_venta: '',
        unidades:     [{ unidad_medida_id: '', es_principal: true, factor_conversion: '1' }] as UnidadForm[],
    });

    const categoriasFiltradas = esSuperAdmin && data.empresa_id
        ? categorias.filter(c => c.empresa_id === Number(data.empresa_id))
        : categorias;

    const abrirCrear = () => {
        setEditando(null);
        reset();
        setData('unidades', [{ unidad_medida_id: '', es_principal: true, factor_conversion: '1' }]);
        setModal(true);
    };

    const abrirEditar = (p: ProductoAlmacen) => {
        setEditando(p);
        setData({
            empresa_id:   String(p.empresa_id),
            categoria_id: p.categoria_id ? String(p.categoria_id) : '',
            codigo:       p.codigo       ?? '',
            nombre:       p.nombre,
            descripcion:  p.descripcion  ?? '',
            precio_venta: p.precio_venta ? String(p.precio_venta) : '',
            unidades: p.producto_unidades?.length
                ? p.producto_unidades.map(u => ({
                    unidad_medida_id:  String(u.unidad_medida_id),
                    es_principal:      u.es_principal,
                    factor_conversion: String(u.factor_conversion),
                }))
                : [{ unidad_medida_id: '', es_principal: true, factor_conversion: '1' }],
        });
        setModal(true);
    };

    const agregarUnidad = () => {
        setData('unidades', [...data.unidades, { unidad_medida_id: '', es_principal: false, factor_conversion: '1' }]);
    };

    const quitarUnidad = (i: number) => {
        setData('unidades', data.unidades.filter((_, idx) => idx !== i));
    };

    const actualizarUnidad = (i: number, campo: keyof UnidadForm, valor: string | boolean) => {
        const nuevas = [...data.unidades];
        if (campo === 'es_principal' && valor === true) {
            nuevas.forEach((_, idx) => { nuevas[idx] = { ...nuevas[idx], es_principal: false }; });
        }
        nuevas[i] = { ...nuevas[i], [campo]: valor };
        setData('unidades', nuevas);
    };

    const guardar = () => {
        if (editando) {
            put(route('almacen.productos.update', editando.id), {
                onSuccess: () => { setModal(false); toast.success('Producto actualizado.'); },
            });
        } else {
            post(route('almacen.productos.store'), {
                onSuccess: () => { setModal(false); reset(); toast.success('Producto creado.'); },
            });
        }
    };

    const confirmarEliminar = (p: ProductoAlmacen) => {
        toast((t) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', margin: 0 }}>¿Eliminar producto?</p>
                <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Se desactivará <strong>{p.nombre}</strong>.</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => toast.dismiss(t.id)} style={{
                        padding: '6px 14px', borderRadius: 8, border: '1px solid #E2E8F0',
                        backgroundColor: '#fff', cursor: 'pointer', fontSize: 13, color: '#64748B',
                    }}>Cancelar</button>
                    <button onClick={() => {
                        toast.dismiss(t.id);
                        router.patch(route('almacen.productos.toggle', p.id), {}, {
                            onSuccess: () => toast.success('Producto eliminado.'),
                        });
                    }} style={{
                        padding: '6px 14px', borderRadius: 8, border: 'none',
                        backgroundColor: '#DC2626', cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 600,
                    }}>Sí, eliminar</button>
                </div>
            </div>
        ), { duration: 10000 });
    };

    const columns = [
        {
            key: 'nombre', label: 'Producto', width: '30%',
            render: (r: ProductoAlmacen) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                        width: 34, height: 34, borderRadius: 8,
                        backgroundColor: '#EFF6FF', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                        <Package size={16} color="#2563EB" />
                    </div>
                    <div>
                        <p style={{ margin: 0, fontWeight: 600, color: '#1E293B', fontSize: 13 }}>{r.nombre}</p>
                        {r.codigo && <p style={{ margin: 0, fontSize: 11, color: '#94A3B8' }}>Cód: {r.codigo}</p>}
                    </div>
                </div>
            ),
        },
        {
            key: 'categoria', label: 'Categoría', width: '16%',
            render: (r: ProductoAlmacen) => (
                <span style={{ fontSize: 13, color: '#64748B' }}>{r.categoria?.nombre ?? '—'}</span>
            ),
        },
        {
            key: 'unidades', label: 'Unidades', width: '18%',
            render: (r: ProductoAlmacen) => (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {r.unidades?.map(u => (
                        <span key={u.id} style={{
                            backgroundColor: '#F1F5F9', color: '#475569',
                            padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                        }}>
                            {u.abreviatura}
                        </span>
                    ))}
                </div>
            ),
        },
        {
            key: 'precio_venta', label: 'P. Venta', width: '13%',
            render: (r: ProductoAlmacen) => (
                r.precio_venta
                    ? <span style={{ fontSize: 13, fontWeight: 700, color: '#16A34A' }}>
                        S/ {Number(r.precio_venta).toFixed(2)}
                      </span>
                    : <span style={{ fontSize: 11, color: '#D97706', fontWeight: 600 }}>
                        Según entrada
                      </span>
            ),
        },
        {
            key: 'activo', label: 'Estado', width: '10%',
            render: (r: ProductoAlmacen) => (
                <Badge label={r.activo ? 'Activo' : 'Inactivo'} variant={r.activo ? 'success' : 'danger'} />
            ),
        },
        {
            key: 'acciones', label: 'Acciones', width: '13%',
            render: (r: ProductoAlmacen) => (
                <div style={{ display: 'flex', gap: 6 }}>
                    <ActionButton onClick={() => abrirEditar(r)} icon={<Pencil size={13} />} tooltip="Editar" color="blue" />
                    {r.activo
                        ? <ActionButton onClick={() => confirmarEliminar(r)} icon={<Trash2 size={13} />} tooltip="Eliminar" color="red" />
                        : <ActionButton
                            onClick={() => router.patch(route('almacen.productos.toggle', r.id), {}, {
                                onSuccess: () => toast.success('Producto restaurado.'),
                            })}
                            icon={<RotateCcw size={13} />} tooltip="Restaurar" color="green"
                          />
                    }
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Productos de Almacén" />
            <Toaster position="top-right" />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', margin: 0 }}>Productos</h1>
                    <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 4 }}>
                        Catálogo de productos del almacén
                    </p>
                </div>
                <Button variant="primary" size="md" icon={<Plus size={16} />} onClick={abrirCrear}>
                    Nuevo Producto
                </Button>
            </div>

            <Table columns={columns} data={productos} emptyText="No hay productos registrados" />

            <Modal
                show={modal}
                onClose={() => setModal(false)}
                title={editando ? 'Editar Producto' : 'Nuevo Producto'}
                maxWidth="2xl"
            >
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>

                        {esSuperAdmin && (
                            <div style={{ gridColumn: '1 / -1' }}>
                                <SelectField
                                    label="Empresa" name="empresa_id" value={data.empresa_id}
                                    onChange={e => {
                                        setData('empresa_id', e.target.value);
                                        setData('categoria_id', '');
                                    }}
                                    options={empresas.map(e => ({ value: e.id, label: e.nombre }))}
                                    placeholder="Selecciona empresa" error={errors.empresa_id} required
                                />
                            </div>
                        )}

                        <SelectField
                            label="Categoría" name="categoria_id" value={data.categoria_id}
                            onChange={e => setData('categoria_id', e.target.value)}
                            options={categoriasFiltradas.map(c => ({ value: c.id, label: c.nombre }))}
                            placeholder="Sin categoría" error={errors.categoria_id}
                        />
                        <InputField
                            label="Código" name="codigo" value={data.codigo}
                            onChange={e => setData('codigo', e.target.value)}
                            error={errors.codigo} placeholder="Código interno (opcional)"
                        />
                        <div style={{ gridColumn: '1 / -1' }}>
                            <InputField
                                label="Nombre" name="nombre" value={data.nombre}
                                onChange={e => setData('nombre', e.target.value)}
                                error={errors.nombre} required placeholder="Nombre del producto"
                            />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <InputField
                                label="Descripción" name="descripcion" value={data.descripcion}
                                onChange={e => setData('descripcion', e.target.value)}
                                error={errors.descripcion} placeholder="Descripción opcional"
                            />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <InputField
                                label="Precio de venta (S/)" name="precio_venta"
                                value={data.precio_venta} type="number"
                                onChange={e => setData('precio_venta', e.target.value)}
                                error={errors.precio_venta}
                                placeholder="Dejar vacío = se usará precio de costo al facturar"
                            />
                            <p style={{ fontSize: 11, color: '#94A3B8', marginTop: -12, marginBottom: 16 }}>
                                El precio de costo se registra en cada entrada de almacén
                            </p>
                        </div>
                    </div>

                    {/* Unidades de medida */}
                    <div style={{ marginBottom: 18 }}>
                        <div style={{
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'space-between', marginBottom: 8,
                        }}>
                            <label style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>
                                Unidades de medida <span style={{ color: '#EF4444' }}>*</span>
                            </label>
                            <button onClick={agregarUnidad} style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                fontSize: 12, color: '#2563EB', background: 'none',
                                border: '1px solid #2563EB', borderRadius: 8,
                                padding: '4px 10px', cursor: 'pointer', fontWeight: 600,
                            }}>
                                <Plus size={12} /> Agregar unidad
                            </button>
                        </div>

                        {data.unidades.map((u, i) => (
                            <div key={i} style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 90px 80px auto',
                                gap: 8, alignItems: 'end', marginBottom: 8,
                                padding: '10px 12px',
                                backgroundColor: '#F8FAFC',
                                borderRadius: 10,
                                border: '1px solid #E2E8F0',
                            }}>
                                <SelectField
                                    label="Unidad" name={`unidad_${i}`}
                                    value={u.unidad_medida_id}
                                    onChange={e => actualizarUnidad(i, 'unidad_medida_id', e.target.value)}
                                    options={unidades.map(ud => ({ value: ud.id, label: `${ud.nombre} (${ud.abreviatura})` }))}
                                    placeholder="Selecciona" error={undefined}
                                />
                                <div style={{ marginBottom: 18 }}>
                                    <label style={{
                                        fontSize: 12, fontWeight: 600, color: '#1E293B',
                                        display: 'block', marginBottom: 6,
                                    }}>
                                        Factor conv.
                                    </label>
                                    <input
                                        type="number" value={u.factor_conversion}
                                        min="0.0001" step="0.0001"
                                        onChange={e => actualizarUnidad(i, 'factor_conversion', e.target.value)}
                                        style={{
                                            width: '100%', padding: '9px 10px', borderRadius: 10,
                                            border: '1.5px solid #E2E8F0', fontSize: 13,
                                            outline: 'none', boxSizing: 'border-box',
                                        }}
                                    />
                                </div>
                                <div style={{ marginBottom: 18, textAlign: 'center' }}>
                                    <label style={{
                                        fontSize: 12, fontWeight: 600, color: '#1E293B',
                                        display: 'block', marginBottom: 10,
                                    }}>
                                        Principal
                                    </label>
                                    <input
                                        type="checkbox" checked={u.es_principal}
                                        onChange={e => actualizarUnidad(i, 'es_principal', e.target.checked)}
                                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                                    />
                                </div>
                                <div style={{ marginBottom: 18 }}>
                                    {data.unidades.length > 1 && (
                                        <button onClick={() => quitarUnidad(i)} style={{
                                            background: 'none', border: 'none',
                                            color: '#EF4444', cursor: 'pointer',
                                            padding: 6, borderRadius: 6,
                                            display: 'flex', alignItems: 'center',
                                        }}>
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {errors.unidades && (
                            <p style={{ fontSize: 13, color: '#EF4444', marginTop: 4 }}>{errors.unidades}</p>
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                        <Button variant="cancel" size="md" onClick={() => setModal(false)}>Cancelar</Button>
                        <Button variant="primary" size="md" loading={processing} onClick={guardar}>
                            {editando ? 'Actualizar' : 'Crear Producto'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}