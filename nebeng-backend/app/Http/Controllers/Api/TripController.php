<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Trip;
use Illuminate\Http\Request;
use App\Models\Users;
use App\Models\Order;
use App\Models\OrderQrSession;
use App\Models\TripQrSession;
use App\Models\PickupPoint;
use App\Services\Maps\OSRMService;
use App\Services\Pricing\TripPricingService;
use App\Models\DriverBalance;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;

class TripController extends Controller
{
    public function search(Request $request)
    {
        $request->validate([
            'origin_point_id' => 'required|exists:pickup_points,id',
            'destination_point_id' => 'required|exists:pickup_points,id',
            'date' => 'required|date',
        ]);

       $query = Trip::with([
            'originPoint.city',
            'destinationPoint.city',
            'mitra'
        ])
        ->where('origin_point_id', $request->origin_point_id)
        ->where('destination_point_id', $request->destination_point_id)
        ->whereDate('departure_date', $request->date)
        ->where('seat_available', '>', 0);

        // FILTER VEHICLE TYPE
        if (
            $request->filled('vehicle_type') &&
            $request->vehicle_type !== 'all'
        ) {
            $query->where(
                'vehicle_type',
                $request->vehicle_type
            );
        }

        $trips = $query
            ->orderBy('departure_time', 'asc')
            ->get();

        return response()->json($trips);
    }

    public function show($id)
    {
        $trip = Trip::with([
            'originPoint.city',
            'destinationPoint.city',
            'mitra',
            'orders.user',
            'orders.itemOrder'
        ])->findOrFail($id);

        return response()->json($trip);
    }

