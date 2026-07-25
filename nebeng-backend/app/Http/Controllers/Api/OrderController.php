<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Trip;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\RewardTransaction;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\DriverBalance;
use App\Models\BalanceTransaction;
use App\Events\NewOrderNotification;
use Illuminate\Support\Facades\Storage;

class OrderController extends Controller
{

    public function store(Request $request)
    {
        $request->validate([
            'trip_id' => 'required|exists:trips,id',
            'pickup_address' => 'required|string',
            'drop_address' => 'required|string',
            'payment_method' => 'required|in:cash,qris,ewallet' // 🔥 tambahan
        ]);

        $trip = Trip::findOrFail($request->trip_id);

        if ($trip->seat_available <= 0) {
            return response()->json([
                'message' => 'Seat sudah habis'
            ], 400);
        }

        $order = Order::create([
            'trip_id' => $trip->id,
            'customer_id' => auth()->id(),
            'pickup_address' => $request->pickup_address,
            'drop_address' => $request->drop_address,
            'price' => $trip->price,
            'payment_method' => $request->payment_method, // 🔥 ini inti
            'status' => 'completed',
            // Baik tunai maupun QRIS baru dianggap lunas setelah mitra
            // konfirmasi pembayaran diterima (lihat OrderController::confirmPayment).
            'payment_status' => 'unpaid'
        ]);

        $order->load('trip', 'customer');

        \Log::info('BROADCAST TEST');
        \Log::info($order->toArray());

        broadcast(new NewOrderNotification($order));

        $conversation = Conversation::firstOrCreate([
            'customer_id' => auth()->id(),
            'mitra_id' => $trip->mitra_id
        ]);

        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $trip->mitra_id,
            'message' => 'Halo 👋 pesanan trip #' . $order->id . ' sudah kami terima. Apakah pickup dan drop address sudah sesuai?'
        ]);

        $user = auth()->user();

        $points = 0;

        switch ($trip->vehicle_type) {
            case 'motor':
                $points = 15;
                break;

            case 'mobil':
                $points = 25;
                break;

            case 'barang':
                $points = 20;
                break;
        }

        $user->reward_points += $points;
        $user->save();

        RewardTransaction::create([
            'user_id' => $user->id,
            'type' => 'earn',
            'points' => $points,
            'description' => 'Poin dari pemesanan trip #' . $trip->id
        ]);

        $trip->decrement('seat_available');

        return response()->json([
            'message' => 'Order berhasil',
            'order' => $order,
            'conversation_id' => $conversation->id
        ]);
    }

    public function show($id)
    {
        $order = Order::with([
            'trip.originPoint.city',
            'trip.destinationPoint.city',
            'trip.mitra.profile',
            'customer'
        ])->findOrFail($id);

        // pastikan hanya owner order yang bisa melihat
        if ($order->customer_id !== auth()->id()) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        return response()->json($order);
    }

    public function history(Request $request)
    {
        $user = $request->user();

        $orders = Order::with([
            'trip.originPoint.city',
            'trip.destinationPoint.city',
            'trip.mitra'
        ])
        ->where('customer_id', $user->id)
        ->latest()
        ->get();

        return response()->json($orders);
    }

    // ================= CUSTOMER: UPLOAD BUKTI PEMBAYARAN QRIS =================
    public function uploadPaymentProof(Request $request, $id)
    {
        $request->validate([
            'payment_proof' => 'required|image|max:4096',
        ]);

        $order = Order::findOrFail($id);

        if ($order->customer_id !== auth()->id()) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        if ($order->payment_method === 'cash') {
            return response()->json([
                'message' => 'Order ini menggunakan pembayaran tunai, tidak perlu bukti pembayaran.'
            ], 400);
        }

        // Hapus bukti lama kalau ada (jika upload ulang)
        if ($order->payment_proof) {
            Storage::disk('public')->delete($order->payment_proof);
        }

        $path = $request->file('payment_proof')->store('payment_proofs', 'public');

        $order->update([
            'payment_proof' => $path,
            'payment_status' => 'waiting_confirmation',
        ]);

        return response()->json([
            'message' => 'Bukti pembayaran berhasil dikirim. Menunggu konfirmasi mitra.',
            'order' => $order,
        ]);
    }

    // ================= MITRA: KONFIRMASI PEMBAYARAN SUDAH DITERIMA =================
    public function confirmPayment($id)
    {
        $order = Order::with('trip')->findOrFail($id);

        if (!$order->trip || $order->trip->mitra_id !== auth()->id()) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        if ($order->payment_status === 'paid') {
            return response()->json([
                'message' => 'Pembayaran order ini sudah dikonfirmasi sebelumnya.'
            ], 400);
        }

        // Bukti pembayaran hanya wajib untuk metode non-tunai (QRIS dkk).
        // Tunai cukup konfirmasi lisan/manual dari mitra, tanpa foto.
        if ($order->payment_method !== 'cash' && !$order->payment_proof) {
            return response()->json([
                'message' => 'Customer belum mengupload bukti pembayaran.'
            ], 400);
        }

        $order->update(['payment_status' => 'paid']);

        // Kredit saldo mitra sekarang, setelah pembayaran benar-benar dikonfirmasi
        $mitraId = $order->trip->mitra_id;

        $balance = DriverBalance::firstOrCreate(
            ['user_id' => $mitraId],
            ['balance' => 0]
        );

        $balance->increment('balance', $order->price);

        BalanceTransaction::create([
            'user_id' => $mitraId,
            'order_id' => $order->id,
            'type' => 'credit',
            'amount' => $order->price,
            'description' => 'Pendapatan dari order #' . $order->id . ' (QRIS terkonfirmasi)'
        ]);

        return response()->json([
            'message' => 'Pembayaran berhasil dikonfirmasi.',
            'order' => $order,
        ]);
    }
}