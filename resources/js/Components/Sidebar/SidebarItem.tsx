import { Link } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Modulo } from '@/types';
import SidebarIcon from './SidebarIcon';

interface Props {
    modulo: Modulo;
    collapsed: boolean;
}

export default function SidebarItem({ modulo, collapsed }: Props) {
    const tieneHijos = modulo.hijos && modulo.hijos.length > 0;
    const [abierto, setAbierto] = useState(false);

    const esActivo = window.location.pathname.startsWith(modulo.url);

    const itemStyle = (activo: boolean): React.CSSProperties => ({
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: collapsed ? '10px 0' : '10px 14px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderRadius: 10,
        cursor: 'pointer',
        transition: 'all 0.2s',
        backgroundColor: activo ? 'rgba(37,99,235,0.12)' : 'transparent',
        color: activo ? '#2563EB' : 'rgba(255,255,255,0.7)',
        fontWeight: activo ? 600 : 400,
        fontSize: 14,
        border: 'none',
        width: '100%',
        textDecoration: 'none',
        position: 'relative',
    });

    // Con hijos — desplegable
    if (tieneHijos) {
        return (
            <div>
                <button
                    onClick={() => setAbierto(!abierto)}
                    style={itemStyle(esActivo)}
                    onMouseEnter={(e) => {
                        if (!esActivo) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.06)';
                    }}
                    onMouseLeave={(e) => {
                        if (!esActivo) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                    }}
                >
                    <SidebarIcon name={modulo.icono} />
                    {!collapsed && (
                        <>
                            <span style={{ flex: 1, textAlign: 'left' }}>{modulo.nombre}</span>
                            <ChevronDown
                                size={14}
                                style={{
                                    transition: 'transform 0.2s',
                                    transform: abierto ? 'rotate(180deg)' : 'rotate(0deg)',
                                    opacity: 0.6,
                                }}
                            />
                        </>
                    )}
                </button>

                {/* Hijos */}
                {abierto && !collapsed && (
                    <div style={{ marginLeft: 28, marginTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {modulo.hijos!.map((hijo) => {
                            const hijoActivo = window.location.pathname === hijo.url;
                            return (
                                <Link
                                    key={hijo.id}
                                    href={hijo.url}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '8px 12px',
                                        borderRadius: 8,
                                        fontSize: 13,
                                        color: hijoActivo ? '#2563EB' : 'rgba(255,255,255,0.55)',
                                        backgroundColor: hijoActivo ? 'rgba(37,99,235,0.1)' : 'transparent',
                                        fontWeight: hijoActivo ? 600 : 400,
                                        textDecoration: 'none',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!hijoActivo) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.05)';
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!hijoActivo) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                                    }}
                                >
                                    {/* Línea decorativa */}
                                    <div style={{
                                        width: 5, height: 5, borderRadius: '50%',
                                        backgroundColor: hijoActivo ? '#D97706' : 'rgba(255,255,255,0.3)',
                                        flexShrink: 0,
                                    }} />
                                    {hijo.nombre}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    // Sin hijos — link directo
    return (
        <Link
            href={modulo.url}
            style={itemStyle(esActivo)}
            onMouseEnter={(e) => {
                if (!esActivo) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.06)';
            }}
            onMouseLeave={(e) => {
                if (!esActivo) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
            }}
        >
            <SidebarIcon name={modulo.icono} />
            {!collapsed && <span>{modulo.nombre}</span>}

            {/* Indicador activo */}
            {esActivo && (
                <div style={{
                    position: 'absolute', right: 0, top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3, height: 20, borderRadius: 3,
                    backgroundColor: '#D97706',
                }} />
            )}
        </Link>
    );
}