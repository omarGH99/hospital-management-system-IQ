<?php

namespace Database\Seeders;

use App\Models\{Appointment, Doctor, Invoice, MedicalRecord, Patient, Prescription};
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Seeder;

// Extra demo data: 5 months of history (visits, records, prescriptions, paid invoices),
// appointments for today and the coming week, plus unpaid invoices.
class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $doctors  = Doctor::all();
        $patients = Patient::all();
        $reasons  = ['Chest pain follow-up', 'Annual checkup', 'Back pain', 'Child vaccination', 'Headaches', 'Blood pressure review'];
        $today    = ['completed', 'completed', 'confirmed', 'confirmed', 'scheduled', 'scheduled', 'in_progress', 'cancelled'];

        mt_srand(2024); // fixed seed: dates look random but the demo data is repeatable

        $this->history($doctors, $patients);

        foreach ($doctors as $di => $doctor) {
            foreach ($today as $i => $status) {
                if (($i + $di) % 3 === 0) continue;
                $this->make($doctor, $patients[($i + $di) % $patients->count()], Carbon::today(), 8 + $i, $status, $reasons[($i + $di) % 6]);
            }
            for ($d = 1; $d <= 7; $d++) {
                $this->make($doctor, $patients[($d + $di) % $patients->count()], Carbon::today()->addDays($d), 9 + ($d % 6), $d % 2 ? 'confirmed' : 'scheduled', $reasons[($d + $di) % 6]);
            }
        }

        $this->backdateTimestamps();
    }

    private function make($doctor, $patient, Carbon $date, int $hour, string $status, string $reason): void
    {
        Appointment::create([
            'patient_id' => $patient->id, 'doctor_id' => $doctor->id, 'department_id' => $doctor->department_id,
            'appointment_date' => $date->toDateString(), 'appointment_time' => sprintf('%02d:%02d:00', $hour, $hour % 2 ? 30 : 0),
            'duration_minutes' => 30, 'status' => $status, 'reason' => $reason, 'fee' => $doctor->consultation_fee,
            'payment_status' => 'pending',
        ]);
    }

    // Completed visits with a record, prescription and paid invoice in each of the last 5 months
    private function history($doctors, $patients): void
    {
        $cases = [
            ['Chest tightness on exertion', 'Stable angina, mild', 'Lifestyle changes and low-dose aspirin.', 'Aspirin', '75mg'],
            ['Persistent lower back pain', 'Lumbar muscle strain', 'Physiotherapy twice weekly, avoid heavy lifting.', 'Ibuprofen', '400mg'],
            ['Fever and sore throat', 'Acute tonsillitis', 'Antibiotic course and rest.', 'Amoxicillin', '500mg'],
            ['Recurring headaches', 'Tension-type headache', 'Hydration, sleep hygiene, follow up in 4 weeks.', 'Paracetamol', '500mg'],
            ['Routine child checkup', 'Healthy, vaccinations up to date', 'Next checkup in 6 months.', 'Vitamin D', '1000 IU'],
        ];
        $n = 0;

        for ($m = 5; $m >= 1; $m--) {
            foreach ($doctors as $di => $doctor) {
                for ($k = 0, $visits = mt_rand(2, 5); $k < $visits; $k++) {
                    $date    = Carbon::today()->subMonths($m)->startOfMonth()->addDays(mt_rand(1, 26));
                    $patient = $patients[($n + $di) % $patients->count()];
                    $case    = $cases[$n % count($cases)];
                    $n++;

                    $appt = Appointment::create([
                        'patient_id' => $patient->id, 'doctor_id' => $doctor->id, 'department_id' => $doctor->department_id,
                        'appointment_date' => $date->toDateString(), 'appointment_time' => sprintf('%02d:00:00', 8 + $n % 8),
                        'duration_minutes' => 30, 'status' => 'completed', 'reason' => $case[0],
                        'fee' => $doctor->consultation_fee, 'payment_status' => 'paid',
                    ]);

                    $record = MedicalRecord::create([
                        'patient_id' => $patient->id, 'doctor_id' => $doctor->id, 'appointment_id' => $appt->id,
                        'visit_date' => $date->toDateString(), 'chief_complaint' => $case[0], 'diagnosis' => $case[1],
                        'treatment_plan' => $case[2],
                        'vital_signs' => ['blood_pressure' => '120/80', 'temperature' => 37.0, 'pulse' => 70 + $n % 12, 'weight' => 60 + $n % 25],
                    ]);

                    Prescription::create([
                        'medical_record_id' => $record->id, 'patient_id' => $patient->id, 'doctor_id' => $doctor->id,
                        'prescribed_date' => $date->toDateString(), 'valid_until' => $date->copy()->addDays(14),
                        'medications' => [['name' => $case[3], 'dosage' => $case[4], 'frequency' => 'Twice daily', 'duration' => '7 days']],
                        'instructions' => 'Take after meals.',
                    ]);

                    // a few recent visits are still unpaid
                    $unpaid = $m <= 2 && mt_rand(1, 100) <= 40;
                    $appt->update(['payment_status' => $unpaid ? 'pending' : 'paid']);

                    $invoice = Invoice::create([
                        'invoice_number' => Invoice::generateNumber(), 'patient_id' => $patient->id, 'appointment_id' => $appt->id,
                        'subtotal' => $appt->fee, 'discount' => 0, 'total' => $appt->fee, 'status' => $unpaid ? 'unpaid' : 'paid',
                        'payment_method' => $unpaid ? null : ['cash', 'card', 'insurance'][$n % 3],
                        'items' => [['description' => 'Consultation Fee', 'amount' => $appt->fee]],
                        'due_date' => $date->copy()->addDays(7), 'paid_at' => $unpaid ? null : $date->copy()->addDays(mt_rand(0, 5)),
                    ]);
                }
            }
        }
    }

    // Spread created_at over a realistic span so nothing is stamped "today"
    private function backdateTimestamps(): void
    {
        $rand = fn (Carbon $from, int $minDays, int $maxDays) => $from->copy()->subDays(mt_rand($minDays, $maxDays))->setTime(mt_rand(8, 17), mt_rand(0, 59));

        foreach (['users', 'patients', 'doctors'] as $table) {
            foreach (DB::table($table)->pluck('id') as $id) {
                $t = $rand(Carbon::today(), 200, 900);
                DB::table($table)->where('id', $id)->update(['created_at' => $t, 'updated_at' => $t]);
            }
        }
        foreach (Appointment::all() as $a) {
            $t = $rand(Carbon::parse($a->appointment_date), 1, 14);
            DB::table('appointments')->where('id', $a->id)->update(['created_at' => $t, 'updated_at' => $t]);
        }
        foreach (MedicalRecord::all() as $r) {
            $t = Carbon::parse($r->visit_date)->setTime(mt_rand(8, 17), mt_rand(0, 59));
            DB::table('medical_records')->where('id', $r->id)->update(['created_at' => $t, 'updated_at' => $t]);
        }
        foreach (Invoice::with('appointment')->get() as $inv) {
            $t = Carbon::parse($inv->appointment->appointment_date)->setTime(mt_rand(9, 18), mt_rand(0, 59));
            DB::table('invoices')->where('id', $inv->id)->update(['created_at' => $t, 'updated_at' => $t]);
        }
    }
}
