<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;

class AdminOrderController extends Controller
{
    public function index()
    {
        $orders = Order::with([
            'customer',
            'trip.mitra'
        ])
        ->latest()
        ->get();

        return response()->json($orders);
    }
}