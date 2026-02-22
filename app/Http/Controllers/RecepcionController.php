<?php
namespace App\Http\Controllers;

use App\Models\Recepcion;
use App\Models\Cliente;
use App\Models\Local;
use App\Models\User;
use App\Models\Empresa;
use App\Models\Correlativo;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;

class RecepcionController extends Controller
{
    public function index()
    {
        $user      = auth()->user();
        $empresaId = $user->esSuperAdmin() ? null : $user->empresa_id;

        $recepciones = Recepcion::with(['cliente', 'local', 'tecnico'])
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderByDesc('id')
            ->get();

        $empresas = $user->esSuperAdmin()
            ? Empresa::where('activo', 1)->orderBy('nombre')->get()
            : collect();

        // Si es superadmin trae todos, si no filtra por su empresa
        $clientes = Cliente::where('activo', 1)
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('nombre')->get();

        $locales = Local::where('activo', 1)
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('nombre')->get();

        $tecnicos = User::where('activo', 1)
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('name')->get();

        return Inertia::render('Recepciones/Index', [
            'recepciones' => $recepciones,
            'empresas'    => $empresas,
            'clientes'    => $clientes,
            'locales'     => $locales,
            'tecnicos'    => $tecnicos,
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();

        $data = $request->validate([
            'empresa_id'             => 'nullable|exists:empresas,id',
            'cliente_id'             => 'required|exists:clientes,id',
            'local_id'               => 'required|exists:locales,id',
            'user_id'                => 'nullable|exists:users,id',
            'tipo_equipo'            => 'required|string|max:100',
            'marca'                  => 'nullable|string|max:100',
            'modelo'                 => 'nullable|string|max:100',
            'serie'                  => 'nullable|string|max:100',
            'accesorios'             => 'nullable|string',
            'descripcion_falla'      => 'required|string',
            'observaciones'          => 'nullable|string',
            'fecha_entrega_estimada' => 'nullable|date',
        ]);

        $empresaId = $user->esSuperAdmin()
            ? ($data['empresa_id'] ?? Local::find($data['local_id'])->empresa_id)
            : $user->empresa_id;

        $data['empresa_id']      = $empresaId;
        $data['codigo']          = Correlativo::siguiente($empresaId, 'REC');
        $data['estado']          = 'recibido';
        $data['fecha_recepcion'] = now();

        $recepcion = Recepcion::create($data);

        return back()->with('success', 'Recepción ' . $recepcion->codigo . ' creada correctamente.');
    }

    public function update(Request $request, Recepcion $recepcion)
    {
        $data = $request->validate([
            'cliente_id'             => 'required|exists:clientes,id',
            'local_id'               => 'required|exists:locales,id',
            'user_id'                => 'nullable|exists:users,id',
            'tipo_equipo'            => 'required|string|max:100',
            'marca'                  => 'nullable|string|max:100',
            'modelo'                 => 'nullable|string|max:100',
            'serie'                  => 'nullable|string|max:100',
            'accesorios'             => 'nullable|string',
            'descripcion_falla'      => 'required|string',
            'observaciones'          => 'nullable|string',
            'fecha_entrega_estimada' => 'nullable|date',
            'estado'                 => 'required|in:recibido,en_proceso,listo,entregado',
        ]);

        $recepcion->update($data);
        return back()->with('success', 'Recepción actualizada correctamente.');
    }

    public function toggleActivo(Recepcion $recepcion)
    {
        $recepcion->update(['activo' => !$recepcion->activo]);
        return back()->with('success', 'Estado actualizado.');
    }

    public function pdf(Recepcion $recepcion)
    {
        $recepcion->load(['cliente', 'local', 'tecnico', 'empresa']);



        $urlRecepcion = url('/recepciones/' . $recepcion->id . '/pdf');
        $renderer     = new ImageRenderer(new RendererStyle(120), new SvgImageBackEnd());
        $writer       = new Writer($renderer);
        $qrBase64     = base64_encode($writer->writeString($urlRecepcion));

        $logoBase64 = null;
        if ($recepcion->empresa->logo) {
            $logoPath = storage_path('app/public/' . $recepcion->empresa->logo);
            if (file_exists($logoPath)) {
                $ext        = pathinfo($logoPath, PATHINFO_EXTENSION);
                $mime       = $ext === 'png' ? 'image/png' : 'image/jpeg';
                $logoBase64 = 'data:' . $mime . ';base64,' . base64_encode(file_get_contents($logoPath));
            }
        }

        $pdf = Pdf::loadView('pdf.recepcion', compact('recepcion', 'qrBase64', 'logoBase64'))
            ->setPaper('a4', 'portrait');

        return $pdf->stream('recepcion-' . $recepcion->codigo . '.pdf');
    }
}