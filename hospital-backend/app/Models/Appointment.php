<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    protected $fillable = [
        'patient_id', 'doctor_id', 'department_id', 'appointment_date',
        'appointment_time', 'duration_minutes', 'status', 'reason',
        'notes', 'fee', 'payment_status'
    ];
    protected $casts = ['appointment_date' => 'date', 'fee' => 'decimal:2'];

    public function patient() { return $this->belongsTo(Patient::class); }
    public function doctor() { return $this->belongsTo(Doctor::class); }
    public function department() { return $this->belongsTo(Department::class); }
    public function medicalRecord() { return $this->hasOne(MedicalRecord::class); }
    public function invoice() { return $this->hasOne(Invoice::class); }

    public function scopeToday($q) { return $q->whereDate('appointment_date', today()); }
}