    public function store(
        Request $request,
        OSRMService $osrm,
        TripPricingService $pricingService
    )
    {
        try {

            $validated = $request->validate([

                'origin_point_id' =>
                    'required|exists:pickup_points,id',

                'destination_point_id' =>
                    'required|exists:pickup_points,id',

                'departure_date' => 'required|date|after_or_equal:today',

                'departure_time' => 'required',

                'seat_total' =>
                    'required|integer|min:1',

                'vehicle_type' => 'required',

                'tebengan_type' => 'nullable',

                'baggage_capacity' => 'nullable',

                // 🔥 BARU
                'max_cap' =>
                    'nullable|integer|min:1',
            ]);

            // ====================================
            // VALIDASI: KEBERANGKATAN MINIMAL 3 JAM DARI SEKARANG
            // ====================================
            $departureAt = Carbon::parse(
                $validated['departure_date'] . ' ' . $validated['departure_time']
            );

            if ($departureAt->lt(Carbon::now()->addHours(3))) {
                throw ValidationException::withMessages([
                    'departure_time' => 'Jadwal keberangkatan minimal 3 jam dari waktu sekarang.',
                ]);
            }

            // ====================================
            // AMBIL PICKUP POINT
            // ====================================

            $origin = PickupPoint::findOrFail(
                $request->origin_point_id
            );

            $destination = PickupPoint::findOrFail(
                $request->destination_point_id
            );

            // ====================================
            // VALIDASI KOORDINAT
            // ====================================

            if (
                !$origin->latitude ||
                !$origin->longitude ||
                !$destination->latitude ||
                !$destination->longitude
            ) {

                return response()->json([
                    'message' =>
                        'Koordinat pickup point belum lengkap'
                ], 422);
            }

            // ====================================
            // GENERATE ROUTE
            // ====================================

            $route = $osrm->getRoute(

                $origin->latitude,
                $origin->longitude,

                $destination->latitude,
                $destination->longitude
            );

            // ====================================
            // PRICE PASSENGER
            // ====================================

            $passengerPrice = $pricingService->calculate(

                $request->vehicle_type,

                $route['distance_km'] ?? 0,

                null
            );

            // ====================================
            // GOODS VEHICLE TYPE
            // ====================================

            $goodsVehicleType =
                $request->vehicle_type === 'motor'
                    ? 'Barang-Motor'
                    : 'Barang-Mobil';

            // ====================================
            // PRICE GOODS
            // ====================================

            $goodsPrice = $pricingService->calculate(

                $goodsVehicleType,

                $route['distance_km'] ?? 0,

                $request->baggage_capacity
            );

            // ====================================
// CREATE TRIP
// ====================================

if ($request->tebengan_type === "Barang") {

    // =========================
    // KONVERSI KAPASITAS
    // =========================

    $capacityMap = [

        'xxs' => 0.5,
        'xs' => 1,
        'kecil' => 5,
        'sedang' => 10,
        'besar' => 15,
    ];

    $capacityValue =
        $capacityMap[$request->baggage_capacity] ?? 1;

    // =========================
    // KHUSUS NEBENG BARANG
    // =========================

    $tripPassenger = Trip::create([

        'mitra_id' => auth()->id(),

        'vehicle_type' =>
            $request->vehicle_type,

        'departure_date' =>
            $request->departure_date,

        'departure_time' =>
            $request->departure_time,

        // ====================
        // KAPASITAS BARANG
        // ====================

        'seat_total' =>
            $capacityValue,

        'seat_available' =>
            $capacityValue,

        'origin_point_id' =>
            $request->origin_point_id,

        'destination_point_id' =>
            $request->destination_point_id,

        'baggage_capacity' =>
            $request->baggage_capacity,

        'price' => $goodsPrice,

        // =========================
        // MAPS DATA
        // =========================

        'estimated_distance_km' =>
            $route['distance_km'] ?? null,

        'estimated_duration_min' =>
            $route['duration_min'] ?? null,

        'route_geojson' =>
            isset($route['geometry'])
                ? json_encode($route['geometry'])
                : null,

        'status' => 'active'
    ]);

} else {

    // =========================
    // TEBENGAN PENUMPANG
    // =========================

    $tripPassenger = Trip::create([

        'mitra_id' => auth()->id(),

        'vehicle_type' =>
            $request->vehicle_type,

        'departure_date' =>
            $request->departure_date,

        'departure_time' =>
            $request->departure_time,

        'seat_total' =>
            $request->seat_total,

        'seat_available' =>
            $request->seat_total,

        'origin_point_id' =>
            $request->origin_point_id,

        'destination_point_id' =>
            $request->destination_point_id,

        'baggage_capacity' => null,

        'price' => $passengerPrice,

        'estimated_distance_km' =>
            $route['distance_km'] ?? null,

        'estimated_duration_min' =>
            $route['duration_min'] ?? null,

        'route_geojson' =>
            isset($route['geometry'])
                ? json_encode($route['geometry'])
                : null,

        'status' => 'active'
    ]);
}

            // ====================================
            // JIKA BARANG DAN TEBENGAN
            // BUAT TRIP BARANG
            // ====================================
            if (
                $request->tebengan_type ===
                "Barang dan Tebengan"
            ) {

                $capacityMap = [

                    'xxs' => 0.5,
                    'xs' => 1,
                    'kecil' => 5,
                    'sedang' => 10,
                    'besar' => 15,
                ];

                $capacityValue =
                    $capacityMap[$request->baggage_capacity] ?? 1;

                Trip::create([

                    'mitra_id' => auth()->id(),

                    'vehicle_type' => $goodsVehicleType,

                    'departure_date' =>
                        $request->departure_date,

                    'departure_time' =>
                        $request->departure_time,

                    'seat_total' =>
                        $capacityValue,

                    'seat_available' =>
                        $capacityValue,

                    'origin_point_id' =>
                        $request->origin_point_id,

                    'destination_point_id' =>
                        $request->destination_point_id,

                    'baggage_capacity' =>
                        $request->baggage_capacity,

                    'price' => $goodsPrice,

                    'estimated_distance_km' =>
                        $route['distance_km'] ?? null,

                    'estimated_duration_min' =>
                        $route['duration_min'] ?? null,

                    'route_geojson' =>
                        isset($route['geometry'])
                            ? json_encode($route['geometry'])
                            : null,

                    'status' => 'active'
                ]);
            }

            return response()->json([

                'message' =>
                    'Trip berhasil dibuat',

                'trip' => $tripPassenger

            ]);

        } catch (ValidationException $e) {

            return response()->json([

                'message' => collect($e->errors())->flatten()->first() ?? 'Data tidak valid',

                'errors' => $e->errors(),

            ], 422);

        } catch (\Exception $e) {

            return response()->json([

                'error' => $e->getMessage(),

                'line' => $e->getLine(),

                'file' => $e->getFile()

            ], 500);
        }
    }

