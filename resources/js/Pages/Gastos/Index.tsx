import { useState } from 'react';
import { router } from '@inertiajs/react';
import { toast, Toaster } from 'react-hot-toast';
import { Plus, Eye, Trash2, Pencil } from 'lucide-react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Table from '@/Components/Table';
import Modal from '@/Components/Modal';
import Badge from '@/Components/Badge';
import Button from '@/Components/Button';
import ActionButton from '@/Components/ActionButton';
import { PageProps } from '@/types';

interface Props extends PageProps { gastos: any[]; }

export default function GastosIndex({ gastos }: Props) {
    const [modalVer, setModalVer] = useState<any | null>(null);

    const confirmarAnular = (g: any) => {
        toast((t) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', margin: 0 }}>¿Anular este gasto?</p>
                <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Esta acción no se puede deshacer.</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => toast.dismiss(t.id)} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #E2E8F0', backgroundColor: '#fff', cursor: 'pointer', fontSize: 13 }}>
                        Cancelar
                    </button>
                    <button onClick={() => {
                        toast.dismiss(t.id);
                        router.patch(route('gastos.toggle', g.id), {}, { onSuccess: () => toast.success('Gasto anulado.') });
                    }} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', backgroundColor: '#DC2626', cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 600 }}>
                        Anular
                    </button>
                </div>
            </div>
        ), { duration: 10000 });
    };

    const columns = [
        {
            key: 'fecha', label: 'Fecha', width: '9%',
            render: (r: any) => <span style={{ fontSize: 12, color: '#64748B' }}>{new Date(r.fecha).toLocaleDateString('es-PE')}</span>,
        },
        {
            key: 'local', label: 'Local', width: '12%',
            render: (r: any) => <span style={{ fontSize: 13 }}>{r.local?.nombre ?? '—'}</span>,
        },
        {
            key: 'concepto', label: 'Concepto', width: '22%',
            render: (r: any) => (
                <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: '#1E293B' }}>
                        {r.descripcion_gasto?.nombre ?? '—'}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: '#94A3B8' }}>
                        {r.descripcion_gasto?.clasificacion?.tipo?.nombre} › {r.descripcion_gasto?.clasificacion?.nombre}
                    </p>
                </div>
            ),
        },
        {
            key: 'monto', label: 'Monto', width: '10%',
            render: (r: any) => <span style={{ fontSize: 13, fontWeight: 700, color: '#DC2626' }}>S/ {Number(r.monto).toFixed(2)}</span>,
        },
        {
            key: 'metodo', label: 'Método', width: '12%',
            render: (r: any) => r.metodo_pago ? (
                <span style={{ backgroundColor: '#EFF6FF', color: '#2563EB', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                    {r.metodo_pago.nombre}
                </span>
            ) : <span style={{ color: '#CBD5E1', fontSize: 12 }}>—</span>,
        },
        {
            key: 'cuenta', label: 'Cuenta', width: '12%',
            render: (r: any) => <span style={{ fontSize: 12, color: '#64748B' }}>{r.cuenta_pago?.nombre ?? '—'}</span>,
        },
        {
            key: 'comprobante', label: 'Comprobante', width: '10%',
            render: (r: any) => <span style={{ fontSize: 12, color: '#64748B' }}>{r.comprobante_numero ?? '—'}</span>,
        },
        {
            key: 'usuario', label: 'Registrado por', width: '10%',
            render: (r: any) => <span style={{ fontSize: 11, color: '#94A3B8' }}>{r.usuario?.name ?? '—'}</span>,
        },
        {
            key: 'activo', label: 'Estado', width: '8%',
            render: (r: any) => <Badge label={r.activo ? 'Activo' : 'Anulado'} variant={r.activo ? 'success' : 'danger'} />,
        },
        {
            key: 'acciones', label: 'Acciones', width: '9%',
            render: (r: any) => (
                <div style={{ display: 'flex', gap: 6 }}>
                    <ActionButton onClick={() => setModalVer(r)} icon={<Eye size={13} />} tooltip="Ver" color="blue" />
                    {r.activo && (
                        <>
                            <Link href={route('gastos.edit', r.id)}>
                                <ActionButton onClick={() => {}} icon={<Pencil size={13} />} tooltip="Editar" color="amber" />
                            </Link>
                            <ActionButton onClick={() => confirmarAnular(r)} icon={<Trash2 size={13} />} tooltip="Anular" color="red" />
                        </>
                    )}
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Gastos" />
            <Toaster position="top-right" />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', margin: 0 }}>Gestión de Gastos</h1>
                    <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 4 }}>Registro de egresos operativos</p>
                </div>
                <Link href={route('gastos.create')}>
                    <Button variant="primary" size="md" icon={<Plus size={16} />}>Registrar Gastos</Button>
                </Link>
            </div>

            <Table columns={columns} data={gastos} emptyText="No hay gastos registrados" />

            {modalVer && (
                <Modal show={!!modalVer} onClose={() => setModalVer(null)} title="Detalle del Gasto" maxWidth="sm">
                    <div>
                        {[
                            ['Fecha',          new Date(modalVer.fecha).toLocaleDateString('es-PE')],
                            ['Local',          modalVer.local?.nombre ?? '—'],
                            ['Categoría',      modalVer.descripcion_gasto?.clasificacion?.tipo?.nombre ?? '—'],
                            ['Clasificación',  modalVer.descripcion_gasto?.clasificacion?.nombre ?? '—'],
                            ['Concepto',       modalVer.descripcion_gasto?.nombre ?? '—'],
                            ['Monto',          `S/ ${Number(modalVer.monto).toFixed(2)}`],
                            ['Método de pago', modalVer.metodo_pago?.nombre ?? '—'],
                            ['Cuenta',         modalVer.cuenta_pago?.nombre ?? '—'],
                            ['Comprobante',    modalVer.comprobante_numero ?? '—'],
                            ['Observaciones',  modalVer.observaciones ?? '—'],
                            ['Registrado por', modalVer.usuario?.name ?? '—'],
                            ['Estado',         modalVer.activo ? 'Activo' : 'Anulado'],
                        ].map(([label, val]) => (
                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                                <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>{label}</span>
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', textAlign: 'right', maxWidth: '60%' }}>{val}</span>
                            </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                            <Button variant="cancel" size="md" onClick={() => setModalVer(null)}>Cerrar</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </AuthenticatedLayout>
    );
}