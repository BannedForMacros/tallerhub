<?php
namespace App\Http\Controllers\Configuracion;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Rol;
use App\Models\Empresa;
use App\Models\Local;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UsuarioController extends Controller
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

        $usuarios = User::with(['rol', 'local'])
            ->when(!$user->esSuperAdmin(), fn($q) =>
                $q->where('empresa_id', $user->empresa_id)
            )
            ->orderBy('name')
            ->get();

        $empresas = $user->esSuperAdmin()
            ? Empresa::where('activo', 1)->orderBy('nombre')->get()
            : collect();

        $roles = Rol::where('activo', 1)
            ->when(!$user->esSuperAdmin(), fn($q) =>
                $q->where('empresa_id', $user->empresa_id)
            )
            ->get();

        $locales = Local::where('activo', 1)
            ->when(!$user->esSuperAdmin(), fn($q) =>
                $q->where('empresa_id', $user->empresa_id)
            )
            ->get();

        return Inertia::render('Configuracion/Usuarios/Index', [
            'usuarios' => $usuarios,
            'empresas' => $empresas,
            'roles'    => $roles,
            'locales'  => $locales,
        ]);
    }

    public function store(Request $request)
    {
        $this->verificarAcceso();
        $user = auth()->user();

        $data = $request->validate([
            'name'       => 'required|string|max:255',
            'email'      => 'required|email|unique:users',
            'password'   => 'required|string|min:8',
            'telefono'   => 'nullable|string|max:20',
            'rol_id'     => 'required|exists:roles,id',
            'local_id'   => 'nullable|exists:locales,id',
            'empresa_id' => 'nullable|exists:empresas,id',
        ]);

        $data['empresa_id'] = $user->esSuperAdmin()
            ? ($data['empresa_id'] ?? null)
            : $user->empresa_id;

        $data['password'] = Hash::make($data['password']);
        User::create($data);
        return back()->with('success', 'Usuario creado correctamente.');
    }

    public function update(Request $request, User $usuario)
    {
        $this->verificarAcceso();
        $this->verificarPropiedadUsuario($usuario);

        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email,'.$usuario->id,
            'telefono' => 'nullable|string|max:20',
            'rol_id'   => 'required|exists:roles,id',
            'local_id' => 'nullable|exists:locales,id',
        ]);

        if ($request->filled('password')) {
            $request->validate(['password' => 'string|min:8']);
            $data['password'] = Hash::make($request->password);
        }

        $usuario->update($data);

        return back()->with('success', 'Usuario actualizado correctamente.');
    }

    public function toggleActivo(User $usuario)
    {
        $this->verificarAcceso();
        $this->verificarPropiedadUsuario($usuario);
        $usuario->update(['activo' => !$usuario->activo]);
        return back()->with('success', 'Estado actualizado.');
    }

    private function verificarPropiedadUsuario(User $usuario): void
    {
        $user = auth()->user();
        if ($user->esSuperAdmin()) return;
        if ($usuario->empresa_id !== $user->empresa_id) abort(403);
    }
}