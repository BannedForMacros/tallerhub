import { useForm, usePage } from '@inertiajs/react';
import { toast, Toaster } from 'react-hot-toast';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import EntradaForm, { detalleVacio } from './EntradaForm';
import { PageProps, ProductoAlmacen, Proveedor, Local, Empresa } from '@/types';

interface Props extends PageProps {
    empresas: Empresa[];
    locales: Local[];
    productos: ProductoAlmacen[];
    proveedores: Proveedor[];
}

export default function EntradasCreate({ empresas, locales, productos, proveedores }: Props) {
    const { auth } = usePage<Props>().props;
    const esSuperAdmin = auth.user.esSuperAdmin;

    const { data, setData, post, processing, errors } = useForm({
        empresa_id:    '',
        local_id:      '',
        motivo:        'Compra',
        observaciones: '',
        fecha:         new Date().toISOString().split('T')[0],
        detalles:      [detalleVacio()],
    });

    const guardar = () => {
        post(route('almacen.entradas.store'), {
            onError: () => toast.error('Revisa los campos requeridos.'),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Nueva Entrada" />
            <Toaster position="top-right" />
            <EntradaForm
                data={data} setData={setData} errors={errors}
                processing={processing} empresas={empresas}
                locales={locales} productos={productos}
                proveedores={proveedores} esSuperAdmin={esSuperAdmin}
                onGuardar={guardar}
            />
        </AuthenticatedLayout>
    );
}