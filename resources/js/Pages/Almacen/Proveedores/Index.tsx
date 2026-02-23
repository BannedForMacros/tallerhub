import { useState } from 'react';
import { useForm, usePage, router } from '@inertiajs/react';
import { toast, Toaster } from 'react-hot-toast';
import { Plus, Pencil, Trash2, RotateCcw, Truck } from 'lucide-react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Table from '@/Components/Table';
import Modal from '@/Components/Modal';
import Badge from '@/Components/Badge';
import Button from '@/Components/Button';
import InputField from '@/Components/InputField';
import SelectField from '@/Components/SelectField';
import ActionButton from '@/Components/ActionButton';
import { PageProps, Proveedor, Empresa } from '@/types';

interface Props extends PageProps {
    proveedores: Proveedor[];
    empresas: Empresa[];
}

export default function ProveedoresIndex({ proveedores, empresas }: Props) {
    const { auth } = usePage<Props>().props;
    const esSuperAdmin = auth.user.esSuperAdmin;

    const [modal, setModal]       = useState(false);
    const [editando, setEditando] = useState<Proveedor | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        empresa_id: '',
        nombre:     '',
        ruc:        '',
        telefono:   '',
        email:      '',
        direccion:  '',
        contacto:   '',
    });

    const abrirCrear = () => { setEditando(null); reset(); setModal(true); };

    const abrirEditar = (p: Proveedor) => {
        setEditando(p);
        setData({
            empresa_id: String(p.empresa_id),
            nombre:     p.nombre,
            ruc:        p.ruc       ?? '',
            telefono:   p.telefono  ?? '',
            email:      p.email     ?? '',
            direccion:  p.direccion ?? '',
            contacto:   p.contacto  ?? '',
        });
        setModal(true);
    };

    const guardar = () => {
        if (editando) {
            put(route('almacen.proveedores.update', editando.id), {
                onSuccess: () => { setModal(false); toast.success('Proveedor actualizado.'); },
            });
        } else {
            post(route('almacen.proveedores.store'), {
                onSuccess: () => { setModal(false); reset(); toast.success('Proveedor creado.'); },
            });
        }
    };

    const confirmarEliminar = (p: Proveedor) => {
        toast((t) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', margin: 0 }}>¿Eliminar proveedor?</p>
                <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Se desactivará <strong>{p.nombre}</strong>.</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => toast.dismiss(t.id)} style={{
                        padding: '6px 14px', borderRadius: 8, border: '1px solid #E2E8F0',
                        backgroundColor: '#fff', cursor: 'pointer', fontSize: 13, color: '#64748B',
                    }}>Cancelar</button>
                    <button onClick={() => {
                        toast.dismiss(t.id);
                        router.patch(route('almacen.proveedores.toggle', p.id), {}, {
                            onSuccess: () => toast.success('Proveedor eliminado.'),
                        });
                    }} style={{
                        padding: '6px 14px', borderRadius: 8, border: 'none',
                        backgroundColor: '#DC2626', cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 600,
                    }}>Sí, eliminar</button>
                </div>
            </div>
        ), { duration: 10000 });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') guardar(); };

    const columns = [
        {
            key: 'nombre', label: 'Proveedor', width: '28%',
            render: (r: Proveedor) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                        width: 34, height: 34, borderRadius: 8,
                        backgroundColor: '#FFF7ED', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                        <Truck size={16} color="#D97706" />
                    </div>
                    <div>
                        <p style={{ margin: 0, fontWeight: 600, color: '#1E293B', fontSize: 13 }}>{r.nombre}</p>
                        {r.ruc && <p style={{ margin: 0, fontSize: 11, color: '#94A3B8' }}>RUC: {r.ruc}</p>}
                    </div>
                </div>
            ),
        },
        {
            key: 'contacto', label: 'Contacto', width: '16%',
            render: (r: Proveedor) => (
                <span style={{ fontSize: 13, color: '#64748B' }}>{r.contacto ?? '—'}</span>
            ),
        },
        {
            key: 'telefono', label: 'Teléfono', width: '13%',
            render: (r: Proveedor) => (
                <span style={{ fontSize: 13, color: '#64748B' }}>{r.telefono ?? '—'}</span>
            ),
        },
        {
            key: 'email', label: 'Email', width: '18%',
            render: (r: Proveedor) => (
                <span style={{ fontSize: 13, color: '#64748B' }}>{r.email ?? '—'}</span>
            ),
        },
        {
            key: 'activo', label: 'Estado', width: '10%',
            render: (r: Proveedor) => (
                <Badge label={r.activo ? 'Activo' : 'Inactivo'} variant={r.activo ? 'success' : 'danger'} />
            ),
        },
        {
            key: 'acciones', label: 'Acciones', width: '15%',
            render: (r: Proveedor) => (
                <div style={{ display: 'flex', gap: 6 }}>
                    <ActionButton onClick={() => abrirEditar(r)} icon={<Pencil size={13} />} tooltip="Editar" color="blue" />
                    {r.activo
                        ? <ActionButton onClick={() => confirmarEliminar(r)} icon={<Trash2 size={13} />} tooltip="Eliminar" color="red" />
                        : <ActionButton
                            onClick={() => router.patch(route('almacen.proveedores.toggle', r.id), {}, {
                                onSuccess: () => toast.success('Proveedor restaurado.'),
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
            <Head title="Proveedores" />
            <Toaster position="top-right" />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', margin: 0 }}>Proveedores</h1>
                    <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 4 }}>
                        Gestión de proveedores de productos del almacén
                    </p>
                </div>
                <Button variant="primary" size="md" icon={<Plus size={16} />} onClick={abrirCrear}>
                    Nuevo Proveedor
                </Button>
            </div>

            <Table columns={columns} data={proveedores} emptyText="No hay proveedores registrados" />

            <Modal
                show={modal}
                onClose={() => setModal(false)}
                title={editando ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                maxWidth="lg"
            >
                <div onKeyDown={handleKeyDown}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>

                        {esSuperAdmin && (
                            <div style={{ gridColumn: '1 / -1' }}>
                                <SelectField
                                    label="Empresa" name="empresa_id" value={data.empresa_id}
                                    onChange={e => setData('empresa_id', e.target.value)}
                                    options={empresas.map(e => ({ value: e.id, label: e.nombre }))}
                                    placeholder="Selecciona empresa" error={errors.empresa_id} required
                                />
                            </div>
                        )}

                        <div style={{ gridColumn: '1 / -1' }}>
                            <InputField
                                label="Nombre / Razón social" name="nombre" value={data.nombre}
                                onChange={e => setData('nombre', e.target.value)}
                                error={errors.nombre} required placeholder="Nombre del proveedor"
                            />
                        </div>
                        <InputField
                            label="RUC" name="ruc" value={data.ruc}
                            onChange={e => setData('ruc', e.target.value)}
                            error={errors.ruc} placeholder="RUC del proveedor"
                        />
                        <InputField
                            label="Teléfono" name="telefono" value={data.telefono}
                            onChange={e => setData('telefono', e.target.value)}
                            error={errors.telefono} placeholder="Teléfono de contacto"
                        />
                        <InputField
                            label="Email" name="email" value={data.email} type="email"
                            onChange={e => setData('email', e.target.value)}
                            error={errors.email} placeholder="Email del proveedor"
                        />
                        <InputField
                            label="Persona de contacto" name="contacto" value={data.contacto}
                            onChange={e => setData('contacto', e.target.value)}
                            error={errors.contacto} placeholder="Nombre del contacto"
                        />
                        <div style={{ gridColumn: '1 / -1' }}>
                            <InputField
                                label="Dirección" name="direccion" value={data.direccion}
                                onChange={e => setData('direccion', e.target.value)}
                                error={errors.direccion} placeholder="Dirección del proveedor"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                        <Button variant="cancel" size="md" onClick={() => setModal(false)}>Cancelar</Button>
                        <Button variant="primary" size="md" loading={processing} onClick={guardar}>
                            {editando ? 'Actualizar' : 'Crear Proveedor'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}