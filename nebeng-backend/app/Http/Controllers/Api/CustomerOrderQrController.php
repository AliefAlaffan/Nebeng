<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderQrSession;
use Illuminate\Support\Str;
use Carbon\Carbon;

class CustomerOrderQrController extends Controller
{
    public function generate($orderId)
    {
        $order = Order::findOrFail($orderId);

        // QR dipakai buat check-in SEBELUM/SAAT boarding (di-scan POS Mitra),
        // jadi tidak boleh disyaratkan trip sudah 'completed' - itu baru
        // terjadi setelah perjalanan berakhir. Yang wajar menghalangi
        // generate QR cuma order yang sudah dibatalkan.
        if ($order->status === 'cancelled') {
            return response()->json([
                'message' => 'Order ini sudah dibatalkan'
            ], 400);
        }

        $existing = OrderQrSession::where('order_id', $order->id)
            ->where('is_used', false)
            ->where('expired_at', '>', now())
            ->latest()
            ->first();

        if ($existing) {
            return response()->json([
                'order_id' => $order->id,
                'token' => $existing->token,
                'expired_at' => $existing->expired_at,
                'is_existing' => true,
            ]);
        }

        $session = OrderQrSession::create([
            'order_id' => $order->id,
            'token' => Str::random(40),
            'expired_at' => Carbon::now()->addHours(3),
        ]);

        return response()->json([
            'order_id' => $order->id,
            'token' => $session->token,
            'expired_at' => $session->expired_at,
            'is_existing' => false,
        ]);
    }
}