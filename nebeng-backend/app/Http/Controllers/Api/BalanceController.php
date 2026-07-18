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

            \DB::transaction(function () use ($balance, $request, $user) {

                // potong saldo
                $balance->decrement('balance', $request->amount);

                // catat transaksi
                \App\Models\BalanceTransaction::create([
                    'user_id' => $user->id,
                    'type' => 'debit',
                    'amount' => $request->amount,
                    'description' => 'Penarikan saldo'
                ]);
            });

            return response()->json([
                'message' => 'Withdraw berhasil'
            ]);
        }
}
