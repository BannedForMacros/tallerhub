import { Head, Link } from '@inertiajs/react';
import { Plus, Eye, FileText } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Table from '@/Components/Table';
import Badge from '@/Components/Badge';
import Button from '@/Components/Button';
import ActionButton from '@/Components/ActionButton';
import { PageProps, CierreCaja, Local } from '@/types';

interface Props extends PageProps {
    cierres: CierreCaja[];
    locales: Local[];
    puedeVerEsperados: boolean;
}

const ESTADO_COLORS: Record<string, 'success' | 'warning'> = {
    cerrado:  'success',
    borrador: 'warning',
};

const ESTADO_LABELS: Record<string, string> = {
    cerrado:  'Cerrado',
    borrador: 'Borrador',
};

const fmt = (n: number | null) =>
    n === null ? '—' : `S/ ${Number(n).toFixed(2)}`;

export default function CierreCajaIndex({ cierres, puedeVerEsperados }: Props) {
    const columns = [
        {
            key: 'fecha', label: 'Fecha', width: '12%',
            render: (r: CierreCaja) => (
                <span style={{ fontWeight: 700, color: '#1E293B', fontSize: 13 }}>
                    {new Date(r.fecha + 'T00:00:00').toLocaleDateString('es-PE')}
                </span>
            ),
        },
        {
            key: 'local', label: 'Local', width: '18%',
            render: (r: CierreCaja) => (
                <span style={{ fontSize: 13 }}>{r.local?.nombre ?? '—'}</span>
            ),
        },
        {
            key: 'ventas_neto', label: 'Ventas neto', width: '12%',
            render: (r: CierreCaja) => (
                <span style={{ fontWeight: 700, color: '#16A34A', fontSize: 13 }}>
                    {fmt(r.ventas_neto)}
                </span>
            ),
        },
        ...(puedeVerEsperados ? [{
            key: 'total_esperado', label: 'Esperado', width: '12%',
            render: (r: CierreCaja) => (
                <span style={{ fontSize: 13, color: '#2563EB', fontWeight: 600 }}>
                    {fmt(r.total_esperado)}
                </span>
            ),
        }] : []),
        {
            key: 'total_entregado', label: 'Entregado', width: '12%',
            render: (r: CierreCaja) => (
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>
                    {fmt(r.total_entregado)}
                </span>
            ),
        },
        ...(puedeVerEsperados ? [{
            key: 'diferencia', label: 'Diferencia', width: '12%',
            render: (r: CierreCaja) => {
                const dif = r.diferencia;
                if (dif === null) return <span style={{ color: '#CBD5E1' }}>—</span>;
                const d = Number(dif);
                const color = d < 0 ? '#EF4444' : d > 0 ? '#16A34A' : '#64748B';
                return (
                    <span style={{ fontWeight: 700, color, fontSize: 13 }}>
                        {d >= 0 ? '+' : ''}{fmt(d)}
                    </span>
                );
            },
        }] : []),
        {
            key: 'estado', label: 'Estado', width: '10%',
            render: (r: CierreCaja) => (
                <Badge label={ESTADO_LABELS[r.estado] ?? r.estado} variant={ESTADO_COLORS[r.estado] ?? 'default'} />
            ),
        },
        {
            key: 'usuario', label: 'Creado por', width: '12%',
            render: (r: CierreCaja) => (
                <span style={{ fontSize: 12, color: '#64748B' }}>{r.usuario?.name ?? '—'}</span>
            ),
        },
        {
            key: 'acciones', label: 'Acciones', width: '10%',
            render: (r: CierreCaja) => (
                <div style={{ display: 'flex', gap: 6 }}>
                    <Link href={route('cierre-caja.show', r.id)}>
                        <ActionButton onClick={() => {}} icon={<Eye size={13} />} tooltip="Ver detalle" color="blue" />
                    </Link>
                    <a href={route('cierre-caja.pdf', r.id)} target="_blank" rel="noreferrer">
                        <ActionButton onClick={() => {}} icon={<FileText size={13} />} tooltip="Exportar PDF" color="amber" />
                    </a>
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Cierre de Caja" />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', margin: 0 }}>Cierre de Caja</h1>
                    <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 4 }}>
                        Registro diario de cierres por local
                    </p>
                </div>
                <Link href={route('cierre-caja.create')}>
                    <Button variant="primary" size="md" icon={<Plus size={16} />}>Nuevo Cierre</Button>
                </Link>
            </div>

            <Table
                columns={columns}
                data={cierres}
                emptyText="No hay cierres de caja registrados"
            />
        </AuthenticatedLayout>
    );
}
