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
                <div style={{ gridColumn: '1 / -1' }}>
                    <InputField
                        label="Nombre completo" name="nombre" value={data.nombre}
                        onChange={e => setData('nombre', e.target.value)}
                        error={errors.nombre} required
                        placeholder="Ej. Juan Pérez García"
                    />
                </div>
                <InputField
                    label="DNI / RUC" name="dni" value={data.dni}
                    onChange={e => setData('dni', e.target.value)}
                    error={errors.dni} placeholder="Número de documento"
                />
                <InputField
                    label="Teléfono" name="telefono" value={data.telefono}
                    onChange={e => setData('telefono', e.target.value)}
                    error={errors.telefono} placeholder="999 999 999"
                />
                <div style={{ gridColumn: '1 / -1' }}>
                    <InputField
                        label="Email" name="email" value={data.email} type="email"
                        onChange={e => setData('email', e.target.value)}
                        error={errors.email} placeholder="correo@ejemplo.com"
                    />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                    <InputField
                        label="Dirección" name="direccion" value={data.direccion}
                        onChange={e => setData('direccion', e.target.value)}
                        error={errors.direccion} placeholder="Av. Principal 123, Chiclayo"
                    />
                </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <Button variant="cancel" size="md" onClick={onCancelar}>Cancelar</Button>
                <Button variant="primary" size="md" loading={processing} onClick={onGuardar}>
                    {editando ? 'Actualizar' : 'Crear Cliente'}
                </Button>
            </div>
        </div>
    );
}