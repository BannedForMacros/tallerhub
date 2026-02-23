import { useForm, usePage } from '@inertiajs/react';
import { toast, Toaster } from 'react-hot-toast';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Save, CreditCard, Receipt } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SelectField from '@/Components/SelectField';
import InputField from '@/Components/InputField';
import Button from '@/Components/Button';
import useGastoForm from './hooks/useGastoForm';
import { PageProps } from '@/types';

interface Props extends PageProps {
    gasto:       any;
    empresas:    any[];
    locales:     any[];
    tipos:       any[];
    metodosPago: any[];
}

export default function GastosEdit({ gasto, empresas, locales, tipos, metodosPago }: Props) {
    const { auth } = usePage<Props>().props;
    const esSuperAdmin = auth.user.esSuperAdmin;

    const tipoId = gasto.descripcion_gasto?.clasificacion?.tipo_id
        ? String(gasto.descripcion_gasto.clasificacion.tipo_id) : '';
    const clasId = gasto.descripcion_gasto?.clasificacion_id
        ? String(gasto.descripcion_gasto.clasificacion_id) : '';

    const { data, setData, put, processing, errors } = useForm({
        empresa_id:           String(gasto.empresa_id ?? ''),
        local_id:             gasto.local_id     ? String(gasto.local_id)      : '',
        tipo_id:              tipoId,
        clasificacion_id:     clasId,
        descripcion_gasto_id: String(gasto.descripcion_gasto_id),
        monto:                String(gasto.monto),
        fecha:                gasto.fecha,
        comprobante_numero:   gasto.comprobante_numero ?? '',
        observaciones:        gasto.observaciones      ?? '',
        metodo_pago_id:       gasto.metodo_pago_id ? String(gasto.metodo_pago_id) : '',
        cuenta_pago_id:       gasto.cuenta_pago_id ? String(gasto.cuenta_pago_id) : '',
    });

    const {
        tipoOptions, metodosOptions,
        getClasificacionOptions, getDescripcionOptions,
        getCuentaUnica, tieneCuentas, getCuentaOptions,
    } = useGastoForm(tipos, metodosPago);

    const localesFiltrados = esSuperAdmin && data.empresa_id
        ? locales.filter(l => l.empresa_id === Number(data.empresa_id))
        : locales;

    const cuentaUnica = getCuentaUnica(data.metodo_pago_id);
    const conCuentas  = tieneCuentas(data.metodo_pago_id);
    const multCuentas = conCuentas && !cuentaUnica;

    const guardar = () => {
        put(route('gastos.update', gasto.id), {
            onError: () => toast.error('Revisa los campos requeridos.'),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Editar Gasto" />
            <Toaster position="top-right" />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Link href={route('gastos.index')}>
                        <button style={{
                            display: 'flex', alignItems: 'center', gap: 6, background: 'none',
                            border: '1px solid #E2E8F0', borderRadius: 10, padding: '8px 14px',
                            cursor: 'pointer', fontSize: 13, color: '#64748B',
                        }}>
                            <ArrowLeft size={15} /> Volver
                        </button>
                    </Link>
                    <div>
                        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1E293B', margin: 0 }}>Editar Gasto</h1>
                        <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 2 }}>Modifica los datos del gasto</p>
                    </div>
                </div>
                <Button variant="primary" size="md" icon={<Save size={15} />} loading={processing} onClick={guardar}>
                    Guardar Cambios
                </Button>
            </div>

            <div style={{ backgroundColor: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                {/* Card header */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 20px', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0',
                }}>
                    <Receipt size={15} color="#64748B" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Datos del Gasto
                    </span>
                </div>

                <div style={{ padding: 20 }}>
                    {/* Fila 1 */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0 16px', marginBottom: 4 }}>
                        {esSuperAdmin && (
                            <SelectField
                                label="Empresa" name="empresa_id" value={data.empresa_id}
                                onChange={e => { setData('empresa_id', e.target.value); setData('local_id', ''); }}
                                options={empresas.map(e => ({ value: e.id, label: e.nombre }))}
                                placeholder="Selecciona empresa"
                            />
                        )}
                        <SelectField
                            label="Local" name="local_id" value={data.local_id}
                            onChange={e => setData('local_id', e.target.value)}
                            options={localesFiltrados.map(l => ({ value: l.id, label: l.nombre }))}
                            placeholder="Local (opcional)"
                        />
                        <InputField
                            label="Fecha del gasto" name="fecha" value={data.fecha}
                            type="date" onChange={e => setData('fecha', e.target.value)}
                            error={errors.fecha} required
                        />
                        <InputField
                            label="Monto (S/)" name="monto" value={data.monto}
                            type="number" onChange={e => setData('monto', e.target.value)}
                            error={errors.monto} placeholder="0.00" required
                        />
                    </div>

                    {/* Fila 2: Cascada */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0 16px', marginBottom: 4 }}>
                        <SelectField
                            label="Categoría" name="tipo_id" value={data.tipo_id}
                            onChange={e => { setData('tipo_id', e.target.value); setData('clasificacion_id', ''); setData('descripcion_gasto_id', ''); }}
                            options={tipoOptions}
                            placeholder="Selecciona categoría" required
                        />
                        <SelectField
                            label="Clasificación" name="clasificacion_id" value={data.clasificacion_id}
                            onChange={e => { setData('clasificacion_id', e.target.value); setData('descripcion_gasto_id', ''); }}
                            options={getClasificacionOptions(data.tipo_id)}
                            placeholder={data.tipo_id ? 'Selecciona clasificación' : '— elige categoría —'}
                            error={errors.clasificacion_id} required
                        />
                        <SelectField
                            label="Descripción / Concepto" name="descripcion_gasto_id" value={data.descripcion_gasto_id}
                            onChange={e => setData('descripcion_gasto_id', e.target.value)}
                            options={getDescripcionOptions(data.tipo_id, data.clasificacion_id)}
                            placeholder={data.clasificacion_id ? 'Selecciona concepto' : '— elige clasificación —'}
                            error={errors.descripcion_gasto_id} required
                        />
                    </div>

                    {/* Fila 3 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0 16px', marginBottom: 4 }}>
                        <InputField
                            label="Nº Comprobante" name="comprobante_numero" value={data.comprobante_numero}
                            onChange={e => setData('comprobante_numero', e.target.value)}
                            placeholder="Opcional"
                        />
                        <InputField
                            label="Observaciones" name="observaciones" value={data.observaciones}
                            onChange={e => setData('observaciones', e.target.value)}
                            placeholder="Detalle adicional (opcional)"
                        />
                    </div>

                    {/* Método de pago */}
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px dashed #E2E8F0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                            <CreditCard size={14} color="#94A3B8" />
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Método de Pago
                            </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 16px' }}>
                            <SelectField
                                label="Método de pago" name="metodo_pago_id" value={data.metodo_pago_id}
                                onChange={e => { setData('metodo_pago_id', e.target.value); setData('cuenta_pago_id', ''); }}
                                options={metodosOptions}
                                placeholder="Selecciona método"
                                error={errors.metodo_pago_id}
                            />
                            {conCuentas && cuentaUnica && (
                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', display: 'block', marginBottom: 6 }}>
                                        Cuenta asociada
                                    </label>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        padding: '10px 14px', borderRadius: 10,
                                        backgroundColor: '#F0FDF4', border: '1.5px solid #BBF7D0',
                                        fontSize: 13, fontWeight: 600, color: '#16A34A',
                                    }}>
                                        <CreditCard size={14} />
                                        {cuentaUnica.nombre}
                                        <span style={{ fontSize: 11, color: '#86EFAC', marginLeft: 4 }}>(auto)</span>
                                    </div>
                                </div>
                            )}
                            {multCuentas && (
                                <SelectField
                                    label="Cuenta de destino" name="cuenta_pago_id" value={data.cuenta_pago_id}
                                    onChange={e => setData('cuenta_pago_id', e.target.value)}
                                    options={getCuentaOptions(data.metodo_pago_id)}
                                    placeholder="Selecciona cuenta"
                                    error={errors.cuenta_pago_id}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
                <Link href={route('gastos.index')}>
                    <Button variant="cancel" size="md">Cancelar</Button>
                </Link>
                <Button variant="primary" size="md" icon={<Save size={15} />} loading={processing} onClick={guardar}>
                    Guardar Cambios
                </Button>
            </div>
        </AuthenticatedLayout>
    );
}