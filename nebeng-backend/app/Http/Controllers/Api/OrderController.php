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
    // Konversi ukuran barang -> berat (kg). Sama persis dengan mapping di
    // ItemOrderController & TripController, dipakai untuk menentukan
    // berapa banyak seat_available yang harus dikurangi/dikembalikan
    // untuk order barang (bukan selalu 1 seperti order penumpang).
    private const CAPACITY_MAP = [
        'xxs' => 0.5,
        'xs' => 1,
        'kecil' => 5,
        'sedang' => 10,
        'besar' => 15,
    ];

    // Order barang (punya item_order_id) -> kurangi/kembalikan sebesar
    // berat barangnya (kg). Order penumpang biasa -> tetap 1 kursi.
    private function capacityWeightForOrder(Order $order): float
    {
        if ($order->item_order_id && $order->itemOrder) {
            return self::CAPACITY_MAP[$order->itemOrder->size] ?? 1;
        }

        return 1;
    }

    public function store(Request $request)
    {
        $request->validate([
            'trip_id' => 'required|exists:trips,id',
            'pickup_address' => 'required|string',
            'drop_address' => 'required|string',
            'payment_method' => 'required|in:cash,qris,ewallet' 
        ]);

        if ($request->payment_method === 'cash' && $request->user()->late_cancel_count >= 3) {
            return response()->json([
                'message' => 'Karena riwayat pembatalan mendadak, akun Anda saat ini hanya bisa memesan dengan pembayaran QRIS.'
            ], 400);
        }

        $trip = Trip::findOrFail($request->trip_id);

        // PENTING: cancelOrder() tidak pernah mereset payment_status - jadi
        // order QRIS yang sudah dibayar lalu dibatalkan tetap payment_status
        // = 'paid' selamanya. Tanpa pengecualian status='cancelled' di sini,
        // customer PERMANEN tidak bisa pesan lagi di trip yang sama walau
        // pesanan sebelumnya sudah mereka batalkan sendiri.
        $existingOrder = Order::where('trip_id', $trip->id)
            ->where('customer_id', auth()->id())
            ->where('status', '!=', 'cancelled')
            ->where(function($query) {
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

        // Sama seperti di atas: order cash yang dibatalkan tetap
        // payment_status = 'unpaid' selamanya (cancelOrder tidak
        // mereset field ini), jadi tanpa pengecualian ini, order LAMA
        // yang sudah dibatalkan malah "dihidupkan kembali" alih-alih
        // membuat order baru yang bersih.
        $pendingOrder = Order::where('trip_id', $trip->id)
            ->where('customer_id', auth()->id())
            ->where('payment_status', 'unpaid')
            ->where('status', '!=', 'cancelled')
            ->first();

        if ($pendingOrder) {
            $pendingOrder->update([
                'pickup_address' => $request->pickup_address,
                'drop_address' => $request->drop_address,
                'payment_method' => $request->payment_method,
            ]);
            $order = $pendingOrder;
        } else {
            $order = Order::create([
                'trip_id' => $trip->id,
                'customer_id' => auth()->id(),
                'pickup_address' => $request->pickup_address,
                'drop_address' => $request->drop_address,
                'price' => $trip->price,
                'payment_method' => $request->payment_method, 
                'status' => 'pending',
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

        $order = Order::with('trip.destinationPoint', 'itemOrder')->findOrFail($id);

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

        $order->update([
            'payment_proof' => $path,
            'payment_status' => 'waiting_confirmation',
            'status' => 'completed'
        ]);

        // Order barang -> kurangi sebesar berat barangnya (kg).
        // Order penumpang -> tetap 1 kursi seperti semula.
        $trip = $order->trip;
        if ($trip) {
            $amount = $this->capacityWeightForOrder($order);
            if ($trip->seat_available >= $amount) {
                $trip->decrement('seat_available', $amount);
            }
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
        $order = Order::with('trip', 'itemOrder')->findOrFail($id);

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

        if ($order->payment_method === 'cash' && $order->status !== 'completed') {
            $order->update(['status' => 'completed']);

            // Order barang -> kurangi sebesar berat barangnya (kg).
            // Order penumpang -> tetap 1 kursi seperti semula.
            $amount = $this->capacityWeightForOrder($order);
            if ($order->trip->seat_available >= $amount) {
                $order->trip->decrement('seat_available', $amount);
            }

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
            $order = \App\Models\Order::findOrFail($id);

            $order->update([
                'readiness_status' => 'no_show',
            ]);

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
        $order = Order::with('trip', 'itemOrder')->findOrFail($id);

        // simpan dulu sebelum status order diubah — untuk tahu apakah kursi
        // sudah sempat "terpakai" (dikurangi) waktu order ini lunas dulu
        $wasSeatReserved = $order->status === 'completed';
        
        $departureTime = Carbon::parse($order->trip->departure_date . ' ' . $order->trip->departure_time);
        $now = Carbon::now();
        $hoursDifference = $now->diffInHours($departureTime, false);

        if ($hoursDifference < 0) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan sudah tidak dapat dibatalkan karena waktu keberangkatan telah tiba/lewat.'
            ], 400);
        }

        // ================= PEMBAYARAN TUNAI =================
        if ($order->payment_method === 'cash') {

            $isLateCancel = $hoursDifference < 3;

            $order->update([
                'status' => 'cancelled',
                'refund_status' => 'not_applicable',
                'penalty_amount' => $isLateCancel ? (int) round($order->price * 0.2) : 0,
                'cancelled_at' => $now,
            ]);

            // KEMBALIKAN KURSI/KAPASITAS kalau sebelumnya sudah terpakai
            if ($wasSeatReserved && $order->trip) {
                $amount = $this->capacityWeightForOrder($order);
                $order->trip->increment('seat_available', $amount);
            }

            \App\Models\OrderQrSession::where('order_id', $id)->delete();

            if ($isLateCancel) {
                $customer = User::find($order->customer_id);
                $message = 'Pesanan tunai dibatalkan. Karena dilakukan kurang dari 3 jam sebelum keberangkatan, ini tercatat sebagai pembatalan mendadak.';

                if ($customer) {
                    $customer->increment('late_cancel_count');
                    $customer->refresh();

                    if ($customer->late_cancel_count >= 5) {
                        $customer->update(['status' => 'blocked']);
                        $message = 'Pesanan tunai dibatalkan. Karena riwayat pembatalan mendadak sudah berulang kali, akun Anda telah disuspend. Silakan hubungi admin untuk informasi lebih lanjut.';
                    } elseif ($customer->late_cancel_count >= 3) {
                        $message = 'Pesanan tunai dibatalkan. Karena riwayat pembatalan mendadak, akun Anda sekarang wajib menggunakan QRIS untuk pesanan berikutnya.';
                    }
                }

                return response()->json([
                    'success' => true,
                    'rule' => 'cash_late_cancel_penalty',
                    'message' => $message,
                ], 200);
            }

            return response()->json([
                'success' => true,
                'rule' => 'cash_cancelled',
                'message' => 'Pesanan tunai berhasil dibatalkan.'
            ], 200);
        }

        // ================= PEMBAYARAN QRIS (Sistem Bertingkat) =================
        if ($hoursDifference >= 12) {
            $percentage = 100;
            $rule = 'refund_100';
            $refundStatus = 'pending_100_percent';
            $message = 'Pembatalan berhasil. Anda berhak mendapatkan refund 100% karena dibatalkan lebih dari 12 jam sebelum keberangkatan. Segera hubungi mitra lewat menu Pesan untuk memberikan nomor rekening/e-wallet Anda, lalu konfirmasi di halaman Pesanan setelah dana diterima.';
        } elseif ($hoursDifference >= 3) {
            $percentage = 50;
            $rule = 'refund_50';
            $refundStatus = 'pending_50_percent';
            $message = 'Pembatalan berhasil. Anda berhak mendapatkan refund 50% karena dibatalkan 3-12 jam sebelum keberangkatan. Segera hubungi mitra lewat menu Pesan untuk memberikan nomor rekening/e-wallet Anda, lalu konfirmasi di halaman Pesanan setelah dana diterima.';
        } else {
            $percentage = 0;
            $rule = 'no_refund';
            $refundStatus = 'non_refundable';
            $message = 'Pembatalan berhasil. Karena dilakukan kurang dari 3 jam sebelum keberangkatan, dana QRIS dinyatakan hangus dan tidak ada refund.';
        }

        $refundAmount = (int) round($order->price * $percentage / 100);

        if ($order->payment_status === 'paid' && $refundAmount > 0) {
            $mitraId = $order->trip->mitra_id;

            $balance = DriverBalance::firstOrCreate(
                ['user_id' => $mitraId],
                ['balance' => 0]
            );
            $balance->decrement('balance', $refundAmount);

            BalanceTransaction::create([
                'user_id' => $mitraId,
                'order_id' => $order->id,
                'type' => 'debit',
                'amount' => $refundAmount,
                'description' => "Potongan saldo untuk refund {$percentage}% pembatalan order #{$order->id}",
            ]);
        }

        $order->update([
            'status' => 'cancelled',
            'refund_status' => $refundStatus,
            'refund_percentage' => $percentage,
            'refund_amount' => $refundAmount,
            'cancelled_at' => $now,
        ]);

        // KEMBALIKAN KURSI/KAPASITAS kalau sebelumnya sudah terpakai
        if ($wasSeatReserved && $order->trip) {
            $amount = $this->capacityWeightForOrder($order);
            $order->trip->increment('seat_available', $amount);
        }

        \App\Models\OrderQrSession::where('order_id', $id)->delete();

        return response()->json([
            'success' => true,
            'rule' => $rule,
            'refund_percentage' => $percentage,
            'refund_amount' => $refundAmount,
            'message' => $message,
        ], 200);
    }

    // ================= MITRA: KLAIM SUDAH TRANSFER REFUND =================
    public function mitraConfirmRefund(Request $request, $id)
    {
        $order = Order::with('trip')->findOrFail($id);

        if ($order->trip->mitra_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (!in_array($order->refund_status, ['pending_100_percent', 'pending_50_percent'])) {
            return response()->json([
                'message' => 'Order ini tidak sedang menunggu konfirmasi refund dari Anda.'
            ], 400);
        }

        $order->update([
            'refund_status' => 'mitra_claimed',
            'mitra_refund_confirmed_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Konfirmasi transfer refund berhasil dicatat. Menunggu konfirmasi penerimaan dari customer.',
            'order' => $order->fresh(),
        ], 200);
    }

    // ================= CUSTOMER: KONFIRMASI DANA DITERIMA =================
    public function customerConfirmRefund(Request $request, $id)
    {
        $order = Order::findOrFail($id);

        if ($order->customer_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($order->refund_status !== 'mitra_claimed') {
            return response()->json([
                'message' => 'Belum ada klaim transfer refund dari mitra untuk order ini.'
            ], 400);
        }

        $order->update([
            'refund_status' => 'refunded',
            'customer_refund_confirmed_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Terima kasih sudah konfirmasi. Refund untuk order ini dinyatakan selesai.',
            'order' => $order->fresh(),
        ], 200);
    }
}