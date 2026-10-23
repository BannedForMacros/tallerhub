import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search, X, Plus } from 'lucide-react';

export interface SearchOption {
    value: string | number;
    label: string;
    /** Texto secundario bajo el label (ej. DNI · teléfono) — también se busca */
    sublabel?: string;
    /** Texto extra que se busca pero no se muestra (ej. email, dirección) */
    keywords?: string;
}

interface Props {
    label: string;
    name: string;
    value: string | number;
    onChange: (e: { target: { name: string; value: string } }) => void;
    options: SearchOption[];
    placeholder?: string;
    searchPlaceholder?: string;
    error?: string;
    required?: boolean;
    /** Si se pasa, muestra "Crear ..." al final con lo que el usuario escribió */
    onCreate?: (query: string) => void;
    createLabel?: string;
}

// Sin tildes, minúsculas
const normalizar = (s: string) =>
    s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const soloDigitos = (s: string) => s.replace(/\D/g, '');

/**
 * Puntaje de coincidencia: cada palabra escrita debe aparecer en algún campo
 * (orden libre, sin tildes). Números se comparan ignorando espacios/guiones,
 * así "987 654" encuentra "987654321". Más puntaje si coincide al inicio.
 */
const puntuar = (opt: SearchOption, tokens: string[]): number => {
    const label = normalizar(opt.label);
    const texto = normalizar(`${opt.label} ${opt.sublabel ?? ''} ${opt.keywords ?? ''}`);
    const digitos = soloDigitos(texto);
    let score = 0;
    for (const t of tokens) {
        const d = soloDigitos(t);
        const esNumero = d.length >= 3 && d.length === t.replace(/[\s-]/g, '').length;
        if (label.startsWith(t))                          score += 4;
        else if (label.split(/\s+/).some(w => w.startsWith(t))) score += 3;
        else if (texto.includes(t))                        score += 2;
        else if (esNumero && digitos.includes(d))          score += 2;
        else return 0;
    }
    return score;
};

