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
import { PageProps, Venta } from '@/types';

interface Props extends PageProps {
    ventas: Venta[];
}

const ESTADO_COLORS: Record<string, 'success' | 'warning' | 'danger'> = {
    pagado:   'success',
    pendiente:'warning',
    anulado:  'danger',
};

const ESTADO_LABELS: Record<string, string> = {
    pagado:    'Pagado',
    pendiente: 'Pendiente',
    anulado:   'Anulado',
};

export default function VentasIndex({ ventas }: Props) {
    const [modalVer, setModalVer] = useState<Venta | null>(null);

    const confirmarAnular = (v: Venta) => {
        toast((t) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', margin: 0 }}>¿Anular venta {v.codigo}?</p>
                <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Esta acción no se puede deshacer.</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => toast.dismiss(t.id)} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #E2E8F0', backgroundColor: '#fff', cursor: 'pointer', fontSize: 13 }}>
                        Cancelar
                    </button>
                    <button onClick={() => {
                        toast.dismiss(t.id);
                        router.patch(route('ventas.toggle', v.id), {}, {
                            onSuccess: () => toast.success('Venta anulada.'),
                        });
                    }} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', backgroundColor: '#DC2626', cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 600 }}>
                        Anular
                    </button>
                </div>
            </div>
        ), { duration: 10000 });
    };

    const columns = [
        {
            key: 'codigo', label: 'Código', width: '10%',
            render: (r: Venta) => (
                <span style={{ fontWeight: 700, color: '#16A34A', fontSize: 13 }}>{r.codigo}</span>
            ),
        },
        {
            key: 'cliente', label: 'Cliente', width: '16%',
            render: (r: Venta) => (
                <span style={{ fontSize: 13 }}>{r.cliente?.nombre ?? <span style={{ color: '#94A3B8' }}>Sin cliente</span>}</span>
            ),
        },
        {
            key: 'recepcion', label: 'Recepción', width: '12%',
            render: (r: Venta) => r.recepcion ? (
                <span style={{ backgroundColor: '#EFF6FF', color: '#2563EB', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                    {r.recepcion.codigo}
                </span>
            ) : <span style={{ color: '#CBD5E1', fontSize: 12 }}>—</span>,
        },
        {
            key: 'detalles', label: 'Ítems', width: '8%',
            render: (r: Venta) => (
                <span style={{ backgroundColor: '#F1F5F9', color: '#475569', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                    {r.detalles?.length ?? 0}
                </span>
            ),
        },
        {
            key: 'descuento', label: 'Descuento', width: '9%',
            render: (r: Venta) => Number(r.descuento) > 0
                ? <span style={{ fontSize: 12, color: '#EF4444', fontWeight: 600 }}>- S/ {Number(r.descuento).toFixed(2)}</span>
                : <span style={{ color: '#CBD5E1', fontSize: 12 }}>—</span>,
        },
        {
            key: 'total', label: 'Total', width: '10%',
            render: (r: Venta) => (
                <span style={{ fontSize: 13, fontWeight: 700, color: '#16A34A' }}>S/ {Number(r.total).toFixed(2)}</span>
            ),
        },
        {
            key: 'usuario', label: 'Registrado por', width: '12%',
            render: (r: Venta) => <span style={{ fontSize: 12, color: '#64748B' }}>{r.usuario?.name ?? '—'}</span>,
        },
        {
            key: 'fecha', label: 'Fecha', width: '10%',
            render: (r: Venta) => (
                <span style={{ fontSize: 12, color: '#64748B' }}>
                    {new Date(r.fecha).toLocaleDateString('es-PE')}
                </span>
            ),
        },
        {
            key: 'estado', label: 'Estado', width: '9%',
            render: (r: Venta) => (
                <Badge label={ESTADO_LABELS[r.estado] ?? r.estado} variant={ESTADO_COLORS[r.estado] ?? 'default'} />
            ),
        },
        {
            key: 'acciones', label: 'Acciones', width: '12%',
            render: (r: Venta) => (
                <div style={{ display: 'flex', gap: 6 }}>
                    <ActionButton onClick={() => setModalVer(r)} icon={<Eye size={13} />} tooltip="Ver detalle" color="blue" />
                    {r.activo && r.estado !== 'anulado' && (
                        <>
                            <Link href={route('ventas.edit', r.id)}>
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
            <Head title="Ventas" />
            <Toaster position="top-right" />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', margin: 0 }}>Ventas</h1>
                    <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 4 }}>
                        Registro de ventas de servicios y productos
                    </p>
                </div>
                <Link href={route('ventas.create')}>
                    <Button variant="primary" size="md" icon={<Plus size={16} />}>Nueva Venta</Button>
                </Link>
            </div>

            <Table columns={columns} data={ventas} emptyText="No hay ventas registradas" />

            {/* Modal Ver Detalle */}
            {modalVer && (
                <Modal show={!!modalVer} onClose={() => setModalVer(null)} title={`Venta — ${modalVer.codigo}`} maxWidth="2xl">
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px 16px', marginBottom: 16 }}>
                            {[
                                ['Cliente',        modalVer.cliente?.nombre ?? '—'],
                                ['Local',          modalVer.local?.nombre ?? '—'],
                                ['Recepción',      modalVer.recepcion?.codigo ?? '—'],
                                ['Fecha',          new Date(modalVer.fecha).toLocaleDateString('es-PE')],
                                ['Estado',         ESTADO_LABELS[modalVer.estado] ?? modalVer.estado],
                                ['Registrado por', modalVer.usuario?.name ?? '—'],
                            ].map(([label, val]) => (
                                <div key={label}>
                                    <p style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', margin: '0 0 2px' }}>{label}</p>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', margin: 0 }}>{val}</p>
                                </div>
                            ))}
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr style={{ backgroundColor: '#1E293B' }}>
                                    {['Tipo', 'Descripción', 'Cant.', 'P. Costo Ref.', 'P. Venta', 'Subtotal'].map(h => (
                                        <th key={h} style={{ padding: '8px 10px', color: '#fff', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', textAlign: 'left' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {modalVer.detalles?.map((d, i) => (
                                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#F8FAFC' : '#fff' }}>
                                        <td style={{ padding: '7px 10px' }}>
                                            <span style={{
                                                padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                                                backgroundColor: d.tipo === 'servicio' ? '#EFF6FF' : '#FFF7ED',
                                                color: d.tipo === 'servicio' ? '#2563EB' : '#D97706',
                                            }}>
                                                {d.tipo === 'servicio' ? 'Servicio' : 'Producto'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '7px 10px', fontWeight: 600 }}>{d.descripcion}</td>
                                        <td style={{ padding: '7px 10px', color: '#64748B' }}>{Number(d.cantidad).toFixed(2)}</td>
                                        <td style={{ padding: '7px 10px', color: '#94A3B8', fontSize: 12 }}>
                                            {Number(d.precio_costo_ref) > 0 ? `S/ ${Number(d.precio_costo_ref).toFixed(2)}` : '—'}
                                        </td>
                                        <td style={{ padding: '7px 10px', color: '#1E293B', fontWeight: 600 }}>S/ {Number(d.precio_unitario).toFixed(2)}</td>
                                        <td style={{ padding: '7px 10px', fontWeight: 700, color: '#16A34A' }}>S/ {Number(d.subtotal).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr style={{ backgroundColor: '#F8FAFC' }}>
                                    <td colSpan={5} style={{ padding: '7px 10px', textAlign: 'right', color: '#64748B' }}>Subtotal</td>
                                    <td style={{ padding: '7px 10px', fontWeight: 600 }}>S/ {Number(modalVer.subtotal).toFixed(2)}</td>
                                </tr>
                                {Number(modalVer.descuento) > 0 && (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '7px 10px', textAlign: 'right', color: '#EF4444' }}>Descuento</td>
                                        <td style={{ padding: '7px 10px', color: '#EF4444', fontWeight: 600 }}>- S/ {Number(modalVer.descuento).toFixed(2)}</td>
                                    </tr>
                                )}
                                <tr style={{ backgroundColor: '#F0FDF4', borderTop: '2px solid #BBF7D0' }}>
                                    <td colSpan={5} style={{ padding: '10px 10px', fontWeight: 800, color: '#1E293B', textAlign: 'right' }}>TOTAL</td>
                                    <td style={{ padding: '10px 10px', fontWeight: 900, color: '#16A34A', fontSize: 15 }}>S/ {Number(modalVer.total).toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>

                        {modalVer.observaciones && (
                            <p style={{ marginTop: 12, fontSize: 13, color: '#64748B' }}>
                                <strong>Obs:</strong> {modalVer.observaciones}
                            </p>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                            <Button variant="cancel" size="md" onClick={() => setModalVer(null)}>Cerrar</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </AuthenticatedLayout>
    );
}