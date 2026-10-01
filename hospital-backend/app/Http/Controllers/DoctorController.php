<?php
namespace App\Http\Controllers;

use App\Models\{Doctor, Patient, MedicalRecord, Prescription, Invoice, User};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{Hash, Cache, DB};
use Barryvdh\DomPDF\Facade\Pdf;

// ── Doctor Controller ───────────────────────────────────────

class DoctorController extends Controller
{
    public function index(Request $request)
    {
        $query = Doctor::with(['user', 'department']);

        if ($request->department_id) {
            $query->where('department_id', $request->department_id);
        }
        if ($request->specialty) {
            $query->where('specialty', 'like', "%{$request->specialty}%");
        }
        if ($request->search) {
            $query->whereHas('user', fn($q) =>
                $q->where('name', 'like', "%{$request->search}%")
            );
        }

        return response()->json($query->get());
    }

    public function show(Doctor $doctor)
    {
        return response()->json(
            $doctor->load(['user', 'department'])
        );
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'             => 'required|string',
            'email'            => 'required|email|unique:users',
            'password'         => 'required|string|min:8',
            'phone'            => 'nullable|string',
            'department_id'    => 'required|exists:departments,id',
            'specialty'        => 'required|string',
            'qualification'    => 'required|string',
            'experience_years' => 'required|integer|min:0',
            'consultation_fee' => 'required|numeric|min:0',
            'license_number'   => 'required|string|unique:doctors',
            'available_days'   => 'required|array',
            'shift_start'      => 'required|date_format:H:i',
            'shift_end'        => 'required|date_format:H:i',
            'bio'              => 'nullable|string',
        ]);

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => 'doctor',
            'phone'    => $request->phone,
        ]);

        $doctor = Doctor::create([
            ...$request->only([
                'department_id', 'specialty', 'qualification',
                'experience_years', 'consultation_fee', 'license_number',
                'available_days', 'shift_start', 'shift_end', 'bio'
            ]),
            'user_id' => $user->id,
        ]);

        return response()->json([
            'doctor'  => $doctor->load(['user', 'department']),
            'message' => 'Doctor created successfully',
        ], 201);
    }

    public function update(Request $request, Doctor $doctor)
    {
        $doctor->update($request->only([
            'department_id', 'specialty', 'qualification',
            'experience_years', 'consultation_fee',
            'available_days', 'shift_start', 'shift_end', 'bio'
        ]));

        if ($request->name || $request->phone) {
            $doctor->user->update($request->only(['name', 'phone']));
        }

        return response()->json([
            'doctor'  => $doctor->fresh(['user', 'department']),
            'message' => 'Doctor updated',
        ]);
    }

    public function dashboard(Request $request)
    {
        $doctor = $request->user()->doctor;

        $stats = Cache::remember("doctor_dashboard_{$doctor->id}", 300, function () use ($doctor) {
            return [
                'today_appointments'   => $doctor->appointments()->today()->count(),
                'pending_today'        => $doctor->appointments()->today()
                                            ->whereIn('status', ['scheduled', 'confirmed'])->count(),
                'completed_today'      => $doctor->appointments()->today()
                                            ->where('status', 'completed')->count(),
                'total_patients'       => $doctor->appointments()
                                            ->distinct('patient_id')->count('patient_id'),
                'this_month'           => $doctor->appointments()
                                            ->whereMonth('appointment_date', now()->month)->count(),
            ];
        });

        $todaySchedule = $doctor->appointments()
            ->with(['patient.user'])
            ->today()
            ->orderBy('appointment_time')
            ->get();

        return response()->json(['stats' => $stats, 'today_schedule' => $todaySchedule]);
    }
}

// ── Patient Controller ──────────────────────────────────────
