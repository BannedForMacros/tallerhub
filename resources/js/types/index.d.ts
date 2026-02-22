export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    rol?: string;
    empresa_id?: number;
    local_id?: number;
    esSuperAdmin: boolean;
}

export interface Modulo {
    id: number;
    nombre: string;
    slug: string;
    url: string;
    icono: string;
    orden: number;
    parent_id: number | null;
    hijos?: Modulo[];
}

export interface Flash {
    success?: string;
    error?: string;
}

export type PageProps<T extends Record<string, unknown> = Record<string, unknown>> = T & {
    auth: { user: User };
    modulos: Modulo[];
    flash: Flash;
};

// ── Empresas ─────────────────────────────────────────
export interface Empresa {
    id: number;
    nombre: string;
    ruc: string;
    email: string;
    telefono: string;
    direccion: string;
    departamento: string;
    provincia: string;
    distrito: string;
    logo: string | null;
    activo: boolean;
}

// ── Locales ──────────────────────────────────────────
export interface Local {
    id: number;
    nombre: string;
    direccion: string;
    telefono: string;
    departamento: string;
    provincia: string;
    distrito: string;
    empresa_id: number;
    activo: boolean;
}

// ── Roles y Permisos ─────────────────────────────────
export interface Rol {
    id: number;
    nombre: string;
    descripcion: string;
    empresa_id: number | null;
    activo: boolean;
    usuarios_count?: number;
}

export interface Permiso {
    modulo_id: number;
    ver: boolean;
    crear: boolean;
    editar: boolean;
    eliminar: boolean;
}

// ── Usuarios ─────────────────────────────────────────
export interface Usuario {
    id: number;
    name: string;
    email: string;
    telefono: string;
    empresa_id: number;
    local_id: number | null;
    rol_id: number;
    activo: boolean;
    rol: { id: number; nombre: string } | null;
    local: { id: number; nombre: string } | null;
}

// ── Gastos ───────────────────────────────────────────
export interface TipoGasto {
    id: number;
    nombre: string;
    empresa_id: number;
    activo: boolean;
}

export interface ClasificacionGasto {
    id: number;
    nombre: string;
    empresa_id: number;
    tipo_gasto_id: number;
    activo: boolean;
    tipo_gasto?: TipoGasto;
}

export interface DescripcionGasto {
    id: number;
    nombre: string;
    empresa_id: number;
    clasificacion_gasto_id: number;
    activo: boolean;
    clasificacion?: ClasificacionGasto & {
        tipo_gasto?: TipoGasto;
    };
}

// ── Servicios ─────────────────────────────────────────
export interface Servicio {
    id: number;
    nombre: string;
    descripcion: string;
    precio: number;
    empresa_id: number;
    local_id: number | null;
    activo: boolean;
    local?: { id: number; nombre: string } | null;
}

// ── Clientes ─────────────────────────────────────────
export interface Cliente {
    id: number;
    nombre: string;
    dni: string;
    telefono: string;
    email: string;
    direccion: string;
    empresa_id: number;
    activo: boolean;
}

// ── Recepciones ──────────────────────────────────────
export interface Recepcion {
    id: number;
    codigo: string;
    tipo_equipo: string;
    marca: string;
    modelo: string;
    serie: string;
    descripcion_falla: string;
    observaciones: string;
    accesorios: string;
    estado: string;
    fecha_recepcion: string;
    fecha_entrega_estimada: string | null;
    fecha_entrega_real: string | null;
    empresa_id: number;
    local_id: number;
    cliente_id: number;
    activo: boolean;
    cliente?: Cliente;
    local?: Local;
}

// ── Órdenes de Servicio ──────────────────────────────
export interface OrdenServicio {
    id: number;
    codigo: string;
    diagnostico: string;
    trabajo_realizado: string;
    costo_mano_obra: number;
    costo_repuestos: number;
    costo_total: number;
    estado: string;
    empresa_id: number;
    local_id: number;
    recepcion_id: number;
    tecnico_id: number | null;
    activo: boolean;
    recepcion?: Recepcion;
    tecnico?: Usuario | null;
}

export interface ClienteFormData {
    nombre: string;
    dni: string;
    telefono: string;
    email: string;
    direccion: string;
    empresa_id: string;
}