    public function preview(
        Request $request,
        OSRMService $osrm,
        TripPricingService $pricingService
    )
    {
        $validated = $request->validate([

            'origin_point_id' =>
                'required|exists:pickup_points,id',

            'destination_point_id' =>
                'required|exists:pickup_points,id',

            'vehicle_type' =>
                'required',

            'baggage_capacity' =>
                'nullable'
        ]);

        $origin = PickupPoint::findOrFail(
            $request->origin_point_id
        );

        $destination = PickupPoint::findOrFail(
            $request->destination_point_id
        );

        $route = $osrm->getRoute(
            $origin->latitude,
            $origin->longitude,
            $destination->latitude,
            $destination->longitude
        );

        $price = $pricingService->calculate(

            $request->vehicle_type,

            $route['distance_km'] ?? 0,

            $request->baggage_capacity
        );

        return response()->json([

            'distance_km' =>
                $route['distance_km'] ?? 0,

            'duration_min' =>
                $route['duration_min'] ?? 0,

            'estimated_price' => $price
        ]);
    }

    public function myTrips(Request $request)
    {
        $user = $request->user();

        $trips = \App\Models\Trip::with([
            'originPoint.city',
            'destinationPoint.city'
        ])
        ->where('mitra_id', $user->id)
        ->latest()
        ->get()
        ->map(function ($trip) {

            $rawStatus = $trip->status;

            if ($rawStatus === 'cancelled') {
                $status = 'Dibatalkan';

            } elseif ($rawStatus === 'completed') {
                $status = 'Selesai';

            } elseif ($rawStatus === 'active') {
                $status = 'Proses';

            } else {
                $status = 'Proses';
            }

            return [
                'id' => $trip->id,
                'vehicle_type' => $trip->vehicle_type,
                'departure_date' => $trip->departure_date,
                'departure_time' => $trip->departure_time,
                'price' => $trip->price,
                'status' => $status,

                'seat_total' => $trip->seat_total,
                'seat_available' => $trip->seat_available,

                'origin_point' => $trip->originPoint,
                'destination_point' => $trip->destinationPoint,
            ];
        });

        return response()->json($trips);
    }

    // Endpoint gabungan khusus dashboard mitra: saldo + 2 trip terdekat yang
    // akan datang. Filter tanggal & limit dilakukan di query, bukan di
    // frontend, supaya tidak perlu tarik seluruh riwayat trip tiap buka
    // dashboard.
    public function dashboardSummary(Request $request)
    {
        $user = $request->user();

        $balance = DriverBalance::firstOrCreate(
            ['user_id' => $user->id],
            ['balance' => 0]
        );

        $now = now();

        $upcomingTrips = Trip::with([
            'originPoint.city',
            'destinationPoint.city'
        ])
        ->where('mitra_id', $user->id)
        ->where('status', '!=', 'completed')
        ->where(function ($q) use ($now) {
            $q->where('departure_date', '>', $now->toDateString())
              ->orWhere(function ($q2) use ($now) {
                  $q2->where('departure_date', '=', $now->toDateString())
                     ->where('departure_time', '>=', $now->toTimeString());
              });
        })
        ->orderBy('departure_date')
        ->orderBy('departure_time')
        ->limit(2)
        ->get()
        ->map(function ($trip) {
            $rawStatus = $trip->status;

            if ($rawStatus === 'cancelled') {
                $status = 'Dibatalkan';
            } elseif ($rawStatus === 'completed') {
                $status = 'Selesai';
            } else {
                $status = 'Proses';
            }

            return [
                'id' => $trip->id,
                'vehicle_type' => $trip->vehicle_type,
                'departure_date' => $trip->departure_date,
                'departure_time' => $trip->departure_time,
                'price' => $trip->price,
                'status' => $status,
                'seat_total' => $trip->seat_total,
                'seat_available' => $trip->seat_available,
                'origin_point' => $trip->originPoint,
                'destination_point' => $trip->destinationPoint,
            ];
        });

        return response()->json([
            'balance' => $balance->balance,
            'upcoming_trips' => $upcomingTrips,
        ]);
    }

