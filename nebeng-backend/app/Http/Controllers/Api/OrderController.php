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
use App\Services\NotificationService;
use Carbon\Carbon;

class OrderController extends Controller
{

    public function store(Request $request)
    {
        $request->validate([
            'trip_id' => 'required|exists:trips,id',
            'pickup_address' => 'required|string',
            'drop_address' => 'required|string',
            'payment_method' => 'required|in:cash,qris,ewallet' 
        ]);

        $trip = Trip::findOrFail($request->trip_id);

        // Cek apakah customer sudah punya pesanan aktif yang BENAR-BENAR VALID/LUNAS (bukan yang mangkrak belum bayar)
        $existingOrder = Order::where('trip_id', $trip->id)
            ->where('customer_id', auth()->id())
            ->where(function($query) {
                // Blokir jika status pembayaran sudah paid atau waiting confirmation (artinya sudah pernah diproses bayar)
                $query->where('payment_status', 'paid')
                      ->orWhere('payment_status', 'waiting_confirmation');
            })
            ->first();

        if ($existingOrder) {
            return response()->json([
                'message' => 'Anda sudah memiliki pesanan aktif pada trip ini. Tidak dapat membuat pesanan ganda.'
            ], 400);
        }

        if ($trip->seat_available <= 0) {
            return response()->json([
                'message' => 'Seat sudah habis'
            ], 400);
        }

        // Cek jika ada order sebelumnya yang mangkrak (unpaid), timpa atau gunakan kembali agar tidak menumpuk
        $pendingOrder = Order::where('trip_id', $trip->id)
            ->where('customer_id', auth()->id())
            ->where('payment_status', 'unpaid')
            ->first();

        if ($pendingOrder) {
            // Update data order yang mangkrak sebelumnya
            $pendingOrder->update([
                'pickup_address' => $request->pickup_address,
                'drop_address' => $request->drop_address,
                'payment_method' => $request->payment_method,
            ]);
            $order = $pendingOrder;
        } else {
            // Buat order baru dengan status awal masih unpaid & status pending (belum mengurangi seat dulu sebelum dibayar/diproses)
            $order = Order::create([
                'trip_id' => $trip->id,
                'customer_id' => auth()->id(),
                'pickup_address' => $request->pickup_address,
                'drop_address' => $request->drop_address,
                'price' => $trip->price,
                'payment_method' => $request->payment_method, 
                'status' => 'pending', // Belum aktif penuh sebelum dibayar
                'payment_status' => 'unpaid'
            ]);
        }

        $order->load('trip', 'customer');

        return response()->json([
            'message' => 'Order berhasil dibuat, silakan lanjutkan pembayaran',
            'order' => $order,
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

        $order = Order::with('trip.destinationPoint')->findOrFail($id);

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

        if ($order->payment_proof) {
            Storage::disk('public')->delete($order->payment_proof);
        }

        $path = $request->file('payment_proof')->store('payment_proofs', 'public');

        // BARU DI SINI PESANAN RESMI AKTIF & KURSI DIKURANGI SETELAH BUKTI DI-UPLOAD
        $order->update([
            'payment_proof' => $path,
            'payment_status' => 'waiting_confirmation',
            'status' => 'completed'
        ]);

        $trip = $order->trip;
        if ($trip && $trip->seat_available > 0) {
            $trip->decrement('seat_available');
        }

        broadcast(new NewOrderNotification($order));

        NotificationService::send(
            $order->customer_id,
            'Pesanan Berhasil Dibuat',
            "Bukti pembayaran berhasil dikirim. Pesanan tebengan kamu ke {$order->trip->destinationPoint->pos_name} resmi dibuat. Total Rp" . number_format($order->price, 0, ',', '.') . '.',
            'order',
            "/customer/perjalanan/{$order->trip_id}"
        );

        NotificationService::send(
            $order->trip->mitra_id,
            'Perlu Konfirmasi Pembayaran',
            'Customer sudah upload bukti pembayaran QRIS. Cek dan konfirmasi di halaman perjalanan.',
            'payment',
            "/mitra/perjalanan/{$order->trip_id}"
        );

        $conversation = Conversation::firstOrCreate([
            'customer_id' => auth()->id(),
            'mitra_id' => $trip->mitra_id
        ]);

        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $trip->mitra_id,
            'message' => 'Halo 👋 pesanan trip #' . $order->id . ' bukti pembayaran sudah diupload. Menunggu konfirmasi.'
        ]);

        return response()->json([
            'message' => 'Bukti pembayaran berhasil dikirim. Menunggu konfirmasi mitra.',
            'order' => $order,
            'conversation_id' => $conversation->id
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

        if ($order->payment_method !== 'cash' && !$order->payment_proof) {
            return response()->json([
                'message' => 'Customer belum mengupload bukti pembayaran.'
            ], 400);
        }

        $order->update(['payment_status' => 'paid']);

        // Jika metode cash, status dan pengurangan kursi baru terjadi saat konfirmasi atau saat pesanan dibuat (sesuaikan kebutuhan cash)
        if ($order->payment_method === 'cash' && $order->status !== 'completed') {
            $order->update(['status' => 'completed']);
            $order->trip->decrement('seat_available');
            broadcast(new NewOrderNotification($order));
        }

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
            'description' => 'Pendapatan dari order #' . $order->id . ' (Terkonfirmasi)'
        ]);

        NotificationService::send(
            $order->customer_id,
            'Pembayaran Dikonfirmasi',
            'Mitra telah mengonfirmasi pembayaran kamu. Lanjutkan ke halaman perjalanan.',
            'payment',
            "/customer/perjalanan/{$order->trip_id}"
        );

        NotificationService::send(
            $mitraId,
            'Saldo Bertambah',
            'Rp' . number_format($order->price, 0, ',', '.') . " masuk ke saldo kamu dari order #{$order->id}.",
            'payment',
            "/mitra/riwayat-saldo"
        );

        return response()->json([
            'message' => 'Pembayaran berhasil dikonfirmasi.',
            'order' => $order,
        ]);
    }

