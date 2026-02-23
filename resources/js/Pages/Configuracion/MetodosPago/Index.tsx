import { useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { toast, Toaster } from 'react-hot-toast';
import { Plus, Pencil, Power, CreditCard } from 'lucide-react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Table from '@/Components/Table';
import Modal from '@/Components/Modal';
import Badge from '@/Components/Badge';
import Button from '@/Components/Button';
import InputField from '@/Components/InputField';
import SelectField from '@/Components/SelectField';
import ActionButton from '@/Components/ActionButton';
import { PageProps, MetodoPago, Empresa } from '@/types';

interface Props extends PageProps {
    metodos:  MetodoPago[];
    empresas: Empresa[];
}

const ICONOS = [
    { value: 'cash',        label: 'Efectivo' },
    { value: 'smartphone',  label: 'Billetera digital' },
    { value: 'credit-card', label: 'Tarjeta' },
    { value: 'landmark',    label: 'Banco' },
    { value: 'repeat',      label: 'Transferencia' },
    { value: 'wallet',      label: 'Billetera' },
];

export default function MetodosPagoIndex({ metodos, empresas }: Props) {
    const { auth } = usePage<Props>().props;
    const esSuperAdmin = auth.user.esSuperAdmin;

    const [modal, setModal]         = useState(false);
    const [editando, setEditando]   = useState<MetodoPago | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        empresa_id: '',
        nombre:     '',
        icono:      'cash',
    });

    const abrirCrear = () => {
        reset(); setEditando(null); setModal(true);
    };

    const abrirEditar = (m: MetodoPago) => {
        setEditando(m);
        setData({ empresa_id: String(m.empresa_id), nombre: m.nombre, icono: m.icono ?? 'cash' });
        setModal(true);
    };

    const guardar = () => {
        if (editando) {
            put(route('config.metodos-pago.update', editando.id), {
                onSuccess: () => { setModal(false); toast.success('Método actualizado.'); },
            });
        } else {
            post(route('config.metodos-pago.store'), {
                onSuccess: () => { setModal(false); reset(); toast.success('Método creado.'); },
            });
        }
    };

    const columns = [
        {
            key: 'nombre', label: 'Método de Pago', width: '35%',
            render: (r: MetodoPago) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CreditCard size={16} color="#2563EB" />
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 13, color: '#1E293B' }}>{r.nombre}</span>
                </div>
            ),
        },
        {
            key: 'cuentas', label: 'Cuentas vinculadas', width: '25%',
            render: (r: MetodoPago) => (
                <span style={{ backgroundColor: '#F1F5F9', color: '#475569', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                    {r.cuentas?.length ?? 0} cuenta(s)
                </span>
            ),
        },
        ...(esSuperAdmin ? [{
            key: 'empresa', label: 'Empresa', width: '20%',
            render: (r: MetodoPago) => <span style={{ fontSize: 13, color: '#64748B' }}>{r.empresa?.nombre ?? '—'}</span>,
        }] : []),
        {
            key: 'activo', label: 'Estado', width: '10%',
            render: (r: MetodoPago) => <Badge label={r.activo ? 'Activo' : 'Inactivo'} variant={r.activo ? 'success' : 'danger'} />,
        },
        {
            key: 'acciones', label: 'Acciones', width: '10%',
            render: (r: MetodoPago) => (
                <div style={{ display: 'flex', gap: 6 }}>
                    <ActionButton onClick={() => abrirEditar(r)} icon={<Pencil size={13} />} tooltip="Editar" color="amber" />
                    <ActionButton
                        onClick={() => router.patch(route('config.metodos-pago.toggle', r.id), {}, { onSuccess: () => toast.success('Estado actualizado.') })}
                        icon={<Power size={13} />} tooltip={r.activo ? 'Desactivar' : 'Activar'}
                        color={r.activo ? 'red' : 'green'}
                    />
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Métodos de Pago" />
            <Toaster position="top-right" />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', margin: 0 }}>Métodos de Pago</h1>
                    <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 4 }}>Configura los métodos de pago disponibles</p>
                </div>
                <Button variant="primary" size="md" icon={<Plus size={16} />} onClick={abrirCrear}>Nuevo Método</Button>
            </div>

            <Table columns={columns} data={metodos} emptyText="No hay métodos de pago registrados" />

            <Modal show={modal} onClose={() => setModal(false)} title={editando ? 'Editar Método' : 'Nuevo Método de Pago'} maxWidth="sm">
                <div onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && guardar()}>
                    {esSuperAdmin && !editando && (
                        <SelectField
                            label="Empresa" name="empresa_id" value={data.empresa_id}
                            onChange={e => setData('empresa_id', e.target.value)}
                            options={empresas.map(e => ({ value: e.id, label: e.nombre }))}
                            placeholder="Selecciona empresa" error={errors.empresa_id} required
                        />
                    )}
                    <InputField
                        label="Nombre" name="nombre" value={data.nombre}
                        onChange={e => setData('nombre', e.target.value)}
                        error={errors.nombre} placeholder="Ej. Efectivo, Yape, BCP"
                        required
                    />
                    <SelectField
                        label="Ícono" name="icono" value={data.icono}
                        onChange={e => setData('icono', e.target.value)}
                        options={ICONOS.map(i => ({ value: i.value, label: i.label }))}
                        error={errors.icono}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                        <Button variant="cancel" size="md" onClick={() => setModal(false)}>Cancelar</Button>
                        <Button variant="primary" size="md" loading={processing} onClick={guardar}>
                            {editando ? 'Guardar' : 'Crear'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}