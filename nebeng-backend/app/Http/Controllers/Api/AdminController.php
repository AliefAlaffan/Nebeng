<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Trip;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function dashboard()
    {
        // ================= STATS =================
        $totalMitra = User::where('role', 'mitra')->count();
        $totalCustomer = User::where('role', 'customer')->count();
        // Status: pending, verified, Rejected, Blocked

        $verifMitra = User::where('role', 'mitra')
            ->where('status', 'verified')
            ->count();

        $verifCustomer = User::where('role', 'customer')
            ->where('status', 'verified')
            ->count();

        // ================= CHART =================
        $ordersByType = Trip::select(
                'vehicle_type',
                DB::raw('count(*) as total')
            )
            ->groupBy('vehicle_type')
            ->get();

        // ================= TOP ROUTE =================
        $topRoutes = Trip::select(
                'origin_point_id',
                'destination_point_id',
                DB::raw('count(*) as total')
            )
            ->with(['originPoint.city', 'destinationPoint.city'])
            ->groupBy('origin_point_id', 'destination_point_id')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        // ================= TABLE =================
        $latestMitra = User::where('role', 'mitra')
            ->latest()
            ->limit(5)
            ->get();

        $latestCustomer = User::where('role', 'customer')
            ->latest()
            ->limit(5)
            ->get();

        return response()->json([
            'stats' => [
                'mitra' => $totalMitra,
                'customer' => $totalCustomer,
                'verif_mitra' => $verifMitra,
                'verif_customer' => $verifCustomer,
            ],
            'orders_chart' => $ordersByType,
            'top_routes' => $topRoutes,
            'latest_mitra' => $latestMitra,
            'latest_customer' => $latestCustomer,
        ]);
    }

    public function mitraList(Request $request)
    {
        $query = User::where('role', 'mitra');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        } else {
            $query->where('status', '!=', 'blocked');
        }

        return $query->latest()->get();
    }

    public function customersList(Request $request)
    {
        $query = User::where('role', 'customer');

        // kalau ada filter status (dipakai untuk blocked page)
        if ($request->has('status')) {
            $query->where('status', $request->status);
        } else {
            // default: exclude blocked
            $query->where('status', '!=', 'blocked');
        }

        return $query->latest()->get();
    }

    public function blockUser($id)
    {
        $user = User::findOrFail($id);

        $user->update([
            'status' => 'blocked'
        ]);

        return response()->json([
            'message' => 'User berhasil diblokir'
        ]);
    }

    public function unblockUser($id)
    {
        $user = User::findOrFail($id);

        $user->update([
            'status' => 'verified'
        ]);

        return response()->json([
            'message' => 'User berhasil dibuka blokirnya'
        ]);
    }
}