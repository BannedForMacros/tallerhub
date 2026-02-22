import { useState } from 'react';
import { useForm, usePage, router } from '@inertiajs/react';
import { toast, Toaster } from 'react-hot-toast';
import { Plus, Pencil, Trash2, RotateCcw, User } from 'lucide-react';
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

interface Usuario {
    id: number;
    name: string;
    email: string;
    telefono: string;
    empresa_id: number;
    local_id: number | null;
    rol_id: number;
    activo: boolean;
    rol: { id: number; nombre: string } | null;
    local: { id: number; nombre: string } | null;
}

interface Empresa { id: number; nombre: string; }
interface Rol     { id: number; nombre: string; }
interface Local   { id: number; nombre: string; empresa_id: number; }

interface Props extends PageProps {
    usuarios: Usuario[];
    empresas: Empresa[];
    roles: Rol[];
    locales: Local[];
}

const empty = {
    name: '', email: '', password: '', telefono: '',
    rol_id: '', local_id: '', empresa_id: '',
};

export default function UsuariosIndex({ usuarios, empresas, roles, locales }: Props) {
    const { auth } = usePage<Props>().props;
    const esSuperAdmin = auth.user.esSuperAdmin;

    const [modal, setModal]       = useState(false);
    const [editando, setEditando] = useState<Usuario | null>(null);
    const [empresaSeleccionada, setEmpresaSeleccionada] = useState<number | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm(empty);

    // Filtra locales según empresa seleccionada
    const localesFiltrados = locales.filter(l =>
        esSuperAdmin
            ? (empresaSeleccionada ? l.empresa_id === empresaSeleccionada : true)
            : true
    );

    const abrirCrear = () => {
        setEditando(null);
        setEmpresaSeleccionada(auth.user.empresa_id ?? null);
        reset();
        setModal(true);
    };

    const abrirEditar = (usuario: Usuario) => {
        setEditando(usuario);
        setEmpresaSeleccionada(usuario.empresa_id);
        setData({
            name:       usuario.name,
            email:      usuario.email,
            password:   '',
            telefono:   usuario.telefono ?? '',
            rol_id:     String(usuario.rol_id),
            local_id:   usuario.local_id ? String(usuario.local_id) : '',
            empresa_id: String(usuario.empresa_id),
        });
        setModal(true);
    };

    const guardar = () => {
        if (editando) {
            put(route('configuracion.usuarios.update', editando.id), {
                onSuccess: () => { setModal(false); toast.success('Usuario actualizado.'); },
            });
        } else {
            post(route('configuracion.usuarios.store'), {
                onSuccess: () => { setModal(false); reset(); toast.success('Usuario creado.'); },
            });
        }
    };

    const confirmarEliminar = (usuario: Usuario) => {
        toast((t) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', margin: 0 }}>¿Eliminar usuario?</p>
                <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Se desactivará <strong>{usuario.name}</strong>.</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => toast.dismiss(t.id)} style={{
                        padding: '6px 14px', borderRadius: 8, border: '1px solid #E2E8F0',
                        backgroundColor: '#fff', cursor: 'pointer', fontSize: 13, color: '#64748B',
                    }}>Cancelar</button>
                    <button onClick={() => {
                        toast.dismiss(t.id);
                        router.patch(route('configuracion.usuarios.toggle', usuario.id), {}, {
                            onSuccess: () => toast.success('Usuario eliminado.'),
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
            key: 'name', label: 'Usuario', width: '22%',
            render: (row: Usuario) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        backgroundColor: '#2563EB',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0,
                    }}>
                        {row.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p style={{ margin: 0, fontWeight: 600, color: '#1E293B', fontSize: 14 }}>{row.name}</p>
                        <p style={{ margin: 0, fontSize: 12, color: '#94A3B8' }}>{row.email}</p>
                    </div>
                </div>
            ),
        },
        { key: 'telefono', label: 'Teléfono', width: '12%' },
        {
            key: 'rol', label: 'Rol', width: '13%',
            render: (row: Usuario) => (
                <Badge label={row.rol?.nombre ?? '—'} variant="info" />
            ),
        },
        {
            key: 'local', label: 'Local', width: '15%',
            render: (row: Usuario) => (
                <span style={{ fontSize: 13, color: '#64748B' }}>
                    {row.local?.nombre ?? 'Todos los locales'}
                </span>
            ),
        },
        {
            key: 'empresa', label: 'Empresa', width: '18%',
            render: (row: Usuario) => (
                <span style={{ fontSize: 13, color: '#1E293B' }}>
                    {empresas.find(e => e.id === row.empresa_id)?.nombre ?? '—'}
                </span>
            ),
        },
        {
            key: 'activo', label: 'Estado', width: '10%',
            render: (row: Usuario) => (
                <Badge label={row.activo ? 'Activo' : 'Inactivo'} variant={row.activo ? 'success' : 'danger'} />
            ),
        },
        {
            key: 'acciones', label: 'Acciones', width: '8%',
            render: (row: Usuario) => (
                <div style={{ display: 'flex', gap: 6 }}>
                    <ActionButton onClick={() => abrirEditar(row)} icon={<Pencil size={13} />} tooltip="Editar" color="blue" />
                    {row.activo ? (
                        <ActionButton onClick={() => confirmarEliminar(row)} icon={<Trash2 size={13} />} tooltip="Eliminar" color="red" />
                    ) : (
                        <ActionButton
                            onClick={() => router.patch(route('configuracion.usuarios.toggle', row.id), {}, {
                                onSuccess: () => toast.success('Usuario restaurado.'),
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
            <Head title="Usuarios" />
            <Toaster position="top-right" />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', margin: 0 }}>Usuarios</h1>
                    <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 4 }}>Gestiona los usuarios del sistema</p>
                </div>
                <Button variant="primary" size="md" icon={<Plus size={16} />} onClick={abrirCrear}>
                    Nuevo Usuario
                </Button>
            </div>

            <Table columns={columns} data={usuarios} emptyText="No hay usuarios registrados" />

            <Modal show={modal} onClose={() => setModal(false)}
                title={editando ? 'Editar Usuario' : 'Nuevo Usuario'} maxWidth="lg">
                <div onKeyDown={handleKeyDown}>
                    {esSuperAdmin && (
                        <SelectField
                            label="Empresa" name="empresa_id" value={data.empresa_id}
                            onChange={e => {
                                setData('empresa_id', e.target.value);
                                setEmpresaSeleccionada(Number(e.target.value));
                                setData('local_id', '');
                            }}
                            options={empresas.map(e => ({ value: e.id, label: e.nombre }))}
                            placeholder="Selecciona empresa" error={errors.empresa_id} required
                        />
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                        <InputField label="Nombre" name="name" value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            error={errors.name} required placeholder="Nombre completo" />
                        <InputField label="Teléfono" name="telefono" value={data.telefono}
                            onChange={e => setData('telefono', e.target.value)}
                            error={errors.telefono} placeholder="999 999 999" />
                        <InputField label="Email" name="email" value={data.email} type="email"
                            onChange={e => setData('email', e.target.value)}
                            error={errors.email} required placeholder="correo@empresa.com" />
                        <InputField
                            label={editando ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                            name="password" value={data.password} type="password"
                            onChange={e => setData('password', e.target.value)}
                            error={errors.password}
                            required={!editando}
                            placeholder="Mínimo 8 caracteres"
                        />
                        <SelectField label="Rol" name="rol_id" value={data.rol_id}
                            onChange={e => setData('rol_id', e.target.value)}
                            options={roles.map(r => ({ value: r.id, label: r.nombre }))}
                            placeholder="Selecciona rol" error={errors.rol_id} required />
                        <SelectField label="Local" name="local_id" value={data.local_id}
                            onChange={e => setData('local_id', e.target.value)}
                            options={localesFiltrados.map(l => ({ value: l.id, label: l.nombre }))}
                            placeholder="Todos los locales"
                            error={errors.local_id} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                        <Button variant="cancel" size="md" onClick={() => setModal(false)}>Cancelar</Button>
                        <Button variant="primary" size="md" loading={processing} onClick={guardar}>
                            {editando ? 'Actualizar' : 'Crear Usuario'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}