import { Link, router, usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { PageProps } from '@/types';
import SidebarItem from './SidebarItem';

interface Props {
    collapsed: boolean;
    onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: Props) {
    const { auth, modulos } = usePage<PageProps>().props;
    const user = auth.user;

    const cerrarSesion = () => {
        router.post(route('logout'));
    };

    return (
        <aside style={{
            width: collapsed ? 64 : 240,
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
            display: 'flex',
            flexDirection: 'column',
            transition: 'width 0.3s ease',
            position: 'fixed',
            top: 0, left: 0, bottom: 0,
            zIndex: 100,
            overflow: 'hidden',
        }}>

            {/* Logo + toggle */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'space-between',
                padding: collapsed ? '20px 0' : '20px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                minHeight: 64,
            }}>
                {!collapsed && (
                    <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                        <div style={{
                            width: 34, height: 34, borderRadius: 8,
                            backgroundColor: '#fff', padding: 3,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <img src="/logo.png" alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        <span style={{ color: '#fff', fontWeight: 800, fontSize: 16, whiteSpace: 'nowrap' }}>
                            Taller<span style={{ color: '#D97706' }}>Hub</span>
                        </span>
                    </Link>
                )}

                {collapsed && (
                    <div style={{
                        width: 34, height: 34, borderRadius: 8,
                        backgroundColor: '#fff', padding: 3,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <img src="/logo.png" alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                )}

                <button
                    onClick={onToggle}
                    style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: 'none', cursor: 'pointer',
                        width: 24, height: 24, borderRadius: 6,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'rgba(255,255,255,0.5)',
                        flexShrink: 0,
                        marginLeft: collapsed ? 0 : 8,
                    }}
                >
                    {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
            </div>

            {/* Usuario */}
            {!collapsed && (
                <div style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            backgroundColor: '#2563EB',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0,
                        }}>
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <p style={{ color: '#fff', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {user.name}
                            </p>
                            <p style={{ color: '#D97706', fontSize: 11, fontWeight: 500, textTransform: 'capitalize' }}>
                                {user.rol ?? 'Sin rol'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Menú */}
            <nav style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: collapsed ? '12px 8px' : '12px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
            }}>
                {modulos.map((modulo) => (
                    <SidebarItem key={modulo.id} modulo={modulo} collapsed={collapsed} />
                ))}
            </nav>

            {/* Cerrar sesión */}
            <div style={{
                padding: collapsed ? '12px 8px' : '12px 10px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
            }}>
                <button
                    onClick={cerrarSesion}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: collapsed ? '10px 0' : '10px 14px',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        borderRadius: 10,
                        cursor: 'pointer',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: 'rgba(255,255,255,0.4)',
                        fontSize: 14,
                        width: '100%',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(220,38,38,0.1)';
                        (e.currentTarget as HTMLElement).style.color = '#EF4444';
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                        (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)';
                    }}
                >
                    <LogOut size={18} strokeWidth={1.8} />
                    {!collapsed && <span>Cerrar sesión</span>}
                </button>
            </div>
        </aside>
    );
}