import { useMemo } from 'react';

interface DescripcionGasto {
    id: number;
    nombre: string;
    clasificacion_gasto_id: number;
}

interface Clasificacion {
    id: number;
    nombre: string;
    tipo_id: number;
    // Debe coincidir con el nombre de la relación en el modelo ClasificacionGasto
    descripciones?: DescripcionGasto[]; 
}

interface TipoGasto {
    id: number;
    nombre: string;
    clasificaciones?: Clasificacion[];
}

interface CuentaPago {
    id: number;
    nombre: string;
    numero_cuenta: string | null;
    moneda: string;
}

interface MetodoPago {
    id: number;
    nombre: string;
    // Laravel Inertia convierte 'cuentasActivas' a 'cuentas_activas'
    cuentas_activas?: CuentaPago[]; 
}

export default function useGastoForm(tipos: TipoGasto[], metodosPago: MetodoPago[]) {

    const tipoOptions = useMemo(() =>
        tipos.map(t => ({ value: String(t.id), label: t.nombre }))
    , [tipos]);

    const metodosOptions = useMemo(() =>
        metodosPago.map(m => ({ value: String(m.id), label: m.nombre }))
    , [metodosPago]);

    const getClasificacionOptions = (tipoId: string) => {
        if (!tipoId) return [];
        const tipo = tipos.find(t => t.id === Number(tipoId));
        return (tipo?.clasificaciones ?? []).map(c => ({ value: String(c.id), label: c.nombre }));
    };

    const getDescripcionOptions = (tipoId: string, clasificacionId: string) => {
        if (!tipoId || !clasificacionId) return [];
        const tipo = tipos.find(t => t.id === Number(tipoId));
        const clas = tipo?.clasificaciones?.find(c => c.id === Number(clasificacionId));
        // Se usa la llave 'descripciones' enviada por el controlador
        return (clas?.descripciones ?? []).map(d => ({ value: String(d.id), label: d.nombre }));
    };

    const getCuentasDeMetodo = (metodoPagoId: string): CuentaPago[] => {
        if (!metodoPagoId) return [];
        const metodo = metodosPago.find(m => m.id === Number(metodoPagoId));
        return metodo?.cuentas_activas ?? [];
    };

    const getCuentaOptions = (metodoPagoId: string) => {
        return getCuentasDeMetodo(metodoPagoId).map(c => ({
            value: String(c.id),
            label: `${c.nombre}${c.numero_cuenta ? ` — ${c.numero_cuenta}` : ''}`,
        }));
    };

    const getCuentaUnica = (metodoPagoId: string): CuentaPago | null => {
        const cuentas = getCuentasDeMetodo(metodoPagoId);
        return cuentas.length === 1 ? cuentas[0] : null;
    };

    const tieneCuentas = (metodoPagoId: string): boolean => {
        return getCuentasDeMetodo(metodoPagoId).length > 0;
    };

    return {
        tipoOptions,
        metodosOptions,
        getClasificacionOptions,
        getDescripcionOptions,
        getCuentasDeMetodo,
        getCuentaUnica,
        tieneCuentas,
        getCuentaOptions,
    };
}