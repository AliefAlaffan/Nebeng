<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\DriverBalance;

class BalanceController extends Controller
{
    public function getBalance(Request $request)
    {
        $user = $request->user();

        // pastikan hanya mitra
        if ($user->role !== 'mitra') {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        $balance = DriverBalance::firstOrCreate(
            ['user_id' => $user->id],
            ['balance' => 0]
        );

        return response()->json([
            'balance' => $balance->balance
        ]);
    }

    public function history(Request $request)
    {
        $user = $request->user();

        $data = \App\Models\BalanceTransaction::where('user_id', $user->id)
            ->latest()
            ->get();

        return response()->json($data);
    }

    // Sebelumnya: saldo langsung kepotong begitu mitra submit PIN.
    // Sekarang: cuma bikin catatan permintaan penarikan berstatus
    // 'pending'. Saldo BELUM kepotong sampai admin approve
    // (lihat AdminBalanceController::approve()).
    public function withdraw(Request $request)
    {
        $request->validate([
            'amount' => 'required|integer|min:10000'
        ]);

        $user = $request->user();

        $balance = \App\Models\DriverBalance::where('user_id', $user->id)->first();

        if (!$balance || $balance->balance < $request->amount) {
            return response()->json([
                'message' => 'Saldo tidak cukup'
            ], 400);
        }

        // Cegah mitra ngajuin banyak permintaan pending sekaligus
        // (bisa numpuk klaim ke saldo yang sama sebelum admin sempat proses)
        $existingPending = \App\Models\BalanceTransaction::where('user_id', $user->id)
            ->where('type', 'debit')
            ->where('status', 'pending')
            ->exists();

        if ($existingPending) {
            return response()->json([
                'message' => 'Masih ada permintaan penarikan yang sedang diproses admin'
            ], 400);
        }

        $transaction = \App\Models\BalanceTransaction::create([
            'user_id' => $user->id,
            'type' => 'debit',
            'amount' => $request->amount,
            'description' => 'Penarikan saldo (menunggu verifikasi admin)',
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Permintaan penarikan berhasil dikirim, menunggu verifikasi admin',
            'data' => $transaction,
        ]);
    }
}