    public function markAsNoShow($id)
    {
        try {
            // Cari order berdasarkan ID
            $order = \App\Models\Order::findOrFail($id);

            // Pastikan status order masih dalam tahap menunggu (sesuaikan dengan status enum kamu)
            // Update readiness_status atau status utama menjadi no_show
            $order->update([
                'readiness_status' => 'no_show',
                // 'status' => 'cancelled' // Buka komentar ini jika status utama juga perlu diubah
            ]);

            // Hapus sesi QR yang menggantung agar tidak mengunci sistem
            \App\Models\OrderQrSession::where('order_id', $id)->delete();

            return response()->json([
                'success' => true,
                'message' => 'Customer berhasil ditandai tidak hadir. Anda dapat melanjutkan perjalanan.'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memproses permintaan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function cancelOrder(Request $request, $id)
    {
        $order = Order::with('trip')->findOrFail($id);
        
        $departureTime = Carbon::parse($order->trip->departure_time);
        $now = Carbon::now();
        $hoursDifference = $now->diffInHours($departureTime, false);

        if ($hoursDifference < 0) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan sudah tidak dapat dibatalkan karena waktu keberangkatan telah tiba/lewat.'
            ], 400);
        }

        // Jika pembayaran Tunai
        if ($order->payment_method === 'cash') {
            $order->update([
                'status' => 'cancelled',
                'refund_status' => 'not_applicable'
            ]);
            
            \App\Models\OrderQrSession::where('order_id', $id)->delete();

            return response()->json([
                'success' => true,
                'rule' => 'cash_cancelled',
                'message' => 'Pesanan tunai berhasil dibatalkan.'
            ], 200);
        }

        // Jika pembayaran QRIS (Sistem Bertingkat)
        if ($hoursDifference >= 12) {
            // Tier 1: > 12 jam (Refund 100%)
            $order->update([
                'status' => 'cancelled',
                'refund_status' => 'pending_100_percent'
            ]);
            
            \App\Models\OrderQrSession::where('order_id', $id)->delete();

            return response()->json([
                'success' => true,
                'rule' => 'refund_100',
                'message' => 'Pembatalan berhasil. Karena dilakukan lebih dari 12 jam sebelum keberangkatan, Anda berhak mendapatkan refund 100% dari mitra.'
            ], 200);

        } elseif ($hoursDifference >= 3) {
            // Tier 2: 3 s.d 12 jam (Refund 50%)
            $order->update([
                'status' => 'cancelled',
                'refund_status' => 'pending_50_percent'
            ]);
            
            \App\Models\OrderQrSession::where('order_id', $id)->delete();

            return response()->json([
                'success' => true,
                'rule' => 'refund_50',
                'message' => 'Pembatalan berhasil. Karena dilakukan antara 3 hingga 12 jam sebelum keberangkatan, Anda berhak mendapatkan refund 50% dari mitra.'
            ], 200);

        } else {
            // Tier 3: < 3 jam (Hangus / No Refund)
            $order->update([
                'status' => 'cancelled',
                'refund_status' => 'non_refundable'
            ]);

            \App\Models\OrderQrSession::where('order_id', $id)->delete();

            return response()->json([
                'success' => true,
                'rule' => 'no_refund',
                'message' => 'Pembatalan berhasil. Karena dilakukan kurang dari 3 jam sebelum keberangkatan, dana QRIS dinyatakan hangus.'
            ], 200);
        }
    }
}