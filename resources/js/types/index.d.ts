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