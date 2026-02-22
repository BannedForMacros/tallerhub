import { useState } from 'react';
import { useForm, usePage, router } from '@inertiajs/react';
import { toast, Toaster } from 'react-hot-toast';
import { Plus, Pencil, Trash2, RotateCcw, Tag, Layers, FileText } from 'lucide-react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Table from '@/Components/Table';
import Modal from '@/Components/Modal';
import Badge from '@/Components/Badge';
import Button from '@/Components/Button';
import InputField from '@/Components/InputField';
import SelectField from '@/Components/SelectField';
import ActionButton from '@/Components/ActionButton';
import { PageProps, Empresa, TipoGasto, ClasificacionGasto, DescripcionGasto } from '@/types';

interface Props extends PageProps {
    tipos: TipoGasto[];
    clasificaciones: ClasificacionGasto[];
    descripciones: DescripcionGasto[];
    empresas: Empresa[];
}

type Tab = 'tipos' | 'clasificaciones' | 'descripciones';

const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'tipos',           label: 'Tipos de Gasto',  icon: <Tag size={15} />      },
    { key: 'clasificaciones', label: 'Clasificaciones', icon: <Layers size={15} />   },
    { key: 'descripciones',   label: 'Descripciones',   icon: <FileText size={15} /> },
];

function useConfirmar() {
    return (nombre: string, onConfirm: () => void) => {
        toast((t) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', margin: 0 }}>¿Eliminar registro?</p>
                <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Se desactivará <strong>{nombre}</strong>.</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => toast.dismiss(t.id)} style={{
                        padding: '6px 14px', borderRadius: 8, border: '1px solid #E2E8F0',
                        backgroundColor: '#fff', cursor: 'pointer', fontSize: 13, color: '#64748B',
                    }}>Cancelar</button>
                    <button onClick={() => { toast.dismiss(t.id); onConfirm(); }} style={{
                        padding: '6px 14px', borderRadius: 8, border: 'none',
                        backgroundColor: '#DC2626', cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 600,
                    }}>Sí, eliminar</button>
                </div>
            </div>
        ), { duration: 10000 });
    };
}

