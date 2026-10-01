<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Patient extends Model
{
    protected $fillable = [
        'user_id', 'date_of_birth', 'gender', 'blood_type', 'national_id',
        'address', 'emergency_contact_name', 'emergency_contact_phone',
        'allergies', 'medical_history'
    ];
    protected $casts = ['date_of_birth' => 'date'];

    public function user() { return $this->belongsTo(User::class); }
    public function appointments() { return $this->hasMany(Appointment::class); }
    public function medicalRecords() { return $this->hasMany(MedicalRecord::class); }
    public function prescriptions() { return $this->hasMany(Prescription::class); }
    public function invoices() { return $this->hasMany(Invoice::class); }
}