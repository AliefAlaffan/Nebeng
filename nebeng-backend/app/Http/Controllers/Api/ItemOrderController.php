<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\PickupPoint;
use App\Models\ItemOrder;
use App\Models\Trip;
use App\Models\Order;

class ItemOrderController extends Controller
{
    //
    public function store(Request $request)
{
    $validated = $request->validate([

        'trip_id' => 'required|exists:trips,id',

        'origin_point_id' =>
            'required|exists:pickup_points,id',

        'destination_point_id' =>
            'required|exists:pickup_points,id',

        'delivery_date' => 'required|date',

        'size' => 'required|in:dokumen,kecil,sedang,besar',

        'item_description' => 'nullable|string',

        'payment_method' =>
            'required|in:cash,qris,ewallet',

        'image' => 'nullable|image|max:2048'
    ]);

    // =========================
    // UPLOAD IMAGE
    // =========================

    $imagePath = null;

    if ($request->hasFile('image')) {

        $imagePath = $request
            ->file('image')
            ->store('item_images', 'public');
    }

    // =========================
    // CREATE ITEM ORDER
    // =========================

    $itemOrder = ItemOrder::create([

        'user_id' => auth()->id(),

        'origin_point_id' =>
            $validated['origin_point_id'],

        'destination_point_id' =>
            $validated['destination_point_id'],

        'delivery_date' =>
            $validated['delivery_date'],

        'size' => $validated['size'],

        'item_description' =>
            $validated['item_description'] ?? null,

        'image' => $imagePath,

        'status' => 'pending'
    ]);

    // =========================
    // AMBIL TRIP
    // =========================

    $trip = Trip::with([
        'originPoint',
        'destinationPoint'
    ])->findOrFail($validated['trip_id']);

    // =========================
    // CREATE ORDER
    // =========================

    $order = Order::create([

        'trip_id' => $trip->id,

        'item_order_id' => $itemOrder->id,

        'customer_id' => auth()->id(),

        'pickup_address' =>
            $trip->originPoint->address ?? 'Pickup Point',

        'drop_address' =>
            $trip->destinationPoint->address ?? 'Destination Point',

        'price' => $trip->price,

        'payment_method' =>
            $validated['payment_method'],

        'status' => 'pending'
    ]);

    return response()->json([

        'message' => 'Order barang berhasil dibuat',

        'order' => $order->load([
            'itemOrder',
            'customer',
            'trip'
        ]),

        'item_order' => $itemOrder

    ]);
}
    
}
