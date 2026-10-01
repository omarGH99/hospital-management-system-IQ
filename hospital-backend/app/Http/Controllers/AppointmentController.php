<?php
namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class AppointmentController extends Controller
{
    // GET /api/appointments
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Appointment::with(['patient.user', 'doctor.user', 'department']);

        // Scope by role
        if ($user->isDoctor()) {
            $query->where('doctor_id', $user->doctor->id);
        } elseif ($user->isPatient()) {
            $query->where('patient_id', $user->patient->id);
        }

        // Filters
        if ($request->date) {
            $query->whereDate('appointment_date', $request->date);
        }
        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->doctor_id) {
            $query->where('doctor_id', $request->doctor_id);
        }
        if ($request->today) {
            $query->whereDate('appointment_date', today());
        }

        // A single day reads best in time order; the general list shows newest first
        $singleDay = $request->date || $request->today;
        $appointments = $query->orderBy('appointment_date', $singleDay ? 'asc' : 'desc')
                              ->orderBy('appointment_time', $singleDay ? 'asc' : 'desc')
                              ->paginate(20);

        return response()->json($appointments);
    }

    // POST /api/appointments
    public function store(Request $request)
    {
        $request->validate([
            'patient_id'       => 'required|exists:patients,id',
            'doctor_id'        => 'required|exists:doctors,id',
            'department_id'    => 'required|exists:departments,id',
            'appointment_date' => 'required|date|after_or_equal:today',
            'appointment_time' => 'required|date_format:H:i',
            'reason'           => 'nullable|string|max:500',
            'duration_minutes' => 'nullable|integer|in:15,30,45,60',
        ]);

        // Check slot availability
        $conflict = Appointment::where('doctor_id', $request->doctor_id)
            ->whereDate('appointment_date', $request->appointment_date)
            ->where('appointment_time', $request->appointment_time)
            ->whereNotIn('status', ['cancelled', 'no_show'])
            ->exists();

        if ($conflict) {
            return response()->json([
                'message' => 'This time slot is already booked.',
            ], 422);
        }

        $doctor = Doctor::find($request->doctor_id);

        $appointment = Appointment::create([
            ...$request->only([
                'patient_id', 'doctor_id', 'department_id',
                'appointment_date', 'appointment_time', 'reason'
            ]),
            'duration_minutes' => $request->duration_minutes ?? 30,
            'fee'              => $doctor->consultation_fee,
            'status'           => 'scheduled',
            'payment_status'   => 'pending',
        ]);

        // Clear cache
        Cache::forget("doctor_{$request->doctor_id}_slots_{$request->appointment_date}");

        return response()->json([
            'appointment' => $appointment->load(['patient.user', 'doctor.user', 'department']),
            'message'     => 'Appointment booked successfully',
        ], 201);
    }

    // GET /api/appointments/{id}
    public function show(Appointment $appointment)
    {
        return response()->json(
            $appointment->load([
                'patient.user', 'doctor.user', 'department',
                'medicalRecord.prescriptions'
            ])
        );
    }

    // PUT /api/appointments/{id}/status
    public function updateStatus(Request $request, Appointment $appointment)
    {
        $request->validate([
            'status' => 'required|in:scheduled,confirmed,in_progress,completed,cancelled,no_show',
            'notes'  => 'nullable|string',
        ]);

        $appointment->update([
            'status' => $request->status,
            'notes'  => $request->notes ?? $appointment->notes,
        ]);

        // Auto-create invoice when completed
        if ($request->status === 'completed' && !$appointment->invoice) {
            Invoice::create([
                'invoice_number' => Invoice::generateNumber(),
                'patient_id'     => $appointment->patient_id,
                'appointment_id' => $appointment->id,
                'subtotal'       => $appointment->fee,
                'discount'       => 0,
                'total'          => $appointment->fee,
                'status'         => 'unpaid',
                'items'          => [
                    ['description' => 'Consultation Fee', 'amount' => $appointment->fee]
                ],
                'due_date'       => now()->addDays(7)->toDateString(),
            ]);
        }

        return response()->json([
            'appointment' => $appointment->fresh(['patient.user', 'doctor.user']),
            'message'     => 'Status updated',
        ]);
    }

    // GET /api/doctors/{id}/available-slots?date=2024-03-20
    public function availableSlots(Request $request, Doctor $doctor)
    {
        $request->validate(['date' => 'required|date|after_or_equal:today']);

        $date = $request->date;
        $cacheKey = "doctor_{$doctor->id}_slots_{$date}";

        $slots = Cache::remember($cacheKey, 300, function () use ($doctor, $date) {
            $dayName = Carbon::parse($date)->format('l');

            // Check if doctor works this day
            if (!in_array($dayName, $doctor->available_days)) {
                return [];
            }

            // Generate 30-min slots
            $start = Carbon::parse($date . ' ' . $doctor->shift_start);
            $end   = Carbon::parse($date . ' ' . $doctor->shift_end);
            $allSlots = [];

            while ($start < $end) {
                $allSlots[] = $start->format('H:i');
                $start->addMinutes(30);
            }

            // Remove booked slots
            $booked = Appointment::where('doctor_id', $doctor->id)
                ->whereDate('appointment_date', $date)
                ->whereNotIn('status', ['cancelled', 'no_show'])
                ->pluck('appointment_time')
                ->map(fn($t) => Carbon::parse($t)->format('H:i'))
                ->toArray();

            return array_values(array_diff($allSlots, $booked));
        });

        return response()->json(['slots' => $slots, 'date' => $date]);
    }

    // GET /api/appointments/stats
    public function stats()
    {
        $cacheKey = 'appointment_stats_' . today()->toDateString();

        $stats = Cache::remember($cacheKey, 30, function () {
            return [
                'today_total'     => Appointment::today()->count(),
                'today_completed' => Appointment::today()->where('status', 'completed')->count(),
                'today_pending'   => Appointment::today()->whereIn('status', ['scheduled', 'confirmed'])->count(),
                'this_month'      => Appointment::whereMonth('appointment_date', now()->month)->count(),
                'cancelled_today' => Appointment::today()->where('status', 'cancelled')->count(),
            ];
        });

        return response()->json($stats);
    }
}
