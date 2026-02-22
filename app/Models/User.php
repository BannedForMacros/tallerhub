<?php
namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name', 'email', 'password',
        'empresa_id', 'local_id', 'rol_id',
        'telefono', 'avatar', 'activo',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'activo'            => 'boolean',
        ];
    }

    public function empresa()  { return $this->belongsTo(Empresa::class); }
    public function local()    { return $this->belongsTo(Local::class); }
    public function rol()      { return $this->belongsTo(Rol::class); }

    public function esSuperAdmin(): bool
    {
        return $this->rol?->nombre === 'superadmin';
    }

    public function esDueno(): bool
    {
        return $this->rol?->nombre === 'dueño';
    }

    // Verifica permiso sobre un módulo por slug
    public function puede(string $slug, string $permiso): bool
    {
        // Superadmin tiene todo
        if ($this->esSuperAdmin()) return true;

        if (!$this->rol_id) return false;

        $permisoPorRol = PermisoPorRol::whereHas(
            'modulo', fn($q) => $q->where('slug', $slug)
        )->where('rol_id', $this->rol_id)->first();

        return $permisoPorRol?->$permiso ?? false;
    }

    // Módulos accesibles según rol (para el sidebar)
    public function modulosAccesibles()
    {
        if ($this->esSuperAdmin()) {
            return Modulo::where('activo', 1)
                ->whereNull('parent_id')
                ->with(['hijos' => fn($q) => $q->where('activo', 1)->orderBy('orden')])
                ->orderBy('orden')
                ->get();
        }

        return Modulo::where('activo', 1)
            ->whereNull('parent_id')
            ->whereHas('permisos', fn($q) => $q->where('rol_id', $this->rol_id)->where('ver', 1))
            ->with(['hijos' => fn($q) => $q->where('activo', 1)
                ->whereHas('permisos', fn($q2) => $q2->where('rol_id', $this->rol_id)->where('ver', 1))
                ->orderBy('orden')
            ])
            ->orderBy('orden')
            ->get();
    }
}