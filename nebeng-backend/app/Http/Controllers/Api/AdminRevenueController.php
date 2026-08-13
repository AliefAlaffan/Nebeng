<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BalanceTransaction;
use Illuminate\Http\Request;

class AdminRevenueController extends Controller
{
    /**
     * Laporan pendapatan platform, bisa difilter berdasarkan rentang
     * tanggal. Menggantikan fitur "saldo mitra + tarik saldo" karena
     * pembayaran sekarang pakai QRIS statis yang langsung masuk ke
     * e-wallet/rekening mitra sendiri - uang tidak pernah ditahan atau
     * ditarik lewat platform ini.
     */
    public function index(Request $request)
    {
        $query = BalanceTransaction::with(['user:id,name', 'order.trip'])
            ->where('type', 'credit');

        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->from);
        }

        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->to);
        }

        if ($request->filled('mitra_id')) {
            $query->where('user_id', $request->mitra_id);
        }

        $transactions = (clone $query)->orderByDesc('created_at')->paginate(15);

        $totalPendapatan = (clone $query)->sum('amount');

        return response()->json([
            'transactions' => $transactions,
            'total_pendapatan' => $totalPendapatan,
        ]);
    }
}