import Button from '@/Components/Button';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

export default function Login({ status, canResetPassword }: { status?: string; canResetPassword: boolean }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '', password: '', remember: false as boolean,
    });
    const [showPassword, setShowPassword] = useState(false);
    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };

    const inputStyle = (hasError: boolean): React.CSSProperties => ({
        width: '100%', padding: '13px 16px', fontSize: '16px',
        border: `1.5px solid ${hasError ? '#DC2626' : '#E2E8F0'}`,
        borderRadius: '10px', outline: 'none', color: '#1E293B',
        backgroundColor: '#fff', transition: 'border-color 0.2s, box-shadow 0.2s',
    });

    return (
        <>
            <Head title="Iniciar Sesión — Taller Hub" />
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                input:focus { border-color: #2563EB !important; box-shadow: 0 0 0 4px rgba(37,99,235,0.1); }
                input::placeholder { color: #CBD5E1; }
            `}</style>

            <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#F8FAFC' }}>

                {/* Panel izquierdo — solo desktop */}
                <div className="hidden lg:flex" style={{
                    width: '50%', flexDirection: 'column', justifyContent: 'space-between',
                    padding: '48px', background: 'linear-gradient(135deg, #0F172A, #1E293B)', position: 'relative', overflow: 'hidden',
                }}>
                    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                        <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, #D97706, transparent)', opacity: 0.1 }} />
                        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, #2563EB, transparent)', opacity: 0.1 }} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
                        <div style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: '#fff', padding: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src="/logo.png" alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 10 }} />
                        </div>
                        <span style={{ color: '#fff', fontWeight: 800, fontSize: 22 }}>
                            Taller<span style={{ color: '#D97706' }}>Hub</span>
                        </span>
                    </div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h2 style={{ fontSize: 40, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 16 }}>
                            Todo tu taller,<br />en un solo lugar.
                        </h2>
                        <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
                            Órdenes, repuestos, clientes y reportes.<br />Sin papel. Sin complicaciones.
                        </p>
                        <div style={{ display: 'flex', gap: 40, marginTop: 36 }}>
                            {[['100%','Digital'],['0','Papel'],['24/7','Disponible']].map(([v,l]) => (
                                <div key={l}>
                                    <div style={{ fontSize: 28, fontWeight: 800, color: '#D97706' }}>{v}</div>
                                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{l}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', position: 'relative', zIndex: 1 }}>
                        © {new Date().getFullYear()} TallerHub
                    </p>
                </div>

                {/* Panel derecho — formulario */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
                    <div style={{ width: '100%', maxWidth: 420 }}>

                        {/* Logo móvil */}
                        <div className="flex lg:hidden" style={{ alignItems: 'center', gap: 12, marginBottom: 36 }}>
                            <div style={{ width: 52, height: 52, borderRadius: 12, backgroundColor: '#1E293B', padding: 4 }}>
                                <img src="/logo.png" alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }} />
                            </div>
                            <span style={{ fontWeight: 800, fontSize: 20, color: '#1E293B' }}>
                                Taller<span style={{ color: '#D97706' }}>Hub</span>
                            </span>
                        </div>

                        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1E293B', marginBottom: 8 }}>Bienvenido de nuevo</h1>
                        <p style={{ fontSize: 16, color: '#64748B', marginBottom: 32 }}>Ingresa tus credenciales para continuar</p>

                        {status && (
                            <div style={{ padding: '12px 16px', borderRadius: 10, backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534', fontSize: 15, marginBottom: 24 }}>
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                            {/* Email */}
                            <div>
                                <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#1E293B', marginBottom: 8 }}>
                                    Correo electrónico
                                </label>
                                <input
                                    type="email" value={data.email} autoFocus
                                    placeholder="tucorreo@ejemplo.com"
                                    onChange={(e) => setData('email', e.target.value)}
                                    style={inputStyle(!!errors.email)}
                                />
                                {errors.email && <p style={{ marginTop: 6, fontSize: 14, color: '#DC2626' }}>{errors.email}</p>}
                            </div>

                            {/* Password */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <label style={{ fontSize: 15, fontWeight: 600, color: '#1E293B' }}>Contraseña</label>
                                    {canResetPassword && (
                                        <Link href={route('password.request')} style={{ fontSize: 14, color: '#2563EB', fontWeight: 500 }}>
                                            ¿Olvidaste tu contraseña?
                                        </Link>
                                    )}
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? 'text' : 'password'} value={data.password}
                                        placeholder="••••••••"
                                        onChange={(e) => setData('password', e.target.value)}
                                        style={{ ...inputStyle(!!errors.password), paddingRight: 52 }}
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex' }}>
                                        {showPassword
                                            ? <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                            : <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        }
                                    </button>
                                </div>
                                {errors.password && <p style={{ marginTop: 6, fontSize: 14, color: '#DC2626' }}>{errors.password}</p>}
                            </div>

                            {/* Remember */}
                            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                                <input type="checkbox" checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked as false)}
                                    style={{ width: 18, height: 18, accentColor: '#2563EB', cursor: 'pointer' }} />
                                <span style={{ fontSize: 15, color: '#64748B' }}>Mantener sesión iniciada</span>
                            </label>

                            <Button type="submit" size="lg" loading={processing} style={{ width: '100%' }}>
                                Iniciar Sesión
                            </Button>
                        </form>

                        <p style={{ marginTop: 28, textAlign: 'center', fontSize: 14, color: '#1E293B' }}>
                            Sistema seguro y confiable
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}