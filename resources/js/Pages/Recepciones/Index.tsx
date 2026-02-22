import { useState, useMemo } from 'react';
import { useForm, usePage, router } from '@inertiajs/react';
import { toast, Toaster } from 'react-hot-toast';
import { Plus, Pencil, Trash2, RotateCcw, FileText } from 'lucide-react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Table from '@/Components/Table';
import Modal from '@/Components/Modal';
import Badge from '@/Components/Badge';
import Button from '@/Components/Button';
import InputField from '@/Components/InputField';
import SelectField from '@/Components/SelectField';
import ActionButton from '@/Components/ActionButton';
import ClienteForm from '@/Components/ClienteForm';
import { PageProps, Recepcion, Cliente, Local, Usuario, Empresa, ClienteFormData } from '@/types';

interface Props extends PageProps {
    recepciones: Recepcion[];
    empresas: Empresa[];
    clientes: Cliente[];
    locales: Local[];
    tecnicos: Usuario[];
}

const ESTADOS = [
    { value: 'recibido',   label: 'Recibido'   },
    { value: 'en_proceso', label: 'En proceso' },
    { value: 'listo',      label: 'Listo'      },
    { value: 'entregado',  label: 'Entregado'  },
];

const estadoVariant: Record<string, 'info' | 'warning' | 'success' | 'default'> = {
    recibido:   'info',
    en_proceso: 'warning',
    listo:      'success',
    entregado:  'default',
};

