<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Trip;
use App\Models\TripTracking;
use Illuminate\Http\Request;

class TripJourneyController extends Controller
{
    // =============================
    // GET JOURNEY DETAIL
    // =============================
    public function show($id)
    {
        $trip = Trip::with([
            'originPoint',
            'destinationPoint',
            'mitra',
            'orders'
        ])->findOrFail($id);

        $latestTracking = TripTracking::where('trip_id', $id)
            ->latest('tracked_at')
            ->first();

        return response()->json([
            'trip' => $trip,
            'origin_point' => $trip->originPoint,
            'destination_point' => $trip->destinationPoint,
            'latest_tracking' => $latestTracking,
        ]);
    }

    // =============================
    // UPDATE GPS TRACKING
    // =============================
    public function updateTracking(Request $request, $id)
    {
        $trip = Trip::findOrFail($id);

        if ($trip->status !== 'on_the_way') {
            return response()->json([
                'message' => 'Trip belum dimulai'
            ], 400);
        }

        $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
        ]);

        $tracking = TripTracking::create([
            'trip_id' => $trip->id,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'tracked_at' => now(),
        ]);

        return response()->json([
            'message' => 'Tracking updated',
            'data' => $tracking
        ]);
    }

    // =============================
    // GET LATEST LOCATION
    // =============================
    public function latestLocation($id)
    {
        $latestTracking = TripTracking::where('trip_id', $id)
            ->latest('tracked_at')
            ->first();

        if (!$latestTracking) {
            return response()->json([
                'message' => 'Belum ada tracking'
            ], 404);
        }

        return response()->json($latestTracking);
    }

    // =============================
    // UPDATE STATUS TRIP
    // =============================
    public function updateStatus(Request $request, $id)
    {
        $trip = Trip::with('orders')->findOrFail($id);

        $request->validate([
            'status' => 'required|string'
        ]);

        $allowedStatuses = [
            'waiting_departure',
            'on_the_way',
            'arrived_destination',
            'completed',
            'cancelled'
        ];

        if (!in_array($request->status, $allowedStatuses)) {
            return response()->json([
                'message' => 'Status tidak valid'
            ], 400);
        }

        // =====================================
        // CEGAH KEBERANGKATAN TANPA CUSTOMER
        // =====================================
        // Tidak masuk akal mitra berangkat/membawa
        // sesuatu jika belum ada satupun pesanan
        // (penumpang/pengirim barang) pada trip ini.
        if (
            $request->status === 'waiting_departure' &&
            $trip->orders->count() === 0
        ) {
            return response()->json([
                'message' => 'Belum ada customer yang memesan tebengan ini. Tunggu hingga ada pesanan sebelum berangkat.'
            ], 422);
        }

        $trip->status = $request->status;
        $trip->save();

        // Jika trip selesai
        if ($request->status === 'completed') {

            foreach ($trip->orders as $order) {
                $order->status = 'completed';
                $order->save();
            }
        }

        return response()->json([
            'message' => 'Status updated',
            'trip' => $trip
        ]);
    }
}