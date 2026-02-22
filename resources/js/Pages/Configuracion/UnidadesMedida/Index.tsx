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
import { PageProps, UnidadMedida } from '@/types';

interface Props extends PageProps {
    unidades: UnidadMedida[];
}

export default function UnidadesMedidaIndex({ unidades }: Props) {
    const [modal, setModal]       = useState(false);
    const [editando, setEditando] = useState<UnidadMedida | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        nombre: '', abreviatura: '',
    });

    const abrirCrear = () => { setEditando(null); reset(); setModal(true); };

    const abrirEditar = (u: UnidadMedida) => {
        setEditando(u);
        setData({ nombre: u.nombre, abreviatura: u.abreviatura });
        setModal(true);
    };

    const guardar = () => {
        if (editando) {
            put(route('configuracion.unidades-medida.update', editando.id), {
                onSuccess: () => { setModal(false); toast.success('Unidad actualizada.'); },
            });
        } else {
            post(route('configuracion.unidades-medida.store'), {
                onSuccess: () => { setModal(false); reset(); toast.success('Unidad creada.'); },
            });
        }
    };

    const confirmarEliminar = (u: UnidadMedida) => {
        toast((t) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', margin: 0 }}>¿Eliminar unidad?</p>
                <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Se desactivará <strong>{u.nombre}</strong>.</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => toast.dismiss(t.id)} style={{
                        padding: '6px 14px', borderRadius: 8, border: '1px solid #E2E8F0',
                        backgroundColor: '#fff', cursor: 'pointer', fontSize: 13, color: '#64748B',
                    }}>Cancelar</button>
                    <button onClick={() => {
                        toast.dismiss(t.id);
                        router.patch(route('configuracion.unidades-medida.toggle', u.id), {}, {
                            onSuccess: () => toast.success('Unidad eliminada.'),
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
            key: 'nombre', label: 'Unidad de Medida', width: '40%',
            render: (r: UnidadMedida) => (
                <span style={{ fontWeight: 600, color: '#1E293B' }}>{r.nombre}</span>
            ),
        },
        {
            key: 'abreviatura', label: 'Abreviatura', width: '25%',
            render: (r: UnidadMedida) => (
                <span style={{
                    backgroundColor: '#EFF6FF', color: '#2563EB',
                    padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                }}>
                    {r.abreviatura}
                </span>
            ),
        },
        {
            key: 'activo', label: 'Estado', width: '20%',
            render: (r: UnidadMedida) => (
                <Badge label={r.activo ? 'Activo' : 'Inactivo'} variant={r.activo ? 'success' : 'danger'} />
            ),
        },
        {
            key: 'acciones', label: 'Acciones', width: '15%',
            render: (r: UnidadMedida) => (
                <div style={{ display: 'flex', gap: 6 }}>
                    <ActionButton onClick={() => abrirEditar(r)} icon={<Pencil size={13} />} tooltip="Editar" color="blue" />
                    {r.activo
                        ? <ActionButton onClick={() => confirmarEliminar(r)} icon={<Trash2 size={13} />} tooltip="Eliminar" color="red" />
                        : <ActionButton
                            onClick={() => router.patch(route('configuracion.unidades-medida.toggle', r.id), {}, {
                                onSuccess: () => toast.success('Unidad restaurada.'),
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
            <Head title="Unidades de Medida" />
            <Toaster position="top-right" />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', margin: 0 }}>Unidades de Medida</h1>
                    <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 4 }}>
                        Configura las unidades de medida para los productos del almacén
                    </p>
                </div>
                <Button variant="primary" size="md" icon={<Plus size={16} />} onClick={abrirCrear}>
                    Nueva Unidad
                </Button>
            </div>

            <Table columns={columns} data={unidades} emptyText="No hay unidades de medida registradas" />

            <Modal show={modal} onClose={() => setModal(false)}
                title={editando ? 'Editar Unidad' : 'Nueva Unidad de Medida'} maxWidth="sm">
                <div onKeyDown={handleKeyDown}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <InputField label="Nombre" name="nombre" value={data.nombre}
                                onChange={e => setData('nombre', e.target.value)}
                                error={errors.nombre} required placeholder="Ej. Unidad, Caja, Par" />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <InputField label="Abreviatura" name="abreviatura" value={data.abreviatura}
                                onChange={e => setData('abreviatura', e.target.value)}
                                error={errors.abreviatura} required placeholder="Ej. und, caj, par" />
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                        <Button variant="cancel" size="md" onClick={() => setModal(false)}>Cancelar</Button>
                        <Button variant="primary" size="md" loading={processing} onClick={guardar}>
                            {editando ? 'Actualizar' : 'Crear Unidad'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}