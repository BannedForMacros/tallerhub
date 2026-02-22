interface Props {
    label: string;
    name: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    placeholder?: string;
    error?: string;
    required?: boolean;
}

export default function InputField({
    label, name, value, onChange,
    type = 'text', placeholder, error, required,
}: Props) {
    return (
        <div style={{ marginBottom: 18 }}>
            <label style={{
                display: 'block', fontSize: 14,
                fontWeight: 600, color: '#1E293B', marginBottom: 7,
            }}>
                {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
            </label>
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                style={{
                    width: '100%', padding: '11px 14px',
                    fontSize: 15, borderRadius: 10,
                    border: `1.5px solid ${error ? '#EF4444' : '#E2E8F0'}`,
                    outline: 'none', color: '#1E293B',
                    backgroundColor: '#fff', transition: 'border-color 0.2s, box-shadow 0.2s',
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