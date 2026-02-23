import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { toast, Toaster } from 'react-hot-toast';
import { Head, Link } from '@inertiajs/react';
import { Plus, Trash2, ArrowLeft, Receipt, CreditCard, Save, ChevronDown } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SelectField from '@/Components/SelectField';
import InputField from '@/Components/InputField';
import Button from '@/Components/Button';
import useGastoForm from './hooks/useGastoForm';
import { PageProps } from '@/types';

interface Props extends PageProps {
    empresas:    any[];
    locales:     any[];
    tipos:       any[];
    metodosPago: any[];
}

interface GastoItem {
    _id:                  number;
    empresa_id:           string;
    local_id:             string;
    tipo_id:              string;
    clasificacion_id:     string;
    descripcion_gasto_id: string;
    monto:                string;
    fecha:                string;
    comprobante_numero:   string;
    observaciones:        string;
    metodo_pago_id:       string;
    cuenta_pago_id:       string;
}

const hoy = () => new Date().toISOString().split('T')[0];

const gastoVacio = (): GastoItem => ({
    _id:                  Date.now() + Math.random(),
    empresa_id:           '',
    local_id:             '',
    tipo_id:              '',
    clasificacion_id:     '',
    descripcion_gasto_id: '',
    monto:                '',
    fecha:                hoy(),
    comprobante_numero:   '',
    observaciones:        '',
    metodo_pago_id:       '',
    cuenta_pago_id:       '',
});

