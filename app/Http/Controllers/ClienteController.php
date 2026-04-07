<?php
namespace App\Http\Controllers;

use App\Models\Cliente;
use App\Models\Empresa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
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

    public function consultaDocumento(Request $request)
    {
        $numero = trim($request->query('numero', ''));

        if (!in_array(strlen($numero), [8, 11])) {
            return response()->json(['error' => 'Ingresa un DNI (8 dígitos) o RUC (11 dígitos)'], 422);
        }

        $token = config('services.decolecta.token');
        $tipo  = strlen($numero) === 8 ? 'dni' : 'ruc';
        $url   = $tipo === 'dni'
            ? "https://api.decolecta.com/v1/reniec/dni?numero={$numero}"
            : "https://api.decolecta.com/v1/sunat/ruc?numero={$numero}";

        $resp = Http::withToken($token)
            ->withHeaders(['Content-Type' => 'application/json'])
            ->get($url);

        if (!$resp->successful()) {
            return response()->json(['error' => 'No se encontró información para este número'], 404);
        }

        $d = $resp->json();

        if ($tipo === 'dni') {
            $nombre = $d['full_name']
                ?? trim("{$d['first_name']} {$d['first_last_name']} {$d['second_last_name']}");
            return response()->json(['tipo' => 'dni', 'nombre' => $nombre, 'direccion' => '']);
        }

        return response()->json([
            'tipo'      => 'ruc',
            'nombre'    => $d['razon_social'] ?? '',
            'direccion' => $d['direccion']    ?? '',
        ]);
    }

    private function verificarPropiedad(Cliente $cliente): void
    {
        $user = auth()->user();
        if ($user->esSuperAdmin()) return;
        if ($cliente->empresa_id !== $user->empresa_id) abort(403);
    }
}