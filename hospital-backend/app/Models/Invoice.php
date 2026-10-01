<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $fillable = [
        'invoice_number', 'patient_id', 'appointment_id', 'subtotal',
        'discount', 'total', 'status', 'payment_method', 'items', 'due_date', 'paid_at'
    ];
    protected $casts = [
        'items' => 'array',
        'due_date' => 'date',
        'paid_at' => 'datetime',
        'subtotal' => 'decimal:2',
        'discount' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    public function patient() { return $this->belongsTo(Patient::class); }
    public function appointment() { return $this->belongsTo(Appointment::class); }

    public static function generateNumber(): string
    {
        $last = static::orderByDesc('id')->first();
        $num  = $last ? (int) substr($last->invoice_number, 4) + 1 : 1;
        return 'INV-' . str_pad($num, 6, '0', STR_PAD_LEFT);
    }
}
