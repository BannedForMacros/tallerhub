import { useForm, usePage } from '@inertiajs/react';
import { toast, Toaster } from 'react-hot-toast';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SalidaForm, { detalleVacio } from './SalidaForm';
import { PageProps, SalidaAlmacen, ProductoAlmacen, Local, Empresa, Inventario } from '@/types';

interface Props extends PageProps {
    salida:     SalidaAlmacen;
    empresas:   Empresa[];
    locales:    Local[];
    productos:  ProductoAlmacen[];
    inventario: Inventario[];
    motivos:    Record<string, string>;
}

export default function SalidasEdit({ salida, empresas, locales, productos, inventario, motivos }: Props) {
    const { auth } = usePage<Props>().props;
    const esSuperAdmin = auth.user.esSuperAdmin;

    const { data, setData, put, processing, errors } = useForm({
        empresa_id:    String(salida.empresa_id),
        local_id:      String(salida.local_id),
        tipo:          salida.tipo,
        observaciones: salida.observaciones ?? '',
        fecha:         salida.fecha.split('T')[0],
        detalles: salida.detalles?.length
            ? salida.detalles.map(d => ({
                producto_id:      String(d.producto_id),
                unidad_medida_id: String(d.unidad_medida_id),
                cantidad:         String(d.cantidad),
            }))
            : [detalleVacio()],
    });

    const guardar = () => {
        put(route('almacen.salidas.update', salida.id), {
            onError: () => toast.error('Revisa los campos requeridos.'),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Editar Salida" />
            <Toaster position="top-right" />
            <SalidaForm
                data={data} setData={setData} errors={errors}
                processing={processing} empresas={empresas}
                locales={locales} productos={productos}
                inventario={inventario} motivos={motivos}
                esSuperAdmin={esSuperAdmin} esEdicion={true}
                onGuardar={guardar}
            />
        </AuthenticatedLayout>
    );
}