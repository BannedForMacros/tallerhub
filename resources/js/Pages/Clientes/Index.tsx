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
import ActionButton from '@/Components/ActionButton';
import ClienteForm from '@/Components/ClienteForm';
import { PageProps, Cliente, Empresa } from '@/types';

interface Props extends PageProps {
    clientes: Cliente[];
    empresas: Empresa[];
}

const emptyForm = {
    nombre: '', dni: '', telefono: '', email: '', direccion: '', empresa_id: '',
};

export default function ClientesIndex({ clientes, empresas }: Props) {
    const { auth } = usePage<Props>().props;
    const esSuperAdmin = auth.user.esSuperAdmin;

    const [modal, setModal]       = useState(false);
    const [editando, setEditando] = useState<Cliente | null>(null);

    const form = useForm(emptyForm);
    const { reset, setData } = form;

    const abrirCrear = () => {
        setEditando(null);
        reset();
        setModal(true);
    };

    const abrirEditar = (c: Cliente) => {
        setEditando(c);
        setData({
            nombre:     c.nombre,
            dni:        c.dni        ?? '',
            telefono:   c.telefono   ?? '',
            email:      c.email      ?? '',
            direccion:  c.direccion  ?? '',
            empresa_id: String(c.empresa_id),
        });
        setModal(true);
    };

    const guardar = () => {
        if (editando) {
            form.put(route('clientes.update', editando.id), {
                onSuccess: () => { setModal(false); toast.success('Cliente actualizado.'); },
            });
        } else {
            form.post(route('clientes.store'), {
                onSuccess: () => { setModal(false); reset(); toast.success('Cliente creado.'); },
            });
        }
    };

    const confirmarEliminar = (c: Cliente) => {
        toast((t) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', margin: 0 }}>¿Eliminar cliente?</p>
                <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Se desactivará <strong>{c.nombre}</strong>.</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => toast.dismiss(t.id)} style={{
                        padding: '6px 14px', borderRadius: 8, border: '1px solid #E2E8F0',
                        backgroundColor: '#fff', cursor: 'pointer', fontSize: 13, color: '#64748B',
                    }}>Cancelar</button>
                    <button onClick={() => {
                        toast.dismiss(t.id);
                        router.patch(route('clientes.toggle', c.id), {}, {
                            onSuccess: () => toast.success('Cliente eliminado.'),
                        });
                    }} style={{
                        padding: '6px 14px', borderRadius: 8, border: 'none',
                        backgroundColor: '#DC2626', cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 600,
                    }}>Sí, eliminar</button>
                </div>
            </div>
        ), { duration: 10000 });
    };

    const columns = [
        {
            key: 'nombre', label: 'Cliente', width: '28%',
            render: (r: Cliente) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        backgroundColor: '#2563EB', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0,
                    }}>
                        {r.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p style={{ margin: 0, fontWeight: 600, color: '#1E293B', fontSize: 14 }}>{r.nombre}</p>
                        {r.email && <p style={{ margin: 0, fontSize: 12, color: '#94A3B8' }}>{r.email}</p>}
                    </div>
                </div>
            ),
        },
        { key: 'dni',       label: 'DNI / RUC', width: '13%' },
        { key: 'telefono',  label: 'Teléfono',  width: '13%' },
        { key: 'direccion', label: 'Dirección', width: '26%' },
        {
            key: 'activo', label: 'Estado', width: '10%',
            render: (r: Cliente) => (
                <Badge label={r.activo ? 'Activo' : 'Inactivo'} variant={r.activo ? 'success' : 'danger'} />
            ),
        },
        {
            key: 'acciones', label: 'Acciones', width: '10%',
            render: (r: Cliente) => (
                <div style={{ display: 'flex', gap: 6 }}>
                    <ActionButton onClick={() => abrirEditar(r)} icon={<Pencil size={13} />} tooltip="Editar" color="blue" />
                    {r.activo
                        ? <ActionButton onClick={() => confirmarEliminar(r)} icon={<Trash2 size={13} />} tooltip="Eliminar" color="red" />
                        : <ActionButton
                            onClick={() => router.patch(route('clientes.toggle', r.id), {}, {
                                onSuccess: () => toast.success('Cliente restaurado.'),
                            })}
                            icon={<RotateCcw size={13} />} tooltip="Restaurar" color="green"
                          />
                    }
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Clientes" />
            <Toaster position="top-right" />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', margin: 0 }}>Clientes</h1>
                    <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 4 }}>
                        Gestiona los clientes registrados en el sistema
                    </p>
                </div>
                <Button variant="primary" size="md" icon={<Plus size={16} />} onClick={abrirCrear}>
                    Nuevo Cliente
                </Button>
            </div>

            <Table columns={columns} data={clientes} emptyText="No hay clientes registrados" />

            <Modal
                show={modal}
                onClose={() => setModal(false)}
                title={editando ? 'Editar Cliente' : 'Nuevo Cliente'}
                maxWidth="md"
            >
                <ClienteForm
                    form={form}
                    onGuardar={guardar}
                    onCancelar={() => setModal(false)}
                    editando={!!editando}
                    empresas={empresas}
                    esSuperAdmin={esSuperAdmin}
                />
            </Modal>
        </AuthenticatedLayout>
    );
}