<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\RewardTransaction;
use Illuminate\Support\Facades\DB;

class RewardController extends Controller
{
    public function redeem(Request $request)
    {
        $request->validate([
            'points' => 'required|integer|min:1',
            'description' => 'nullable|string'
        ]);

        $user = $request->user();
        $points = $request->points;

        if ($user->reward_points < $points) {
            return response()->json([
                'message' => 'Poin tidak cukup'
            ], 400);
        }

        DB::transaction(function () use ($user, $points, $request) {

            // Kurangi total poin user
            $user->reward_points -= $points;
            $user->save();

            // Simpan history redeem
            RewardTransaction::create([
                'user_id' => $user->id,
                'type' => 'redeem',
                'points' => $points,
                'description' => $request->description ?? 'Penukaran poin'
            ]);

        });

        return response()->json([
            'message' => 'Redeem berhasil',
            'remaining_points' => $user->reward_points
        ]);
    }
}