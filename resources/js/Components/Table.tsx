import { ReactNode, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Column<T> {
    key: string;
    label: string;
    render?: (row: T) => ReactNode;
    width?: string;
}

interface Props<T> {
    columns: Column<T>[];
    data: T[];
    perPage?: number;
    emptyText?: string;
}

export default function Table<T extends { id: number }>({
    columns,
    data,
    perPage = 25,
    emptyText = 'No hay registros',
}: Props<T>) {
    const [page, setPage] = useState(1);
    const total = data.length;
    const totalPages = Math.ceil(total / perPage);
    const start = (page - 1) * perPage;
    const rows = data.slice(start, start + perPage);

    return (
        <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
            {/* Tabla */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                        <tr style={{ backgroundColor: '#1E293B' }}>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    style={{
                                        padding: '13px 16px',
                                        textAlign: 'left',
                                        color: '#ffffff',
                                        fontWeight: 600,
                                        fontSize: 13,
                                        whiteSpace: 'nowrap',
                                        width: col.width,
                                        letterSpacing: '0.02em',
                                    }}
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    style={{
                                        padding: '48px 16px',
                                        textAlign: 'center',
                                        color: '#94A3B8',
                                        fontSize: 14,
                                        backgroundColor: '#fff',
                                    }}
                                >
                                    {emptyText}
                                </td>
                            </tr>
                        ) : (
                            rows.map((row, i) => (
                                <tr
                                    key={row.id}
                                    style={{
                                        backgroundColor: i % 2 === 0 ? '#ffffff' : '#F8FAFC',
                                        borderBottom: '1px solid #F1F5F9',
                                        transition: 'background-color 0.15s',
                                    }}
                                    onMouseEnter={(e) => {
                                        (e.currentTarget as HTMLElement).style.backgroundColor = '#EFF6FF';
                                    }}
                                    onMouseLeave={(e) => {
                                        (e.currentTarget as HTMLElement).style.backgroundColor = i % 2 === 0 ? '#ffffff' : '#F8FAFC';
                                    }}
                                >
                                    {columns.map((col) => (
                                        <td
                                            key={col.key}
                                            style={{
                                                padding: '12px 16px',
                                                color: '#334155',
                                                verticalAlign: 'middle',
                                            }}
                                        >
                                            {col.render
                                                ? col.render(row)
                                                : String((row as Record<string, unknown>)[col.key] ?? '')}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderTop: '1px solid #F1F5F9',
                    backgroundColor: '#fff',
                }}>
                    <p style={{ fontSize: 13, color: '#64748B' }}>
                        Mostrando <strong>{start + 1}</strong> - <strong>{Math.min(start + perPage, total)}</strong> de <strong>{total}</strong>
                    </p>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            style={{
                                width: 32, height: 32, borderRadius: 8,
                                border: '1px solid #E2E8F0',
                                backgroundColor: page === 1 ? '#F8FAFC' : '#fff',
                                color: page === 1 ? '#CBD5E1' : '#1E293B',
                                cursor: page === 1 ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                        >
                            <ChevronLeft size={15} />
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                            .reduce<(number | string)[]>((acc, p, idx, arr) => {
                                if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                                acc.push(p);
                                return acc;
                            }, [])
                            .map((p, i) => (
                                <button
                                    key={i}
                                    onClick={() => typeof p === 'number' && setPage(p)}
                                    disabled={p === '...'}
                                    style={{
                                        minWidth: 32, height: 32, borderRadius: 8,
                                        border: '1px solid',
                                        borderColor: p === page ? '#2563EB' : '#E2E8F0',
                                        backgroundColor: p === page ? '#2563EB' : '#fff',
                                        color: p === page ? '#fff' : p === '...' ? '#94A3B8' : '#1E293B',
                                        cursor: p === '...' ? 'default' : 'pointer',
                                        fontWeight: p === page ? 700 : 400,
                                        fontSize: 13,
                                        padding: '0 8px',
                                    }}
                                >
                                    {p}
                                </button>
                            ))}

                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            style={{
                                width: 32, height: 32, borderRadius: 8,
                                border: '1px solid #E2E8F0',
                                backgroundColor: page === totalPages ? '#F8FAFC' : '#fff',
                                color: page === totalPages ? '#CBD5E1' : '#1E293B',
                                cursor: page === totalPages ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                        >
                            <ChevronRight size={15} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}