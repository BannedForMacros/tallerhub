import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

interface Option { value: string | number; label: string; }

interface Props {
    label: string;
    name: string;
    value: string | number;
    onChange: (e: { target: { name: string; value: string } }) => void;
    options: Option[];
    placeholder?: string;
    error?: string;
    required?: boolean;
}

export default function SelectField({
    label, name, value, onChange,
    options, placeholder, error, required,
}: Props) {
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const ref = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null); // Nueva ref para el menú del portal

    const selected = options.find(o => String(o.value) === String(value));

    const handleToggle = () => {
        if (!open && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
        setOpen(!open);
    };

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            // LÓGICA CLAVE: Solo cerrar si el click NO fue en el trigger Y NO fue dentro del dropdown
            const clickInTrigger = triggerRef.current?.contains(e.target as Node);
            const clickInDropdown = dropdownRef.current?.contains(e.target as Node);

            if (!clickInTrigger && !clickInDropdown) {
                setOpen(false);
            }
        };

        if (open) {
            document.addEventListener('mousedown', handler);
        }
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const seleccionar = (opt: Option) => {
        onChange({ target: { name, value: String(opt.value) } });
        setOpen(false);
    };

    const dropdownMenu = (
        <div 
            ref={dropdownRef} // Asignamos la ref al menú flotante
            style={{
                position: 'absolute',
                zIndex: 9999,
                top: coords.top + 6,
                left: coords.left,
                width: coords.width,
                backgroundColor: '#fff',
                borderRadius: 12,
                border: '1.5px solid #E2E8F0',
                boxShadow: '0 12px 30px -5px rgba(0,0,0,0.15)',
                overflow: 'hidden',
                maxHeight: 260,
                overflowY: 'auto',
            }}
        >
            {placeholder && (
                <button 
                    type="button" 
                    onClick={() => { onChange({ target: { name, value: '' } }); setOpen(false); }} 
                    style={itemStyle(!value)}
                >
                    {placeholder}
                </button>
            )}
            {options.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                    <button 
                        key={opt.value} 
                        type="button" 
                        /* Usamos onMouseDown para asegurar que se capture antes del cierre del modal */
                        onMouseDown={(e) => { e.preventDefault(); seleccionar(opt); }} 
                        style={itemStyle(isSelected, true)}
                    >
                        <span style={{ flex: 1 }}>{opt.label}</span>
                        {isSelected && <Check size={16} strokeWidth={3} color="#2563EB" />}
                    </button>
                );
            })}
        </div>
    );

    return (
        <div style={{ marginBottom: 18 }} ref={ref}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#1E293B', marginBottom: 7 }}>
                {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
            </label>

            <button
                ref={triggerRef}
                type="button"
                onClick={handleToggle}
                style={{
                    width: '100%', padding: '11px 14px', fontSize: 15, borderRadius: 10,
                    border: `1.5px solid ${open ? '#2563EB' : error ? '#EF4444' : '#E2E8F0'}`,
                    backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', outline: 'none'
                }}
            >
                <span style={{ color: selected ? '#1E293B' : '#94A3B8', fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selected ? selected.label : (placeholder ?? 'Selecciona una opción')}
                </span>
                <ChevronDown size={18} color={open ? '#2563EB' : '#94A3B8'} style={{ transition: 'transform 0.3s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </button>

            {error && <p style={{ marginTop: 6, fontSize: 13, color: '#EF4444', fontWeight: 500 }}>{error}</p>}

            {open && createPortal(dropdownMenu, document.body)}
        </div>
    );
}

const itemStyle = (selected: boolean, isItem = false) => ({
    width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: selected ? '#EFF6FF' : '#fff', border: 'none', cursor: 'pointer', fontSize: 14,
    color: selected ? (isItem ? '#2563EB' : '#94A3B8') : '#1E293B', fontWeight: selected && isItem ? 600 : 400,
    textAlign: 'left' as const, transition: 'all 0.15s'
});