import { useForm, usePage } from '@inertiajs/react';
import { toast, Toaster } from 'react-hot-toast';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SalidaForm, { detalleVacio } from './SalidaForm';
import { PageProps, ProductoAlmacen, Local, Empresa, Inventario } from '@/types';

interface Props extends PageProps {
    empresas:   Empresa[];
    locales:    Local[];
    productos:  ProductoAlmacen[];
    inventario: Inventario[];
    motivos:    Record<string, string>;
}

export default function SalidasCreate({ empresas, locales, productos, inventario, motivos }: Props) {
    const { auth } = usePage<Props>().props;
    const esSuperAdmin = auth.user.esSuperAdmin;

    const { data, setData, post, processing, errors } = useForm({
        empresa_id:    '',
        local_id:      '',
        tipo:          '',
        observaciones: '',
        fecha:         new Date().toISOString().split('T')[0],
        detalles:      [detalleVacio()],
    });

    const guardar = () => {
        post(route('almacen.salidas.store'), {
            onError: () => toast.error('Revisa los campos requeridos.'),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Nueva Salida" />
            <Toaster position="top-right" />
            <SalidaForm
                data={data} setData={setData} errors={errors}
                processing={processing} empresas={empresas}
                locales={locales} productos={productos}
                inventario={inventario} motivos={motivos}
                esSuperAdmin={esSuperAdmin} onGuardar={guardar}
            />
        </AuthenticatedLayout>
    );
}