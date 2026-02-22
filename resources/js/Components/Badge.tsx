type Variant = 'success' | 'danger' | 'warning' | 'info' | 'default';

const styles: Record<Variant, React.CSSProperties> = {
    success: { backgroundColor: '#F0FDF4', color: '#16A34A', borderColor: '#BBF7D0' },
    danger:  { backgroundColor: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' },
    warning: { backgroundColor: '#FFFBEB', color: '#D97706', borderColor: '#FDE68A' },
    info:    { backgroundColor: '#EFF6FF', color: '#2563EB', borderColor: '#BFDBFE' },
    default: { backgroundColor: '#F8FAFC', color: '#64748B', borderColor: '#E2E8F0' },
};

export default function Badge({ label, variant = 'default' }: { label: string; variant?: Variant }) {
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '3px 10px', borderRadius: 999,
            fontSize: 12, fontWeight: 600,
            border: '1px solid',
            ...styles[variant],
        }}>
            {label}
        </span>
    );
}