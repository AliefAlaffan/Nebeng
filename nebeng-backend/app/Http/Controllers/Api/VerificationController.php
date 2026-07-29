<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Verification;
use App\Models\VerificationFile;
use Illuminate\Support\Facades\Storage;
use App\Models\UserProfile;
use App\Models\User;
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
            'province' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'district' => 'nullable|string|max:255',
            'village' => 'nullable|string|max:255',

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
        // Catatan: data kendaraan (motor/mobil/barang) TIDAK divalidasi/disimpan
        // di sini. Itu dikirim terpisah oleh frontend ke
        // POST /api/mitra/vehicles (MitraVehicleController) setelah verifikasi
        // utama ini berhasil, dan tersimpan ke tabel `mitra_vehicles`
        // (bukan tabel `vehicles` lama yang terhubung ke `drivers` dan
        // tidak punya kolom user_id/vehicle_type/color sama sekali).
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
                'province' => $request->province,
                'city' => $request->city,
                'district' => $request->district,
                'village' => $request->village,

                // BANK
                'bank_name' => $request->bank_name,
                'bank_account_name' => $request->bank_account_name,
                'bank_account_number' => $request->bank_account_number,
            ]
        );

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

        // Notifikasi admin bersifat "nice to have" - jangan sampai proses
        // verifikasi utama (yang sudah berhasil disimpan di atas) ikut gagal
        // hanya karena ada masalah di sisi notifikasi (mis. migration tabel
        // `notifications` belum dijalankan).
        try {
            $this->notifyAdmins($user->name, $request->type);
        } catch (\Throwable $e) {
            \Log::warning('Gagal kirim notifikasi verifikasi baru: ' . $e->getMessage());
        }

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

        try {
            NotificationService::send(
                $verification->user_id,
                'Verifikasi Disetujui',
                $verification->type === 'mitra'
                    ? 'Selamat! Akun mitra kamu sudah terverifikasi. Kamu sekarang bisa membuat tebengan.'
                    : 'Selamat! Akun kamu sudah terverifikasi.',
                'verification',
                $verification->type === 'mitra' ? '/mitra/dashboard' : '/customer/dashboard'
            );
        } catch (\Throwable $e) {
            \Log::warning('Gagal kirim notifikasi persetujuan verifikasi: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'User berhasil diverifikasi'
        ]);
    }
}