export default function SearchableSelectField({
    label, name, value, onChange,
    options, placeholder, searchPlaceholder = 'Buscar...', error, required,
    onCreate, createLabel = 'Crear',
}: Props) {
    const [open, setOpen]       = useState(false);
    const [query, setQuery]     = useState('');
    const [activo, setActivo]   = useState(0);
    const [coords, setCoords]   = useState({ top: 0, left: 0, width: 0 });

    const triggerRef  = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchRef   = useRef<HTMLInputElement>(null);
    const listRef     = useRef<HTMLDivElement>(null);

    const selected = options.find(o => String(o.value) === String(value));

    const filtered = useMemo(() => {
        const tokens = normalizar(query).trim().split(/\s+/).filter(Boolean);
        if (!tokens.length) return options;
        return options
            .map(o => ({ o, s: puntuar(o, tokens) }))
            .filter(x => x.s > 0)
            .sort((a, b) => b.s - a.s)
            .map(x => x.o);
    }, [query, options]);

    const mostrarCrear = !!onCreate && query.trim().length > 0;
    const totalItems   = filtered.length + (mostrarCrear ? 1 : 0);

    useEffect(() => { setActivo(0); }, [query]);

    const posicionar = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top:   rect.bottom + window.scrollY,
                left:  rect.left   + window.scrollX,
                width: rect.width,
            });
        }
    };

    const abrir = (inicial = '') => {
        posicionar();
        setQuery(inicial);
        setOpen(true);
    };

    const cerrar = () => {
        setOpen(false);
        setQuery('');
    };

    const handleToggle = () => (open ? cerrar() : abrir());

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
            if (!inTrigger && !inDropdown) cerrar();
        };
        if (open) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    // Recalcular posición al hacer scroll/resize
    useEffect(() => {
        if (!open) return;
        window.addEventListener('scroll', posicionar, true);
        window.addEventListener('resize', posicionar);
        return () => {
            window.removeEventListener('scroll', posicionar, true);
            window.removeEventListener('resize', posicionar);
        };
    }, [open]);

    // Mantener visible el item activo al navegar con flechas
    useEffect(() => {
        listRef.current
            ?.querySelector<HTMLElement>(`[data-idx="${activo}"]`)
            ?.scrollIntoView({ block: 'nearest' });
    }, [activo]);

    const seleccionar = (opt: SearchOption) => {
        onChange({ target: { name, value: String(opt.value) } });
        cerrar();
        triggerRef.current?.focus();
    };

    const crear = () => {
        const q = query.trim();
        cerrar();
        onCreate?.(q);
    };

    const limpiar = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange({ target: { name, value: '' } });
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        // Evita que Enter/Escape lleguen al formulario o modal padre
        e.stopPropagation();
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActivo(i => Math.min(i + 1, totalItems - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActivo(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activo < filtered.length) seleccionar(filtered[activo]);
            else if (mostrarCrear) crear();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cerrar();
            triggerRef.current?.focus();
        } else if (e.key === 'Tab') {
            cerrar();
        }
    };

    // Escribir sobre el campo cerrado abre el buscador con esa letra
    const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
        if (open) return;
        if (e.key.length === 1 && e.key !== ' ' && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            abrir(e.key);
        } else if (e.key === 'ArrowDown' || e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            abrir();
        }
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
                    onKeyDown={handleSearchKeyDown}
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
            <div ref={listRef} style={{ maxHeight: 260, overflowY: 'auto' }}>
                {placeholder && !query && (
                    <button
                        type="button"
                        onMouseDown={e => { e.preventDefault(); onChange({ target: { name, value: '' } }); cerrar(); }}
                        style={itemStyle(!value)}
                    >
                        {placeholder}
                    </button>
                )}
                {filtered.length === 0 && (
                    <div style={{ padding: '14px 16px', fontSize: 13, color: '#94A3B8', textAlign: 'center' }}>
                        Sin resultados para "{query}"
                    </div>
                )}
                {filtered.map((opt, idx) => {
                    const isSelected = String(opt.value) === String(value);
                    return (
                        <button
                            key={opt.value}
                            data-idx={idx}
                            type="button"
                            onMouseDown={e => { e.preventDefault(); seleccionar(opt); }}
                            onMouseEnter={() => setActivo(idx)}
                            style={{
                                ...itemStyle(isSelected, true),
                                ...(idx === activo && !isSelected ? { backgroundColor: '#F8FAFC' } : {}),
                            }}
                        >
                            <span style={{ flex: 1, minWidth: 0 }}>
                                <span style={{ display: 'block' }}>{opt.label}</span>
                                {opt.sublabel && (
                                    <span style={{ display: 'block', fontSize: 12, color: '#94A3B8', fontWeight: 400, marginTop: 2 }}>
                                        {opt.sublabel}
                                    </span>
                                )}
                            </span>
                            {isSelected && <Check size={16} strokeWidth={3} color="#2563EB" />}
                        </button>
                    );
                })}
                {mostrarCrear && (
                    <button
                        type="button"
                        data-idx={filtered.length}
                        onMouseDown={e => { e.preventDefault(); crear(); }}
                        onMouseEnter={() => setActivo(filtered.length)}
                        style={{
                            ...itemStyle(false, true),
                            justifyContent: 'flex-start', gap: 8, color: '#2563EB', fontWeight: 600,
                            borderTop: '1px solid #F1F5F9',
                            backgroundColor: activo === filtered.length ? '#EFF6FF' : '#fff',
                        }}
                    >
                        <Plus size={14} /> {createLabel} "{query.trim()}"
                    </button>
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
                onKeyDown={handleTriggerKeyDown}
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
                    {selected?.sublabel && (
                        <span style={{ color: '#94A3B8', fontSize: 13 }}> · {selected.sublabel}</span>
                    )}
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
