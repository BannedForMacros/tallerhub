import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import InputField from '@/Components/InputField';
import SelectField from '@/Components/SelectField';
import Button from '@/Components/Button';
import { ClienteFormData, Empresa } from '@/types';

interface Props {
    form: {
        data: ClienteFormData;
        setData: (key: keyof ClienteFormData, value: string) => void;
        processing: boolean;
        errors: Partial<Record<keyof ClienteFormData, string>>;
    };
    onGuardar: () => void;
    onCancelar: () => void;
    editando?: boolean;
    empresas?: Empresa[];
    esSuperAdmin?: boolean;
}

export default function ClienteForm({
    form, onGuardar, onCancelar,
    editando = false, empresas = [], esSuperAdmin = false,
}: Props) {
    const { data, setData, processing, errors } = form;

    const [buscando, setBuscando] = useState(false);
    const [errorBusqueda, setErrorBusqueda] = useState('');
    const [bloqueados, setBloqueados] = useState<Set<string>>(new Set());
    const [errorDoc, setErrorDoc] = useState('');

    const tipoDoc = data.tipo_documento || 'DNI';
    const longitudRequerida = tipoDoc === 'DNI' ? 8 : 11;
    const longitudDoc = data.dni?.replace(/\D/g, '').length ?? 0;
    const puedeConsultar = longitudDoc === longitudRequerida;

    const buscarDocumento = async () => {
        if (!puedeConsultar) return;
        setBuscando(true);
        setErrorBusqueda('');

        try {
            const res = await fetch(`/consulta-documento?numero=${encodeURIComponent(data.dni)}`, {
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            const json = await res.json();

            if (!res.ok) {
                setErrorBusqueda(json.error ?? 'No se encontró información');
                return;
            }

            const campos = new Set<string>();
            setData('nombre', json.nombre ?? '');
            campos.add('nombre');

            if (json.direccion) {
                setData('direccion', json.direccion);
                campos.add('direccion');
            }

            setBloqueados(campos);
        } catch {
            setErrorBusqueda('Error de conexión al consultar');
        } finally {
            setBuscando(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') onGuardar();
    };

    return (
        <div onKeyDown={handleKeyDown}>
            {esSuperAdmin && (
                <SelectField
                    label="Empresa" name="empresa_id" value={data.empresa_id ?? ''}
                    onChange={e => setData('empresa_id', e.target.value)}
                    options={empresas.map(e => ({ value: e.id, label: e.nombre }))}
                    placeholder="Selecciona empresa"
                    error={errors.empresa_id}
                    required
                />
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                {/* Tipo de documento */}
                <div>
                    <SelectField
                        label="Tipo de documento"
                        name="tipo_documento"
                        value={tipoDoc}
                        onChange={e => {
                            setData('tipo_documento', e.target.value);
                            setData('dni', '');
                            setBloqueados(new Set());
                            setErrorBusqueda('');
                            setErrorDoc('');
                        }}
                        options={[
                            { value: 'DNI', label: 'DNI' },
                            { value: 'RUC', label: 'RUC' },
                        ]}
                    />
                </div>

                {/* Número de documento + botón consultar */}
                <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#1E293B', marginBottom: 7 }}>
                        Número de documento
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <input
                            type="text"
                            name="dni"
                            value={data.dni}
                            maxLength={longitudRequerida}
                            placeholder={tipoDoc === 'DNI' ? '8 dígitos' : '11 dígitos'}
                            onChange={e => {
                                const soloNumeros = e.target.value.replace(/\D/g, '');
                                setErrorDoc(soloNumeros !== e.target.value ? 'Solo se permiten números' : '');
                                setData('dni', soloNumeros);
                                if (bloqueados.size > 0) setBloqueados(new Set());
                                setErrorBusqueda('');
                            }}
                            style={{
                                flex: 1, padding: '11px 14px', fontSize: 15, borderRadius: 10,
                                border: `1.5px solid ${(errors.dni || errorDoc) ? '#EF4444' : '#E2E8F0'}`,
                                outline: 'none', color: '#1E293B', height: 46, boxSizing: 'border-box',
                            }}
                        />
                        <button
                            type="button"
                            onClick={buscarDocumento}
                            disabled={!puedeConsultar || buscando}
                            title={!puedeConsultar ? `Ingresa ${longitudRequerida} dígitos` : `Consultar en ${tipoDoc === 'DNI' ? 'RENIEC' : 'SUNAT'}`}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '0 14px', borderRadius: 10, height: 46,
                                border: 'none', cursor: puedeConsultar && !buscando ? 'pointer' : 'not-allowed',
                                backgroundColor: puedeConsultar && !buscando ? '#2563EB' : '#CBD5E1',
                                color: '#fff', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
                                transition: 'background 0.2s', flexShrink: 0,
                            }}
                        >
                            {buscando
                                ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Buscando...</>
                                : <><Search size={14} /> Consultar</>
                            }
                        </button>
                    </div>
                    {data.dni.length > 0 && data.dni.length < longitudRequerida && !errorDoc && (
                        <p style={{ marginTop: 5, fontSize: 12, color: '#64748B' }}>
                            {data.dni.length}/{longitudRequerida} dígitos
                        </p>
                    )}
                    {errorDoc && <p style={{ marginTop: 5, fontSize: 13, color: '#EF4444' }}>{errorDoc}</p>}
                    {errors.dni && <p style={{ marginTop: 5, fontSize: 13, color: '#EF4444' }}>{errors.dni}</p>}
                    {errorBusqueda && <p style={{ marginTop: 5, fontSize: 13, color: '#EF4444' }}>{errorBusqueda}</p>}
                    {bloqueados.size > 0 && (
                        <p style={{ marginTop: 5, fontSize: 12, color: '#16A34A', fontWeight: 600 }}>
                            ✓ Datos obtenidos de {tipoDoc === 'DNI' ? 'RENIEC' : 'SUNAT'}
                        </p>
                    )}
                </div>

                {/* Nombre */}
                <div style={{ gridColumn: '1 / -1' }}>
                    <InputField
                        label="Nombre completo / Razón social" name="nombre" value={data.nombre}
                        onChange={e => setData('nombre', e.target.value)}
                        error={errors.nombre} required
                        placeholder="Ej. Juan Pérez García"
                        disabled={bloqueados.has('nombre')}
                    />
                </div>

                <InputField
                    label="Teléfono" name="telefono" value={data.telefono}
                    onChange={e => setData('telefono', e.target.value)}
                    error={errors.telefono} placeholder="999 999 999"
                />
                <InputField
                    label="Email" name="email" value={data.email} type="email"
                    onChange={e => setData('email', e.target.value)}
                    error={errors.email} placeholder="correo@ejemplo.com"
                />

                <div style={{ gridColumn: '1 / -1' }}>
                    <InputField
                        label="Dirección" name="direccion" value={data.direccion}
                        onChange={e => setData('direccion', e.target.value)}
                        error={errors.direccion}
                        placeholder="Av. Principal 123, Lima"
                        disabled={bloqueados.has('direccion')}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <Button variant="cancel" size="md" onClick={onCancelar}>Cancelar</Button>
                <Button variant="primary" size="md" loading={processing} onClick={onGuardar}>
                    {editando ? 'Actualizar' : 'Crear Cliente'}
                </Button>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
