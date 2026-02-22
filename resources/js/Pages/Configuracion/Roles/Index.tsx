import { useState } from 'react';
import { useForm, usePage, router } from '@inertiajs/react';
import { toast, Toaster } from 'react-hot-toast';
import { Plus, Pencil, Trash2, RotateCcw, Shield } from 'lucide-react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Table from '@/Components/Table';
import Modal from '@/Components/Modal';
import Badge from '@/Components/Badge';
import Button from '@/Components/Button';
import InputField from '@/Components/InputField';
import SelectField from '@/Components/SelectField';
import ActionButton from '@/Components/ActionButton';
import { PageProps } from '@/types';
import { Key } from 'lucide-react';

interface Rol {
    id: number;
    nombre: string;
    descripcion: string;
    empresa_id: number | null;
    activo: boolean;
    usuarios_count: number;
}

interface Empresa { id: number; nombre: string; }

interface Props extends PageProps {
    roles: Rol[];
    empresas: Empresa[];
}

const empty = { nombre: '', descripcion: '', empresa_id: '' };

export default function RolesIndex({ roles, empresas }: Props) {
    const { auth } = usePage<Props>().props;
    const esSuperAdmin = auth.user.esSuperAdmin;

    const [modal, setModal] = useState(false);
    const [editando, setEditando] = useState<Rol | null>(null);
    const { data, setData, post, put, processing, errors, reset } = useForm(empty);

    const abrirCrear = () => { setEditando(null); reset(); setModal(true); };

    const abrirEditar = (rol: Rol) => {
        setEditando(rol);
        setData({
            nombre:      rol.nombre,
            descripcion: rol.descripcion ?? '',
            empresa_id:  rol.empresa_id ? String(rol.empresa_id) : '',
        });
        setModal(true);
    };

    const guardar = () => {
        if (editando) {
            put(route('configuracion.roles.update', editando.id), {
                onSuccess: () => { setModal(false); toast.success('Rol actualizado.'); },
            });
        } else {
            post(route('configuracion.roles.store'), {
                onSuccess: () => { setModal(false); reset(); toast.success('Rol creado.'); },
            });
        }
    };

    const confirmarEliminar = (rol: Rol) => {
        toast((t) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', margin: 0 }}>
                    ¿Eliminar rol?
                </p>
                <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
                    Se desactivará <strong>{rol.nombre}</strong>.
                </p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => toast.dismiss(t.id)} style={{
                        padding: '6px 14px', borderRadius: 8, border: '1px solid #E2E8F0',
                        backgroundColor: '#fff', cursor: 'pointer', fontSize: 13, color: '#64748B',
                    }}>Cancelar</button>
                    <button onClick={() => {
                        toast.dismiss(t.id);
                        router.patch(route('configuracion.roles.toggle', rol.id), {}, {
                            onSuccess: () => toast.success('Rol eliminado.'),
                        });
                    }} style={{
                        padding: '6px 14px', borderRadius: 8, border: 'none',
                        backgroundColor: '#DC2626', cursor: 'pointer',
                        fontSize: 13, color: '#fff', fontWeight: 600,
                    }}>Sí, eliminar</button>
                </div>
            </div>
        ), { duration: 10000 });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') guardar();
    };

    const columns = [
        {
            key: 'nombre', label: 'Rol', width: '20%',
            render: (row: Rol) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                        width: 30, height: 30, borderRadius: 8,
                        backgroundColor: '#EFF6FF', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Shield size={14} color="#2563EB" />
                    </div>
                    <span style={{ fontWeight: 600, color: '#1E293B' }}>{row.nombre}</span>
                </div>
            ),
        },
        { key: 'descripcion', label: 'Descripción', width: '30%' },
        {
            key: 'empresa', label: 'Empresa', width: '20%',
            render: (row: Rol) => (
                <span style={{ color: row.empresa_id ? '#1E293B' : '#D97706', fontSize: 13 }}>
                    {row.empresa_id
                        ? empresas.find(e => e.id === row.empresa_id)?.nombre ?? '—'
                        : 'Global'}
                </span>
            ),
        },
        {
            key: 'usuarios_count', label: 'Usuarios', width: '10%',
            render: (row: Rol) => (
                <Badge label={String(row.usuarios_count)} variant="info" />
            ),
        },
        {
            key: 'activo', label: 'Estado', width: '10%',
            render: (row: Rol) => (
                <Badge label={row.activo ? 'Activo' : 'Inactivo'} variant={row.activo ? 'success' : 'danger'} />
            ),
        },
        {
            key: 'acciones', label: 'Acciones', width: '10%',
            render: (row: Rol) => (
                <div style={{ display: 'flex', gap: 6 }}>
                    <ActionButton onClick={() => abrirEditar(row)} icon={<Pencil size={13} />} tooltip="Editar" color="blue" />
                    <ActionButton
                        onClick={() => router.visit(route('configuracion.roles.permisos', row.id))}
                        icon={<Key size={13} />}
                        tooltip="Permisos"
                        color="amber"
                    />
                    {row.activo ? (
                        <ActionButton onClick={() => confirmarEliminar(row)} icon={<Trash2 size={13} />} tooltip="Eliminar" color="red" />
                    ) : (
                        <ActionButton
                            onClick={() => router.patch(route('configuracion.roles.toggle', row.id), {}, {
                                onSuccess: () => toast.success('Rol restaurado.'),
                            })}
                            icon={<RotateCcw size={13} />} tooltip="Restaurar" color="green"
                        />
                    )}
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Roles" />
            <Toaster position="top-right" />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', margin: 0 }}>Roles</h1>
                    <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 4 }}>Gestiona los roles y sus permisos</p>
                </div>
                <Button variant="primary" size="md" icon={<Plus size={16} />} onClick={abrirCrear}>
                    Nuevo Rol
                </Button>
            </div>

            <Table columns={columns} data={roles} emptyText="No hay roles registrados" />

            <Modal show={modal} onClose={() => setModal(false)} title={editando ? 'Editar Rol' : 'Nuevo Rol'}>
                <div onKeyDown={handleKeyDown}>
                    <InputField label="Nombre" name="nombre" value={data.nombre}
                        onChange={e => setData('nombre', e.target.value)}
                        error={errors.nombre} required placeholder="Ej. administrador" />
                    <InputField label="Descripción" name="descripcion" value={data.descripcion}
                        onChange={e => setData('descripcion', e.target.value)}
                        error={errors.descripcion} placeholder="Descripción del rol" />
                    {esSuperAdmin && (
                        <SelectField
                            label="Empresa"
                            name="empresa_id"
                            value={data.empresa_id}
                            onChange={e => setData('empresa_id', e.target.value)}
                            options={empresas.map(e => ({ value: e.id, label: e.nombre }))}
                            placeholder="Global (sin empresa)"
                            error={errors.empresa_id}
                        />
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                        <Button variant="cancel" size="md" onClick={() => setModal(false)}>Cancelar</Button>
                        <Button variant="primary" size="md" loading={processing} onClick={guardar}>
                            {editando ? 'Actualizar' : 'Crear Rol'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}