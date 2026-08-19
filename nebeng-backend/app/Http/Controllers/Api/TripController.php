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
use App\Services\NotificationService;
use App\Models\User;
use App\Models\RewardTransaction;
use App\Models\SosLog;

class TripController extends Controller
{
    public function search(Request $request)
    {
        $request->validate([
            'origin_point_id' => 'required|exists:pickup_points,id',
            'destination_point_id' => 'required|exists:pickup_points,id',
            'date' => 'required|date',
        ]);

        $requestedDate = \Carbon\Carbon::parse($request->date)->toDateString();
        $now = now();

        $query = Trip::with([
            'originPoint.city',
            'destinationPoint.city',
            'mitra'
        ])
        ->where('origin_point_id', $request->origin_point_id)
        ->where('destination_point_id', $request->destination_point_id)
        ->whereDate('departure_date', $requestedDate)
        ->where('seat_available', '>', 0)
        ->where('status', 'active');

        // Kalau tanggal yang dicari adalah HARI INI, buang trip yang jam
        // keberangkatannya sudah lewat dari waktu sekarang.
        if ($requestedDate === $now->toDateString()) {
            $query->where('departure_time', '>=', $now->toTimeString());
        }

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
            // mitra.profile WAJIB ikut di-load - dipakai untuk menampilkan
            // QRIS mitra di halaman preview pembayaran customer SEBELUM
            // order dibuat (UploadBuktiPembayaran.jsx mode "buat baru").
            // Tanpa ini, qris_image tidak pernah ikut ke response walau
            // mitra sudah upload QRIS-nya.
            'mitra.profile',
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

                'departure_date' => 'required|date',

                'departure_time' => 'required',

                'seat_total' =>
                    'required|integer|min:1',

                'vehicle_type' => 'required',

                'tebengan_type' => 'nullable',

                'baggage_capacity' => 'nullable',

                // 🔥 BARU
                'max_cap' =>
                    'nullable|integer|min:1',

                // Kendaraan spesifik (merk/plat) yang dipakai untuk trip ini
                'mitra_vehicle_id' => 'nullable|exists:mitra_vehicles,id',
            ]);

            // ====================================
            // VALIDASI KENDARAAN SPESIFIK YANG DIPILIH
            // ====================================
            $mitraVehicle = null;

            if ($request->filled('mitra_vehicle_id')) {
                $mitraVehicle = \App\Models\MitraVehicle::where('id', $request->mitra_vehicle_id)
                    ->where('user_id', auth()->id())
                    ->first();

                if (!$mitraVehicle) {
                    return response()->json([
                        'message' => 'Kendaraan yang dipilih tidak ditemukan.',
                    ], 422);
                }

                if ($mitraVehicle->status !== 'approved') {
                    return response()->json([
                        'message' => 'Kendaraan yang dipilih belum disetujui admin.',
                    ], 422);
                }

                if ($mitraVehicle->type === 'mobil' && $mitraVehicle->seat_capacity && $request->seat_total > $mitraVehicle->seat_capacity) {
                    return response()->json([
                        'message' => "Jumlah kursi tidak boleh melebihi kapasitas kendaraan terdaftar ({$mitraVehicle->seat_capacity} penumpang).",
                    ], 422);
                }
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
            // PENTING: vehicle_type yang dikirim BEDA tergantung asal form:
            // - NebengBarang.jsx (trip barang murni) sudah mengirim string
            //   "Barang-Motor"/"Barang-Mobil" langsung, BUKAN "motor"/"mobil"
            //   polos. Kalau tetap dicek "=== 'motor'", perbandingan ini
            //   selalu gagal dan salah jatuh ke "Barang-Mobil" (tarif lebih
            //   mahal) walaupun kendaraannya Motor.
            // - NebengMotor.jsx/NebengMobil.jsx (mode "Barang dan Tebengan")
            //   mengirim vehicle_type mentah "motor"/"mobil", jadi masih
            //   perlu di-mapping ke "Barang-Motor"/"Barang-Mobil".

            $goodsVehicleType =
                str_starts_with($request->vehicle_type, 'Barang-')
                    ? $request->vehicle_type
                    : ($request->vehicle_type === 'motor'
                        ? 'Barang-Motor'
                        : 'Barang-Mobil');

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

                    'mitra_vehicle_id' => $mitraVehicle->id ?? null,

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

                    'mitra_vehicle_id' => $mitraVehicle->id ?? null,

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

                    'mitra_vehicle_id' => $mitraVehicle->id ?? null,

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

    public function dashboardSummary(Request $request)
    {
        $user = $request->user();

        $balance = \App\Models\DriverBalance::where('user_id', $user->id)
            ->value('balance') ?? 0;

        $now = now();

        $upcomingTrips = Trip::with([
                'originPoint.city',
                'destinationPoint.city',
            ])
            ->where('mitra_id', $user->id)
            ->whereNotIn('status', ['cancelled', 'completed'])
            ->where(function ($q) use ($now) {
                $q->where('departure_date', '>', $now->toDateString())
                  ->orWhere(function ($q2) use ($now) {
                      $q2->where('departure_date', $now->toDateString())
                         ->where('departure_time', '>=', $now->toTimeString());
                  });
            })
            ->orderBy('departure_date', 'asc')
            ->orderBy('departure_time', 'asc')
            ->take(2)
            ->get()
            ->map(function ($trip) {
                return [
                    'id' => $trip->id,
                    'vehicle_type' => $trip->vehicle_type,
                    'departure_date' => $trip->departure_date,
                    'departure_time' => $trip->departure_time,
                    'status' => $trip->status,
                    'origin_point' => $trip->originPoint,
                    'destination_point' => $trip->destinationPoint,
                ];
            });

        return response()->json([
            'balance' => $balance,
            'upcoming_trips' => $upcomingTrips,
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
            ->with('trip.orders')
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

        $trip = $session->trip;
        
        $trip->update([
            'status' => 'completed'
        ]);

        NotificationService::send(
            $trip->mitra_id,
            'Perjalanan Selesai',
            'Trip kamu telah selesai. Saldo akan bertambah setelah pembayaran dikonfirmasi.',
            'trip',
            "/mitra/riwayat"
        );

        foreach ($trip->orders as $order) {
            // ==========================================
            // 1. HITUNG POIN BERDASARKAN KENDARAAN
            // ==========================================
            $customer = User::find($order->customer_id);
            $points = 0;

            if ($customer) {
                $vType = strtolower($trip->vehicle_type);

                if (str_contains($vType, 'motor')) {
                    $points = 15;
                } elseif (str_contains($vType, 'mobil')) {
                    $points = 25;
                } elseif (str_contains($vType, 'barang')) {
                    $points = 20;
                } else {
                    $points = 15;
                }

                // Tambahkan poin ke database
                $customer->reward_points += $points;
                $customer->save();

                RewardTransaction::create([
                    'user_id' => $customer->id,
                    'type' => 'earn',
                    'points' => $points,
                    'description' => 'Poin dari penyelesaian trip #' . $trip->id
                ]);
            }

            // ==========================================
            // 2. KIRIM SATU NOTIFIKASI GABUNGAN YANG RAPI
            // ==========================================
            $notifMessage = 'Kamu sudah sampai tujuan. Jangan lupa beri penilaian untuk mitra (opsional).';
            if ($points > 0) {
                $notifMessage = "Kamu sudah sampai tujuan dan mendapatkan +{$points} poin reward! Jangan lupa beri penilaian untuk mitra.";
            }

            NotificationService::send(
                $order->customer_id,
                'Perjalanan Selesai',
                $notifMessage,
                'trip',
                "/customer/perjalanan/{$trip->id}"
            );
        }

        NotificationService::send(
            auth()->id(),
            'QR Kedatangan Terverifikasi',
            "Trip #{$trip->id} berhasil diselesaikan.",
            'system',
            '/pos-mitra/aktivitas'
        );

        return response()->json([
            'message' => 'Trip berhasil diselesaikan',
            'trip_id' => $trip->id,
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

        $session->trip->load('orders');

        NotificationService::send(
            $session->trip->mitra_id,
            'Perjalanan Dimulai',
            'QR keberangkatan berhasil diverifikasi. Selamat menempuh perjalanan.',
            'trip',
            "/mitra/perjalanan/{$session->trip->id}"
        );

        foreach ($session->trip->orders as $order) {
            NotificationService::send(
                $order->customer_id,
                'Perjalanan Dimulai',
                'Mitra sudah berangkat. Pantau perjalanan kamu secara langsung.',
                'trip',
                "/customer/perjalanan/{$session->trip->id}"
            );
        }

        NotificationService::send(
            auth()->id(),
            'QR Keberangkatan Terverifikasi',
            "Trip #{$session->trip->id} berhasil diberangkatkan.",
            'system',
            '/pos-mitra/aktivitas'
        );

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
        ->where('purpose', 'checkin')
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

        $session->order->load('trip', 'customer');

        NotificationService::send(
            $session->order->trip->mitra_id,
            'Customer Sudah Check-in',
            "{$session->order->customer->name} sudah check-in di Pos Mitra. Cek apakah semua customer sudah siap berangkat.",
            'trip',
            "/mitra/perjalanan/{$session->order->trip_id}"
        );

        return response()->json([
            'message' => 'Customer berhasil diverifikasi',
            'order_id' => $session->order->id,
            'readiness_status' => 'ready'
        ]);
    }

    // ================= MITRA: GENERATE QR PENGIRIMAN PER-ORDER =================
    // Beda dengan scanQr() (arrival, per-TRIP, dampaknya ke semua order
    // sekaligus) - QR ini khusus 1 order barang, supaya trip barang yang
    // dipakai beberapa customer bisa dikonfirmasi kedatangan/pengiriman
    // masing-masing secara independen.
    public function generateDeliveryQr(Request $request, $orderId)
    {
        $order = Order::with('trip')->findOrFail($orderId);

        if (!$order->trip || $order->trip->mitra_id !== auth()->id()) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        if (!$order->item_order_id) {
            return response()->json([
                'message' => 'Fitur QR pengiriman ini khusus untuk order barang.'
            ], 400);
        }

        if ($order->delivered_at) {
            return response()->json([
                'message' => 'Order ini sudah dikonfirmasi sampai sebelumnya.'
            ], 400);
        }

        $token = \Illuminate\Support\Str::random(40);

        $session = OrderQrSession::create([
            'order_id' => $order->id,
            'token' => $token,
            'purpose' => 'delivery',
            'expired_at' => now()->addMinutes(30),
            'is_used' => false,
        ]);

        return response()->json([
            'token' => $session->token,
            'expired_at' => $session->expired_at,
        ]);
    }

    // ================= SCAN QR PENGIRIMAN PER-ORDER =================
    public function scanDeliveryQr(Request $request)
    {
        $validated = $request->validate([
            'qr_token' => 'required|string'
        ]);

        $session = OrderQrSession::where('token', $request->qr_token)
            ->where('purpose', 'delivery')
            ->with('order.trip', 'order.customer')
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

        $order = $session->order;

        // Cuma menandai ORDER INI - tidak menyentuh order lain di trip
        // yang sama sekalipun trip-nya sama persis.
        $order->update([
            'delivered_at' => now(),
        ]);

        // ==========================================
        // POIN REWARD - khusus customer order ini saja
        // ==========================================
        $customer = $order->customer;

        if ($customer) {
            $points = 20; // sama seperti poin barang di scanQr()

            $customer->reward_points += $points;
            $customer->save();

            RewardTransaction::create([
                'user_id' => $customer->id,
                'type' => 'earn',
                'points' => $points,
                'description' => 'Poin dari barang sampai tujuan - order #' . $order->id,
            ]);
        }

        NotificationService::send(
            $order->customer_id,
            'Barang Sudah Sampai',
            'Barang kamu sudah dikonfirmasi sampai tujuan.' . ($customer ? " Kamu mendapat +20 poin reward!" : ''),
            'trip',
            "/customer/pesanan/{$order->id}"
        );

        // ==========================================
        // Kalau SEMUA order di trip ini sudah delivered, baru trip
        // ditandai selesai. Kalau masih ada yang belum, trip tetap
        // berjalan menunggu order lain.
        // ==========================================
        $trip = $order->trip;

        $stillPending = $trip->orders()
            ->whereNotNull('item_order_id')
            ->whereNull('delivered_at')
            ->exists();

        if (!$stillPending && $trip->status !== 'completed') {
            $trip->update(['status' => 'completed']);

            NotificationService::send(
                $trip->mitra_id,
                'Perjalanan Selesai',
                'Semua barang di trip #' . $trip->id . ' sudah dikonfirmasi sampai.',
                'trip',
                "/mitra/riwayat"
            );
        }

        return response()->json([
            'message' => 'Barang berhasil dikonfirmasi sampai tujuan',
            'order_id' => $order->id,
            'trip_completed' => !$stillPending,
        ]);
    }

    public function sendSos(Request $request, $tripId)
    {
        $request->validate([
            'latitude' => 'nullable',
            'longitude' => 'nullable',
        ]);

        $trip = Trip::findOrFail($tripId);

        $sos = SosLog::create([
            'trip_id' => $trip->id,
            'customer_id' => $request->user()->id,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'message' => 'Darurat! Pengguna mengirim sinyal SOS dari perjalanan.'
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'SOS berhasil dikirim ke pusat!',
            'data' => $sos
        ], 200);
    }

    // 2. Digunakan Admin untuk melihat daftar darurat masuk
    public function adminGetSosList()
    {
        $sosList = SosLog::with(['trip.mitra', 'trip.originPoint', 'trip.destinationPoint', 'customer'])
                        ->orderBy('created_at', 'desc')
                        ->get();

        return response()->json($sosList, 200);
    }

    // 3. Digunakan Admin untuk mengirim teguran/tindakan ke Mitra
    public function adminRebukeMitra(Request $request, $sosId)
    {
        $request->validate([
            'admin_notes' => 'required|string'
        ]);

        $sos = SosLog::with('trip.mitra')->findOrFail($sosId);
        $sos->update([
            'admin_notes' => $request->admin_notes,
            'status' => 'reviewed'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Teguran berhasil dicatat dan dikirimkan kepada Mitra.'
        ], 200);
    }

    // 4. Digunakan Admin untuk menandai sinyal SOS sebagai selesai ditangani
    public function adminResolveSos($id)
    {
        $sos = SosLog::findOrFail($id);

        $sos->update([
            'status' => 'resolved',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Status SOS berhasil diperbarui menjadi selesai.'
        ], 200);
    }
}