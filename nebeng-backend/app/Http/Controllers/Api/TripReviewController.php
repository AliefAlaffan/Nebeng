<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Trip;
use App\Models\TripReview;
use Illuminate\Http\Request;

class TripReviewController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'trip_id' => 'required|exists:trips,id',
            'rating' => 'required|integer|min:1|max:5',
            'review' => 'nullable|string|max:1000',
            'reviewed_user_id' => 'nullable|exists:users,id',
        ]);

        $authUser = auth()->user();

        $trip = Trip::findOrFail($request->trip_id);

        $isMitra = $authUser->id == $trip->mitra_id;

        // =========================
        // CUSTOMER -> MITRA
        // =========================
        if (!$isMitra) {

            $existing = TripReview::where('trip_id', $trip->id)
                ->where('customer_id', $authUser->id)
                ->where('mitra_id', $trip->mitra_id)
                ->first();

            if ($existing) {
                return response()->json([
                    'message' => 'Trip sudah pernah diberi rating'
                ], 422);
            }

            $review = TripReview::create([
                'trip_id' => $trip->id,
                'customer_id' => $authUser->id,
                'mitra_id' => $trip->mitra_id,
                'rating' => $request->rating,
                'review' => $request->review,
            ]);
        }

        // =========================
        // MITRA -> CUSTOMER
        // =========================
        else {

            if (!$request->reviewed_user_id) {
                return response()->json([
                    'message' => 'Customer tujuan wajib dipilih'
                ], 422);
            }

            $existing = TripReview::where('trip_id', $trip->id)
                ->where('customer_id', $request->reviewed_user_id)
                ->where('mitra_id', $authUser->id)
                ->first();

            if ($existing) {
                return response()->json([
                    'message' => 'Customer sudah pernah diberi rating'
                ], 422);
            }

            $review = TripReview::create([
                'trip_id' => $trip->id,

                // customer yang direview
                'customer_id' => $request->reviewed_user_id,

                // mitra reviewer
                'mitra_id' => $authUser->id,

                'rating' => $request->rating,
                'review' => $request->review,
            ]);
        }

        return response()->json([
            'message' => 'Review berhasil dikirim',
            'data' => $review
        ]);
    }
}