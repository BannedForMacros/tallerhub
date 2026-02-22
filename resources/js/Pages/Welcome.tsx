import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

export default function Welcome({
    auth,
}: PageProps<{ laravelVersion: string; phpVersion: string }>) {
    const [isVisible, setIsVisible] = useState(false);
    const [scrollY, setScrollY] = useState(0);
    const featuresRef = useRef<HTMLDivElement>(null);
    const [featuresVisible, setFeaturesVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setFeaturesVisible(true); },
            { threshold: 0.1 }
        );
        if (featuresRef.current) observer.observe(featuresRef.current);
        return () => observer.disconnect();
    }, []);

    const features = [
        {
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
            ),
            title: 'Órdenes de Servicio',
            description: 'Crea, asigna y monitorea cada orden desde el diagnóstico hasta la entrega. Historial completo por cliente y equipo.',
        },
        {
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            ),
            title: 'Control de Repuestos',
            description: 'Gestiona tu almacén en tiempo real. Stock mínimo, alertas automáticas y trazabilidad total de cada pieza.',
        },
        {
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            title: 'Gestión de Clientes',
            description: 'Base de datos completa de clientes con historial de equipos reparados, pagos y seguimiento personalizado.',
        },
        {
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            title: 'Reportes y Ventas',
            description: 'Dashboards con métricas clave de tu negocio. Ventas diarias, técnicos más productivos y rentabilidad por servicio.',
        },
    ];

    const stats = [
        { value: '100%', label: 'Digital' },
        { value: '24/7', label: 'Disponible' },
        { value: '0', label: 'Papel' },
    ];

    return (
        <>
            <Head title="Taller Hub — Gestión de Talleres Técnicos" />

            <div className="min-h-screen bg-white font-sans overflow-x-hidden">

                {/* ── NAVBAR ── */}
                <nav
                    className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
                    style={{
                        backgroundColor: scrollY > 50 ? 'rgba(30,41,59,0.97)' : 'transparent',
                        backdropFilter: scrollY > 50 ? 'blur(12px)' : 'none',
                        boxShadow: scrollY > 50 ? '0 1px 30px rgba(0,0,0,0.3)' : 'none',
                    }}
                >
                    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: '#2563EB' }}>
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                                    style={{ backgroundColor: '#D97706' }} />
                            </div>
                            <span className="text-white font-bold text-xl tracking-tight">
                                Taller<span style={{ color: '#D97706' }}>Hub</span>
                            </span>
                        </div>

                        {/* Nav right */}
                        {auth.user ? (
                            <Link href={route('dashboard')}
                                className="px-5 py-2 rounded-lg text-white font-medium text-sm transition-all duration-200 hover:opacity-90"
                                style={{ backgroundColor: '#2563EB' }}>
                                Ir al Dashboard
                            </Link>
                        ) : (
                            <Link href={route('login')}
                                className="px-5 py-2 rounded-lg text-white font-medium text-sm transition-all duration-200 border border-white/20 hover:border-white/50 hover:bg-white/10">
                                Iniciar Sesión
                            </Link>
                        )}
                    </div>
                </nav>

                {/* ── HERO ── */}
                <section className="relative min-h-screen flex items-center justify-center overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #1e3a5f 100%)' }}>

                    {/* Fondo decorativo */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {/* Círculo grande cobre */}
                        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10"
                            style={{ background: 'radial-gradient(circle, #D97706, transparent)' }} />
                        {/* Círculo azul */}
                        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-10"
                            style={{ background: 'radial-gradient(circle, #2563EB, transparent)' }} />
                        {/* Grid lines */}
                        <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                                    <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#grid)" />
                        </svg>
                        {/* Línea decorativa cobre */}
                        <div className="absolute top-1/2 left-0 right-0 h-px opacity-20"
                            style={{ background: 'linear-gradient(90deg, transparent, #D97706, transparent)' }} />
                    </div>

                    {/* Contenido Hero */}
                    <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">

                        {/* Badge */}
                        <div
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium mb-8 border"
                            style={{
                                backgroundColor: 'rgba(217,119,6,0.1)',
                                borderColor: 'rgba(217,119,6,0.3)',
                                color: '#D97706',
                                opacity: isVisible ? 1 : 0,
                                transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                                transition: 'all 0.6s ease',
                            }}
                        >
                            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                            Software de Gestión para Talleres Técnicos
                        </div>

                        {/* Título */}
                        <h1
                            className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-6"
                            style={{
                                opacity: isVisible ? 1 : 0,
                                transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                                transition: 'all 0.7s ease 0.1s',
                            }}
                        >
                            Tu taller,{' '}
                            <span style={{
                                background: 'linear-gradient(135deg, #2563EB, #D97706)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}>
                                bajo control
                            </span>
                        </h1>

                        {/* Subtítulo */}
                        <p
                            className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed"
                            style={{
                                opacity: isVisible ? 1 : 0,
                                transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                                transition: 'all 0.7s ease 0.2s',
                            }}
                        >
                            Gestiona órdenes de servicio, repuestos, clientes y ventas desde un solo lugar.
                            Diseñado para talleres mecánicos, electrónicos y de electrodomésticos.
                        </p>

                        {/* CTA Button */}
                        <div
                            style={{
                                opacity: isVisible ? 1 : 0,
                                transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                                transition: 'all 0.7s ease 0.3s',
                            }}
                        >
                            <Link
                                href={route('login')}
                                className="group inline-flex items-center gap-3 px-8 py-4 rounded-xl text-white font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                                style={{
                                    backgroundColor: '#2563EB',
                                    boxShadow: '0 0 40px rgba(37,99,235,0.4)',
                                }}
                            >
                                Iniciar Sesión
                                <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Link>
                        </div>

                        {/* Stats */}
                        <div
                            className="flex items-center justify-center gap-12 mt-16"
                            style={{
                                opacity: isVisible ? 1 : 0,
                                transition: 'all 0.7s ease 0.5s',
                            }}
                        >
                            {stats.map((stat, i) => (
                                <div key={i} className="text-center">
                                    <div className="text-3xl font-extrabold" style={{ color: '#D97706' }}>
                                        {stat.value}
                                    </div>
                                    <div className="text-white/40 text-sm mt-1">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Scroll indicator */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
                        <span className="text-white text-xs">Descubre más</span>
                        <div className="w-px h-8 bg-white animate-pulse" />
                    </div>
                </section>

                {/* ── FEATURES ── */}
                <section ref={featuresRef} className="py-24 px-6" style={{ backgroundColor: '#F8FAFC' }}>
                    <div className="max-w-7xl mx-auto">

                        {/* Header sección */}
                        <div className="text-center mb-16"
                            style={{
                                opacity: featuresVisible ? 1 : 0,
                                transform: featuresVisible ? 'translateY(0)' : 'translateY(30px)',
                                transition: 'all 0.6s ease',
                            }}>
                            <div className="inline-block px-4 py-1 rounded-full text-xs font-semibold mb-4"
                                style={{ backgroundColor: 'rgba(37,99,235,0.1)', color: '#2563EB' }}>
                                ¿Qué incluye?
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#1E293B' }}>
                                Todo lo que tu taller necesita
                            </h2>
                            <p className="text-gray-500 max-w-xl mx-auto">
                                Una plataforma completa pensada para técnicos y dueños de taller que quieren
                                crecer sin perder el control.
                            </p>
                        </div>

                        {/* Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {features.map((feature, index) => (
                                <div
                                    key={index}
                                    className="group bg-white rounded-2xl p-7 border border-gray-100 hover:border-blue-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl cursor-default"
                                    style={{
                                        opacity: featuresVisible ? 1 : 0,
                                        transform: featuresVisible ? 'translateY(0)' : 'translateY(40px)',
                                        transition: `all 0.6s ease ${index * 0.1}s`,
                                    }}
                                >
                                    {/* Ícono */}
                                    <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-colors duration-300"
                                        style={{
                                            backgroundColor: 'rgba(37,99,235,0.08)',
                                            color: '#2563EB',
                                        }}>
                                        {feature.icon}
                                    </div>

                                    {/* Acento cobre */}
                                    <div className="w-8 h-1 rounded-full mb-4 transition-all duration-300 group-hover:w-12"
                                        style={{ backgroundColor: '#D97706' }} />

                                    <h3 className="font-bold text-lg mb-2" style={{ color: '#1E293B' }}>
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── BANNER INTERMEDIO ── */}
                <section className="py-16 px-6" style={{ backgroundColor: '#1E293B' }}>
                    <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-2">
                                Desde electrodomésticos hasta motos
                            </h3>
                            <p className="text-white/50">
                                Taller Hub se adapta a cualquier tipo de servicio técnico sin configuraciones complicadas.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3 shrink-0">
                            {['Electrónica', 'Mecánica', 'Electrodomésticos', 'Celulares', 'Computadoras'].map((tag) => (
                                <span key={tag}
                                    className="px-4 py-2 rounded-full text-sm font-medium border"
                                    style={{
                                        borderColor: 'rgba(217,119,6,0.4)',
                                        color: '#D97706',
                                        backgroundColor: 'rgba(217,119,6,0.08)',
                                    }}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── CTA FINAL ── */}
                <section className="py-28 px-6 text-center relative overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-16"
                            style={{ background: 'linear-gradient(to bottom, transparent, #E2E8F0)' }} />
                    </div>
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-4xl md:text-5xl font-extrabold mb-6" style={{ color: '#1E293B' }}>
                            Empieza a gestionar tu taller{' '}
                            <span style={{ color: '#2563EB' }}>hoy mismo</span>
                        </h2>
                        <p className="text-gray-400 mb-10 text-lg">
                            Sin complicaciones. Sin papel. Sin excusas.
                        </p>
                        <Link
                            href={route('login')}
                            className="group inline-flex items-center gap-3 px-10 py-4 rounded-xl text-white font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                            style={{
                                background: 'linear-gradient(135deg, #1E293B, #2563EB)',
                                boxShadow: '0 8px 30px rgba(37,99,235,0.3)',
                            }}
                        >
                            Iniciar Sesión
                            <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                    </div>
                </section>

                {/* ── FOOTER ── */}
                <footer className="py-8 px-6 border-t border-gray-100">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded flex items-center justify-center"
                                style={{ backgroundColor: '#2563EB' }}>
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <span className="font-bold text-sm" style={{ color: '#1E293B' }}>
                                Taller<span style={{ color: '#D97706' }}>Hub</span>
                            </span>
                        </div>
                        <p className="text-gray-400 text-sm">
                            © {new Date().getFullYear()} TallerHub — Todos los derechos reservados
                        </p>
                    </div>
                </footer>

            </div>
        </>
    );
}