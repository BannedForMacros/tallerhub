import { useState } from 'react';
import { router } from '@inertiajs/react';
import { toast, Toaster } from 'react-hot-toast';
import { Plus, Trash2, Eye, Pencil } from 'lucide-react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Table from '@/Components/Table';
import Modal from '@/Components/Modal';
import Badge from '@/Components/Badge';
import Button from '@/Components/Button';
import ActionButton from '@/Components/ActionButton';
import { PageProps, SalidaAlmacen } from '@/types';

interface Props extends PageProps {
    salidas: SalidaAlmacen[];
}

const MOTIVOS: Record<string, string> = {
    ajuste:              'Ajuste de inventario',
    devolucion_defecto:  'Devolución por defecto',
    otro:                'Otro',
    venta:               'Venta',
};

export default function SalidasIndex({ salidas }: Props) {
    const [modalVer, setModalVer] = useState<SalidaAlmacen | null>(null);

    const confirmarAnular = (r: SalidaAlmacen) => {
        toast((t) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', margin: 0 }}>¿Anular salida?</p>
                <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Esta acción no se puede deshacer.</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => toast.dismiss(t.id)} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #E2E8F0', backgroundColor: '#fff', cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
                    <button onClick={() => {
                        toast.dismiss(t.id);
                        router.patch(route('almacen.salidas.toggle', r.id), {}, {
                            onSuccess: () => toast.success('Salida anulada.'),
                        });
                    }} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', backgroundColor: '#DC2626', cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 600 }}>Anular</button>
                </div>
            </div>
        ), { duration: 10000 });
    };

    const columns = [
        {
            key: 'codigo', label: 'Código', width: '10%',
            render: (r: SalidaAlmacen) => (
                <span style={{ fontWeight: 700, color: '#D97706', fontSize: 13 }}>{r.codigo}</span>
            ),
        },
        {
            key: 'local', label: 'Local', width: '16%',
            render: (r: SalidaAlmacen) => (
                <span style={{ fontSize: 13 }}>{r.local?.nombre ?? '—'}</span>
            ),
        },
        {
            key: 'tipo', label: 'Motivo', width: '18%',
            render: (r: SalidaAlmacen) => (
                <span style={{
                    backgroundColor: '#FFF7ED', color: '#D97706',
                    padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                }}>
                    {MOTIVOS[r.tipo] ?? r.tipo}
                </span>
            ),
        },
        {
            key: 'detalles', label: 'Productos', width: '10%',
            render: (r: SalidaAlmacen) => (
                <span style={{ backgroundColor: '#EFF6FF', color: '#2563EB', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                    {r.detalles?.length ?? 0} ítem(s)
                </span>
            ),
        },
        {
            key: 'total', label: 'Total', width: '10%',
            render: (r: SalidaAlmacen) => (
                <span style={{ fontSize: 13, fontWeight: 700, color: '#D97706' }}>
                    S/ {Number(r.total).toFixed(2)}
                </span>
            ),
        },
        {
            key: 'usuario', label: 'Registrado por', width: '13%',
            render: (r: SalidaAlmacen) => (
                <span style={{ fontSize: 12, color: '#64748B' }}>{r.usuario?.name ?? '—'}</span>
            ),
        },
        {
            key: 'fecha', label: 'Fecha', width: '11%',
            render: (r: SalidaAlmacen) => (
                <span style={{ fontSize: 12, color: '#64748B' }}>
                    {new Date(r.fecha).toLocaleDateString('es-PE')}
                </span>
            ),
        },
        {
            key: 'activo', label: 'Estado', width: '9%',
            render: (r: SalidaAlmacen) => (
                <Badge label={r.activo ? 'Activo' : 'Anulado'} variant={r.activo ? 'success' : 'danger'} />
            ),
        },
        {
            key: 'acciones', label: 'Acciones', width: '13%',
            render: (r: SalidaAlmacen) => (
                <div style={{ display: 'flex', gap: 6 }}>
                    <ActionButton onClick={() => setModalVer(r)} icon={<Eye size={13} />} tooltip="Ver detalle" color="blue" />
                    {r.activo && r.tipo !== 'venta' && (
                        <>
                            <Link href={route('almacen.salidas.edit', r.id)}>
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
            <Head title="Salidas de Almacén" />
            <Toaster position="top-right" />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', margin: 0 }}>Salidas de Almacén</h1>
                    <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 4 }}>Registro de salidas de productos del inventario</p>
                </div>
                <Link href={route('almacen.salidas.create')}>
                    <Button variant="primary" size="md" icon={<Plus size={16} />}>Nueva Salida</Button>
                </Link>
            </div>

            <Table columns={columns} data={salidas} emptyText="No hay salidas registradas" />

            {/* Modal Ver */}
            {modalVer && (
                <Modal show={!!modalVer} onClose={() => setModalVer(null)} title={`Detalle — ${modalVer.codigo}`} maxWidth="2xl">
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px 16px', marginBottom: 16 }}>
                            {[
                                ['Local',          modalVer.local?.nombre ?? '—'],
                                ['Motivo',         MOTIVOS[modalVer.tipo] ?? modalVer.tipo],
                                ['Fecha',          new Date(modalVer.fecha).toLocaleDateString('es-PE')],
                                ['Registrado por', modalVer.usuario?.name ?? '—'],
                                ['Estado',         modalVer.activo ? 'Activo' : 'Anulado'],
                                ['Total',          `S/ ${Number(modalVer.total).toFixed(2)}`],
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
                                    {['Producto', 'Unidad', 'Cantidad', 'Precio', 'Tipo', 'Subtotal'].map(h => (
                                        <th key={h} style={{ padding: '8px 10px', color: '#fff', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', textAlign: 'left' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {modalVer.detalles?.map((d, i) => (
                                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#F8FAFC' : '#fff' }}>
                                        <td style={{ padding: '7px 10px', fontWeight: 600 }}>{d.producto?.nombre}</td>
                                        <td style={{ padding: '7px 10px', color: '#64748B' }}>{d.unidad_medida?.abreviatura}</td>
                                        <td style={{ padding: '7px 10px', color: '#64748B' }}>{Number(d.cantidad).toFixed(2)}</td>
                                        <td style={{ padding: '7px 10px', color: '#64748B' }}>S/ {Number(d.precio_unitario).toFixed(2)}</td>
                                        <td style={{ padding: '7px 10px' }}>
                                            <span style={{
                                                backgroundColor: d.tipo_precio === 'venta' ? '#EFF6FF' : '#FFF7ED',
                                                color: d.tipo_precio === 'venta' ? '#2563EB' : '#D97706',
                                                padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                                            }}>
                                                {d.tipo_precio === 'venta' ? 'P.Venta' : 'P.Costo'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '7px 10px', fontWeight: 700, color: '#D97706' }}>S/ {Number(d.subtotal).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr style={{ backgroundColor: '#F1F5F9', borderTop: '2px solid #E2E8F0' }}>
                                    <td colSpan={5} style={{ padding: '8px 10px', fontWeight: 800, textAlign: 'right' }}>TOTAL</td>
                                    <td style={{ padding: '8px 10px', fontWeight: 800, color: '#D97706', fontSize: 14 }}>S/ {Number(modalVer.total).toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                            <Button variant="cancel" size="md" onClick={() => setModalVer(null)}>Cerrar</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </AuthenticatedLayout>
    );
}