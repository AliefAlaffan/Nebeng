<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Verification;
use App\Models\VerificationFile;
use Illuminate\Support\Facades\Storage;
use App\Models\UserProfile;
use App\Models\User;
use App\Models\Vehicle;
use App\Services\NotificationService;

class VerificationController extends Controller
{
    // 🔹 GET status verifikasi user
    public function status(Request $request)
    {
        $verification = Verification::with('files')
            ->where('user_id', $request->user()->id)
            ->latest()
            ->first();

        return response()->json($verification);
    }

    // 🔹 SUBMIT verifikasi
    public function store(Request $request)
    {
        $request->validate([

            // ======================
            // BASIC
            // ======================
            'type' => 'required|string|in:customer,mitra',

            // ======================
            // FILES
            // ======================
            'face' => 'required|image|max:5120',
            'ktp' => 'required|image|max:5120',
            'selfie_ktp' => 'required|image|max:5120',

            // ======================
            // DATA KTP
            // ======================
            'full_name' => 'required|string|max:255',
            'nik' => 'required|string|max:255',
            'birth_place' => 'required|string|max:255',
            'birth_date' => 'required|date',
            'gender' => 'required|string|max:255',
            'religion' => 'required|string|max:255',
            'address' => 'required|string',

        ]);

        $user = $request->user();

        // =========================
        // CEK VERIFIKASI PENDING
        // =========================
        $existing = Verification::where('user_id', $user->id)
            ->where('status', 'pending')
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'Masih ada verifikasi yang diproses'
            ], 400);
        }

        // =========================
        // VALIDASI KHUSUS MITRA
        // =========================
        if ($request->type === 'mitra') {

            $request->validate([

                // FILES
                'sim' => 'required|image|max:10120',
                'skck' => 'required|image|max:10120',
                'bank' => 'required|image|max:10120',

                // BANK
                'bank_name' => 'required|string|max:255',
                'bank_account_name' => 'required|string|max:255',
                'bank_account_number' => 'required|string|max:255',

                // DATA KENDARAAN
                'vehicle_type' => 'required|string|in:motor,mobil',
                'vehicle_brand' => 'required|string|max:255',
                'vehicle_model' => 'required|string|max:255',
                'vehicle_plate' => 'required|string|max:255',
                'vehicle_color' => 'required|string|max:255',
                'vehicle_seat_capacity' => 'required|integer|min:1|max:20',
            ]);
        }

        // =========================
        // UPDATE STATUS USER
        // =========================
        $user->update([
            'status' => 'pending'
        ]);

        // =========================
        // SIMPAN PROFILE
        // =========================
        UserProfile::updateOrCreate(
            ['user_id' => $user->id],
            [

                // DATA DIRI
                'full_name' => $request->full_name,
                'nik' => $request->nik,
                'birth_place' => $request->birth_place,
                'birth_date' => $request->birth_date,
                'gender' => $request->gender,
                'religion' => $request->religion,
                'address' => $request->address,

                // BANK
                'bank_name' => $request->bank_name,
                'bank_account_name' => $request->bank_account_name,
                'bank_account_number' => $request->bank_account_number,
            ]
        );

        // =========================
        // SIMPAN DATA KENDARAAN (khusus mitra)
        // =========================
        if ($request->type === 'mitra') {
            Vehicle::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'vehicle_type' => $request->vehicle_type,
                    'brand' => $request->vehicle_brand,
                    'model' => $request->vehicle_model,
                    'plate_number' => $request->vehicle_plate,
                    'color' => $request->vehicle_color,
                    // Motor cuma bisa angkut 1 penumpang, berapa pun yang diinput
                    'seat_capacity' => $request->vehicle_type === 'motor' ? 1 : $request->vehicle_seat_capacity,
                ]
            );
        }

        // =========================
        // CREATE VERIFICATION
        // =========================
        $verification = Verification::create([
            'user_id' => $user->id,
            'type' => $request->type,
            'status' => 'pending'
        ]);

        // =========================
        // FILE TYPES
        // =========================
        $files = [
            'face',
            'ktp',
            'selfie_ktp'
        ];

        // tambah file khusus mitra
        if ($request->type === 'mitra') {

            $files = array_merge($files, [
                'sim',
                'skck',
                'bank'
            ]);
        }

        // =========================
        // UPLOAD FILES
        // =========================
        foreach ($files as $fileType) {

            if ($request->hasFile($fileType)) {

                $path = $request->file($fileType)
                    ->store('verifications', 'public');

                VerificationFile::create([
                    'verification_id' => $verification->id,
                    'file_type' => $fileType,
                    'file_path' => $path
                ]);
            }
        }

        $this->notifyAdmins($user->name, $request->type);

        return response()->json([
            'message' => 'Verifikasi berhasil dikirim',
            'data' => $verification
        ]);
    }

    // Kirim notifikasi ke semua admin saat ada pengajuan verifikasi baru
    private function notifyAdmins($userName, $type)
    {
        $adminIds = User::where('role', 'admin')->pluck('id')->toArray();

        NotificationService::sendToMany(
            $adminIds,
            'Pengajuan Verifikasi Baru',
            "{$userName} mengajukan verifikasi akun " . ($type === 'mitra' ? 'mitra' : 'customer') . '.',
            'verification',
            $type === 'mitra' ? '/admin/verifikasi-mitra' : '/admin/verifikasi-customer'
        );
    }

    public function approve($id)
    {
        $verification = Verification::findOrFail($id);

        // update status verification
        $verification->update([
            'status' => 'verified'
        ]);

        // update status user
        User::where('id', $verification->user_id)
            ->update([
                'status' => 'verified'
            ]);

        NotificationService::send(
            $verification->user_id,
            'Verifikasi Disetujui',
            $verification->type === 'mitra'
                ? 'Selamat! Akun mitra kamu sudah terverifikasi. Kamu sekarang bisa membuat tebengan.'
                : 'Selamat! Akun kamu sudah terverifikasi.',
            'verification',
            $verification->type === 'mitra' ? '/mitra/dashboard' : '/customer/dashboard'
        );

        return response()->json([
            'message' => 'User berhasil diverifikasi'
        ]);
    }
}