import { ReactNode, useState } from 'react';

interface Props {
    onClick: () => void;
    icon: ReactNode;
    tooltip: string;
    color?: 'blue' | 'red' | 'green' | 'amber' | 'gray';
}

const colorMap = {
    blue:  { border: '#2563EB', bg: '#EFF6FF',  text: '#2563EB' },
    red:   { border: '#DC2626', bg: '#FEF2F2',  text: '#DC2626' },
    green: { border: '#16A34A', bg: '#F0FDF4',  text: '#16A34A' },
    amber: { border: '#D97706', bg: '#FFFBEB',  text: '#D97706' },
    gray:  { border: '#94A3B8', bg: '#F8FAFC',  text: '#64748B' },
};

export default function ActionButton({ onClick, icon, tooltip, color = 'blue' }: Props) {
    const [hovered, setHovered] = useState(false);
    const c = colorMap[color];

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
                onClick={onClick}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                style={{
                    width: 30, height: 30,
                    borderRadius: 7,
                    border: `1.5px solid ${hovered ? c.border : '#E2E8F0'}`,
                    backgroundColor: hovered ? c.bg : '#fff',
                    color: hovered ? c.text : '#94A3B8',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.18s',
                }}
            >
                {icon}
            </button>

            {/* Tooltip */}
            {hovered && (
                <div style={{
                    position: 'absolute',
                    bottom: '110%', left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#1E293B',
                    color: '#fff',
                    fontSize: 11, fontWeight: 500,
                    padding: '4px 8px',
                    borderRadius: 6,
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    zIndex: 50,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}>
                    {tooltip}
                    {/* Flecha */}
                    <div style={{
                        position: 'absolute', top: '100%', left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0, height: 0,
                        borderLeft: '4px solid transparent',
                        borderRight: '4px solid transparent',
                        borderTop: '4px solid #1E293B',
                    }} />
                </div>
            )}
        </div>
    );
}