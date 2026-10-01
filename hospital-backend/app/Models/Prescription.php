<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Prescription extends Model
{
    protected $fillable = [
        'medical_record_id', 'patient_id', 'doctor_id',
        'prescribed_date', 'valid_until', 'medications', 'instructions', 'status'
    ];
    protected $casts = [
        'prescribed_date' => 'date',
        'valid_until' => 'date',
        'medications' => 'array'
    ];

    public function patient() { return $this->belongsTo(Patient::class); }
    public function doctor() { return $this->belongsTo(Doctor::class); }
    public function medicalRecord() { return $this->belongsTo(MedicalRecord::class); }
}