<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Reward;
use App\Models\RewardTransaction;
use Illuminate\Support\Facades\DB;

class RewardController extends Controller
{
    /**
     * Daftar reward yang bisa ditukar (dipakai halaman Poin Hadiah).
     */
    public function index(Request $request)
    {
        $query = Reward::where('is_active', true);

        if ($search = $request->query('search')) {
            $query->where('title', 'like', "%{$search}%");
        }

        if ($category = $request->query('category')) {
            $query->where('category', $category);
        }

        $rewards = $query->orderBy('points_required')->get();

        return response()->json($rewards);
    }

    /**
     * Tukar poin dengan reward tertentu. Sekarang berbasis reward_id
     * (bukan poin mentah dari frontend lagi) supaya server yang menentukan
     * harga poin sebenarnya + validasi stok, bukan percaya begitu saja
     * angka yang dikirim client.
     */
    public function redeem(Request $request)
    {
        $request->validate([
            'reward_id' => 'required|exists:rewards,id',
        ]);

        $user = $request->user();
        $reward = Reward::findOrFail($request->reward_id);

        if (!$reward->is_active) {
            return response()->json([
                'message' => 'Reward ini sudah tidak tersedia.'
            ], 400);
        }

        if (!is_null($reward->stock) && $reward->stock <= 0) {
            return response()->json([
                'message' => 'Stok reward ini sudah habis.'
            ], 400);
        }

        if ($user->reward_points < $reward->points_required) {
            return response()->json([
                'message' => 'Poin kamu tidak cukup untuk menukar reward ini.'
            ], 400);
        }

        DB::transaction(function () use ($user, $reward) {
            $user->reward_points -= $reward->points_required;
            $user->save();

            if (!is_null($reward->stock)) {
                $reward->decrement('stock');
            }

            RewardTransaction::create([
                'user_id' => $user->id,
                'reward_id' => $reward->id,
                'type' => 'redeem',
                'points' => $reward->points_required,
                'description' => 'Penukaran: ' . $reward->title,
            ]);
        });

        return response()->json([
            'message' => 'Reward berhasil ditukar! Tim kami akan segera memprosesnya.',
            'remaining_points' => $user->fresh()->reward_points,
        ]);
    }
}