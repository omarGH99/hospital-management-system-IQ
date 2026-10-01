<?php
namespace App\Http\Controllers;

use App\Models\{Doctor, Patient, MedicalRecord, Prescription, Invoice, User};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{Hash, Cache, DB};
use Barryvdh\DomPDF\Facade\Pdf;

// ── Doctor Controller ───────────────────────────────────────

class PatientController extends Controller
{
    public function index(Request $request)
    {
        $query = Patient::with('user');

        if ($request->search) {
            $query->whereHas('user', fn($q) =>
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%")
            )->orWhere('national_id', 'like', "%{$request->search}%");
        }

        return response()->json($query->paginate(20));
    }

    public function show(Patient $patient)
    {
        return response()->json(
            $patient->load([
                'user',
                'appointments.doctor.user',
                'appointments.department',
                'medicalRecords.doctor.user',
                'prescriptions.doctor.user',
                'invoices',
            ])
        );
    }

    public function medicalHistory(Patient $patient)
    {
        return response()->json([
            'records'       => $patient->medicalRecords()->with('doctor.user')->latest()->get(),
            'prescriptions' => $patient->prescriptions()->with('doctor.user')->latest()->get(),
        ]);
    }
}

// ── Medical Record Controller ───────────────────────────────
