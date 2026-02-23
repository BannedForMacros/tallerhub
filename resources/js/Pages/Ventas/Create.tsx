import { useForm, usePage } from '@inertiajs/react';
import { toast, Toaster } from 'react-hot-toast';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import VentaForm, { detalleVacio } from './VentaForm';
import { PageProps, ProductoAlmacen, Local, Empresa, Cliente, Servicio, Inventario } from '@/types';

interface RecepcionOpcion { id: number; codigo: string; label: string; }

interface Props extends PageProps {
    empresas:    Empresa[];
    locales:     Local[];
    clientes:    Cliente[];
    servicios:   Servicio[];
    productos:   ProductoAlmacen[];
    inventario:  Inventario[];
    recepciones: RecepcionOpcion[];
}

export default function VentasCreate({ empresas, locales, clientes, servicios, productos, inventario, recepciones }: Props) {
    const { auth } = usePage<Props>().props;
    const esSuperAdmin = auth.user.esSuperAdmin;

    const { data, setData, post, processing, errors } = useForm({
        empresa_id:    '',
        local_id:      '',
        cliente_id:    '',
        recepcion_id:  '',
        observaciones: '',
        descuento:     '0',
        fecha:         new Date().toISOString().split('T')[0],
        detalles:      [detalleVacio('servicio')],
    });

    const guardar = () => {
        post(route('ventas.store'), {
            onError: () => toast.error('Revisa los campos requeridos.'),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Nueva Venta" />
            <Toaster position="top-right" />
            <VentaForm
                data={data} setData={setData} errors={errors} processing={processing}
                empresas={empresas} locales={locales} clientes={clientes}
                servicios={servicios} productos={productos} inventario={inventario}
                recepciones={recepciones} esSuperAdmin={esSuperAdmin} onGuardar={guardar}
            />
        </AuthenticatedLayout>
    );
}