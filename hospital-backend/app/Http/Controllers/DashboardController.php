<?php
namespace App\Http\Controllers;

use App\Models\{Appointment, Doctor, Invoice, Patient};

class DashboardController extends Controller
{
    public function stats()
    {
        $monthly = collect(range(5, 0))->map(function ($ago) {
            $start = now()->subMonths($ago)->startOfMonth();
            $end   = $start->copy()->endOfMonth();
            return [
                'month'    => $start->format('M'),
                'revenue'  => (float) Invoice::where('status', 'paid')->whereBetween('paid_at', [$start, $end])->sum('total'),
                'patients' => Appointment::where('status', 'completed')->whereBetween('appointment_date', [$start, $end])->distinct('patient_id')->count('patient_id'),
            ];
        })->values();

        return response()->json([
            'total_patients'     => Patient::count(),
            'total_doctors'      => Doctor::count(),
            'today_appointments' => Appointment::today()->count(),
            'monthly_revenue'    => $monthly[5]['revenue'], // current month
            'pending_invoices'   => Invoice::where('status', 'unpaid')->count(),
            'appointments_by_status' => Appointment::today()
                ->selectRaw('status, count(*) as count')
                ->groupBy('status')->pluck('count', 'status'),
            'monthly'            => $monthly,
        ]);
    }
}
