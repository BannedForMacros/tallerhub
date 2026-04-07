import { LabelHTMLAttributes } from 'react';

interface Props {
    label?: string;
    name: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    placeholder?: string;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    styleContainer?: React.CSSProperties;
}

export default function InputField({
    label, name, value, onChange,
    type = 'text', placeholder, error, required, disabled, styleContainer
}: Props) {
    return (
        <div style={{ marginBottom: label ? 18 : 0, ...styleContainer }}>
            {/* Solo renderiza si hay label para no ocupar espacio */}
            {label && (
                <label style={{
                    display: 'block', fontSize: 14,
                    fontWeight: 600, color: '#1E293B', marginBottom: 7,
                }}>
                    {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
                </label>
            )}
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                onWheel={(e) => e.currentTarget.blur()}
                style={{
                    width: '100%', padding: '11px 14px',
                    fontSize: 15, borderRadius: 10,
                    border: `1.5px solid ${error ? '#EF4444' : '#E2E8F0'}`,
                    outline: 'none', color: disabled ? '#64748B' : '#1E293B',
                    backgroundColor: disabled ? '#F1F5F9' : '#fff',
                    transition: 'all 0.2s', cursor: disabled ? 'not-allowed' : 'text',
                    height: '46px',
                    boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                    e.target.style.borderColor = '#2563EB';
                    e.target.style.boxShadow = '0 0 0 4px rgba(37,99,235,0.08)';
                }}
                onBlur={(e) => {
                    e.target.style.borderColor = error ? '#EF4444' : '#E2E8F0';
                    e.target.style.boxShadow = 'none';
                }}
            />
            {error && <p style={{ marginTop: 5, fontSize: 13, color: '#EF4444' }}>{error}</p>}
        </div>
    );
}