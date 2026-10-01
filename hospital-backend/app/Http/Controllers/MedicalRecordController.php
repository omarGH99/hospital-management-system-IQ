<?php
namespace App\Http\Controllers;

use App\Models\{Doctor, Patient, MedicalRecord, Prescription, Invoice, User};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{Hash, Cache, DB};
use Barryvdh\DomPDF\Facade\Pdf;

// ── Doctor Controller ───────────────────────────────────────

class MedicalRecordController extends Controller
{
    public function index(Request $request)
    {
        $user  = $request->user();
        $query = MedicalRecord::with(['patient.user', 'doctor.user', 'prescriptions']);

        if ($user->isDoctor()) { $query->where('doctor_id', $user->doctor->id); }
        if ($request->patient_id) { $query->where('patient_id', $request->patient_id); }

        return response()->json($query->latest('visit_date')->paginate(20));
    }

    public function store(Request $request)
    {
        $request->validate([
            'patient_id'      => 'required|exists:patients,id',
            'appointment_id'  => 'nullable|exists:appointments,id',
            'visit_date'      => 'required|date',
            'chief_complaint' => 'required|string',
            'diagnosis'       => 'required|string',
            'treatment_plan'  => 'nullable|string',
            'notes'           => 'nullable|string',
            'vital_signs'     => 'nullable|array',
        ]);

        $record = MedicalRecord::create([
            ...$request->only([
                'patient_id', 'appointment_id', 'visit_date',
                'chief_complaint', 'diagnosis', 'treatment_plan',
                'notes', 'vital_signs'
            ]),
            'doctor_id' => $request->user()->doctor->id,
        ]);

        // Mark appointment as completed
        if ($request->appointment_id) {
            $appt = $record->appointment;
            if ($appt && $appt->status === 'in_progress') {
                $appt->update(['status' => 'completed']);
            }
        }

        return response()->json([
            'record'  => $record->load(['patient.user', 'doctor.user']),
            'message' => 'Medical record saved',
        ], 201);
    }

    public function show(MedicalRecord $medicalRecord)
    {
        return response()->json(
            $medicalRecord->load(['patient.user', 'doctor.user', 'prescriptions'])
        );
    }
}

// ── Prescription Controller ─────────────────────────────────
