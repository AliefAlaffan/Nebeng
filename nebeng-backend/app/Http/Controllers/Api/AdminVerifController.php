<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class AdminVerifController extends Controller
{
    // =============================
    // 1. GET MITRA PENDING
    // =============================
    public function pending()
    {
        $mitra = User::where('role', 'mitra')
            ->where('status', 'pending')
            ->latest()
            ->get();

        return response()->json($mitra);
    }

    // =============================
    // 2. GET DETAIL MITRA
    // =============================
    public function show($id)
    {
        $mitra = User::where('role', 'mitra')
            ->findOrFail($id);

        return response()->json($mitra);
    }

    // =============================
    // 3. APPROVE MITRA
    // =============================
    public function approve($id)
    {
        $mitra = User::findOrFail($id);

        $mitra->status = 'verified';
        $mitra->save();

        return response()->json([
            'message' => 'Mitra berhasil diverifikasi'
        ]);
    }

    // =============================
    // 4. REJECT / BLOKIR MITRA
    // =============================
    public function reject($id)
    {
        $mitra = User::findOrFail($id);

        $mitra->status = 'rejected';
        $mitra->save();

        return response()->json([
            'message' => 'Mitra berhasil diblokir'
        ]);
    }

    // =============================
    // GET CUSTOMER PENDING
    // =============================
    public function pendingCustomer()
    {
        $customers = User::where('role', 'customer')
            ->where('status', 'pending')
            ->latest()
            ->get();

        return response()->json($customers);
    }

    // =============================
    // BLOKIR CUSTOMER
    // =============================
    public function rejectCustomer($id)
    {
        $user = User::findOrFail($id);

        $user->status = 'rejected';
        $user->save();

        return response()->json([
            'message' => 'Customer berhasil diblokir'
        ]);
    }
    
}