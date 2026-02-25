import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';

const hora = () => {
    const h = new Date().getHours();
    if (h >= 5  && h < 12) return 'Buenos días';
    if (h >= 12 && h < 19) return 'Buenas tardes';
    return 'Buenas noches';
};

const fecha = () => new Date().toLocaleDateString('es-PE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
});

export default function Dashboard() {
    const { auth } = usePage<PageProps>().props;
    const nombre   = auth.user.name.split(' ')[0];

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div style={{
                minHeight: '70vh',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <div style={{ textAlign: 'center', maxWidth: 520 }}>

                    {/* Logo / ícono */}
                    <div style={{
                        width: 72, height: 72, borderRadius: 20,
                        background: 'linear-gradient(135deg, #1E293B, #2563EB)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 24px', fontSize: 32,
                        boxShadow: '0 12px 32px rgba(37,99,235,0.25)',
                    }}>
                        🔧
                    </div>

                    {/* Saludo */}
                    <p style={{
                        margin: '0 0 6px',
                        fontSize: 15, color: '#94A3B8',
                        fontWeight: 500, textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                    }}>
                        {hora()}
                    </p>
                    <h1 style={{
                        margin: '0 0 12px',
                        fontSize: 42, fontWeight: 900,
                        color: '#1E293B', lineHeight: 1.1,
                    }}>
                        {nombre} 👋
                    </h1>
                    <p style={{
                        margin: '0 0 28px',
                        fontSize: 16, color: '#64748B', lineHeight: 1.6,
                    }}>
                        Bienvenido a <strong style={{ color: '#2563EB' }}>TallerHub</strong>.<br />
                        Usa el menú lateral para navegar por el sistema.
                    </p>

                    {/* Fecha */}
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0',
                        borderRadius: 12, padding: '10px 20px',
                        fontSize: 13, color: '#475569', fontWeight: 600,
                    }}>
                        📅 {fecha()}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}