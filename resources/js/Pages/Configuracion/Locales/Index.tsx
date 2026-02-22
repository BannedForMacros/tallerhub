import { useState } from 'react';
import { useForm, usePage, router } from '@inertiajs/react';
import { toast, Toaster } from 'react-hot-toast';
import { Plus, Pencil, Trash2, RotateCcw, MapPin } from 'lucide-react';
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

interface Local {
    id: number;
    nombre: string;
    direccion: string;
    telefono: string;
    departamento: string;
    provincia: string;
    distrito: string;
    empresa_id: number;
    activo: boolean;
}

interface Empresa { id: number; nombre: string; }

interface Props extends PageProps {
    locales: Local[];
    empresas: Empresa[];
}

const empty = {
    nombre: '', direccion: '', telefono: '',
    departamento: '', provincia: '', distrito: '', empresa_id: '',
};

export default function LocalesIndex({ locales, empresas }: Props) {
    const { auth } = usePage<Props>().props;
    const esSuperAdmin = auth.user.esSuperAdmin;

    const [modal, setModal] = useState(false);
    const [editando, setEditando] = useState<Local | null>(null);
    const { data, setData, post, put, processing, errors, reset } = useForm(empty);

    const abrirCrear = () => { setEditando(null); reset(); setModal(true); };

    const abrirEditar = (local: Local) => {
        setEditando(local);
        setData({
            nombre:       local.nombre,
            direccion:    local.direccion    ?? '',
            telefono:     local.telefono     ?? '',
            departamento: local.departamento,
            provincia:    local.provincia,
            distrito:     local.distrito,
            empresa_id:   String(local.empresa_id),
        });
        setModal(true);
    };

    const guardar = () => {
        if (editando) {
            put(route('configuracion.locales.update', editando.id), {
                onSuccess: () => { setModal(false); toast.success('Local actualizado.'); },
            });
        } else {
            post(route('configuracion.locales.store'), {
                onSuccess: () => { setModal(false); reset(); toast.success('Local creado.'); },
            });
        }
    };

    const confirmarEliminar = (local: Local) => {
        toast((t) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', margin: 0 }}>¿Eliminar local?</p>
                <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Se desactivará <strong>{local.nombre}</strong>.</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => toast.dismiss(t.id)} style={{
                        padding: '6px 14px', borderRadius: 8, border: '1px solid #E2E8F0',
                        backgroundColor: '#fff', cursor: 'pointer', fontSize: 13, color: '#64748B',
                    }}>Cancelar</button>
                    <button onClick={() => {
                        toast.dismiss(t.id);
                        router.patch(route('configuracion.locales.toggle', local.id), {}, {
                            onSuccess: () => toast.success('Local eliminado.'),
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
            key: 'nombre', label: 'Local', width: '20%',
            render: (row: Local) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                        width: 30, height: 30, borderRadius: 8,
                        backgroundColor: '#FFF7ED', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                    }}>
                        <MapPin size={14} color="#D97706" />
                    </div>
                    <span style={{ fontWeight: 600, color: '#1E293B' }}>{row.nombre}</span>
                </div>
            ),
        },
        { key: 'direccion',    label: 'Dirección',    width: '22%' },
        { key: 'telefono',     label: 'Teléfono',     width: '12%' },
        { key: 'departamento', label: 'Departamento', width: '13%' },
        {
            key: 'empresa', label: 'Empresa', width: '15%',
            render: (row: Local) => (
                <span style={{ fontSize: 13, color: '#1E293B' }}>
                    {empresas.find(e => e.id === row.empresa_id)?.nombre ?? '—'}
                </span>
            ),
        },
        {
            key: 'activo', label: 'Estado', width: '10%',
            render: (row: Local) => (
                <Badge label={row.activo ? 'Activo' : 'Inactivo'} variant={row.activo ? 'success' : 'danger'} />
            ),
        },
        {
            key: 'acciones', label: 'Acciones', width: '8%',
            render: (row: Local) => (
                <div style={{ display: 'flex', gap: 6 }}>
                    <ActionButton onClick={() => abrirEditar(row)} icon={<Pencil size={13} />} tooltip="Editar" color="blue" />
                    {row.activo ? (
                        <ActionButton onClick={() => confirmarEliminar(row)} icon={<Trash2 size={13} />} tooltip="Eliminar" color="red" />
                    ) : (
                        <ActionButton
                            onClick={() => router.patch(route('configuracion.locales.toggle', row.id), {}, {
                                onSuccess: () => toast.success('Local restaurado.'),
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
            <Head title="Locales" />
            <Toaster position="top-right" />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', margin: 0 }}>Locales</h1>
                    <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 4 }}>Gestiona los locales de tu empresa</p>
                </div>
                <Button variant="primary" size="md" icon={<Plus size={16} />} onClick={abrirCrear}>
                    Nuevo Local
                </Button>
            </div>

            <Table columns={columns} data={locales} emptyText="No hay locales registrados" />

            <Modal show={modal} onClose={() => setModal(false)} title={editando ? 'Editar Local' : 'Nuevo Local'} maxWidth="lg">
                <div onKeyDown={handleKeyDown}>
                    {esSuperAdmin && (
                        <SelectField
                            label="Empresa" name="empresa_id" value={data.empresa_id}
                            onChange={e => setData('empresa_id', e.target.value)}
                            options={empresas.map(e => ({ value: e.id, label: e.nombre }))}
                            placeholder="Selecciona empresa" error={errors.empresa_id} required
                        />
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <InputField label="Nombre" name="nombre" value={data.nombre}
                                onChange={e => setData('nombre', e.target.value)}
                                error={errors.nombre} required placeholder="Ej. Local Centro" />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <InputField label="Dirección" name="direccion" value={data.direccion}
                                onChange={e => setData('direccion', e.target.value)}
                                error={errors.direccion} placeholder="Av. Principal 123" />
                        </div>
                        <InputField label="Teléfono" name="telefono" value={data.telefono}
                            onChange={e => setData('telefono', e.target.value)}
                            error={errors.telefono} placeholder="999 999 999" />
                        <InputField label="Departamento" name="departamento" value={data.departamento}
                            onChange={e => setData('departamento', e.target.value)}
                            error={errors.departamento} required />
                        <InputField label="Provincia" name="provincia" value={data.provincia}
                            onChange={e => setData('provincia', e.target.value)}
                            error={errors.provincia} required />
                        <InputField label="Distrito" name="distrito" value={data.distrito}
                            onChange={e => setData('distrito', e.target.value)}
                            error={errors.distrito} required />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                        <Button variant="cancel" size="md" onClick={() => setModal(false)}>Cancelar</Button>
                        <Button variant="primary" size="md" loading={processing} onClick={guardar}>
                            {editando ? 'Actualizar' : 'Crear Local'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}