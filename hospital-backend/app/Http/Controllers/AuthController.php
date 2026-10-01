<?php
namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Doctor;
use App\Models\Patient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        if (! $user->is_active) {
            return response()->json(['message' => 'Account is deactivated.'], 403);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        // Load role-specific data
        $profile = null;
        if ($user->isDoctor()) {
            $profile = $user->doctor()->with('department')->first();
        } elseif ($user->isPatient()) {
            $profile = $user->patient()->first();
        }

        return response()->json([
            'user'    => $user,
            'profile' => $profile,
            'token'   => $token,
            'message' => 'Login successful',
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        $profile = null;

        if ($user->isDoctor()) {
            $profile = $user->doctor()->with('department')->first();
        } elseif ($user->isPatient()) {
            $profile = $user->patient()->first();
        }

        return response()->json(['user' => $user, 'profile' => $profile]);
    }

    public function register(Request $request)
    {
        $request->validate([
            'name'        => 'required|string|max:255',
            'email'       => 'required|email|unique:users',
            'password'    => 'required|string|min:8|confirmed',
            'phone'       => 'nullable|string',
            'national_id' => 'required|string|unique:patients',
            'date_of_birth' => 'required|date',
            'gender'      => 'required|in:male,female',
            'address'     => 'required|string',
        ]);

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => 'patient',
            'phone'    => $request->phone,
        ]);

        Patient::create([
            'user_id'       => $user->id,
            'national_id'   => $request->national_id,
            'date_of_birth' => $request->date_of_birth,
            'gender'        => $request->gender,
            'address'       => $request->address,
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user'    => $user,
            'token'   => $token,
            'message' => 'Registration successful',
        ], 201);
    }
}
