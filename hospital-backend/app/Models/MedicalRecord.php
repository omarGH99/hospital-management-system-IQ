<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class MedicalRecord extends Model
{
    protected $fillable = [
        'patient_id', 'doctor_id', 'appointment_id', 'visit_date',
        'chief_complaint', 'diagnosis', 'treatment_plan', 'notes', 'vital_signs'
    ];
    protected $casts = ['visit_date' => 'date', 'vital_signs' => 'array'];

    public function patient() { return $this->belongsTo(Patient::class); }
    public function doctor() { return $this->belongsTo(Doctor::class); }
    public function appointment() { return $this->belongsTo(Appointment::class); }
    public function prescriptions() { return $this->hasMany(Prescription::class); }
}