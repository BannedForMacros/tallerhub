import { useState, useMemo } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { toast, Toaster } from 'react-hot-toast';
import { Plus, Pencil, Power, Landmark } from 'lucide-react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Table from '@/Components/Table';
import Modal from '@/Components/Modal';
import Badge from '@/Components/Badge';
import Button from '@/Components/Button';
import InputField from '@/Components/InputField';
import SelectField from '@/Components/SelectField';
import ActionButton from '@/Components/ActionButton';
import { PageProps, CuentaPago, MetodoPago, Empresa } from '@/types';

interface Props extends PageProps {
    cuentas:  CuentaPago[];
    metodos:  MetodoPago[];
    empresas: Empresa[];
}

export default function CuentasPagoIndex({ cuentas, metodos, empresas }: Props) {
    const { auth } = usePage<Props>().props;
    const esSuperAdmin = auth.user.esSuperAdmin;

    const [modal, setModal]       = useState(false);
    const [editando, setEditando] = useState<CuentaPago | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        empresa_id:     '',
        metodo_pago_id: '',
        nombre:         '',
        numero_cuenta:  '',
        titular:        '',
        moneda:         'PEN' as 'PEN' | 'USD',
    });

    const metodosFiltrados = useMemo(() =>
        esSuperAdmin && data.empresa_id
            ? metodos.filter(m => m.empresa_id === Number(data.empresa_id))
            : metodos
    , [data.empresa_id, metodos]);

    const abrirCrear = () => { reset(); setEditando(null); setModal(true); };

    const abrirEditar = (c: CuentaPago) => {
        setEditando(c);
        setData({
            empresa_id:     String(c.empresa_id),
            metodo_pago_id: String(c.metodo_pago_id),
            nombre:         c.nombre,
            numero_cuenta:  c.numero_cuenta ?? '',
            titular:        c.titular       ?? '',
            moneda:         c.moneda,
        });
        setModal(true);
    };

    const guardar = () => {
        if (editando) {
            put(route('config.cuentas-pago.update', editando.id), {
                onSuccess: () => { setModal(false); toast.success('Cuenta actualizada.'); },
            });
        } else {
            post(route('config.cuentas-pago.store'), {
                onSuccess: () => { setModal(false); reset(); toast.success('Cuenta creada.'); },
            });
        }
    };

    const columns = [
        {
            key: 'nombre', label: 'Cuenta', width: '28%',
            render: (r: CuentaPago) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Landmark size={16} color="#D97706" />
                    </div>
                    <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: '#1E293B' }}>{r.nombre}</p>
                        {r.numero_cuenta && (
                            <p style={{ margin: 0, fontSize: 11, color: '#94A3B8' }}>{r.numero_cuenta}</p>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'metodo', label: 'Método de Pago', width: '18%',
            render: (r: CuentaPago) => (
                <span style={{ backgroundColor: '#EFF6FF', color: '#2563EB', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                    {r.metodo_pago?.nombre ?? '—'}
                </span>
            ),
        },
        {
            key: 'titular', label: 'Titular', width: '16%',
            render: (r: CuentaPago) => <span style={{ fontSize: 13, color: '#64748B' }}>{r.titular ?? '—'}</span>,
        },
        {
            key: 'moneda', label: 'Moneda', width: '9%',
            render: (r: CuentaPago) => (
                <span style={{
                    backgroundColor: r.moneda === 'USD' ? '#F0FDF4' : '#F8FAFC',
                    color: r.moneda === 'USD' ? '#16A34A' : '#475569',
                    padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                }}>
                    {r.moneda}
                </span>
            ),
        },
        ...(esSuperAdmin ? [{
            key: 'empresa', label: 'Empresa', width: '13%',
            render: (r: CuentaPago) => <span style={{ fontSize: 12, color: '#64748B' }}>{r.empresa?.nombre ?? '—'}</span>,
        }] : []),
        {
            key: 'activo', label: 'Estado', width: '8%',
            render: (r: CuentaPago) => <Badge label={r.activo ? 'Activo' : 'Inactivo'} variant={r.activo ? 'success' : 'danger'} />,
        },
        {
            key: 'acciones', label: 'Acciones', width: '10%',
            render: (r: CuentaPago) => (
                <div style={{ display: 'flex', gap: 6 }}>
                    <ActionButton onClick={() => abrirEditar(r)} icon={<Pencil size={13} />} tooltip="Editar" color="amber" />
                    <ActionButton
                        onClick={() => router.patch(
                            route('config.cuentas-pago.toggle', r.id), {},
                            { onSuccess: () => toast.success('Estado actualizado.') }
                        )}
                        icon={<Power size={13} />}
                        tooltip={r.activo ? 'Desactivar' : 'Activar'}
                        color={r.activo ? 'red' : 'green'}
                    />
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Cuentas de Pago" />
            <Toaster position="top-right" />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', margin: 0 }}>Cuentas de Pago</h1>
                    <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 4 }}>
                        Cuentas vinculadas a cada método de pago
                    </p>
                </div>
                <Button variant="primary" size="md" icon={<Plus size={16} />} onClick={abrirCrear}>
                    Nueva Cuenta
                </Button>
            </div>

            <Table columns={columns} data={cuentas} emptyText="No hay cuentas registradas" />

            <Modal
                show={modal}
                onClose={() => setModal(false)}
                title={editando ? 'Editar Cuenta' : 'Nueva Cuenta'}
                maxWidth="sm"
            >
                <div onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && guardar()}>
                    {esSuperAdmin && !editando && (
                        <SelectField
                            label="Empresa" name="empresa_id" value={data.empresa_id}
                            onChange={e => { setData('empresa_id', e.target.value); setData('metodo_pago_id', ''); }}
                            options={empresas.map(e => ({ value: e.id, label: e.nombre }))}
                            placeholder="Selecciona empresa" error={errors.empresa_id} required
                        />
                    )}
                    <SelectField
                        label="Método de Pago" name="metodo_pago_id" value={data.metodo_pago_id}
                        onChange={e => setData('metodo_pago_id', e.target.value)}
                        options={metodosFiltrados.map(m => ({ value: m.id, label: m.nombre }))}
                        placeholder="Selecciona método" error={errors.metodo_pago_id} required
                    />
                    <InputField
                        label="Nombre de la cuenta" name="nombre" value={data.nombre}
                        onChange={e => setData('nombre', e.target.value)}
                        error={errors.nombre} placeholder="Ej. BCP Soles, Caja principal" required
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                        <InputField
                            label="Número de cuenta" name="numero_cuenta" value={data.numero_cuenta}
                            onChange={e => setData('numero_cuenta', e.target.value)}
                            placeholder="Opcional"
                        />
                        <InputField
                            label="Titular" name="titular" value={data.titular}
                            onChange={e => setData('titular', e.target.value)}
                            placeholder="Opcional"
                        />
                    </div>
                    <SelectField
                        label="Moneda" name="moneda" value={data.moneda}
                        onChange={e => setData('moneda', e.target.value as 'PEN' | 'USD')}
                        options={[
                            { value: 'PEN', label: 'Soles (PEN)' },
                            { value: 'USD', label: 'Dólares (USD)' },
                        ]}
                        error={errors.moneda}
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