<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class PasswordController extends Controller
{
    public function updatePassword(Request $request)
    {
        try {

            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'message' => 'Unauthorized'
                ], 401);
            }

            $request->validate([
                'old_password' => 'required',
                'new_password' => 'required|min:8|confirmed'
            ]);

            if (!Hash::check($request->old_password, $user->password)) {
                return response()->json([
                    'message' => 'Password lama salah'
                ], 400);
            }

            $user->password = Hash::make($request->new_password);
            $user->save();

            return response()->json([
                'message' => 'Password berhasil diperbarui'
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'message' => 'Update password error',
                'error' => $e->getMessage()
            ], 500);

        }
    }
}