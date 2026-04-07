import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search, X } from 'lucide-react';

interface Option { value: string | number; label: string; }

interface Props {
    label: string;
    name: string;
    value: string | number;
    onChange: (e: { target: { name: string; value: string } }) => void;
    options: Option[];
    placeholder?: string;
    searchPlaceholder?: string;
    error?: string;
    required?: boolean;
}

export default function SearchableSelectField({
    label, name, value, onChange,
    options, placeholder, searchPlaceholder = 'Buscar...', error, required,
}: Props) {
    const [open, setOpen]       = useState(false);
    const [query, setQuery]     = useState('');
    const [coords, setCoords]   = useState({ top: 0, left: 0, width: 0 });

    const triggerRef  = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchRef   = useRef<HTMLInputElement>(null);

    const selected = options.find(o => String(o.value) === String(value));

    const filtered = query.trim()
        ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
        : options;

    const handleToggle = () => {
        if (!open && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top:   rect.bottom + window.scrollY,
                left:  rect.left   + window.scrollX,
                width: rect.width,
            });
        }
        setOpen(prev => {
            if (prev) setQuery('');
            return !prev;
        });
    };

    // Auto-focus buscador al abrir
    useEffect(() => {
        if (open) {
            setTimeout(() => searchRef.current?.focus(), 50);
        }
    }, [open]);

    // Cerrar al click fuera
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const inTrigger  = triggerRef.current?.contains(e.target as Node);
            const inDropdown = dropdownRef.current?.contains(e.target as Node);
            if (!inTrigger && !inDropdown) {
                setOpen(false);
                setQuery('');
            }
        };
        if (open) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    // Recalcular posición al hacer scroll/resize
    useEffect(() => {
        if (!open) return;
        const recalc = () => {
            if (triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                setCoords({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
            }
        };
        window.addEventListener('scroll', recalc, true);
        window.addEventListener('resize', recalc);
        return () => {
            window.removeEventListener('scroll', recalc, true);
            window.removeEventListener('resize', recalc);
        };
    }, [open]);

    const seleccionar = (opt: Option) => {
        onChange({ target: { name, value: String(opt.value) } });
        setOpen(false);
        setQuery('');
    };

    const limpiar = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange({ target: { name, value: '' } });
    };

    const dropdownMenu = (
        <div
            ref={dropdownRef}
            style={{
                position: 'absolute', zIndex: 9999,
                top: coords.top + 6, left: coords.left, width: coords.width,
                backgroundColor: '#fff', borderRadius: 12,
                border: '1.5px solid #E2E8F0',
                boxShadow: '0 12px 30px -5px rgba(0,0,0,0.18)',
                overflow: 'hidden', display: 'flex', flexDirection: 'column',
            }}
        >
            {/* Buscador */}
            <div style={{ padding: '10px 12px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Search size={14} color="#94A3B8" style={{ flexShrink: 0 }} />
                <input
                    ref={searchRef}
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    style={{
                        flex: 1, border: 'none', outline: 'none',
                        fontSize: 14, color: '#1E293B', backgroundColor: 'transparent',
                    }}
                />
                {query && (
                    <button
                        type="button"
                        onMouseDown={e => { e.preventDefault(); setQuery(''); }}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                    >
                        <X size={13} color="#94A3B8" />
                    </button>
                )}
            </div>

            {/* Lista */}
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                {placeholder && !query && (
                    <button
                        type="button"
                        onMouseDown={e => { e.preventDefault(); onChange({ target: { name, value: '' } }); setOpen(false); setQuery(''); }}
                        style={itemStyle(!value)}
                    >
                        {placeholder}
                    </button>
                )}
                {filtered.length === 0 ? (
                    <div style={{ padding: '14px 16px', fontSize: 13, color: '#94A3B8', textAlign: 'center' }}>
                        Sin resultados para "{query}"
                    </div>
                ) : (
                    filtered.map(opt => {
                        const isSelected = String(opt.value) === String(value);
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onMouseDown={e => { e.preventDefault(); seleccionar(opt); }}
                                style={itemStyle(isSelected, true)}
                            >
                                <span style={{ flex: 1 }}>{opt.label}</span>
                                {isSelected && <Check size={16} strokeWidth={3} color="#2563EB" />}
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );

    return (
        <div style={{ marginBottom: 18 }}>
            {label && (
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#1E293B', marginBottom: 7 }}>
                    {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
                </label>
            )}

            <button
                ref={triggerRef}
                type="button"
                onClick={handleToggle}
                style={{
                    width: '100%', padding: '11px 14px', fontSize: 15, borderRadius: 10,
                    border: `1.5px solid ${open ? '#2563EB' : error ? '#EF4444' : '#E2E8F0'}`,
                    backgroundColor: '#fff', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', gap: 8,
                    cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', outline: 'none',
                }}
            >
                <span style={{
                    flex: 1, color: selected ? '#1E293B' : '#94A3B8',
                    fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                    {selected ? selected.label : (placeholder ?? 'Selecciona una opción')}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    {value && (
                        <span
                            role="button"
                            onClick={limpiar}
                            style={{ display: 'flex', alignItems: 'center', padding: 2, borderRadius: 4, cursor: 'pointer' }}
                        >
                            <X size={14} color="#94A3B8" />
                        </span>
                    )}
                    <ChevronDown
                        size={18}
                        color={open ? '#2563EB' : '#94A3B8'}
                        style={{ transition: 'transform 0.3s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    />
                </div>
            </button>

            {error && <p style={{ marginTop: 6, fontSize: 13, color: '#EF4444', fontWeight: 500 }}>{error}</p>}

            {open && createPortal(dropdownMenu, document.body)}
        </div>
    );
}

const itemStyle = (selected: boolean, isItem = false) => ({
    width: '100%', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: selected ? '#EFF6FF' : '#fff', border: 'none', cursor: 'pointer', fontSize: 14,
    color: selected ? (isItem ? '#2563EB' : '#94A3B8') : '#1E293B', fontWeight: selected && isItem ? 600 : 400,
    textAlign: 'left' as const, transition: 'background 0.1s',
});
