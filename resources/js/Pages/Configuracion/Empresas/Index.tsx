import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import { toast, Toaster } from 'react-hot-toast';
import { Plus, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Table from '@/Components/Table';
import Modal from '@/Components/Modal';
import Badge from '@/Components/Badge';
import Button from '@/Components/Button';
import InputField from '@/Components/InputField';
import ActionButton from '@/Components/ActionButton';
import { PageProps, Empresa } from '@/types';

interface Props extends PageProps {
    empresas: Empresa[];
}

const confirmarEliminar = (empresa: Empresa) => {
    toast((t) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', margin: 0 }}>¿Eliminar empresa?</p>
            <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Se desactivará <strong>{empresa.nombre}</strong>.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => toast.dismiss(t.id)} style={{
                    padding: '6px 14px', borderRadius: 8, border: '1px solid #E2E8F0',
                    backgroundColor: '#fff', cursor: 'pointer', fontSize: 13, color: '#64748B',
                }}>Cancelar</button>
                <button onClick={() => {
                    toast.dismiss(t.id);
                    router.patch(route('configuracion.empresas.toggle', empresa.id), {}, {
                        onSuccess: () => toast.success('Empresa eliminada.'),
                    });
                }} style={{
                    padding: '6px 14px', borderRadius: 8, border: 'none',
                    backgroundColor: '#DC2626', cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 600,
                }}>Sí, eliminar</button>
            </div>
        </div>
    ), { duration: 10000 });
};

