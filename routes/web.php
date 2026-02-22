<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Configuracion\EmpresaController;
use App\Http\Controllers\Configuracion\RolController;
use App\Http\Controllers\Configuracion\UsuarioController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ── WELCOME ──────────────────────────────────────────
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin'       => Route::has('login'),
        'canRegister'    => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion'     => PHP_VERSION,
    ]);
});

// ── DASHBOARD ────────────────────────────────────────
Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

// ── PERFIL ───────────────────────────────────────────
Route::middleware('auth')->group(function () {
    Route::get   ('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch ('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// ── CONFIGURACIÓN ────────────────────────────────────
Route::middleware(['auth', 'verified'])->prefix('configuracion')->name('configuracion.')->group(function () {

    // Empresas — solo superadmin
    Route::get   ('/empresas',                  [EmpresaController::class, 'index'])->name('empresas.index');
    Route::post  ('/empresas',                  [EmpresaController::class, 'store'])->name('empresas.store');
    Route::put   ('/empresas/{empresa}',        [EmpresaController::class, 'update'])->name('empresas.update');
    Route::patch ('/empresas/{empresa}/toggle', [EmpresaController::class, 'toggleActivo'])->name('empresas.toggle');

    // Roles — superadmin y dueño
    Route::get   ('/roles',                     [RolController::class, 'index'])->name('roles.index');
    Route::post  ('/roles',                     [RolController::class, 'store'])->name('roles.store');
    Route::put   ('/roles/{rol}',               [RolController::class, 'update'])->name('roles.update');
    Route::patch ('/roles/{rol}/toggle',        [RolController::class, 'toggleActivo'])->name('roles.toggle');
    Route::get   ('/roles/{rol}/permisos',      [RolController::class, 'permisos'])->name('roles.permisos');
    Route::post  ('/roles/{rol}/permisos',      [RolController::class, 'guardarPermisos'])->name('roles.permisos.guardar');

    // Usuarios — superadmin y dueño
    Route::get   ('/usuarios',                  [UsuarioController::class, 'index'])->name('usuarios.index');
    Route::post  ('/usuarios',                  [UsuarioController::class, 'store'])->name('usuarios.store');
    Route::put   ('/usuarios/{usuario}',        [UsuarioController::class, 'update'])->name('usuarios.update');
    Route::patch ('/usuarios/{usuario}/toggle', [UsuarioController::class, 'toggleActivo'])->name('usuarios.toggle');
});

require __DIR__.'/auth.php';