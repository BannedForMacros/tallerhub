import { useForm, usePage } from '@inertiajs/react';
import { toast, Toaster } from 'react-hot-toast';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import EntradaForm, { detalleVacio } from './EntradaForm';
import { PageProps, EntradaAlmacen, ProductoAlmacen, Proveedor, Local, Empresa } from '@/types';

interface Props extends PageProps {
    entrada: EntradaAlmacen;
    empresas: Empresa[];
    locales: Local[];
    productos: ProductoAlmacen[];
    proveedores: Proveedor[];
}

export default function EntradasEdit({ entrada, empresas, locales, productos, proveedores }: Props) {
    const { auth } = usePage<Props>().props;
    const esSuperAdmin = auth.user.esSuperAdmin;

    const { data, setData, put, processing, errors } = useForm({
        empresa_id:    String(entrada.empresa_id),
        local_id:      String(entrada.local_id),
        motivo:        entrada.motivo        ?? '',
        observaciones: entrada.observaciones ?? '',
        fecha:         entrada.fecha.split('T')[0],
        detalles: entrada.detalles?.length
            ? entrada.detalles.map(d => ({
                producto_id:      String(d.producto_id),
                unidad_medida_id: String(d.unidad_medida_id),
                proveedor_id:     d.proveedor_id ? String(d.proveedor_id) : '',
                cantidad:         String(d.cantidad),
                subtotal:         String(d.subtotal),
                precio_unitario:  String(d.precio_unitario),
            }))
            : [detalleVacio()],
    });

    const guardar = () => {
        put(route('almacen.entradas.update', entrada.id), {
            onError: () => toast.error('Revisa los campos requeridos.'),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Editar Entrada" />
            <Toaster position="top-right" />
            <EntradaForm
                data={data} setData={setData} errors={errors}
                processing={processing} empresas={empresas}
                locales={locales} productos={productos}
                proveedores={proveedores} esSuperAdmin={esSuperAdmin}
                esEdicion={true} onGuardar={guardar}
            />
        </AuthenticatedLayout>
    );
}