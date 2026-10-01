<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DoctorController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\MedicalRecordController;
use App\Http\Controllers\PrescriptionController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\DashboardController;

Route::post('/auth/login',    [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);

// ── Protected Routes ────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);

    // Doctors
    Route::get('/doctors',               [DoctorController::class, 'index']);
    Route::get('/doctors/{doctor}',      [DoctorController::class, 'show']);
    Route::get('/doctor/dashboard',      [DoctorController::class, 'dashboard']);
    Route::get('/doctors/{doctor}/slots', [AppointmentController::class, 'availableSlots']);

    Route::middleware('role:admin')->group(function () {
        Route::post('/doctors',            [DoctorController::class, 'store']);
        Route::put('/doctors/{doctor}',    [DoctorController::class, 'update']);
    });

    Route::get('/departments', fn () => \App\Models\Department::where('is_active', true)->orderBy('name')->get(['id', 'name']));

    // Patients
    Route::get('/patients',                        [PatientController::class, 'index']);
    Route::get('/patients/{patient}',              [PatientController::class, 'show']);
    Route::get('/patients/{patient}/history',      [PatientController::class, 'medicalHistory']);

    // Appointments
    Route::get('/appointments',                        [AppointmentController::class, 'index']);
    Route::post('/appointments',                       [AppointmentController::class, 'store']);
    Route::get('/appointments/stats',                  [AppointmentController::class, 'stats']);
    Route::get('/appointments/{appointment}',          [AppointmentController::class, 'show']);
    Route::patch('/appointments/{appointment}/status', [AppointmentController::class, 'updateStatus']);

    // Medical Records
    Route::get('/medical-records',            [MedicalRecordController::class, 'index']);
    Route::post('/medical-records',           [MedicalRecordController::class, 'store']);
    Route::get('/medical-records/{record}',   [MedicalRecordController::class, 'show']);

    // Prescriptions
    Route::post('/prescriptions',                     [PrescriptionController::class, 'store']);
    Route::get('/prescriptions/{prescription}/pdf',   [PrescriptionController::class, 'downloadPdf']);

    // Invoices
    Route::get('/invoices',                          [InvoiceController::class, 'index']);
    Route::patch('/invoices/{invoice}/pay',          [InvoiceController::class, 'markPaid']);
    Route::get('/invoices/{invoice}/pdf',            [InvoiceController::class, 'downloadPdf']);

    // Dashboard stats (admin + reception)
    Route::middleware('role:admin,receptionist')->get('/dashboard/stats', [DashboardController::class, 'stats']);
});
