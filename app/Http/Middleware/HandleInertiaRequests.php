<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Constants\Roles;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),

            'auth' => [
                'user' => $user ? [
                    'id'           => $user->id,
                    'name'         => $user->name,
                    'email'        => $user->email,
                    'avatar'       => $user->avatar,
                    'rol'          => $user->rol?->nombre,
                    'empresa_id'   => $user->empresa_id,
                    'local_id'     => $user->local_id,
                    'esSuperAdmin' => $user->esSuperAdmin(),
                ] : null,
            ],

            // Módulos accesibles según rol — alimenta el sidebar
            'modulos' => $user
                ? $user->modulosAccesibles()
                : [],

            // Flash messages globales
            'flash' => [
                'success' => $request->session()->get('success'),
                'error'   => $request->session()->get('error'),
            ],
        ];
    }
}