<?php
namespace App\Http\Controllers;

use App\Models\Cliente;
use App\Models\Empresa;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClienteController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        $clientes = Cliente::when(!$user->esSuperAdmin(), fn($q) =>
                $q->where('empresa_id', $user->empresa_id)
            )
            ->orderBy('nombre')
            ->get();

        $empresas = $user->esSuperAdmin()
            ? Empresa::where('activo', 1)->orderBy('nombre')->get()
            : collect();

        return Inertia::render('Clientes/Index', [
            'clientes' => $clientes,
            'empresas' => $empresas,
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();

        $data = $request->validate([
            'nombre'     => 'required|string|max:255',
            'dni'        => 'nullable|string|max:20',
            'telefono'   => 'nullable|string|max:20',
            'email'      => 'nullable|email|max:255',
            'direccion'  => 'nullable|string|max:255',
            'empresa_id' => 'nullable|exists:empresas,id',
        ]);

        $data['empresa_id'] = $user->esSuperAdmin()
            ? ($data['empresa_id'] ?? null)
            : $user->empresa_id;

        $cliente = Cliente::create($data);

        if ($request->wantsJson()) {
            return response()->json($cliente);
        }

        return back()->with('success', 'Cliente creado correctamente.');
    }

    public function update(Request $request, Cliente $cliente)
    {
        $this->verificarPropiedad($cliente);

        $data = $request->validate([
            'nombre'    => 'required|string|max:255',
            'dni'       => 'nullable|string|max:20',
            'telefono'  => 'nullable|string|max:20',
            'email'     => 'nullable|email|max:255',
            'direccion' => 'nullable|string|max:255',
        ]);

        $cliente->update($data);
        return back()->with('success', 'Cliente actualizado correctamente.');
    }

    public function toggleActivo(Cliente $cliente)
    {
        $this->verificarPropiedad($cliente);
        $cliente->update(['activo' => !$cliente->activo]);
        return back()->with('success', 'Estado actualizado.');
    }

    private function verificarPropiedad(Cliente $cliente): void
    {
        $user = auth()->user();
        if ($user->esSuperAdmin()) return;
        if ($cliente->empresa_id !== $user->empresa_id) abort(403);
    }
}