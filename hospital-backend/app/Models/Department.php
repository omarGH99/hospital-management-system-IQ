<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    protected $fillable = ['name', 'code', 'description', 'head_doctor', 'floor', 'is_active'];
    protected $casts = ['is_active' => 'boolean'];

    public function doctors() { return $this->hasMany(Doctor::class); }
    public function appointments() { return $this->hasMany(Appointment::class); }
}