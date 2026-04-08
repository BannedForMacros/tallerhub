/**
 * Fecha de hoy en hora local (Lima/Peru), formato YYYY-MM-DD.
 * Reemplaza new Date().toISOString().split('T')[0] que usa UTC.
 */
export function fechaHoy(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dia}`;
}

/**
 * Parsea un string de fecha (YYYY-MM-DD) como hora local, no UTC.
 * Evita el bug donde new Date("2026-04-07") se interpreta como UTC midnight
 * y en Lima (UTC-5) muestra el día anterior.
 */
export function parseFechaLocal(fecha: string): Date {
    return new Date(fecha.slice(0, 10) + 'T00:00:00');
}

/**
 * Formatea una fecha para mostrar en español peruano.
 */
export function formatFecha(fecha: string): string {
    return parseFechaLocal(fecha).toLocaleDateString('es-PE');
}
