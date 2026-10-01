<?php
namespace App\Http\Controllers;

use App\Models\{Doctor, Patient, MedicalRecord, Prescription, Invoice, User};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{Hash, Cache, DB};
use Barryvdh\DomPDF\Facade\Pdf;

// ── Doctor Controller ───────────────────────────────────────

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $query = Invoice::with(['patient.user', 'appointment.doctor.user']);

        if ($request->status) { $query->where('status', $request->status); }
        if ($request->patient_id) { $query->where('patient_id', $request->patient_id); }

        // Totals cover every matching invoice, not just the current page
        $summary = [
            'total'       => (clone $query)->count(),
            'collected'   => (float) (clone $query)->where('status', 'paid')->sum('total'),
            'outstanding' => (float) (clone $query)->where('status', 'unpaid')->sum('total'),
        ];

        return response()->json([
            ...$query->latest()->orderByDesc('id')->paginate(20)->toArray(),
            'summary' => $summary,
        ]);
    }

    public function markPaid(Request $request, Invoice $invoice)
    {
        $request->validate([
            'payment_method' => 'required|in:cash,card,insurance,bank',
        ]);

        $invoice->update([
            'status'         => 'paid',
            'payment_method' => $request->payment_method,
            'paid_at'        => now(),
        ]);

        // Update appointment payment status
        if ($invoice->appointment) {
            $invoice->appointment->update(['payment_status' => 'paid']);
        }

        return response()->json(['invoice' => $invoice->fresh(), 'message' => 'Payment recorded']);
    }

    public function downloadPdf(Invoice $invoice)
    {
        $invoice->load(['patient.user', 'appointment.doctor.user']);

        $pdf = Pdf::loadView('pdf.invoice', ['invoice' => $invoice])->setPaper('a4');

        return $pdf->download("invoice-{$invoice->invoice_number}.pdf");
    }
}
