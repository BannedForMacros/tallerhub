<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Constants\Roles;

class VerificarPermiso
{
    public function handle(Request $request, Closure $next, string $slug, string $permiso = 'ver')
    {
        $user = auth()->user();

        if (!$user) {
            return redirect()->route('login');
        }

        if (!$user->activo) {
            auth()->logout();
            return redirect()->route('login')
                ->with('error', 'Tu cuenta está desactivada.');
        }

        // Solo superadmin usa constante, el resto evalúa tabla
        if ($user->esSuperAdmin()) {
            return $next($request);
        }

        if (!$user->puede($slug, $permiso)) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Sin permiso.'], 403);
            }
            abort(403, 'No tienes permiso para acceder a esta sección.');
        }

        return $next($request);
    }
}