export default function RecepcionesIndex({ recepciones, empresas, clientes, locales, tecnicos }: Props) {
    const { auth } = usePage<Props>().props;
    const esSuperAdmin = auth.user.esSuperAdmin;

    const [modal, setModal]               = useState(false);
    const [modalCliente, setModalCliente] = useState(false);
    const [editando, setEditando]         = useState<Recepcion | null>(null);

    const form = useForm({
        empresa_id:              '',
        cliente_id:              '',
        local_id:                '',
        user_id:                 '',
        tipo_equipo:             '',
        marca:                   '',
        modelo:                  '',
        serie:                   '',
        accesorios:              '',
        descripcion_falla:       '',
        observaciones:           '',
        fecha_entrega_estimada:  '',
        estado:                  'recibido',
    });

    const formCliente = useForm<ClienteFormData>({
        nombre: '', dni: '', telefono: '', email: '', direccion: '', empresa_id: '',
    });

    // Filtra clientes, locales y tecnicos según empresa seleccionada (solo superadmin)
    const empresaIdFiltro = esSuperAdmin
        ? (form.data.empresa_id ? Number(form.data.empresa_id) : null)
        : null;

    const clientesFiltrados = useMemo(() =>
        esSuperAdmin && empresaIdFiltro
            ? clientes.filter(c => c.empresa_id === empresaIdFiltro)
            : clientes
    , [form.data.empresa_id, clientes]);

    const localesFiltrados = useMemo(() =>
        esSuperAdmin && empresaIdFiltro
            ? locales.filter(l => l.empresa_id === empresaIdFiltro)
            : locales
    , [form.data.empresa_id, locales]);

    const tecnicosFiltrados = useMemo(() =>
        esSuperAdmin && empresaIdFiltro
            ? tecnicos.filter(t => t.empresa_id === empresaIdFiltro)
            : tecnicos
    , [form.data.empresa_id, tecnicos]);

    const limpiarFiltrosDependientes = () => {
        form.setData(prev => ({
            ...prev,
            cliente_id: '',
            local_id:   '',
            user_id:    '',
        }));
    };

    const abrirCrear = () => {
        setEditando(null);
        form.reset();
        setModal(true);
    };

    const abrirEditar = (r: Recepcion) => {
        setEditando(r);
        form.setData({
            empresa_id:             String(r.empresa_id),
            cliente_id:             String(r.cliente_id),
            local_id:               String(r.local_id),
            user_id:                r.user_id ? String(r.user_id) : '',
            tipo_equipo:            r.tipo_equipo,
            marca:                  r.marca         ?? '',
            modelo:                 r.modelo        ?? '',
            serie:                  r.serie         ?? '',
            accesorios:             r.accesorios    ?? '',
            descripcion_falla:      r.descripcion_falla,
            observaciones:          r.observaciones ?? '',
            fecha_entrega_estimada: r.fecha_entrega_estimada ?? '',
            estado:                 r.estado,
        });
        setModal(true);
    };

    const guardar = () => {
        if (editando) {
            form.put(route('recepciones.update', editando.id), {
                onSuccess: () => { setModal(false); toast.success('Recepción actualizada.'); },
            });
        } else {
            form.post(route('recepciones.store'), {
                onSuccess: () => { setModal(false); form.reset(); toast.success('Recepción creada.'); },
            });
        }
    };

    const guardarCliente = () => {
        formCliente.post(route('clientes.store'), {
            onSuccess: () => {
                setModalCliente(false);
                formCliente.reset();
                toast.success('Cliente creado. Ya puedes seleccionarlo.');
                router.reload({ only: ['clientes'] });
            },
        });
    };

    const confirmarEliminar = (r: Recepcion) => {
        toast((t) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', margin: 0 }}>¿Eliminar recepción?</p>
                <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Se desactivará <strong>{r.codigo}</strong>.</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => toast.dismiss(t.id)} style={{
                        padding: '6px 14px', borderRadius: 8, border: '1px solid #E2E8F0',
                        backgroundColor: '#fff', cursor: 'pointer', fontSize: 13, color: '#64748B',
                    }}>Cancelar</button>
                    <button onClick={() => {
                        toast.dismiss(t.id);
                        router.patch(route('recepciones.toggle', r.id), {}, {
                            onSuccess: () => toast.success('Recepción eliminada.'),
                        });
                    }} style={{
                        padding: '6px 14px', borderRadius: 8, border: 'none',
                        backgroundColor: '#DC2626', cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 600,
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
            key: 'codigo', label: 'Código', width: '10%',
            render: (r: Recepcion) => (
                <span style={{ fontWeight: 700, color: '#2563EB', fontSize: 13 }}>{r.codigo}</span>
            ),
        },
        {
            key: 'cliente', label: 'Cliente', width: '20%',
            render: (r: Recepcion) => (
                <div>
                    <p style={{ margin: 0, fontWeight: 600, color: '#1E293B', fontSize: 13 }}>{r.cliente?.nombre}</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#94A3B8' }}>{r.cliente?.telefono}</p>
                </div>
            ),
        },
        {
            key: 'equipo', label: 'Equipo', width: '18%',
            render: (r: Recepcion) => (
                <div>
                    <p style={{ margin: 0, fontWeight: 600, color: '#1E293B', fontSize: 13 }}>{r.tipo_equipo}</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#94A3B8' }}>
                        {[r.marca, r.modelo].filter(Boolean).join(' — ')}
                    </p>
                </div>
            ),
        },
        {
            key: 'tecnico', label: 'Técnico', width: '14%',
            render: (r: Recepcion) => (
                <span style={{ fontSize: 13, color: '#64748B' }}>{r.tecnico?.name ?? 'Sin asignar'}</span>
            ),
        },
        {
            key: 'fecha_recepcion', label: 'Fecha', width: '10%',
            render: (r: Recepcion) => (
                <span style={{ fontSize: 12, color: '#64748B' }}>
                    {new Date(r.fecha_recepcion).toLocaleDateString('es-PE')}
                </span>
            ),
        },
        {
            key: 'estado', label: 'Estado', width: '12%',
            render: (r: Recepcion) => (
                <Badge
                    label={ESTADOS.find(e => e.value === r.estado)?.label ?? r.estado}
                    variant={estadoVariant[r.estado] ?? 'default'}
                />
            ),
        },
        {
            key: 'acciones', label: 'Acciones', width: '16%',
            render: (r: Recepcion) => (
                <div style={{ display: 'flex', gap: 6 }}>
                    <ActionButton
                        onClick={() => window.open(route('recepciones.pdf', r.id), '_blank')}
                        icon={<FileText size={13} />}
                        tooltip="Ver PDF"
                        color="amber"
                    />
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
                            onClick={() => router.patch(route('recepciones.toggle', r.id), {}, {
                                onSuccess: () => toast.success('Recepción restaurada.'),
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
            <Head title="Recepciones" />
            <Toaster position="top-right" />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', margin: 0 }}>Recepciones</h1>
                    <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 4 }}>
                        Registro de equipos recibidos para servicio técnico
                    </p>
                </div>
                <Button variant="primary" size="md" icon={<Plus size={16} />} onClick={abrirCrear}>
                    Nueva Recepción
                </Button>
            </div>

            <Table columns={columns} data={recepciones} emptyText="No hay recepciones registradas" />

            {/* Modal principal */}
            <Modal
                show={modal}
                onClose={() => setModal(false)}
                title={editando ? `Editar ${editando.codigo}` : 'Nueva Recepción'}
                maxWidth="2xl"
            >
                <div onKeyDown={handleKeyDown}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>

                        {/* Empresa — solo superadmin */}
                        {esSuperAdmin && (
                            <div style={{ gridColumn: '1 / -1' }}>
                                <SelectField
                                    label="Empresa" name="empresa_id" value={form.data.empresa_id}
                                    onChange={e => {
                                        form.setData('empresa_id', e.target.value);
                                        limpiarFiltrosDependientes();
                                    }}
                                    options={empresas.map(e => ({ value: e.id, label: e.nombre }))}
                                    placeholder="Selecciona empresa" error={form.errors.empresa_id} required
                                />
                            </div>
                        )}

                        {/* Cliente con botón crear rápido */}
                        <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                            <div style={{ flex: 1 }}>
                                <SelectField
                                    label="Cliente" name="cliente_id" value={form.data.cliente_id}
                                    onChange={e => form.setData('cliente_id', e.target.value)}
                                    options={clientesFiltrados.map(c => ({
                                        value: c.id,
                                        label: `${c.nombre}${c.dni ? ' — ' + c.dni : ''}`,
                                    }))}
                                    placeholder="Selecciona cliente" error={form.errors.cliente_id} required
                                />
                            </div>
                            <div style={{ marginBottom: 18 }}>
                                <Button variant="primary" size="md" icon={<Plus size={14} />} onClick={() => setModalCliente(true)}>
                                    Nuevo
                                </Button>
                            </div>
                        </div>

                        <SelectField
                            label="Local" name="local_id" value={form.data.local_id}
                            onChange={e => form.setData('local_id', e.target.value)}
                            options={localesFiltrados.map(l => ({ value: l.id, label: l.nombre }))}
                            placeholder="Selecciona local" error={form.errors.local_id} required
                        />
                        <SelectField
                            label="Técnico asignado" name="user_id" value={form.data.user_id}
                            onChange={e => form.setData('user_id', e.target.value)}
                            options={tecnicosFiltrados.map(t => ({ value: t.id, label: t.name }))}
                            placeholder="Sin asignar" error={form.errors.user_id}
                        />

                        <InputField
                            label="Tipo de equipo" name="tipo_equipo" value={form.data.tipo_equipo}
                            onChange={e => form.setData('tipo_equipo', e.target.value)}
                            error={form.errors.tipo_equipo} required placeholder="Ej. Laptop, Celular, TV"
                        />
                        <InputField
                            label="Marca" name="marca" value={form.data.marca}
                            onChange={e => form.setData('marca', e.target.value)}
                            error={form.errors.marca} placeholder="Ej. Samsung, HP"
                        />
                        <InputField
                            label="Modelo" name="modelo" value={form.data.modelo}
                            onChange={e => form.setData('modelo', e.target.value)}
                            error={form.errors.modelo} placeholder="Ej. Galaxy S21"
                        />
                        <InputField
                            label="Número de serie" name="serie" value={form.data.serie}
                            onChange={e => form.setData('serie', e.target.value)}
                            error={form.errors.serie} placeholder="Número de serie"
                        />
                        <div style={{ gridColumn: '1 / -1' }}>
                            <InputField
                                label="Accesorios entregados" name="accesorios" value={form.data.accesorios}
                                onChange={e => form.setData('accesorios', e.target.value)}
                                error={form.errors.accesorios} placeholder="Ej. Cargador, funda, caja"
                            />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#1E293B', marginBottom: 7 }}>
                                Descripción de falla <span style={{ color: '#EF4444' }}>*</span>
                            </label>
                            <textarea
                                value={form.data.descripcion_falla}
                                onChange={e => form.setData('descripcion_falla', e.target.value)}
                                rows={3}
                                placeholder="Describe el problema reportado por el cliente..."
                                style={{
                                    width: '100%', padding: '10px 14px', borderRadius: 10,
                                    border: `1.5px solid ${form.errors.descripcion_falla ? '#EF4444' : '#E2E8F0'}`,
                                    fontSize: 14, color: '#1E293B', resize: 'vertical',
                                    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                                }}
                            />
                            {form.errors.descripcion_falla && (
                                <p style={{ fontSize: 13, color: '#EF4444', marginTop: 4 }}>{form.errors.descripcion_falla}</p>
                            )}
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#1E293B', marginBottom: 7 }}>
                                Observaciones
                            </label>
                            <textarea
                                value={form.data.observaciones}
                                onChange={e => form.setData('observaciones', e.target.value)}
                                rows={2}
                                placeholder="Observaciones adicionales..."
                                style={{
                                    width: '100%', padding: '10px 14px', borderRadius: 10,
                                    border: '1.5px solid #E2E8F0', fontSize: 14, color: '#1E293B',
                                    resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                                }}
                            />
                        </div>
                        <InputField
                            label="Fecha entrega estimada" name="fecha_entrega_estimada"
                            value={form.data.fecha_entrega_estimada} type="date"
                            onChange={e => form.setData('fecha_entrega_estimada', e.target.value)}
                            error={form.errors.fecha_entrega_estimada}
                        />
                        {editando && (
                            <SelectField
                                label="Estado" name="estado" value={form.data.estado}
                                onChange={e => form.setData('estado', e.target.value)}
                                options={ESTADOS.map(e => ({ value: e.value, label: e.label }))}
                                error={form.errors.estado}
                            />
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                        <Button variant="cancel" size="md" onClick={() => setModal(false)}>Cancelar</Button>
                        <Button variant="primary" size="md" loading={form.processing} onClick={guardar}>
                            {editando ? 'Actualizar' : 'Crear Recepción'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal crear cliente rápido */}
            <Modal
                show={modalCliente}
                onClose={() => setModalCliente(false)}
                title="Nuevo Cliente"
                maxWidth="md"
            >
                <ClienteForm
                    form={formCliente}
                    onGuardar={guardarCliente}
                    onCancelar={() => setModalCliente(false)}
                    empresas={empresas}
                    esSuperAdmin={esSuperAdmin}
                />
            </Modal>
        </AuthenticatedLayout>
    );
}