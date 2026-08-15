<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderComplaint;
use App\Models\User;
use Illuminate\Http\Request;

class OrderComplaintController extends Controller
{
    // ================= CUSTOMER: AJUKAN LAPORAN =================
    public function store(Request $request, $orderId)
    {
        $request->validate([
            'description' => 'required|string|min:10|max:1000',
        ]);

        $order = Order::with('trip')->findOrFail($orderId);

        if ($order->customer_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Order boleh dilaporkan pada 2 kondisi:
        // 1. Sudah lewat waktu wajar tapi mitra belum juga transfer (status masih pending_X_percent)
        // 2. Mitra KLAIM sudah transfer (mitra_claimed), tapi customer merasa belum menerima dana
        if ($order->status !== 'cancelled' || $order->payment_method !== 'qris' || !in_array($order->refund_status, ['pending_100_percent', 'pending_50_percent', 'mitra_claimed'])) {
            return response()->json([
                'message' => 'Order ini tidak memenuhi syarat untuk dilaporkan (bukan pembatalan QRIS yang berhak refund, atau refund sudah selesai).'
            ], 400);
        }

        $existing = OrderComplaint::where('order_id', $order->id)->first();
        if ($existing) {
            return response()->json([
                'message' => 'Anda sudah pernah melaporkan order ini sebelumnya. Silakan tunggu admin menindaklanjuti.',
                'complaint' => $existing,
            ], 409);
        }

        $complaint = OrderComplaint::create([
            'order_id' => $order->id,
            'customer_id' => $request->user()->id,
            'mitra_id' => $order->trip->mitra_id,
            'type' => 'refund_not_received',
            'description' => $request->description,
            'status' => 'pending',
        ]);

        // Tandai order sebagai "disputed" supaya langsung terlihat di dashboard
        // admin sebagai kasus yang butuh perhatian - terutama kasus rawan
        // konflik: mitra sudah klaim transfer, tapi customer bilang belum terima.
        $order->update(['refund_status' => 'disputed']);

        return response()->json([
            'success' => true,
            'message' => 'Laporan berhasil dikirim. Admin akan segera meninjau dan menindaklanjuti.',
            'complaint' => $complaint,
        ], 201);
    }

    // ================= CUSTOMER: CEK STATUS LAPORAN UNTUK 1 ORDER =================
    public function show(Request $request, $orderId)
    {
        $complaint = OrderComplaint::where('order_id', $orderId)
            ->where('customer_id', $request->user()->id)
            ->first();

        return response()->json($complaint);
    }

    // ================= ADMIN: DAFTAR SEMUA LAPORAN =================
    public function adminIndex()
    {
        $complaints = OrderComplaint::with(['order', 'customer', 'mitra'])
            ->latest()
            ->get();

        return response()->json($complaints);
    }

    // ================= ADMIN: AMBIL TINDAKAN =================
    public function adminAct(Request $request, $id)
    {
        $request->validate([
            'action' => 'required|in:warn,block_mitra,mark_refund_done',
            'admin_notes' => 'nullable|string|max:1000',
        ]);

        $complaint = OrderComplaint::with('order', 'mitra')->findOrFail($id);

        switch ($request->action) {
            case 'warn':
                $complaint->update([
                    'status' => 'reviewed',
                    'admin_action' => 'warned_mitra',
                    'admin_notes' => $request->admin_notes,
                ]);
                $message = 'Teguran berhasil dicatat untuk mitra.';
                break;

            case 'block_mitra':
                if ($complaint->mitra) {
                    $complaint->mitra->update(['status' => 'blocked']);
                }
                $complaint->update([
                    'status' => 'resolved',
                    'admin_action' => 'blocked_mitra',
                    'admin_notes' => $request->admin_notes,
                ]);
                $message = 'Mitra berhasil diblokir.';
                break;

            case 'mark_refund_done':
                if ($complaint->order) {
                    $complaint->order->update(['refund_status' => 'refunded']);
                }
                $complaint->update([
                    'status' => 'resolved',
                    'admin_action' => 'marked_refund_done',
                    'admin_notes' => $request->admin_notes,
                ]);
                $message = 'Refund ditandai sudah selesai diproses.';
                break;
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'complaint' => $complaint->fresh(['order', 'customer', 'mitra']),
        ], 200);
    }

    // ================= ADMIN: PANTAUAN TRANSPARAN SEMUA REFUND =================
    // Menampilkan SEMUA order yang refund-nya masih berjalan (belum tuntas),
    // baik yang sudah dilaporkan formal maupun belum, supaya admin bisa
    // memantau proaktif - bukan cuma menunggu ada laporan masuk.
    public function adminRefundOverview()
    {
        $orders = Order::with(['customer', 'trip.mitra'])
            ->whereIn('refund_status', ['pending_100_percent', 'pending_50_percent', 'mitra_claimed', 'disputed'])
            ->latest('cancelled_at')
            ->get();

        return response()->json($orders);
    }
}