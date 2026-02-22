<?php
namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Constants\Roles;

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
        return $this->rol?->nombre === Roles::SUPERADMIN;
    }

    public function esDueno(): bool
    {
        return $this->rol?->nombre === 'dueño';
    }

    // Verifica permiso sobre un módulo por slug



    // Todo lo demás se evalúa desde permisos_por_rol
    public function puede(string $slug, string $permiso): bool
    {
        if ($this->esSuperAdmin()) return true;
        if (!$this->rol_id)        return false;

        return \App\Models\PermisoPorRol::whereHas(
                'modulo', fn($q) => $q->where('slug', $slug)->where('activo', 1)
            )
            ->where('rol_id', $this->rol_id)
            ->where($permiso, 1)
            ->exists();
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