export default function GastosCreate({ empresas, locales, tipos, metodosPago }: Props) {
    const { auth } = usePage<Props>().props;
    const esSuperAdmin = auth.user.esSuperAdmin;

    const [gastos, setGastos]       = useState<GastoItem[]>([gastoVacio()]);
    const [processing, setProcessing] = useState(false);

    const {
        tipoOptions, metodosOptions,
        getClasificacionOptions, getDescripcionOptions,
        getCuentaUnica, tieneCuentas, getCuentaOptions,
    } = useGastoForm(tipos, metodosPago);

    const localesFiltrados = (empresaId: string) =>
        esSuperAdmin && empresaId
            ? locales.filter(l => l.empresa_id === Number(empresaId))
            : locales;

    const agregar = () => setGastos(prev => [...prev, gastoVacio()]);

    const eliminar = (id: number) => {
        if (gastos.length === 1) return toast.error('Debe haber al menos un gasto.');
        setGastos(prev => prev.filter(g => g._id !== id));
    };

    const actualizar = (id: number, campo: keyof GastoItem, valor: string) => {
        setGastos(prev => prev.map(g => {
            if (g._id !== id) return g;
            const u = { ...g, [campo]: valor };
            if (campo === 'tipo_id')          { u.clasificacion_id = ''; u.descripcion_gasto_id = ''; }
            if (campo === 'clasificacion_id') { u.descripcion_gasto_id = ''; }
            if (campo === 'metodo_pago_id')   { u.cuenta_pago_id = ''; }
            if (campo === 'empresa_id')       { u.local_id = ''; }
            return u;
        }));
    };

    const guardar = () => {
        const invalidos = gastos.filter(g => !g.descripcion_gasto_id || !g.monto || !g.fecha);
        if (invalidos.length > 0) return toast.error('Completa categoría, descripción y monto en todos los gastos.');

        const sinMetodo = gastos.some(g => !g.metodo_pago_id);
        if (sinMetodo) return toast.error('Selecciona el método de pago en todos los gastos.');

        const sinCuenta = gastos.some(g => {
            const cuentas = getCuentaOptions(g.metodo_pago_id);
            const unica   = getCuentaUnica(g.metodo_pago_id);
            return cuentas.length > 1 && !unica && !g.cuenta_pago_id;
        });
        if (sinCuenta) return toast.error('Selecciona la cuenta en los métodos que lo requieren.');

        setProcessing(true);
        router.post(route('gastos.store'), {
            gastos: gastos.map(g => {
                const cuentaUnica = getCuentaUnica(g.metodo_pago_id);
                return {
                    empresa_id:           esSuperAdmin ? (g.empresa_id || null) : null,
                    local_id:             g.local_id             || null,
                    descripcion_gasto_id: g.descripcion_gasto_id,
                    monto:                g.monto,
                    fecha:                g.fecha,
                    comprobante_numero:   g.comprobante_numero   || null,
                    observaciones:        g.observaciones        || null,
                    metodo_pago_id:       g.metodo_pago_id       || null,
                    cuenta_pago_id:       cuentaUnica ? String(cuentaUnica.id) : (g.cuenta_pago_id || null),
                };
            }),
        }, {
            onSuccess: () => toast.success('Gastos registrados correctamente.'),
            onError:   () => toast.error('Error al guardar. Revisa los campos.'),
            onFinish:  () => setProcessing(false),
        });
    };

    const totalGastos = gastos.reduce((acc, g) => acc + (parseFloat(g.monto) || 0), 0);

    return (
        <AuthenticatedLayout>
            <Head title="Registrar Gastos" />
            <Toaster position="top-right" />

            {/* Header */}
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
                        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1E293B', margin: 0 }}>
                            Registrar Gastos
                        </h1>
                        <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 2 }}>
                            Puedes registrar múltiples gastos de una sola vez
                        </p>
                    </div>
                </div>
                <Button variant="primary" size="md" icon={<Save size={15} />} loading={processing} onClick={guardar}>
                    Guardar {gastos.length > 1 ? `${gastos.length} gastos` : 'gasto'}
                </Button>
            </div>

            {/* Lista de gastos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
                {gastos.map((gasto, index) => {
                    const cuentaUnica  = getCuentaUnica(gasto.metodo_pago_id);
                    const conCuentas   = tieneCuentas(gasto.metodo_pago_id);
                    const multCuentas  = conCuentas && !cuentaUnica;

                    return (
                        <div key={gasto._id} style={{
                            backgroundColor: '#fff', borderRadius: 14,
                            border: '1px solid #E2E8F0', overflow: 'hidden',
                            transition: 'border-color 0.2s',
                        }}>
                            {/* Card header */}
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '12px 20px', backgroundColor: '#F8FAFC',
                                borderBottom: '1px solid #E2E8F0',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: '50%',
                                        backgroundColor: '#1E293B', color: '#fff',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 12, fontWeight: 800, flexShrink: 0,
                                    }}>
                                        {index + 1}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Receipt size={15} color="#64748B" />
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Gasto #{index + 1}
                                        </span>
                                        {gasto.monto && (
                                            <span style={{
                                                backgroundColor: '#FEF2F2', color: '#DC2626',
                                                padding: '2px 10px', borderRadius: 20,
                                                fontSize: 12, fontWeight: 700,
                                            }}>
                                                S/ {parseFloat(gasto.monto).toFixed(2)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {gastos.length > 1 && (
                                    <button onClick={() => eliminar(gasto._id)} style={{
                                        background: 'none', border: 'none', color: '#94A3B8',
                                        cursor: 'pointer', padding: '4px 8px', borderRadius: 8,
                                        display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                                        onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}
                                    >
                                        <Trash2 size={14} /> Eliminar
                                    </button>
                                )}
                            </div>

                            <div style={{ padding: 20 }}>
                                {/* Fila 1: Empresa (superadmin) + Local + Fecha */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0 16px', marginBottom: 4 }}>
                                    {esSuperAdmin && (
                                        <SelectField
                                            label="Empresa" name={`empresa_${gasto._id}`} value={gasto.empresa_id}
                                            onChange={e => actualizar(gasto._id, 'empresa_id', e.target.value)}
                                            options={empresas.map(e => ({ value: e.id, label: e.nombre }))}
                                            placeholder="Selecciona empresa"
                                        />
                                    )}
                                    <SelectField
                                        label="Local" name={`local_${gasto._id}`} value={gasto.local_id}
                                        onChange={e => actualizar(gasto._id, 'local_id', e.target.value)}
                                        options={localesFiltrados(gasto.empresa_id).map(l => ({ value: l.id, label: l.nombre }))}
                                        placeholder="Local (opcional)"
                                    />
                                    <InputField
                                        label="Fecha del gasto" name={`fecha_${gasto._id}`} value={gasto.fecha}
                                        type="date" onChange={e => actualizar(gasto._id, 'fecha', e.target.value)}
                                        required
                                    />
                                    <InputField
                                        label="Monto (S/)" name={`monto_${gasto._id}`} value={gasto.monto}
                                        type="number" onChange={e => actualizar(gasto._id, 'monto', e.target.value)}
                                        placeholder="0.00" required
                                    />
                                </div>

                                {/* Fila 2: Tipo → Clasificación → Descripción (cascada) */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0 16px', marginBottom: 4 }}>
                                    <SelectField
                                        label="Categoría" name={`tipo_${gasto._id}`} value={gasto.tipo_id}
                                        onChange={e => actualizar(gasto._id, 'tipo_id', e.target.value)}
                                        options={tipoOptions}
                                        placeholder="Selecciona categoría" required
                                    />
                                    <SelectField
                                        label="Clasificación" name={`clas_${gasto._id}`} value={gasto.clasificacion_id}
                                        onChange={e => actualizar(gasto._id, 'clasificacion_id', e.target.value)}
                                        options={getClasificacionOptions(gasto.tipo_id)}
                                        placeholder={gasto.tipo_id ? 'Selecciona clasificación' : '— elige categoría —'}
                                        required
                                    />
                                    <SelectField
                                        label="Descripción / Concepto" name={`desc_${gasto._id}`} value={gasto.descripcion_gasto_id}
                                        onChange={e => actualizar(gasto._id, 'descripcion_gasto_id', e.target.value)}
                                        options={getDescripcionOptions(gasto.tipo_id, gasto.clasificacion_id)}
                                        placeholder={gasto.clasificacion_id ? 'Selecciona concepto' : '— elige clasificación —'}
                                        required
                                    />
                                </div>

                                {/* Fila 3: Comprobante + Observaciones */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0 16px', marginBottom: 4 }}>
                                    <InputField
                                        label="Nº Comprobante" name={`comp_${gasto._id}`} value={gasto.comprobante_numero}
                                        onChange={e => actualizar(gasto._id, 'comprobante_numero', e.target.value)}
                                        placeholder="Opcional"
                                    />
                                    <InputField
                                        label="Observaciones" name={`obs_${gasto._id}`} value={gasto.observaciones}
                                        onChange={e => actualizar(gasto._id, 'observaciones', e.target.value)}
                                        placeholder="Detalle adicional (opcional)"
                                    />
                                </div>

                                {/* Fila 4: Método de pago + Cuenta */}
                                <div style={{
                                    marginTop: 14, paddingTop: 14,
                                    borderTop: '1px dashed #E2E8F0',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                                        <CreditCard size={14} color="#94A3B8" />
                                        <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Método de Pago
                                        </span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 16px' }}>
                                        <SelectField
                                            label="Método de pago" name={`metodo_${gasto._id}`} value={gasto.metodo_pago_id}
                                            onChange={e => actualizar(gasto._id, 'metodo_pago_id', e.target.value)}
                                            options={metodosOptions}
                                            placeholder="Selecciona método" required
                                        />

                                        {/* Cuenta única — asignada automáticamente */}
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
                                                    <span style={{ fontSize: 11, color: '#86EFAC', marginLeft: 4 }}>
                                                        (auto)
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Múltiples cuentas — selector */}
                                        {multCuentas && (
                                            <SelectField
                                                label="Cuenta de destino" name={`cuenta_${gasto._id}`} value={gasto.cuenta_pago_id}
                                                onChange={e => actualizar(gasto._id, 'cuenta_pago_id', e.target.value)}
                                                options={getCuentaOptions(gasto.metodo_pago_id)}
                                                placeholder="Selecciona cuenta" required
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Botón agregar */}
            <button onClick={agregar} style={{
                width: '100%', padding: '14px', borderRadius: 14, marginBottom: 20,
                border: '2px dashed #CBD5E1', backgroundColor: '#F8FAFC',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, fontSize: 13, fontWeight: 600, color: '#64748B',
                transition: 'all 0.2s',
            }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.color = '#2563EB'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.color = '#64748B'; }}
            >
                <Plus size={16} /> Agregar otro gasto
            </button>

            {/* Resumen total */}
            <div style={{
                backgroundColor: '#FEF2F2', borderRadius: 14, border: '1px solid #FECACA',
                padding: '14px 20px', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12,
            }}>
                <div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#64748B' }}>
                        {gastos.length} gasto(s) registrado(s)
                    </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#94A3B8' }}>TOTAL GASTOS</p>
                    <p style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#DC2626', lineHeight: 1 }}>
                        S/ {totalGastos.toFixed(2)}
                    </p>
                </div>
            </div>

            {/* Botones finales */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <Link href={route('gastos.index')}>
                    <Button variant="cancel" size="md">Cancelar</Button>
                </Link>
                <Button variant="primary" size="md" icon={<Save size={15} />} loading={processing} onClick={guardar}>
                    Guardar {gastos.length > 1 ? `${gastos.length} gastos` : 'gasto'}
                </Button>
            </div>
        </AuthenticatedLayout>
    );
}