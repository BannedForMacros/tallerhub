import { useState } from 'react';
import { useForm, usePage, router } from '@inertiajs/react';
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
import { PageProps } from '@/types';

interface Empresa {
    id: number;
    nombre: string;
    ruc: string;
    email: string;
    telefono: string;
    departamento: string;
    provincia: string;
    distrito: string;
    activo: boolean;
}

interface Props extends PageProps {
    empresas: Empresa[];
}

const empty = {
    nombre: '', ruc: '', email: '', telefono: '',
    departamento: '', provincia: '', distrito: '',
};

const confirmarEliminar = (empresa: Empresa) => {
    toast((t) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', margin: 0 }}>
                ¿Eliminar empresa?
            </p>
            <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
                Esta acción desactivará <strong>{empresa.nombre}</strong>.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                    onClick={() => toast.dismiss(t.id)}
                    style={{
                        padding: '6px 14px', borderRadius: 8, border: '1px solid #E2E8F0',
                        backgroundColor: '#fff', cursor: 'pointer', fontSize: 13, color: '#64748B',
                    }}
                >
                    Cancelar
                </button>
                <button
                    onClick={() => {
                        toast.dismiss(t.id);
                        router.patch(route('configuracion.empresas.toggle', empresa.id), {}, {
                            onSuccess: () => toast.success('Empresa eliminada.'),
                        });
                    }}
                    style={{
                        padding: '6px 14px', borderRadius: 8, border: 'none',
                        backgroundColor: '#DC2626', cursor: 'pointer',
                        fontSize: 13, color: '#fff', fontWeight: 600,
                    }}
                >
                    Sí, eliminar
                </button>
            </div>
        </div>
    ), { duration: 10000 });
};

export default function EmpresasIndex({ empresas }: Props) {
    const [modal, setModal] = useState(false);
    const [editando, setEditando] = useState<Empresa | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm(empty);

    const abrirCrear = () => {
        setEditando(null);
        reset();
        setModal(true);
    };

    const abrirEditar = (empresa: Empresa) => {
        setEditando(empresa);
        setData({
            nombre:       empresa.nombre,
            ruc:          empresa.ruc,
            email:        empresa.email        ?? '',
            telefono:     empresa.telefono     ?? '',
            departamento: empresa.departamento,
            provincia:    empresa.provincia,
            distrito:     empresa.distrito,
        });
        setModal(true);
    };

    const guardar = () => {
        if (editando) {
            put(route('configuracion.empresas.update', editando.id), {
                onSuccess: () => { setModal(false); toast.success('Empresa actualizada.'); },
            });
        } else {
            post(route('configuracion.empresas.store'), {
                onSuccess: () => { setModal(false); reset(); toast.success('Empresa creada.'); },
            });
        }
    };

    const toggleActivo = (empresa: Empresa) => {
        router.patch(route('configuracion.empresas.toggle', empresa.id), {}, {
            onSuccess: () => toast.success(empresa.activo ? 'Empresa desactivada.' : 'Empresa activada.'),
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') guardar();
    };

    const columns = [
        { key: 'nombre',       label: 'Empresa',      width: '25%' },
        { key: 'ruc',          label: 'RUC',           width: '12%' },
        { key: 'email',        label: 'Email',         width: '20%' },
        { key: 'telefono',     label: 'Teléfono',      width: '12%' },
        { key: 'departamento', label: 'Departamento',  width: '13%' },
        {
            key: 'activo', label: 'Estado', width: '10%',
            render: (row: Empresa) => (
                <Badge
                    label={row.activo ? 'Activo' : 'Inactivo'}
                    variant={row.activo ? 'success' : 'danger'}
                />
            ),
        },
        {
            key: 'acciones', label: 'Acciones', width: '8%',
            render: (row: Empresa) => (
                <div style={{ display: 'flex', gap: 6 }}>
                    <ActionButton
                        onClick={() => abrirEditar(row)}
                        icon={<Pencil size={13} />}
                        tooltip="Editar"
                        color="blue"
                    />
                    {row.activo ? (
                        <ActionButton
                            onClick={() => confirmarEliminar(row)}
                            icon={<Trash2 size={13} />}
                            tooltip="Eliminar"
                            color="red"
                        />
                    ) : (
                        <ActionButton
                            onClick={() => toggleActivo(row)}
                            icon={<RotateCcw size={13} />}
                            tooltip="Restaurar"
                            color="green"
                        />
                    )}
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Empresas" />
            <Toaster position="top-right" />

            {/* Header página */}
            <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', marginBottom: 24,
            }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', margin: 0 }}>
                        Empresas
                    </h1>
                    <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 4 }}>
                        Gestiona las empresas registradas en el sistema
                    </p>
                </div>
                <Button variant="primary" size="md" icon={<Plus size={16} />} onClick={abrirCrear}>
                    Nueva Empresa
                </Button>
            </div>

            <Table
                columns={columns}
                data={empresas}
                emptyText="No hay empresas registradas"
            />

            <Modal
                show={modal}
                onClose={() => setModal(false)}
                title={editando ? 'Editar Empresa' : 'Nueva Empresa'}
                maxWidth="lg"
            >
                <div onKeyDown={handleKeyDown}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <InputField
                                label="Nombre"
                                name="nombre"
                                value={data.nombre}
                                onChange={e => setData('nombre', e.target.value)}
                                error={errors.nombre}
                                required
                                placeholder="Nombre de la empresa"
                            />
                        </div>
                        <InputField
                            label="RUC"
                            name="ruc"
                            value={data.ruc}
                            onChange={e => setData('ruc', e.target.value)}
                            error={errors.ruc}
                            required
                            placeholder="11 dígitos"
                        />
                        <InputField
                            label="Teléfono"
                            name="telefono"
                            value={data.telefono}
                            onChange={e => setData('telefono', e.target.value)}
                            error={errors.telefono}
                            placeholder="Ej. 999 999 999"
                        />
                        <div style={{ gridColumn: '1 / -1' }}>
                            <InputField
                                label="Email"
                                name="email"
                                value={data.email}
                                type="email"
                                onChange={e => setData('email', e.target.value)}
                                error={errors.email}
                                placeholder="correo@empresa.com"
                            />
                        </div>
                        <InputField
                            label="Departamento"
                            name="departamento"
                            value={data.departamento}
                            onChange={e => setData('departamento', e.target.value)}
                            error={errors.departamento}
                            required
                        />
                        <InputField
                            label="Provincia"
                            name="provincia"
                            value={data.provincia}
                            onChange={e => setData('provincia', e.target.value)}
                            error={errors.provincia}
                            required
                        />
                        <div style={{ gridColumn: '1 / -1' }}>
                            <InputField
                                label="Distrito"
                                name="distrito"
                                value={data.distrito}
                                onChange={e => setData('distrito', e.target.value)}
                                error={errors.distrito}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                        <Button variant="cancel" size="md" onClick={() => setModal(false)}>
                            Cancelar
                        </Button>
                        <Button variant="primary" size="md" loading={processing} onClick={guardar}>
                            {editando ? 'Actualizar' : 'Crear Empresa'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}