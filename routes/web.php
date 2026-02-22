<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Configuracion\EmpresaController;
use App\Http\Controllers\Configuracion\RolController;
use App\Http\Controllers\Configuracion\UsuarioController;
use App\Http\Controllers\Configuracion\LocalController;
use App\Http\Controllers\Configuracion\TipoGastoController;
use App\Http\Controllers\Configuracion\ClasificacionGastoController;
use App\Http\Controllers\Configuracion\DescripcionGastoController;
use App\Http\Controllers\Configuracion\ServicioController;
use App\Http\Controllers\ClienteController;
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

    
    Route::get   ('/clientes',                  [ClienteController::class, 'index'])->name('clientes.index');
    Route::post  ('/clientes',                  [ClienteController::class, 'store'])->name('clientes.store');
    Route::put   ('/clientes/{cliente}',        [ClienteController::class, 'update'])->name('clientes.update');
    Route::patch ('/clientes/{cliente}/toggle', [ClienteController::class, 'toggleActivo'])->name('clientes.toggle');


// ── CONFIGURACIÓN ────────────────────────────────────
Route::middleware(['auth', 'verified'])->prefix('configuracion')->name('configuracion.')->group(function () {

    // Empresas
    Route::get   ('/empresas',                        [EmpresaController::class,  'index'])->name('empresas.index');
    Route::post  ('/empresas',                        [EmpresaController::class,  'store'])->name('empresas.store');
    Route::put   ('/empresas/{empresa}',              [EmpresaController::class,  'update'])->name('empresas.update');
    Route::patch ('/empresas/{empresa}/toggle',       [EmpresaController::class,  'toggleActivo'])->name('empresas.toggle');

    // Locales
    Route::get   ('/locales',                         [LocalController::class,    'index'])->name('locales.index');
    Route::post  ('/locales',                         [LocalController::class,    'store'])->name('locales.store');
    Route::put   ('/locales/{local}',                 [LocalController::class,    'update'])->name('locales.update');
    Route::patch ('/locales/{local}/toggle',          [LocalController::class,    'toggleActivo'])->name('locales.toggle');

    // Roles
    Route::get   ('/roles',                           [RolController::class,      'index'])->name('roles.index');
    Route::post  ('/roles',                           [RolController::class,      'store'])->name('roles.store');
    Route::put   ('/roles/{rol}',                     [RolController::class,      'update'])->name('roles.update');
    Route::patch ('/roles/{rol}/toggle',              [RolController::class,      'toggleActivo'])->name('roles.toggle');
    Route::get   ('/roles/{rol}/permisos',            [RolController::class,      'permisos'])->name('roles.permisos');
    Route::post  ('/roles/{rol}/permisos',            [RolController::class,      'guardarPermisos'])->name('roles.permisos.guardar');

    // Usuarios
    Route::get   ('/usuarios',                        [UsuarioController::class,  'index'])->name('usuarios.index');
    Route::post  ('/usuarios',                        [UsuarioController::class,  'store'])->name('usuarios.store');
    Route::put   ('/usuarios/{usuario}',              [UsuarioController::class,  'update'])->name('usuarios.update');
    Route::patch ('/usuarios/{usuario}/toggle',       [UsuarioController::class,  'toggleActivo'])->name('usuarios.toggle');

    // Servicios
    Route::get   ('/servicios',                       [ServicioController::class, 'index'])->name('servicios.index');
    Route::post  ('/servicios',                       [ServicioController::class, 'store'])->name('servicios.store');
    Route::put   ('/servicios/{servicio}',            [ServicioController::class, 'update'])->name('servicios.update');
    Route::patch ('/servicios/{servicio}/toggle',     [ServicioController::class, 'toggleActivo'])->name('servicios.toggle');

    // Gestión de Gastos — página unificada
    Route::get   ('/gastos',                                            [TipoGastoController::class,          'index'])->name('gastos.index');
    Route::post  ('/gastos/tipos',                                      [TipoGastoController::class,          'store'])->name('tipos-gasto.store');
    Route::put   ('/gastos/tipos/{tipoGasto}',                          [TipoGastoController::class,          'update'])->name('tipos-gasto.update');
    Route::patch ('/gastos/tipos/{tipoGasto}/toggle',                   [TipoGastoController::class,          'toggleActivo'])->name('tipos-gasto.toggle');
    Route::post  ('/gastos/clasificacion',                              [ClasificacionGastoController::class, 'store'])->name('clasificacion-gasto.store');
    Route::put   ('/gastos/clasificacion/{clasificacionGasto}',         [ClasificacionGastoController::class, 'update'])->name('clasificacion-gasto.update');
    Route::patch ('/gastos/clasificacion/{clasificacionGasto}/toggle',  [ClasificacionGastoController::class, 'toggleActivo'])->name('clasificacion-gasto.toggle');
    Route::post  ('/gastos/descripcion',                                [DescripcionGastoController::class,   'store'])->name('descripcion-gasto.store');
    Route::put   ('/gastos/descripcion/{descripcionGasto}',             [DescripcionGastoController::class,   'update'])->name('descripcion-gasto.update');
    Route::patch ('/gastos/descripcion/{descripcionGasto}/toggle',      [DescripcionGastoController::class,   'toggleActivo'])->name('descripcion-gasto.toggle');
    

});

require __DIR__.'/auth.php';