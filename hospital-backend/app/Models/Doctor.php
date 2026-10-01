<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Doctor extends Model
{
    protected $fillable = [
        'user_id', 'department_id', 'specialty', 'qualification',
        'experience_years', 'consultation_fee', 'license_number',
        'available_days', 'shift_start', 'shift_end', 'bio'
    ];
    protected $casts = ['available_days' => 'array', 'consultation_fee' => 'decimal:2'];

    public function user() { return $this->belongsTo(User::class); }
    public function department() { return $this->belongsTo(Department::class); }
    public function appointments() { return $this->hasMany(Appointment::class); }
    public function medicalRecords() { return $this->hasMany(MedicalRecord::class); }
    public function prescriptions() { return $this->hasMany(Prescription::class); }
}