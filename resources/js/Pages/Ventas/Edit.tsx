import { useForm, usePage } from '@inertiajs/react';
import { toast, Toaster } from 'react-hot-toast';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import VentaForm, { detalleVacio } from './VentaForm';
import { PageProps, Venta, ProductoAlmacen, Local, Empresa, Cliente, Servicio, Inventario } from '@/types';

interface RecepcionOpcion { id: number; codigo: string; label: string; }

interface Props extends PageProps {
    venta:       Venta;
    empresas:    Empresa[];
    locales:     Local[];
    clientes:    Cliente[];
    servicios:   Servicio[];
    productos:   ProductoAlmacen[];
    inventario:  Inventario[];
    recepciones: RecepcionOpcion[];
}

export default function VentasEdit({ venta, empresas, locales, clientes, servicios, productos, inventario, recepciones }: Props) {
    const { auth } = usePage<Props>().props;
    const esSuperAdmin = auth.user.esSuperAdmin;

    const { data, setData, put, processing, errors } = useForm({
        empresa_id:    String(venta.empresa_id),
        local_id:      String(venta.local_id),
        cliente_id:    venta.cliente_id    ? String(venta.cliente_id)   : '',
        recepcion_id:  venta.recepcion_id  ? String(venta.recepcion_id) : '',
        observaciones: venta.observaciones ?? '',
        descuento:     String(venta.descuento),
        fecha:         venta.fecha.split('T')[0],
        detalles: venta.detalles?.length
            ? venta.detalles.map(d => ({
                tipo:             d.tipo as 'servicio' | 'producto',
                servicio_id:      d.servicio_id ? String(d.servicio_id) : '',
                producto_id:      d.producto_id ? String(d.producto_id) : '',
                unidad_medida_id: d.unidad_medida_id ? String(d.unidad_medida_id) : '',
                descripcion:      d.descripcion,
                cantidad:         String(d.cantidad),
                precio_unitario:  String(d.precio_unitario),
            }))
            : [detalleVacio('servicio')],
    });

    const guardar = () => {
        put(route('ventas.update', venta.id), {
            onError: () => toast.error('Revisa los campos requeridos.'),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Editar Venta" />
            <Toaster position="top-right" />
            <VentaForm
                data={data} setData={setData} errors={errors} processing={processing}
                empresas={empresas} locales={locales} clientes={clientes}
                servicios={servicios} productos={productos} inventario={inventario}
                recepciones={recepciones} esSuperAdmin={esSuperAdmin}
                esEdicion={true} onGuardar={guardar}
            />
        </AuthenticatedLayout>
    );
}