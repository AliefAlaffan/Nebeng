<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;

class PosDashboardController extends Controller
{
    public function stats()
    {
        // Nebeng Motor
        $nebengMotor = Order::where('status', 'completed')
            ->whereHas('trip', function ($q) {
                $q->where('vehicle_type', 'motor');
            })
            ->count();

        // Nebeng Mobil
        $nebengMobil = Order::where('status', 'completed')
            ->whereHas('trip', function ($q) {
                $q->where('vehicle_type', 'mobil');
            })
            ->count();

        // Nebeng Barang
        $nebengBarang = Order::where('status', 'completed')
            ->whereHas('trip', function ($q) {
                $q->where('vehicle_type', 'barang');
            })
            ->count();

        // Titip Barang
        // $titipBarang = Order::whereNotNull('item_order_id')
        //     ->where('status', 'completed')
        //     ->count();

        return response()->json([
            'nebeng_motor' => $nebengMotor,
            'nebeng_mobil' => $nebengMobil,
            'nebeng_barang' => $nebengBarang,
            // 'titip_barang' => $titipBarang
        ]);
    }
}