import { useState } from 'react';
import { useForm, usePage, router } from '@inertiajs/react';
import { toast, Toaster } from 'react-hot-toast';
import { Plus, Pencil, Trash2, RotateCcw, Wrench } from 'lucide-react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Table from '@/Components/Table';
import Modal from '@/Components/Modal';
import Badge from '@/Components/Badge';
import Button from '@/Components/Button';
import InputField from '@/Components/InputField';
import SelectField from '@/Components/SelectField';
import ActionButton from '@/Components/ActionButton';
import { PageProps, Servicio, Local, Empresa } from '@/types';

interface Props extends PageProps {
    servicios: Servicio[];
    locales: Local[];
    empresas: Empresa[];
}

export default function ServiciosIndex({ servicios, locales, empresas }: Props) {
    const { auth } = usePage<Props>().props;
    const esSuperAdmin = auth.user.esSuperAdmin;

    const [modal, setModal]       = useState(false);
    const [editando, setEditando] = useState<Servicio | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        nombre:      '',
        descripcion: '',
        precio:      '',
        local_id:    '',
        empresa_id:  '',
    });

    // Filtra locales según empresa seleccionada
    const localesFiltrados = locales.filter(l =>
        data.empresa_id ? l.empresa_id === Number(data.empresa_id) : true
    );

    const abrirCrear = () => {
        setEditando(null);
        reset();
        setModal(true);
    };

    const abrirEditar = (s: Servicio) => {
        setEditando(s);
        setData({
            nombre:      s.nombre,
            descripcion: s.descripcion ?? '',
            precio:      String(s.precio),
            local_id:    s.local_id ? String(s.local_id) : '',
            empresa_id:  String(s.empresa_id),
        });
        setModal(true);
    };

    const guardar = () => {
        if (editando) {
            put(route('configuracion.servicios.update', editando.id), {
                onSuccess: () => { setModal(false); toast.success('Servicio actualizado.'); },
            });
        } else {
            post(route('configuracion.servicios.store'), {
                onSuccess: () => { setModal(false); reset(); toast.success('Servicio creado.'); },
            });
        }
    };

    const confirmarEliminar = (s: Servicio) => {
        toast((t) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', margin: 0 }}>¿Eliminar servicio?</p>
                <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Se desactivará <strong>{s.nombre}</strong>.</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => toast.dismiss(t.id)} style={{
                        padding: '6px 14px', borderRadius: 8, border: '1px solid #E2E8F0',
                        backgroundColor: '#fff', cursor: 'pointer', fontSize: 13, color: '#64748B',
                    }}>Cancelar</button>
                    <button onClick={() => {
                        toast.dismiss(t.id);
                        router.patch(route('configuracion.servicios.toggle', s.id), {}, {
                            onSuccess: () => toast.success('Servicio eliminado.'),
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
            key: 'nombre', label: 'Servicio', width: '28%',
            render: (r: Servicio) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                        width: 30, height: 30, borderRadius: 8,
                        backgroundColor: '#EFF6FF', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                        <Wrench size={14} color="#2563EB" />
                    </div>
                    <div>
                        <p style={{ margin: 0, fontWeight: 600, color: '#1E293B', fontSize: 14 }}>{r.nombre}</p>
                        {r.descripcion && (
                            <p style={{ margin: 0, fontSize: 12, color: '#94A3B8' }}>{r.descripcion}</p>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'precio', label: 'Precio', width: '13%',
            render: (r: Servicio) => (
                <span style={{ fontWeight: 700, color: '#16A34A', fontSize: 15 }}>
                    S/ {Number(r.precio).toFixed(2)}
                </span>
            ),
        },
        {
            key: 'local', label: 'Local', width: '20%',
            render: (r: Servicio) => (
                <span style={{ fontSize: 13, color: '#64748B' }}>
                    {r.local
                        ? r.local.nombre
                        : <span style={{ color: '#D97706', fontWeight: 500 }}>Todos los locales</span>
                    }
                </span>
            ),
        },
        {
            key: 'empresa', label: 'Empresa', width: '18%',
            render: (r: Servicio) => (
                <span style={{ fontSize: 13, color: '#64748B' }}>
                    {empresas.find(e => e.id === r.empresa_id)?.nombre ?? '—'}
                </span>
            ),
        },
        {
            key: 'activo', label: 'Estado', width: '10%',
            render: (r: Servicio) => (
                <Badge label={r.activo ? 'Activo' : 'Inactivo'} variant={r.activo ? 'success' : 'danger'} />
            ),
        },
        {
            key: 'acciones', label: 'Acciones', width: '11%',
            render: (r: Servicio) => (
                <div style={{ display: 'flex', gap: 6 }}>
                    <ActionButton
                        onClick={() => abrirEditar(r)}
                        icon={<Pencil size={13} />}
                        tooltip="Editar"
                        color="blue"
                    />
                    {r.activo
                        ? <ActionButton
                            onClick={() => confirmarEliminar(r)}
                            icon={<Trash2 size={13} />}
                            tooltip="Eliminar"
                            color="red"
                          />
                        : <ActionButton
                            onClick={() => router.patch(route('configuracion.servicios.toggle', r.id), {}, {
                                onSuccess: () => toast.success('Servicio restaurado.'),
                            })}
                            icon={<RotateCcw size={13} />}
                            tooltip="Restaurar"
                            color="green"
                          />
                    }
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Servicios" />
            <Toaster position="top-right" />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', margin: 0 }}>Servicios</h1>
                    <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 4 }}>
                        Catálogo de servicios con precios base por local o empresa
                    </p>
                </div>
                <Button variant="primary" size="md" icon={<Plus size={16} />} onClick={abrirCrear}>
                    Nuevo Servicio
                </Button>
            </div>

            <Table columns={columns} data={servicios} emptyText="No hay servicios registrados" />

            <Modal
                show={modal}
                onClose={() => setModal(false)}
                title={editando ? 'Editar Servicio' : 'Nuevo Servicio'}
                maxWidth="md"
            >
                <div onKeyDown={handleKeyDown}>
                    {esSuperAdmin && (
                        <SelectField
                            label="Empresa" name="empresa_id" value={data.empresa_id}
                            onChange={e => {
                                setData('empresa_id', e.target.value);
                                setData('local_id', '');
                            }}
                            options={empresas.map(e => ({ value: e.id, label: e.nombre }))}
                            placeholder="Selecciona empresa"
                            error={errors.empresa_id}
                            required
                        />
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <InputField
                                label="Nombre" name="nombre" value={data.nombre}
                                onChange={e => setData('nombre', e.target.value)}
                                error={errors.nombre} required
                                placeholder="Ej. Mantenimiento general"
                            />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <InputField
                                label="Descripción" name="descripcion" value={data.descripcion}
                                onChange={e => setData('descripcion', e.target.value)}
                                error={errors.descripcion}
                                placeholder="Descripción opcional del servicio"
                            />
                        </div>
                        <InputField
                            label="Precio (S/)" name="precio" value={data.precio} type="number"
                            onChange={e => setData('precio', e.target.value)}
                            error={errors.precio} required placeholder="0.00"
                        />
                        <SelectField
                            label="Local" name="local_id" value={data.local_id}
                            onChange={e => setData('local_id', e.target.value)}
                            options={localesFiltrados.map(l => ({ value: l.id, label: l.nombre }))}
                            placeholder="Todos los locales"
                            error={errors.local_id}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                        <Button variant="cancel" size="md" onClick={() => setModal(false)}>Cancelar</Button>
                        <Button variant="primary" size="md" loading={processing} onClick={guardar}>
                            {editando ? 'Actualizar' : 'Crear Servicio'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}