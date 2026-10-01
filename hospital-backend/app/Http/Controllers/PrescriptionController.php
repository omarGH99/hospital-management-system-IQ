<?php
namespace App\Http\Controllers;

use App\Models\{Doctor, Patient, MedicalRecord, Prescription, Invoice, User};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{Hash, Cache, DB};
use Barryvdh\DomPDF\Facade\Pdf;

// ── Doctor Controller ───────────────────────────────────────

class PrescriptionController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'medical_record_id' => 'required|exists:medical_records,id',
            'patient_id'        => 'required|exists:patients,id',
            'valid_until'       => 'required|date|after:today',
            'medications'       => 'required|array|min:1',
            'medications.*.name'      => 'required|string',
            'medications.*.dosage'    => 'required|string',
            'medications.*.frequency' => 'required|string',
            'medications.*.duration'  => 'required|string',
            'instructions'      => 'nullable|string',
        ]);

        $prescription = Prescription::create([
            ...$request->only([
                'medical_record_id', 'patient_id',
                'valid_until', 'medications', 'instructions'
            ]),
            'doctor_id'       => $request->user()->doctor->id,
            'prescribed_date' => today(),
        ]);

        return response()->json([
            'prescription' => $prescription->load(['patient.user', 'doctor.user']),
            'message'      => 'Prescription created',
        ], 201);
    }

    // GET /api/prescriptions/{id}/pdf
    public function downloadPdf(Prescription $prescription)
    {
        $prescription->load(['patient.user', 'doctor.user', 'medicalRecord']);

        $pdf = Pdf::loadView('pdf.prescription', [
            'prescription' => $prescription,
        ])->setPaper('a4');

        return $pdf->download("prescription-{$prescription->id}.pdf");
    }
}

// ── Invoice Controller ──────────────────────────────────────
