import { useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { toast, Toaster } from 'react-hot-toast';
import { Head, Link } from '@inertiajs/react';
import { ChevronLeft, Save } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/Button';
import { PageProps, Modulo } from '@/types';


interface Permiso {
    modulo_id: number;
    ver: boolean;
    crear: boolean;
    editar: boolean;
    eliminar: boolean;
}

interface Rol { id: number; nombre: string; descripcion: string; }

interface Props extends PageProps {
    rol: Rol;
    modulos: Modulo[];        // ahora usa la del types/index.d.ts
    permisos: Record<number, Permiso>;
}
interface Rol { id: number; nombre: string; descripcion: string; }



const ACCIONES = ['ver', 'crear', 'editar', 'eliminar'] as const;
type Accion = typeof ACCIONES[number];

export default function PermisosRol({ rol, modulos, permisos: permisosIniciales }: Props) {
    const [permisos, setPermisos] = useState<Record<number, Permiso>>(() => {
        const init: Record<number, Permiso> = {};
        modulos.forEach(m => {
            init[m.id] = permisosIniciales[m.id] ?? { modulo_id: m.id, ver: false, crear: false, editar: false, eliminar: false };
            m.hijos?.forEach(h => {
                init[h.id] = permisosIniciales[h.id] ?? { modulo_id: h.id, ver: false, crear: false, editar: false, eliminar: false };
            });
        });
        return init;
    });

    const [saving, setSaving] = useState(false);

    const toggle = (moduloId: number, accion: Accion) => {
        setPermisos(prev => ({
            ...prev,
            [moduloId]: {
                ...prev[moduloId],
                [accion]: !prev[moduloId][accion],
            },
        }));
    };

    const toggleTodo = (moduloId: number, valor: boolean) => {
        setPermisos(prev => ({
            ...prev,
            [moduloId]: {
                ...prev[moduloId],
                ver: valor, crear: valor, editar: valor, eliminar: valor,
            },
        }));
    };

    const toggleColumna = (accion: Accion, valor: boolean) => {
        setPermisos(prev => {
            const nuevo = { ...prev };
            Object.keys(nuevo).forEach(id => {
                nuevo[Number(id)] = { ...nuevo[Number(id)], [accion]: valor };
            });
            return nuevo;
        });
    };

    const guardar = () => {
        setSaving(true);
        const payload = Object.values(permisos);

        (window as any).axios.post(route('configuracion.roles.permisos.guardar', rol.id), {
            permisos: payload,
        }).then(() => {
            toast.success('Permisos guardados correctamente.');
        }).catch(() => {
            toast.error('Error al guardar permisos.');
        }).finally(() => setSaving(false));
    };

    const renderFila = (modulo: Modulo, esHijo = false) => {
        const p = permisos[modulo.id];
        const todoActivo = ACCIONES.every(a => p[a]);

        return (
            <tr
                key={modulo.id}
                style={{
                    borderBottom: '1px solid #F1F5F9',
                    backgroundColor: esHijo ? '#F8FAFC' : '#fff',
                }}
            >
                <td style={{ padding: '12px 16px', color: '#1E293B', fontSize: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {esHijo && (
                            <div style={{ width: 16, height: 1, backgroundColor: '#CBD5E1', marginLeft: 16 }} />
                        )}
                        <span style={{ fontWeight: esHijo ? 400 : 600 }}>{modulo.nombre}</span>
                    </div>
                </td>

                {/* Toggle todo */}
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <input
                        type="checkbox"
                        checked={todoActivo}
                        onChange={e => toggleTodo(modulo.id, e.target.checked)}
                        style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#D97706' }}
                    />
                </td>

                {/* Permisos individuales */}
                {ACCIONES.map(accion => (
                    <td key={accion} style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <input
                            type="checkbox"
                            checked={p[accion]}
                            onChange={() => toggle(modulo.id, accion)}
                            style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#2563EB' }}
                        />
                    </td>
                ))}
            </tr>
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Permisos — ${rol.nombre}`} />
            <Toaster position="top-right" />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Link
                        href={route('configuracion.roles.index')}
                        style={{
                            width: 36, height: 36, borderRadius: 10,
                            border: '1.5px solid #E2E8F0', backgroundColor: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#64748B', textDecoration: 'none',
                        }}
                    >
                        <ChevronLeft size={18} />
                    </Link>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', margin: 0 }}>
                            Permisos — <span style={{ color: '#2563EB', textTransform: 'capitalize' }}>{rol.nombre}</span>
                        </h1>
                        <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 4 }}>
                            {rol.descripcion || 'Configura los accesos para este rol'}
                        </p>
                    </div>
                </div>
                <Button variant="primary" size="md" icon={<Save size={15} />} loading={saving} onClick={guardar}>
                    Guardar Permisos
                </Button>
            </div>

            {/* Tabla */}
            <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                        <tr style={{ backgroundColor: '#1E293B' }}>
                            <th style={{ padding: '13px 16px', textAlign: 'left', color: '#fff', fontWeight: 600, fontSize: 13, width: '40%' }}>
                                Módulo
                            </th>
                            <th style={{ padding: '13px 16px', textAlign: 'center', color: '#D97706', fontWeight: 600, fontSize: 13, width: '10%' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                    <span>Todo</span>
                                </div>
                            </th>
                            {ACCIONES.map(accion => (
                                <th key={accion} style={{ padding: '13px 16px', textAlign: 'center', color: '#fff', fontWeight: 600, fontSize: 13, width: '12.5%' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                                        <span style={{ textTransform: 'capitalize' }}>{accion}</span>
                                        {/* Toggle columna */}
                                        <input
                                            type="checkbox"
                                            title={`Marcar todo ${accion}`}
                                            onChange={e => toggleColumna(accion, e.target.checked)}
                                            style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#2563EB' }}
                                        />
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {modulos.map(modulo => (
                            <>
                                {renderFila(modulo)}
                                {modulo.hijos?.map(hijo => renderFila(hijo, true))}
                            </>
                        ))}
                    </tbody>
                </table>
            </div>
        </AuthenticatedLayout>
    );
}