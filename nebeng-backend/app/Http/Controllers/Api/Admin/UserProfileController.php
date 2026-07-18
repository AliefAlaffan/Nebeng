<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Http\Request;

class UserProfileController extends Controller
{
    public function show($id)
    {
        $user = User::with([
            'profile',
            'verification.files'
        ])->findOrFail($id);

       return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
            'status' => $user->status,

            'profile' => [
                'full_name'   => $user->profile->full_name ?? '',
                'birth_place' => $user->profile->birth_place ?? '',
                'birth_date'  => $user->profile->birth_date ?? '',
                'gender'      => $user->profile->gender ?? '',

                'nik' => $user->profile->nik ?? '',
                'religion' => $user->profile->religion ?? '',
                'address' => $user->profile->address ?? '',
                'bank_name' => $user->profile->bank_name ?? '',
                'bank_account_name' => $user->profile->bank_account_name ?? '',
                'bank_account_number' => $user->profile->bank_account_number ?? '',
            ],

            'verification' => $user->verification ? [
                'id' => $user->verification->id,
                'type' => $user->verification->type,
                'status' => $user->verification->status,
                'notes' => $user->verification->notes,

                'files' => $user->verification->files->map(function ($file) {
                    return [
                        'id' => $file->id,
                        'file_type' => $file->file_type,
                        'file_path' => asset('storage/' . $file->file_path),
                    ];
                }),
            ] : null
        ]);
    }

    public function storeOrUpdate(Request $request, $id)
    {
        $request->validate([
            'full_name'   => 'required',
            'birth_place' => 'required',
            'birth_date'  => 'required|date',
            'gender'      => 'required',
        ]);

        $profile = UserProfile::updateOrCreate(
            ['user_id' => $id],
            [
                'full_name'   => $request->full_name,
                'birth_place' => $request->birth_place,
                'birth_date'  => $request->birth_date,
                'gender'      => $request->gender,
            ]
        );

        return response()->json([
            'message' => 'Profile saved',
            'data' => $profile
        ]);
    }
}