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
use App\Http\Controllers\Configuracion\UnidadMedidaController;
use App\Http\Controllers\Configuracion\CategoriaAlmacenController;
use App\Http\Controllers\Configuracion\MetodoPagoController;
use App\Http\Controllers\Configuracion\CuentaPagoController;
use App\Http\Controllers\Almacen\ProductoAlmacenController;
use App\Http\Controllers\Almacen\ProveedorController;
use App\Http\Controllers\Almacen\EntradaAlmacenController;
use App\Http\Controllers\Almacen\SalidaAlmacenController;
use App\Http\Controllers\Almacen\InventarioController;
use App\Http\Controllers\ClienteController;
use App\Http\Controllers\VentaController;
use App\Http\Controllers\RecepcionController;
use App\Http\Controllers\GastoController;
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

    // CLIENTES
    Route::get   ('/clientes',                  [ClienteController::class, 'index'])->name('clientes.index');
    Route::post  ('/clientes',                  [ClienteController::class, 'store'])->name('clientes.store');
    Route::put   ('/clientes/{cliente}',        [ClienteController::class, 'update'])->name('clientes.update');
    Route::patch ('/clientes/{cliente}/toggle', [ClienteController::class, 'toggleActivo'])->name('clientes.toggle');

    // RECEPCIONES
    Route::get   ('/recepciones',                    [RecepcionController::class, 'index'])->name('recepciones.index');
    Route::post  ('/recepciones',                    [RecepcionController::class, 'store'])->name('recepciones.store');
    Route::put   ('/recepciones/{recepcion}',        [RecepcionController::class, 'update'])->name('recepciones.update');
    Route::patch ('/recepciones/{recepcion}/toggle', [RecepcionController::class, 'toggleActivo'])->name('recepciones.toggle');
    Route::get   ('/recepciones/{recepcion}/pdf',    [RecepcionController::class, 'pdf'])->name('recepciones.pdf');

    // PRODUCTOS ALMACÉN
    Route::get   ('/almacen/productos',                        [ProductoAlmacenController::class, 'index'])->name('almacen.productos.index');
    Route::post  ('/almacen/productos',                        [ProductoAlmacenController::class, 'store'])->name('almacen.productos.store');
    Route::put   ('/almacen/productos/{productoAlmacen}',      [ProductoAlmacenController::class, 'update'])->name('almacen.productos.update');
    Route::patch ('/almacen/productos/{productoAlmacen}/toggle',[ProductoAlmacenController::class, 'toggleActivo'])->name('almacen.productos.toggle');

    //PROVEEDORES
    Route::get   ('/almacen/proveedores',                      [ProveedorController::class, 'index'])->name('almacen.proveedores.index');
    Route::post  ('/almacen/proveedores',                      [ProveedorController::class, 'store'])->name('almacen.proveedores.store');
    Route::put   ('/almacen/proveedores/{proveedor}',          [ProveedorController::class, 'update'])->name('almacen.proveedores.update');
    Route::patch ('/almacen/proveedores/{proveedor}/toggle',   [ProveedorController::class, 'toggleActivo'])->name('almacen.proveedores.toggle');
    Route::get   ('/almacen/proveedores/lista',                [ProveedorController::class, 'lista'])->name('almacen.proveedores.lista');

    // ENTRADAS ALMACÉN
    Route::get   ('/almacen/entradas',                        [EntradaAlmacenController::class, 'index'])->name('almacen.entradas.index');
    Route::get   ('/almacen/entradas/create',                 [EntradaAlmacenController::class, 'create'])->name('almacen.entradas.create');
    Route::post  ('/almacen/entradas',                        [EntradaAlmacenController::class, 'store'])->name('almacen.entradas.store');
    Route::get   ('/almacen/entradas/{entradaAlmacen}',       [EntradaAlmacenController::class, 'show'])->name('almacen.entradas.show');
    Route::get   ('/almacen/entradas/{entradaAlmacen}/edit',  [EntradaAlmacenController::class, 'edit'])->name('almacen.entradas.edit');
    Route::put   ('/almacen/entradas/{entradaAlmacen}',       [EntradaAlmacenController::class, 'update'])->name('almacen.entradas.update');
    Route::patch ('/almacen/entradas/{entradaAlmacen}/toggle',[EntradaAlmacenController::class, 'toggleActivo'])->name('almacen.entradas.toggle');

    // Salidas
    Route::get   ('/almacen/salidas',                       [SalidaAlmacenController::class, 'index'])->name('almacen.salidas.index');
    Route::get   ('/almacen/salidas/create',                [SalidaAlmacenController::class, 'create'])->name('almacen.salidas.create');
    Route::post  ('/almacen/salidas',                       [SalidaAlmacenController::class, 'store'])->name('almacen.salidas.store');
    Route::get   ('/almacen/salidas/{salidaAlmacen}/edit',  [SalidaAlmacenController::class, 'edit'])->name('almacen.salidas.edit');
    Route::put   ('/almacen/salidas/{salidaAlmacen}',       [SalidaAlmacenController::class, 'update'])->name('almacen.salidas.update');
    Route::patch ('/almacen/salidas/{salidaAlmacen}/toggle',[SalidaAlmacenController::class, 'toggleActivo'])->name('almacen.salidas.toggle');

    // Inventario
    Route::get('/almacen/inventario', [InventarioController::class, 'index'])->name('almacen.inventario.index');

    // VENTAS
    Route::get   ('/ventas',               [VentaController::class, 'index'])->name('ventas.index');
    Route::get   ('/ventas/create',        [VentaController::class, 'create'])->name('ventas.create');
    Route::post  ('/ventas',               [VentaController::class, 'store'])->name('ventas.store');
    Route::get   ('/ventas/{venta}',       [VentaController::class, 'show'])->name('ventas.show');
    Route::get   ('/ventas/{venta}/edit',  [VentaController::class, 'edit'])->name('ventas.edit');
    Route::patch ('/ventas/{venta}/toggle',[VentaController::class, 'toggleActivo'])->name('ventas.toggle');
    Route::put('/ventas/{venta}', [VentaController::class, 'update'])->name('ventas.update');

    // Métodos de pago
    Route::get   ('/configuracion/metodos-pago',                    [MetodoPagoController::class, 'index'])->name('config.metodos-pago.index');
    Route::post  ('/configuracion/metodos-pago',                    [MetodoPagoController::class, 'store'])->name('config.metodos-pago.store');
    Route::put   ('/configuracion/metodos-pago/{metodoPago}',       [MetodoPagoController::class, 'update'])->name('config.metodos-pago.update');
    Route::patch ('/configuracion/metodos-pago/{metodoPago}/toggle',[MetodoPagoController::class, 'toggleActivo'])->name('config.metodos-pago.toggle');
    Route::get   ('/configuracion/metodos-pago/lista',              [MetodoPagoController::class, 'lista'])->name('config.metodos-pago.lista');

    // Cuentas de pago
    Route::get   ('/configuracion/cuentas-pago',                   [CuentaPagoController::class, 'index'])->name('config.cuentas-pago.index');
    Route::post  ('/configuracion/cuentas-pago',                   [CuentaPagoController::class, 'store'])->name('config.cuentas-pago.store');
    Route::put   ('/configuracion/cuentas-pago/{cuentaPago}',      [CuentaPagoController::class, 'update'])->name('config.cuentas-pago.update');
    Route::patch ('/configuracion/cuentas-pago/{cuentaPago}/toggle',[CuentaPagoController::class, 'toggleActivo'])->name('config.cuentas-pago.toggle');

    // GASTOS
    Route::get   ('/gastos',               [GastoController::class, 'index'])->name('gastos.index');
    Route::get   ('/gastos/create',        [GastoController::class, 'create'])->name('gastos.create');
    Route::post  ('/gastos',               [GastoController::class, 'store'])->name('gastos.store');
    Route::get   ('/gastos/{gasto}/edit',  [GastoController::class, 'edit'])->name('gastos.edit');
    Route::put   ('/gastos/{gasto}',       [GastoController::class, 'update'])->name('gastos.update');
    Route::patch ('/gastos/{gasto}/toggle',[GastoController::class, 'toggleActivo'])->name('gastos.toggle');

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
    
    Route::get   ('/unidades-medida',                          [UnidadMedidaController::class,    'index'])->name('unidades-medida.index');
    Route::post  ('/unidades-medida',                          [UnidadMedidaController::class,    'store'])->name('unidades-medida.store');
    Route::put   ('/unidades-medida/{unidadMedida}',           [UnidadMedidaController::class,    'update'])->name('unidades-medida.update');
    Route::patch ('/unidades-medida/{unidadMedida}/toggle',    [UnidadMedidaController::class,    'toggleActivo'])->name('unidades-medida.toggle');

    Route::get   ('/categorias-almacen',                       [CategoriaAlmacenController::class,'index'])->name('categorias-almacen.index');
    Route::post  ('/categorias-almacen',                       [CategoriaAlmacenController::class,'store'])->name('categorias-almacen.store');
    Route::put   ('/categorias-almacen/{categoriaAlmacen}',    [CategoriaAlmacenController::class,'update'])->name('categorias-almacen.update');
    Route::patch ('/categorias-almacen/{categoriaAlmacen}/toggle',[CategoriaAlmacenController::class,'toggleActivo'])->name('categorias-almacen.toggle');

});

require __DIR__.'/auth.php';