export default function EmpresasIndex({ empresas }: Props) {
    const [modal, setModal]       = useState(false);
    const [editando, setEditando] = useState<Empresa | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        nombre: '', ruc: '', email: '', telefono: '',
        departamento: '', provincia: '', distrito: '',
        logo: null as File | null,
        _method: 'POST',
    });

    const abrirCrear = () => {
        setEditando(null);
        reset();
        setData('_method', 'POST');
        setModal(true);
    };

    const abrirEditar = (empresa: Empresa) => {
        setEditando(empresa);
        setData({
            nombre:       empresa.nombre,
            ruc:          empresa.ruc,
            email:        empresa.email        ?? '',
            telefono:     empresa.telefono     ?? '',
            departamento: empresa.departamento,
            provincia:    empresa.provincia,
            distrito:     empresa.distrito,
            logo:         null,
            _method:      'PUT',
        });
        setModal(true);
    };

    const guardar = () => {
        if (editando) {
            post(route('configuracion.empresas.update', editando.id), {
                forceFormData: true,
                onSuccess: () => { setModal(false); toast.success('Empresa actualizada.'); },
            });
        } else {
            post(route('configuracion.empresas.store'), {
                forceFormData: true,
                onSuccess: () => { setModal(false); reset(); toast.success('Empresa creada.'); },
            });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') guardar();
    };

    const columns = [
        {
            key: 'nombre', label: 'Empresa', width: '25%',
            render: (r: Empresa) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {r.logo
                        ? <img src={`/storage/${r.logo}`} alt={r.nombre} style={{
                            width: 32, height: 32, objectFit: 'contain',
                            borderRadius: 6, border: '1px solid #E2E8F0', padding: 2,
                          }} />
                        : <div style={{
                            width: 32, height: 32, borderRadius: 6,
                            backgroundColor: '#EFF6FF', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 700, color: '#2563EB', flexShrink: 0,
                          }}>
                            {r.nombre.charAt(0).toUpperCase()}
                          </div>
                    }
                    <span style={{ fontWeight: 600, color: '#1E293B' }}>{r.nombre}</span>
                </div>
            ),
        },
        { key: 'ruc',          label: 'RUC',          width: '12%' },
        { key: 'email',        label: 'Email',        width: '20%' },
        { key: 'telefono',     label: 'Teléfono',     width: '12%' },
        { key: 'departamento', label: 'Departamento', width: '11%' },
        {
            key: 'activo', label: 'Estado', width: '10%',
            render: (r: Empresa) => (
                <Badge label={r.activo ? 'Activo' : 'Inactivo'} variant={r.activo ? 'success' : 'danger'} />
            ),
        },
        {
            key: 'acciones', label: 'Acciones', width: '8%',
            render: (r: Empresa) => (
                <div style={{ display: 'flex', gap: 6 }}>
                    <ActionButton onClick={() => abrirEditar(r)} icon={<Pencil size={13} />} tooltip="Editar" color="blue" />
                    {r.activo
                        ? <ActionButton onClick={() => confirmarEliminar(r)} icon={<Trash2 size={13} />} tooltip="Eliminar" color="red" />
                        : <ActionButton
                            onClick={() => router.patch(route('configuracion.empresas.toggle', r.id), {}, {
                                onSuccess: () => toast.success('Empresa restaurada.'),
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
            <Head title="Empresas" />
            <Toaster position="top-right" />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', margin: 0 }}>Empresas</h1>
                    <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 4 }}>
                        Gestiona las empresas registradas en el sistema
                    </p>
                </div>
                <Button variant="primary" size="md" icon={<Plus size={16} />} onClick={abrirCrear}>
                    Nueva Empresa
                </Button>
            </div>

            <Table columns={columns} data={empresas} emptyText="No hay empresas registradas" />

            <Modal
                show={modal}
                onClose={() => setModal(false)}
                title={editando ? 'Editar Empresa' : 'Nueva Empresa'}
                maxWidth="lg"
            >
                <div onKeyDown={handleKeyDown}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <InputField
                                label="Nombre" name="nombre" value={data.nombre}
                                onChange={e => setData('nombre', e.target.value)}
                                error={errors.nombre} required placeholder="Nombre de la empresa"
                            />
                        </div>
                        <InputField
                            label="RUC" name="ruc" value={data.ruc}
                            onChange={e => setData('ruc', e.target.value)}
                            error={errors.ruc} required placeholder="11 dígitos"
                        />
                        <InputField
                            label="Teléfono" name="telefono" value={data.telefono}
                            onChange={e => setData('telefono', e.target.value)}
                            error={errors.telefono} placeholder="Ej. 999 999 999"
                        />
                        <div style={{ gridColumn: '1 / -1' }}>
                            <InputField
                                label="Email" name="email" value={data.email} type="email"
                                onChange={e => setData('email', e.target.value)}
                                error={errors.email} placeholder="correo@empresa.com"
                            />
                        </div>
                        <InputField
                            label="Departamento" name="departamento" value={data.departamento}
                            onChange={e => setData('departamento', e.target.value)}
                            error={errors.departamento} required
                        />
                        <InputField
                            label="Provincia" name="provincia" value={data.provincia}
                            onChange={e => setData('provincia', e.target.value)}
                            error={errors.provincia} required
                        />
                        <div style={{ gridColumn: '1 / -1' }}>
                            <InputField
                                label="Distrito" name="distrito" value={data.distrito}
                                onChange={e => setData('distrito', e.target.value)}
                                error={errors.distrito} required
                            />
                        </div>

                        {/* Logo */}
                        <div style={{ gridColumn: '1 / -1', marginBottom: 18 }}>
                            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#1E293B', marginBottom: 7 }}>
                                Logo de la empresa
                            </label>

                            {/* Preview logo actual */}
                            {editando?.logo && !data.logo && (
                                <div style={{ marginBottom: 10 }}>
                                    <img
                                        src={`/storage/${editando.logo}`}
                                        alt="Logo actual"
                                        style={{ height: 48, objectFit: 'contain', borderRadius: 8, border: '1px solid #E2E8F0', padding: 6 }}
                                    />
                                    <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, margin: 0 }}>Logo actual</p>
                                </div>
                            )}

                            {/* Preview nuevo logo */}
                            {data.logo && (
                                <div style={{ marginBottom: 10 }}>
                                    <img
                                        src={URL.createObjectURL(data.logo)}
                                        alt="Nuevo logo"
                                        style={{ height: 48, objectFit: 'contain', borderRadius: 8, border: '1px solid #2563EB', padding: 6 }}
                                    />
                                </div>
                            )}

                            <input
                                type="file"
                                accept="image/png,image/jpg,image/jpeg,image/webp"
                                onChange={e => setData('logo', e.target.files?.[0] ?? null)}
                                style={{ fontSize: 14, color: '#1E293B' }}
                            />
                            {errors.logo && <p style={{ marginTop: 5, fontSize: 13, color: '#EF4444' }}>{errors.logo}</p>}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                        <Button variant="cancel" size="md" onClick={() => setModal(false)}>Cancelar</Button>
                        <Button variant="primary" size="md" loading={processing} onClick={guardar}>
                            {editando ? 'Actualizar' : 'Crear Empresa'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}