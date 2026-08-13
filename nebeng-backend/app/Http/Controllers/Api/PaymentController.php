<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    protected function configureMidtrans()
    {
        \Midtrans\Config::$serverKey = config('midtrans.server_key');
        \Midtrans\Config::$clientKey = config('midtrans.client_key');
        \Midtrans\Config::$isProduction = config('midtrans.is_production');
        \Midtrans\Config::$isSanitized = true;
        \Midtrans\Config::$is3ds = true;
    }

    public function createPayment(Request $request)
{
    $request->validate([
        'order_id' => 'required|integer|exists:orders,id'
    ]);

    $order = Order::findOrFail($request->order_id);

    if ($order->customer_id !== auth()->id()) {
        return response()->json(['message' => 'Unauthorized'], 403);
    }

    if ($order->status !== 'pending') {
        return response()->json([
            'message' => 'Order tidak dapat dibayar (status tidak pending)'
        ], 400);
    }

    $this->configureMidtrans();

    $params = [
        'transaction_details' => [
            'order_id' => (string) $order->id,
            'gross_amount' => (int) $order->price,
        ],
        'customer_details' => [
            'first_name' => optional($order->customer)->name ?? '',
            'email' => optional($order->customer)->email ?? '',
        ],
    ];

    try {

        $snapToken = \Midtrans\Snap::getSnapToken($params);

        return response()->json([
            'status' => true,
            'snap_token' => $snapToken
        ]);

    } catch (\Exception $e) {

        return response()->json([
            'status' => false,
            'message' => 'Gagal membuat token pembayaran',
            'error' => $e->getMessage()
        ], 500);

    }
}

    // Endpoint untuk menerima notification dari Midtrans (server-to-server)
    public function notification(Request $request)
    {
        $this->configureMidtrans();

        try {
            $notif = new \Midtrans\Notification();

            $transaction = $notif->transaction_status;
            $fraud = isset($notif->fraud_status) ? $notif->fraud_status : null;
            $orderId = $notif->order_id;

            $order = Order::find($orderId);
            if (! $order) {
                return response()->json(['message' => 'Order tidak ditemukan'], 404);
            }

            if ($transaction == 'capture') {
                if ($fraud == 'challenge') {
                    $order->status = 'challenge';
                } else {
                    $order->status = 'paid';
                }
            } elseif ($transaction == 'settlement') {
                $order->status = 'paid';
            } elseif ($transaction == 'pending') {
                $order->status = 'pending';
            } elseif ($transaction == 'deny') {
                $order->status = 'failed';
            } elseif ($transaction == 'expire') {
                $order->status = 'expired';
            } elseif ($transaction == 'cancel') {
                $order->status = 'cancelled';
            }

            $order->save();

            return response()->json(['status' => true, 'message' => 'Notification processed']);
        } catch (\Exception $e) {
            return response()->json(['status' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