export default function GastosIndex({ tipos, clasificaciones, descripciones, empresas }: Props) {
    const { auth } = usePage<Props>().props;
    const esSuperAdmin = auth.user.esSuperAdmin;
    const confirmar = useConfirmar();

    const [tab,   setTab]   = useState<Tab>('tipos');
    const [modal, setModal] = useState(false);

    const [editTipo,  setEditTipo]  = useState<TipoGasto | null>(null);
    const [editClasi, setEditClasi] = useState<ClasificacionGasto | null>(null);
    const [editDesc,  setEditDesc]  = useState<DescripcionGasto | null>(null);

    const fTipo  = useForm({ nombre: '', empresa_id: '' });
    const fClasi = useForm({ nombre: '', empresa_id: '', tipo_gasto_id: '' });
    const fDesc  = useForm({ nombre: '', empresa_id: '', tipo_gasto_id: '', clasificacion_gasto_id: '' });

    const tiposFiltradosClasi = tipos.filter(t =>
        fClasi.data.empresa_id ? t.empresa_id === Number(fClasi.data.empresa_id) : true
    );

    const tiposFiltradosDesc = tipos.filter(t =>
        fDesc.data.empresa_id ? t.empresa_id === Number(fDesc.data.empresa_id) : true
    );

    const clasiFiltradas = clasificaciones.filter(c =>
        fDesc.data.tipo_gasto_id ? c.tipo_gasto_id === Number(fDesc.data.tipo_gasto_id) : true
    );

    // ── ABRIR MODALES ─────────────────────────────────
    const abrirNuevo = () => {
        setEditTipo(null); setEditClasi(null); setEditDesc(null);
        fTipo.reset(); fClasi.reset(); fDesc.reset();
        setModal(true);
    };

    const abrirEditarTipo = (t: TipoGasto) => {
        setEditTipo(t); setEditClasi(null); setEditDesc(null);
        fTipo.setData({ nombre: t.nombre, empresa_id: String(t.empresa_id) });
        setTab('tipos');
        setModal(true);
    };

    const abrirEditarClasi = (c: ClasificacionGasto) => {
        setEditTipo(null); setEditClasi(c); setEditDesc(null);
        fClasi.setData({ nombre: c.nombre, empresa_id: String(c.empresa_id), tipo_gasto_id: String(c.tipo_gasto_id) });
        setTab('clasificaciones');
        setModal(true);
    };

    const abrirEditarDesc = (d: DescripcionGasto) => {
        setEditTipo(null); setEditClasi(null); setEditDesc(d);
        const clasi = clasificaciones.find(c => c.id === d.clasificacion_gasto_id);
        fDesc.setData({
            nombre:                  d.nombre,
            empresa_id:              String(d.empresa_id),
            tipo_gasto_id:           clasi ? String(clasi.tipo_gasto_id) : '',
            clasificacion_gasto_id:  String(d.clasificacion_gasto_id),
        });
        setTab('descripciones');
        setModal(true);
    };

    // ── GUARDAR ───────────────────────────────────────
    const guardarActual = () => {
        if (tab === 'tipos')           guardarTipo();
        else if (tab === 'clasificaciones') guardarClasi();
        else                           guardarDesc();
    };

    const guardarTipo = () => {
        if (editTipo) {
            fTipo.put(route('configuracion.tipos-gasto.update', editTipo.id), {
                onSuccess: () => { setModal(false); toast.success('Tipo actualizado.'); },
            });
        } else {
            fTipo.post(route('configuracion.tipos-gasto.store'), {
                onSuccess: () => { setModal(false); fTipo.reset(); toast.success('Tipo creado.'); },
            });
        }
    };

    const guardarClasi = () => {
        if (editClasi) {
            fClasi.put(route('configuracion.clasificacion-gasto.update', editClasi.id), {
                onSuccess: () => { setModal(false); toast.success('Clasificación actualizada.'); },
            });
        } else {
            fClasi.post(route('configuracion.clasificacion-gasto.store'), {
                onSuccess: () => { setModal(false); fClasi.reset(); toast.success('Clasificación creada.'); },
            });
        }
    };

    const guardarDesc = () => {
        if (editDesc) {
            fDesc.put(route('configuracion.descripcion-gasto.update', editDesc.id), {
                onSuccess: () => { setModal(false); toast.success('Descripción actualizada.'); },
            });
        } else {
            fDesc.post(route('configuracion.descripcion-gasto.store'), {
                onSuccess: () => { setModal(false); fDesc.reset(); toast.success('Descripción creada.'); },
            });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') guardarActual(); };

    const procesando = tab === 'tipos'
        ? fTipo.processing
        : tab === 'clasificaciones'
        ? fClasi.processing
        : fDesc.processing;

    const editandoActual = tab === 'tipos' ? editTipo : tab === 'clasificaciones' ? editClasi : editDesc;

    // ── COLUMNAS ──────────────────────────────────────
    const colsTipo = [
        {
            key: 'nombre', label: 'Tipo de Gasto', width: '40%',
            render: (r: TipoGasto) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Tag size={13} color="#D97706" />
                    </div>
                    <span style={{ fontWeight: 600, color: '#1E293B' }}>{r.nombre}</span>
                </div>
            ),
        },
        {
            key: 'empresa', label: 'Empresa', width: '30%',
            render: (r: TipoGasto) => (
                <span style={{ fontSize: 13, color: '#64748B' }}>
                    {empresas.find(e => e.id === r.empresa_id)?.nombre ?? '—'}
                </span>
            ),
        },
        {
            key: 'activo', label: 'Estado', width: '15%',
            render: (r: TipoGasto) => <Badge label={r.activo ? 'Activo' : 'Inactivo'} variant={r.activo ? 'success' : 'danger'} />,
        },
        {
            key: 'acciones', label: 'Acciones', width: '15%',
            render: (r: TipoGasto) => (
                <div style={{ display: 'flex', gap: 6 }}>
                    <ActionButton onClick={() => abrirEditarTipo(r)} icon={<Pencil size={13} />} tooltip="Editar" color="blue" />
                    {r.activo
                        ? <ActionButton onClick={() => confirmar(r.nombre, () => router.patch(route('configuracion.tipos-gasto.toggle', r.id), {}, { onSuccess: () => toast.success('Eliminado.') }))} icon={<Trash2 size={13} />} tooltip="Eliminar" color="red" />
                        : <ActionButton onClick={() => router.patch(route('configuracion.tipos-gasto.toggle', r.id), {}, { onSuccess: () => toast.success('Restaurado.') })} icon={<RotateCcw size={13} />} tooltip="Restaurar" color="green" />
                    }
                </div>
            ),
        },
    ];

    const colsClasi = [
        {
            key: 'nombre', label: 'Clasificación', width: '30%',
            render: (r: ClasificacionGasto) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Layers size={13} color="#2563EB" />
                    </div>
                    <span style={{ fontWeight: 600, color: '#1E293B' }}>{r.nombre}</span>
                </div>
            ),
        },
        {
            key: 'tipo', label: 'Tipo de Gasto', width: '25%',
            render: (r: ClasificacionGasto) => (
                <span style={{ fontSize: 13, color: '#64748B' }}>{r.tipo_gasto?.nombre ?? '—'}</span>
            ),
        },
        {
            key: 'empresa', label: 'Empresa', width: '20%',
            render: (r: ClasificacionGasto) => (
                <span style={{ fontSize: 13, color: '#64748B' }}>{empresas.find(e => e.id === r.empresa_id)?.nombre ?? '—'}</span>
            ),
        },
        {
            key: 'activo', label: 'Estado', width: '12%',
            render: (r: ClasificacionGasto) => <Badge label={r.activo ? 'Activo' : 'Inactivo'} variant={r.activo ? 'success' : 'danger'} />,
        },
        {
            key: 'acciones', label: 'Acciones', width: '13%',
            render: (r: ClasificacionGasto) => (
                <div style={{ display: 'flex', gap: 6 }}>
                    <ActionButton onClick={() => abrirEditarClasi(r)} icon={<Pencil size={13} />} tooltip="Editar" color="blue" />
                    {r.activo
                        ? <ActionButton onClick={() => confirmar(r.nombre, () => router.patch(route('configuracion.clasificacion-gasto.toggle', r.id), {}, { onSuccess: () => toast.success('Eliminado.') }))} icon={<Trash2 size={13} />} tooltip="Eliminar" color="red" />
                        : <ActionButton onClick={() => router.patch(route('configuracion.clasificacion-gasto.toggle', r.id), {}, { onSuccess: () => toast.success('Restaurado.') })} icon={<RotateCcw size={13} />} tooltip="Restaurar" color="green" />
                    }
                </div>
            ),
        },
    ];

    const colsDesc = [
        {
            key: 'nombre', label: 'Descripción', width: '28%',
            render: (r: DescripcionGasto) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={13} color="#16A34A" />
                    </div>
                    <span style={{ fontWeight: 600, color: '#1E293B' }}>{r.nombre}</span>
                </div>
            ),
        },
        {
            key: 'clasificacion', label: 'Clasificación', width: '22%',
            render: (r: DescripcionGasto) => <span style={{ fontSize: 13, color: '#64748B' }}>{r.clasificacion?.nombre ?? '—'}</span>,
        },
        {
            key: 'tipo', label: 'Tipo', width: '18%',
            render: (r: DescripcionGasto) => <span style={{ fontSize: 13, color: '#64748B' }}>{r.clasificacion?.tipo_gasto?.nombre ?? '—'}</span>,
        },
        {
            key: 'activo', label: 'Estado', width: '12%',
            render: (r: DescripcionGasto) => <Badge label={r.activo ? 'Activo' : 'Inactivo'} variant={r.activo ? 'success' : 'danger'} />,
        },
        {
            key: 'acciones', label: 'Acciones', width: '20%',
            render: (r: DescripcionGasto) => (
                <div style={{ display: 'flex', gap: 6 }}>
                    <ActionButton onClick={() => abrirEditarDesc(r)} icon={<Pencil size={13} />} tooltip="Editar" color="blue" />
                    {r.activo
                        ? <ActionButton onClick={() => confirmar(r.nombre, () => router.patch(route('configuracion.descripcion-gasto.toggle', r.id), {}, { onSuccess: () => toast.success('Eliminado.') }))} icon={<Trash2 size={13} />} tooltip="Eliminar" color="red" />
                        : <ActionButton onClick={() => router.patch(route('configuracion.descripcion-gasto.toggle', r.id), {}, { onSuccess: () => toast.success('Restaurado.') })} icon={<RotateCcw size={13} />} tooltip="Restaurar" color="green" />
                    }
                </div>
            ),
        },
    ];

    const tituloModal = () => {
        const prefijo = editandoActual ? 'Editar' : 'Nuevo';
        if (tab === 'tipos')           return `${prefijo} Tipo de Gasto`;
        if (tab === 'clasificaciones') return `${prefijo} Clasificación`;
        return `${prefijo} Descripción`;
    };

    return (
        <AuthenticatedLayout>
            <Head title="Gestión de Gastos" />
            <Toaster position="top-right" />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', margin: 0 }}>Gestión de Gastos</h1>
                    <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 4 }}>Configura tipos, clasificaciones y descripciones</p>
                </div>
                <Button variant="primary" size="md" icon={<Plus size={16} />} onClick={abrirNuevo}>
                    {tab === 'tipos' ? 'Nuevo Tipo' : tab === 'clasificaciones' ? 'Nueva Clasificación' : 'Nueva Descripción'}
                </Button>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex', gap: 4, marginBottom: 20,
                backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4,
                width: 'fit-content',
            }}>
                {tabs.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 7,
                            padding: '8px 18px', borderRadius: 9, border: 'none',
                            cursor: 'pointer', fontSize: 14, fontWeight: 600,
                            transition: 'all 0.2s',
                            backgroundColor: tab === t.key ? '#fff' : 'transparent',
                            color: tab === t.key ? '#1E293B' : '#94A3B8',
                            boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                        }}
                    >
                        {t.icon}
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'tipos'           && <Table columns={colsTipo}  data={tipos}          emptyText="No hay tipos de gasto" />}
            {tab === 'clasificaciones' && <Table columns={colsClasi} data={clasificaciones} emptyText="No hay clasificaciones" />}
            {tab === 'descripciones'   && <Table columns={colsDesc}  data={descripciones}  emptyText="No hay descripciones" />}

            <Modal show={modal} onClose={() => setModal(false)} title={tituloModal()} maxWidth="md">
                <div onKeyDown={handleKeyDown}>
                    {tab === 'tipos' && (
                        <>
                            {esSuperAdmin && (
                                <SelectField label="Empresa" name="empresa_id" value={fTipo.data.empresa_id}
                                    onChange={e => fTipo.setData('empresa_id', e.target.value)}
                                    options={empresas.map(e => ({ value: e.id, label: e.nombre }))}
                                    placeholder="Selecciona empresa" error={fTipo.errors.empresa_id} required />
                            )}
                            <InputField label="Nombre" name="nombre" value={fTipo.data.nombre}
                                onChange={e => fTipo.setData('nombre', e.target.value)}
                                error={fTipo.errors.nombre} required placeholder="Ej. Operativo" />
                        </>
                    )}

                    {tab === 'clasificaciones' && (
                        <>
                            {esSuperAdmin && (
                                <SelectField label="Empresa" name="empresa_id" value={fClasi.data.empresa_id}
                                    onChange={e => { fClasi.setData('empresa_id', e.target.value); fClasi.setData('tipo_gasto_id', ''); }}
                                    options={empresas.map(e => ({ value: e.id, label: e.nombre }))}
                                    placeholder="Selecciona empresa" error={fClasi.errors.empresa_id} required />
                            )}
                            <SelectField label="Tipo de Gasto" name="tipo_gasto_id" value={fClasi.data.tipo_gasto_id}
                                onChange={e => fClasi.setData('tipo_gasto_id', e.target.value)}
                                options={tiposFiltradosClasi.map(t => ({ value: t.id, label: t.nombre }))}
                                placeholder="Selecciona tipo" error={fClasi.errors.tipo_gasto_id} required />
                            <InputField label="Nombre" name="nombre" value={fClasi.data.nombre}
                                onChange={e => fClasi.setData('nombre', e.target.value)}
                                error={fClasi.errors.nombre} required placeholder="Ej. Servicios básicos" />
                        </>
                    )}

                    {tab === 'descripciones' && (
                        <>
                            {esSuperAdmin && (
                                <SelectField label="Empresa" name="empresa_id" value={fDesc.data.empresa_id}
                                    onChange={e => { fDesc.setData('empresa_id', e.target.value); fDesc.setData('tipo_gasto_id', ''); fDesc.setData('clasificacion_gasto_id', ''); }}
                                    options={empresas.map(e => ({ value: e.id, label: e.nombre }))}
                                    placeholder="Selecciona empresa" error={fDesc.errors.empresa_id} required />
                            )}
                            <SelectField label="Tipo de Gasto" name="tipo_gasto_id" value={fDesc.data.tipo_gasto_id}
                                onChange={e => { fDesc.setData('tipo_gasto_id', e.target.value); fDesc.setData('clasificacion_gasto_id', ''); }}
                                options={tiposFiltradosDesc.map(t => ({ value: t.id, label: t.nombre }))}
                                placeholder="Selecciona tipo" error={fDesc.errors.tipo_gasto_id} required />
                            <SelectField label="Clasificación" name="clasificacion_gasto_id" value={fDesc.data.clasificacion_gasto_id}
                                onChange={e => fDesc.setData('clasificacion_gasto_id', e.target.value)}
                                options={clasiFiltradas.map(c => ({ value: c.id, label: c.nombre }))}
                                placeholder="Selecciona clasificación" error={fDesc.errors.clasificacion_gasto_id} required />
                            <InputField label="Nombre" name="nombre" value={fDesc.data.nombre}
                                onChange={e => fDesc.setData('nombre', e.target.value)}
                                error={fDesc.errors.nombre} required placeholder="Ej. Luz eléctrica" />
                        </>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                        <Button variant="cancel" size="md" onClick={() => setModal(false)}>Cancelar</Button>
                        <Button variant="primary" size="md" loading={procesando} onClick={guardarActual}>
                            {editandoActual ? 'Actualizar' : 'Crear'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}