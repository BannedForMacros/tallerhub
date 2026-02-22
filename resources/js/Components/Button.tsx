import { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'success' | 'danger' | 'warning' | 'ghost' | 'cancel';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
    icon?: React.ReactNode;
}

const variants: Record<Variant, React.CSSProperties> = {
    primary: { backgroundColor: '#2563EB', color: '#fff', boxShadow: '0 4px 14px rgba(37,99,235,0.3)' },
    success: { backgroundColor: '#16A34A', color: '#fff', boxShadow: '0 4px 14px rgba(22,163,74,0.3)' },
    danger:  { backgroundColor: '#DC2626', color: '#fff', boxShadow: '0 4px 14px rgba(220,38,38,0.3)' },
    warning: { backgroundColor: '#D97706', color: '#fff', boxShadow: '0 4px 14px rgba(217,119,6,0.3)' },
    ghost:   { backgroundColor: 'transparent', color: '#2563EB', border: '1.5px solid #2563EB' },
    cancel:  { backgroundColor: '#F1F5F9', color: '#64748B', border: '1.5px solid #E2E8F0' },
};

const sizes: Record<Size, React.CSSProperties> = {
    sm: { padding: '8px 16px',  fontSize: '14px', borderRadius: '8px'  },
    md: { padding: '12px 24px', fontSize: '15px', borderRadius: '10px' },
    lg: { padding: '15px 32px', fontSize: '17px', borderRadius: '12px' },
};

export default function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    children,
    disabled,
    style,
    ...props
}: ButtonProps) {
    return (
        <button
            disabled={disabled || loading}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: 700,
                border: 'none',
                cursor: disabled || loading ? 'not-allowed' : 'pointer',
                opacity: disabled || loading ? 0.6 : 1,
                transition: 'all 0.2s ease',
                ...variants[variant],
                ...sizes[size],
                ...style,
            }}
            onMouseEnter={(e) => {
                if (!disabled && !loading)
                    (e.currentTarget as HTMLButtonElement).style.opacity = '0.88';
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = '1';
            }}
            {...props}
        >
            {loading ? (
                <svg style={{ animation: 'spin 1s linear infinite' }} width="18" height="18" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }} />
                    <path fill="currentColor" style={{ opacity: 0.75 }} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            ) : icon}
            {children}
        </button>
    );
}