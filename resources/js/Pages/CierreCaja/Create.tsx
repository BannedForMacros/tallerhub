import { useState } from 'react';
import { router, useForm, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/Button';
import { PageProps, Local, Empresa } from '@/types';

interface Props extends PageProps {
    locales: Local[];
    empresas: Empresa[];
}

export default function CierreCajaCreate({ locales, empresas, auth }: Props) {
    const esSuperAdmin = auth.user.esSuperAdmin;

    const params = new URLSearchParams(window.location.search);
    const fechaParam = params.get('fecha') ?? new Date().toISOString().split('T')[0];

    const { data, setData, post, processing, errors } = useForm({
        empresa_id:    auth.user.empresa_id?.toString() ?? '',
        local_id:      '',
        fecha:         fechaParam,
        observaciones: '',
    });

    const localesFiltrados = esSuperAdmin && data.empresa_id
        ? locales.filter(l => l.empresa_id === parseInt(data.empresa_id))
        : locales;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('cierre-caja.store'));
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        border: '1px solid #E2E8F0',
        borderRadius: 8,
        padding: '9px 12px',
        fontSize: 14,
        color: '#1E293B',
        outline: 'none',
        backgroundColor: '#fff',
    };

    const labelStyle: React.CSSProperties = {
        fontSize: 12,
        fontWeight: 700,
        color: '#475569',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
        marginBottom: 6,
        display: 'block',
    };

    const errorStyle: React.CSSProperties = {
        fontSize: 12,
        color: '#EF4444',
        marginTop: 4,
    };

    return (
        <AuthenticatedLayout>
            <Head title="Nuevo Cierre de Caja" />

            <div style={{ maxWidth: 560 }}>
                <div style={{ marginBottom: 24 }}>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', margin: 0 }}>Nuevo Cierre de Caja</h1>
                    <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 4 }}>
                        El sistema calculará automáticamente los montos esperados desde las ventas del día.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>

                        {esSuperAdmin && (
                            <div>
                                <label style={labelStyle}>Empresa</label>
                                <select
                                    value={data.empresa_id}
                                    onChange={e => { setData('empresa_id', e.target.value); setData('local_id', ''); }}
                                    style={inputStyle}
                                >
                                    <option value="">Seleccionar empresa...</option>
                                    {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                                </select>
                            </div>
                        )}

                        <div>
                            <label style={labelStyle}>Local *</label>
                            <select
                                value={data.local_id}
                                onChange={e => setData('local_id', e.target.value)}
                                style={inputStyle}
                                required
                            >
                                <option value="">Seleccionar local...</option>
                                {localesFiltrados.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                            </select>
                            {errors.local_id && <p style={errorStyle}>{errors.local_id}</p>}
                        </div>

                        <div>
                            <label style={labelStyle}>Fecha *</label>
                            <input
                                type="date"
                                value={data.fecha}
                                onChange={e => setData('fecha', e.target.value)}
                                style={inputStyle}
                                required
                            />
                            {errors.fecha && <p style={errorStyle}>{errors.fecha}</p>}
                        </div>

                        <div>
                            <label style={labelStyle}>Observaciones</label>
                            <textarea
                                value={data.observaciones}
                                onChange={e => setData('observaciones', e.target.value)}
                                rows={3}
                                style={{ ...inputStyle, resize: 'vertical' }}
                                placeholder="Observaciones opcionales..."
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #F1F5F9' }}>
                            <Button
                                variant="cancel"
                                size="md"
                                type="button"
                                onClick={() => router.visit(route('cierre-caja.index'))}
                            >
                                Cancelar
                            </Button>
                            <Button variant="primary" size="md" type="submit" disabled={processing}>
                                {processing ? 'Iniciando...' : 'Iniciar Cierre'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