    public function posMitraTrips()
    {
        $trips = \App\Models\Trip::with([
            'originPoint.city',
            'destinationPoint.city',
            'mitra',
            'orders.customer'
        ])
        ->latest()
        ->get()
        ->map(function ($trip) {

            $rawStatus = $trip->status;

            if ($rawStatus === 'cancelled') {
                $status = 'Dibatalkan';

            } elseif ($rawStatus === 'completed') {
                $status = 'Selesai';

            } elseif ($rawStatus === 'active') {
                $status = 'Proses';

            } else {
                $status = 'Proses';
            }

            return [
                'id' => $trip->id,

                'vehicle_type' => $trip->vehicle_type,

                'departure_date' => $trip->departure_date,

                'departure_time' => $trip->departure_time,

                'price' => $trip->price,

                'status' => $status,

                'seat_total' => $trip->seat_total,

                'seat_available' => $trip->seat_available,

                'origin_point' => $trip->originPoint,

                'destination_point' => $trip->destinationPoint,

                'mitra' => $trip->mitra,

                'orders' => $trip->orders,
            ];
        });

        return response()->json($trips);
    }

    public function scanQr(Request $request)
    {
        $validated = $request->validate([
            'qr_token' => 'required|string'
        ]);

        $session = TripQrSession::where('token', $request->qr_token)
            ->where('purpose', 'arrival')
            ->with('trip')
            ->first();

        if (!$session) {
            return response()->json([
                'message' => 'QR tidak valid'
            ], 404);
        }

        if (now()->gt($session->expired_at)) {
            return response()->json([
                'message' => 'QR sudah expired'
            ], 400);
        }

        if ($session->is_used) {
            return response()->json([
                'message' => 'QR sudah digunakan'
            ], 400);
        }

        $session->update([
            'is_used' => true,
            'used_at' => now(),
        ]);

        $session->trip->update([
            'status' => 'completed'
        ]);

        // Ikut selesaikan semua order yang terkait trip ini, supaya
        // riwayat pesanan customer ikut ter-update jadi "Selesai" -
        // sebelumnya cuma status Trip yang di-update di sini, Order-nya
        // kelewat, jadi customer lihat "Dalam Proses" terus walau
        // trip-nya sudah beneran selesai.
        foreach ($session->trip->orders as $order) {
            $order->status = 'completed';
            $order->save();
        }

        return response()->json([
            'message' => 'Trip berhasil diselesaikan',
            'trip_id' => $session->trip->id,
            'status' => 'completed'
        ]);
    }

    public function scanDepartureQr(Request $request)
    {
        $validated = $request->validate([
            'qr_token' => 'required|string'
        ]);

        $session = TripQrSession::where(
                'token',
                $request->qr_token
            )
            ->where('purpose', 'departure')
            ->with('trip')
            ->first();

        if (!$session) {
            return response()->json([
                'message' => 'QR tidak valid'
            ], 404);
        }

        if (now()->gt($session->expired_at)) {
            return response()->json([
                'message' => 'QR sudah expired'
            ], 400);
        }

        if ($session->is_used) {
            return response()->json([
                'message' => 'QR sudah digunakan'
            ], 400);
        }

        $session->update([
            'is_used' => true,
            'used_at' => now(),
        ]);

        $session->trip->update([
            'status' => 'on_the_way'
        ]);

        return response()->json([
            'message' => 'Perjalanan dimulai',
            'trip_id' => $session->trip->id,
            'status' => 'on_the_way'
        ]);
    }

    public function scanCustomerQr(Request $request)
    {
        $validated = $request->validate([
            'qr_token' => 'required|string'
        ]);

        $session = OrderQrSession::where(
            'token',
            $request->qr_token
        )
        ->with('order')
        ->first();

        if (!$session) {
            return response()->json([
                'message' => 'QR tidak valid'
            ], 404);
        }

        if (now()->gt($session->expired_at)) {
            return response()->json([
                'message' => 'QR sudah expired'
            ], 400);
        }

        if ($session->is_used) {
            return response()->json([
                'message' => 'QR sudah digunakan'
            ], 400);
        }

        $session->update([
            'is_used' => true,
            'used_at' => now(),
        ]);

        $session->order->update([
            'readiness_status' => 'ready'
        ]);

        return response()->json([
            'message' => 'Customer berhasil diverifikasi',
            'order_id' => $session->order->id,
            'readiness_status' => 'ready'
        ]);
    }
}