<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'fullName' => 'required|string|max:255',
            'email' => [
                    'required',
                    'email',
                    'regex:/^[a-zA-Z0-9._%+-]+@gmail\.com$/',
                    'unique:users,email'
                ],
            'phone' => 'required|string|max:20|unique:users,phone',
            'role' => 'required|in:customer,mitra',
            'password' => 'required|min:6|confirmed'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        // ================= ROLE & STATUS =================

        $role = $request->role;

        $status = 'unverified';

        // ================= CREATE USER =================

        $user = User::create([
            'name' => $request->fullName,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'role' => $role,
            'status' => $status
        ]);

        $token = $user->createToken('nebeng_token')->plainTextToken;

        return response()->json([
            'status' => true,
            'message' => 'Register berhasil',
            'token' => $token,
            'user' => $user
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'status' => false,
                'message' => 'Email atau password salah'
            ], 401);
        }

        $user = Auth::user();

        if ($user->status === 'blocked') {
            return response()->json([
                'message' => 'Akun anda diblokir oleh admin'
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status' => true,
            'message' => 'Login berhasil',
            'token' => $token,
            'user' => $user
        ]);
    }
}