<?php
namespace App\Http\Controllers\Configuracion;
use App\Http\Controllers\Controller;
use App\Models\Rol;
use App\Models\Modulo;
use App\Models\PermisoPorRol;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RolController extends Controller
{
    private function verificarAcceso()
    {
        $user = auth()->user();
        if (!$user->esSuperAdmin() && !$user->esDueno()) {
            abort(403, 'Sin acceso.');
        }
    }

    public function index()
    {
        $this->verificarAcceso();
        $user = auth()->user();

        $roles = Rol::when(!$user->esSuperAdmin(), fn($q) =>
                $q->where('empresa_id', $user->empresa_id)
            )
            ->withCount('usuarios')
            ->orderBy('nombre')
            ->get();

        return Inertia::render('Configuracion/Roles/Index', [
            'roles' => $roles,
        ]);
    }

    public function store(Request $request)
    {
        $this->verificarAcceso();
        $user = auth()->user();

        $data = $request->validate([
            'nombre'      => 'required|string|max:100',
            'descripcion' => 'nullable|string|max:255',
        ]);

        // Superadmin puede crear roles globales, dueño solo para su empresa
        $data['empresa_id'] = $user->esSuperAdmin() ? null : $user->empresa_id;

        Rol::create($data);

        return back()->with('success', 'Rol creado correctamente.');
    }

    public function update(Request $request, Rol $rol)
    {
        $this->verificarAcceso();
        $this->verificarPropiedadRol($rol);

        $data = $request->validate([
            'nombre'      => 'required|string|max:100',
            'descripcion' => 'nullable|string|max:255',
        ]);

        $rol->update($data);

        return back()->with('success', 'Rol actualizado correctamente.');
    }

    public function toggleActivo(Rol $rol)
    {
        $this->verificarAcceso();
        $this->verificarPropiedadRol($rol);
        $rol->update(['activo' => !$rol->activo]);
        return back()->with('success', 'Estado actualizado.');
    }

    // Pantalla de asignación de permisos por rol
    public function permisos(Rol $rol)
    {
        $this->verificarAcceso();
        $this->verificarPropiedadRol($rol);

        $modulos = Modulo::where('activo', 1)
            ->whereNull('parent_id')
            ->with(['hijos' => fn($q) => $q->where('activo', 1)->orderBy('orden')])
            ->orderBy('orden')
            ->get();

        $permisos = PermisoPorRol::where('rol_id', $rol->id)
            ->get()
            ->keyBy('modulo_id');

        return Inertia::render('Configuracion/Roles/Permisos', [
            'rol'     => $rol,
            'modulos' => $modulos,
            'permisos'=> $permisos,
        ]);
    }

    // Guardar permisos de un rol
    public function guardarPermisos(Request $request, Rol $rol)
    {
        $this->verificarAcceso();
        $this->verificarPropiedadRol($rol);

        $request->validate([
            'permisos'            => 'required|array',
            'permisos.*.modulo_id'=> 'required|exists:modulos,id',
            'permisos.*.ver'      => 'boolean',
            'permisos.*.crear'    => 'boolean',
            'permisos.*.editar'   => 'boolean',
            'permisos.*.eliminar' => 'boolean',
        ]);

        foreach ($request->permisos as $permiso) {
            PermisoPorRol::updateOrCreate(
                [
                    'rol_id'    => $rol->id,
                    'modulo_id' => $permiso['modulo_id'],
                ],
                [
                    'ver'      => $permiso['ver']      ?? false,
                    'crear'    => $permiso['crear']    ?? false,
                    'editar'   => $permiso['editar']   ?? false,
                    'eliminar' => $permiso['eliminar'] ?? false,
                ]
            );
        }

        return back()->with('success', 'Permisos guardados correctamente.');
    }

    // Verifica que el dueño solo edite roles de su empresa
    private function verificarPropiedadRol(Rol $rol): void
    {
        $user = auth()->user();
        if ($user->esSuperAdmin()) return;
        if ($rol->empresa_id !== $user->empresa_id) abort(403);
    }
}