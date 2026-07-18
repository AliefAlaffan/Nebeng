<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\UserProfile;

class ProfileController extends Controller
{
    // ===============================
    // GET PROFILE USER + PROFILE DATA
    // ===============================
    public function me(Request $request)
    {
        $user = $request->user()->load('profile');

        return response()->json($user);
    }

    public function show(Request $request)
    {
        $user = $request->user()->load('profile');

        return response()->json($user);
    }

    // ===============================
    // UPDATE PROFILE
    // ===============================
    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'phone' => 'required|string|max:20',
            'avatar' => 'nullable|image|max:2048',

            'full_name' => 'nullable|string|max:255',
            'birth_place' => 'nullable|string|max:255',
            'birth_date' => 'nullable|date',
            'gender' => 'nullable|string|max:50',

            'nik' => 'nullable|string|max:30',
            'religion' => 'nullable|string|max:50',
            'address' => 'nullable|string',
        ]);

        // upload avatar
        if ($request->hasFile('avatar')) {

            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }

            $path = $request->file('avatar')->store('avatars', 'public');
            $validated['avatar'] = $path;
        }

        // update tabel users
        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'avatar' => $validated['avatar'] ?? $user->avatar,
        ]);

        // update / create user_profiles
        UserProfile::updateOrCreate(
            ['user_id' => $user->id],
            [
                'full_name'   => $validated['full_name'] ?? null,
                'birth_place' => $validated['birth_place'] ?? null,
                'birth_date'  => $validated['birth_date'] ?? null,
                'gender'      => $validated['gender'] ?? null,

                'nik'         => $validated['nik'] ?? null,
                'religion'    => $validated['religion'] ?? null,
                'address'     => $validated['address'] ?? null,
            ]
        );

        return response()->json([
            'message' => 'Profil berhasil diperbarui',
            'user' => $user->load('profile')
        ]);
    }
}