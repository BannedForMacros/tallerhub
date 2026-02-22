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
import SelectField from '@/Components/SelectField';
import ActionButton from '@/Components/ActionButton';
import { PageProps, CategoriaAlmacen, Empresa } from '@/types';

interface Props extends PageProps {
    categorias: CategoriaAlmacen[];
    empresas: Empresa[];
}

export default function CategoriasAlmacenIndex({ categorias, empresas }: Props) {
    const { auth } = usePage<Props>().props;
    const esSuperAdmin = auth.user.esSuperAdmin;

    const [modal, setModal]       = useState(false);
    const [editando, setEditando] = useState<CategoriaAlmacen | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        nombre: '', empresa_id: '',
    });

    const abrirCrear = () => { setEditando(null); reset(); setModal(true); };

    const abrirEditar = (c: CategoriaAlmacen) => {
        setEditando(c);
        setData({ nombre: c.nombre, empresa_id: String(c.empresa_id) });
        setModal(true);
    };

    const guardar = () => {
        if (editando) {
            put(route('configuracion.categorias-almacen.update', editando.id), {
                onSuccess: () => { setModal(false); toast.success('Categoría actualizada.'); },
            });
        } else {
            post(route('configuracion.categorias-almacen.store'), {
                onSuccess: () => { setModal(false); reset(); toast.success('Categoría creada.'); },
            });
        }
    };

    const confirmarEliminar = (c: CategoriaAlmacen) => {
        toast((t) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', margin: 0 }}>¿Eliminar categoría?</p>
                <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Se desactivará <strong>{c.nombre}</strong>.</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => toast.dismiss(t.id)} style={{
                        padding: '6px 14px', borderRadius: 8, border: '1px solid #E2E8F0',
                        backgroundColor: '#fff', cursor: 'pointer', fontSize: 13, color: '#64748B',
                    }}>Cancelar</button>
                    <button onClick={() => {
                        toast.dismiss(t.id);
                        router.patch(route('configuracion.categorias-almacen.toggle', c.id), {}, {
                            onSuccess: () => toast.success('Categoría eliminada.'),
                        });
                    }} style={{
                        padding: '6px 14px', borderRadius: 8, border: 'none',
                        backgroundColor: '#DC2626', cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 600,
                    }}>Sí, eliminar</button>
                </div>
            </div>
        ), { duration: 10000 });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') guardar(); };

    const columns = [
        {
            key: 'nombre', label: 'Categoría', width: '40%',
            render: (r: CategoriaAlmacen) => (
                <span style={{ fontWeight: 600, color: '#1E293B' }}>{r.nombre}</span>
            ),
        },
        {
            key: 'empresa', label: 'Empresa', width: '30%',
            render: (r: CategoriaAlmacen) => (
                <span style={{ fontSize: 13, color: '#64748B' }}>
                    {r.empresa?.nombre ?? '—'}
                </span>
            ),
        },
        {
            key: 'activo', label: 'Estado', width: '15%',
            render: (r: CategoriaAlmacen) => (
                <Badge label={r.activo ? 'Activo' : 'Inactivo'} variant={r.activo ? 'success' : 'danger'} />
            ),
        },
        {
            key: 'acciones', label: 'Acciones', width: '15%',
            render: (r: CategoriaAlmacen) => (
                <div style={{ display: 'flex', gap: 6 }}>
                    <ActionButton onClick={() => abrirEditar(r)} icon={<Pencil size={13} />} tooltip="Editar" color="blue" />
                    {r.activo
                        ? <ActionButton onClick={() => confirmarEliminar(r)} icon={<Trash2 size={13} />} tooltip="Eliminar" color="red" />
                        : <ActionButton
                            onClick={() => router.patch(route('configuracion.categorias-almacen.toggle', r.id), {}, {
                                onSuccess: () => toast.success('Categoría restaurada.'),
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
            <Head title="Categorías de Productos" />
            <Toaster position="top-right" />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', margin: 0 }}>Categorías de Productos</h1>
                    <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 4 }}>
                        Organiza los productos del almacén por categorías
                    </p>
                </div>
                <Button variant="primary" size="md" icon={<Plus size={16} />} onClick={abrirCrear}>
                    Nueva Categoría
                </Button>
            </div>

            <Table columns={columns} data={categorias} emptyText="No hay categorías registradas" />

            <Modal show={modal} onClose={() => setModal(false)}
                title={editando ? 'Editar Categoría' : 'Nueva Categoría'} maxWidth="sm">
                <div onKeyDown={handleKeyDown}>
                    {esSuperAdmin && (
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
                        error={errors.nombre} required
                        placeholder="Ej. Repuestos, Herramientas, Insumos"
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                        <Button variant="cancel" size="md" onClick={() => setModal(false)}>Cancelar</Button>
                        <Button variant="primary" size="md" loading={processing} onClick={guardar}>
                            {editando ? 'Actualizar' : 'Crear Categoría'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}