<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Department;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Appointment;
use App\Models\MedicalRecord;
use App\Models\Prescription;
use App\Models\Invoice;
use Carbon\Carbon;
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Departments ──────────────────────────────────────
        $departments = [
            ['name' => 'General Medicine',   'code' => 'GM',  'floor' => '1st', 'description' => 'Primary care and general health services'],
            ['name' => 'Cardiology',          'code' => 'CAR', 'floor' => '2nd', 'description' => 'Heart and cardiovascular care'],
            ['name' => 'Orthopedics',         'code' => 'ORT', 'floor' => '2nd', 'description' => 'Bone, joint and muscle disorders'],
            ['name' => 'Pediatrics',          'code' => 'PED', 'floor' => '3rd', 'description' => 'Healthcare for children and adolescents'],
            ['name' => 'Neurology',           'code' => 'NEU', 'floor' => '3rd', 'description' => 'Brain and nervous system disorders'],
            ['name' => 'Dermatology',         'code' => 'DER', 'floor' => '4th', 'description' => 'Skin, hair and nail conditions'],
            ['name' => 'Ophthalmology',       'code' => 'OPH', 'floor' => '4th', 'description' => 'Eye care and vision services'],
            ['name' => 'Emergency',           'code' => 'EMR', 'floor' => 'G',   'description' => '24/7 emergency care'],
        ];

        $deptModels = [];
        foreach ($departments as $d) {
            $deptModels[] = Department::create($d);
        }

        // ── Admin User ───────────────────────────────────────
        User::create([
            'name'     => 'Dr. Ahmad Hassan',
            'email'    => 'admin@hospital.com',
            'password' => Hash::make('password'),
            'role'     => 'admin',
            'phone'    => '+964 750 100 0001',
        ]);

        // ── Receptionist ─────────────────────────────────────
        User::create([
            'name'     => 'Sara Khalid',
            'email'    => 'receptionist@hospital.com',
            'password' => Hash::make('password'),
            'role'     => 'receptionist',
            'phone'    => '+964 750 100 0002',
        ]);

        // ── Doctors ──────────────────────────────────────────
        $doctorData = [
            ['name' => 'Dr. Omar Aziz',    'email' => 'dr.omar@hospital.com',    'specialty' => 'General Physician', 'dept' => 0, 'fee' => 50000, 'exp' => 12, 'days' => ['Monday','Tuesday','Wednesday','Thursday','Sunday']],
            ['name' => 'Dr. Layla Hassan', 'email' => 'dr.layla@hospital.com',   'specialty' => 'Cardiologist',      'dept' => 1, 'fee' => 80000, 'exp' => 15, 'days' => ['Monday','Wednesday','Thursday','Saturday']],
            ['name' => 'Dr. Karwan Ali',   'email' => 'dr.karwan@hospital.com',  'specialty' => 'Orthopedic Surgeon','dept' => 2, 'fee' => 75000, 'exp' => 10, 'days' => ['Sunday','Monday','Tuesday','Wednesday']],
            ['name' => 'Dr. Roza Mustafa', 'email' => 'dr.roza@hospital.com',    'specialty' => 'Pediatrician',      'dept' => 3, 'fee' => 55000, 'exp' => 8,  'days' => ['Monday','Tuesday','Wednesday','Thursday','Saturday']],
            ['name' => 'Dr. Soran Ibrahim','email' => 'dr.soran@hospital.com',   'specialty' => 'Neurologist',       'dept' => 4, 'fee' => 90000, 'exp' => 18, 'days' => ['Monday','Wednesday','Friday']],
        ];

        $doctorModels = [];
        foreach ($doctorData as $i => $d) {
            $user = User::create([
                'name'     => $d['name'],
                'email'    => $d['email'],
                'password' => Hash::make('password'),
                'role'     => 'doctor',
                'phone'    => '+964 750 20' . str_pad($i + 1, 4, '0', STR_PAD_LEFT),
            ]);
            $doctorModels[] = Doctor::create([
                'user_id'          => $user->id,
                'department_id'    => $deptModels[$d['dept']]->id,
                'specialty'        => $d['specialty'],
                'qualification'    => 'MBBS, MD',
                'experience_years' => $d['exp'],
                'consultation_fee' => $d['fee'],
                'license_number'   => 'IQ-' . str_pad(1000 + $i, 6, '0', STR_PAD_LEFT),
                'available_days'   => $d['days'],
                'shift_start'      => '08:00:00',
                'shift_end'        => '16:00:00',
            ]);
        }

        // ── Patients ─────────────────────────────────────────
        $patientData = [
            ['name' => 'Dashni Omar',   'email' => 'dashni@email.com',   'dob' => '1990-05-15', 'gender' => 'female', 'id' => 'IQ-P001', 'blood' => 'A+'],
            ['name' => 'Heval Saeed',   'email' => 'heval@email.com',    'dob' => '1985-09-22', 'gender' => 'male',   'id' => 'IQ-P002', 'blood' => 'O+'],
            ['name' => 'Zheen Bakr',    'email' => 'zheen@email.com',    'dob' => '1998-03-10', 'gender' => 'female', 'id' => 'IQ-P003', 'blood' => 'B+'],
            ['name' => 'Ari Mahmoud',   'email' => 'ari@email.com',      'dob' => '1975-11-28', 'gender' => 'male',   'id' => 'IQ-P004', 'blood' => 'AB+'],
            ['name' => 'Berivan Jalal', 'email' => 'berivan@email.com',  'dob' => '2001-07-04', 'gender' => 'female', 'id' => 'IQ-P005', 'blood' => 'A-'],
            ['name' => 'Kardo Tahir',   'email' => 'kardo@email.com',    'dob' => '1995-12-19', 'gender' => 'male',   'id' => 'IQ-P006', 'blood' => 'O-'],
        ];

        $patientModels = [];
        foreach ($patientData as $p) {
            $user = User::create([
                'name'     => $p['name'],
                'email'    => $p['email'],
                'password' => Hash::make('password'),
                'role'     => 'patient',
            ]);
            $patientModels[] = Patient::create([
                'user_id'       => $user->id,
                'date_of_birth' => $p['dob'],
                'gender'        => $p['gender'],
                'blood_type'    => $p['blood'],
                'national_id'   => $p['id'],
                'address'       => '12 Riverside Avenue, Sample City',
            ]);
        }

        // ── Appointments ─────────────────────────────────────
        $statuses = ['completed', 'completed', 'completed', 'scheduled', 'confirmed', 'cancelled'];
        $apptModels = [];

        for ($i = 0; $i < 20; $i++) {
            $patient = $patientModels[$i % count($patientModels)];
            $doctor  = $doctorModels[$i % count($doctorModels)];
            $status  = $statuses[$i % count($statuses)];
            $date    = Carbon::now()->subDays(rand(0, 30));

            $apptModels[] = Appointment::create([
                'patient_id'       => $patient->id,
                'doctor_id'        => $doctor->id,
                'department_id'    => $doctor->department_id,
                'appointment_date' => $date->toDateString(),
                'appointment_time' => sprintf('%02d:00:00', rand(8, 15)),
                'duration_minutes' => 30,
                'status'           => $status,
                'reason'           => 'Routine checkup',
                'fee'              => $doctor->consultation_fee,
                'payment_status'   => $status === 'completed' ? 'paid' : 'pending',
            ]);
        }

        // ── Medical Records & Prescriptions ──────────────────
        foreach ($apptModels as $appt) {
            if ($appt->status !== 'completed') continue;

            $record = MedicalRecord::create([
                'patient_id'      => $appt->patient_id,
                'doctor_id'       => $appt->doctor_id,
                'appointment_id'  => $appt->id,
                'visit_date'      => $appt->appointment_date,
                'chief_complaint' => 'Patient reports general discomfort and fatigue.',
                'diagnosis'       => 'Minor viral infection, rest recommended.',
                'treatment_plan'  => 'Prescribed antibiotics and rest for 5 days.',
                'vital_signs'     => ['blood_pressure' => '120/80', 'temperature' => 37.2, 'pulse' => 72, 'weight' => 70],
            ]);

            Prescription::create([
                'medical_record_id' => $record->id,
                'patient_id'        => $appt->patient_id,
                'doctor_id'         => $appt->doctor_id,
                'prescribed_date'   => $appt->appointment_date,
                'valid_until'       => Carbon::parse($appt->appointment_date)->addDays(14),
                'medications'       => [
                    ['name' => 'Amoxicillin', 'dosage' => '500mg', 'frequency' => '3x daily', 'duration' => '7 days'],
                    ['name' => 'Paracetamol', 'dosage' => '500mg', 'frequency' => 'As needed', 'duration' => '5 days'],
                ],
                'instructions' => 'Take with food. Drink plenty of water.',
            ]);

            Invoice::create([
                'invoice_number' => Invoice::generateNumber(),
                'patient_id'     => $appt->patient_id,
                'appointment_id' => $appt->id,
                'subtotal'       => $appt->fee,
                'discount'       => 0,
                'total'          => $appt->fee,
                'status'         => 'paid',
                'payment_method' => 'cash',
                'items'          => [['description' => 'Consultation Fee', 'amount' => $appt->fee]],
                'due_date'       => Carbon::parse($appt->appointment_date)->addDays(7),
                'paid_at'        => $appt->appointment_date,
            ]);
        }

        $this->call(DemoDataSeeder::class);

        $this->command->info('✅ Hospital database seeded successfully!');
        $this->command->table(
            ['Role', 'Email', 'Password'],
            [
                ['Admin',         'admin@hospital.com',        'password'],
                ['Receptionist',  'receptionist@hospital.com', 'password'],
                ['Doctor',        'dr.omar@hospital.com',      'password'],
                ['Patient',       'dashni@email.com',          'password'],
            ]
        );
    }
}
