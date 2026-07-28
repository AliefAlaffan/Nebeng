<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MitraVehicle;
use Illuminate\Http\Request;

class MitraVehicleController extends Controller
{
    /**
     * Mitra menambahkan data kendaraan (dipanggil saat proses verifikasi,
     * atau kapan saja setelah itu lewat halaman "Status Akun" / "Tambah Kendaraan").
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'type' => 'required|in:motor,mobil,barang',
            'brand' => 'required|string|max:100',
            'model' => 'nullable|string|max:100',
            'plate_number' => 'required|string|max:20',
            'color' => 'nullable|string|max:50',

            // wajib diisi khusus untuk mobil (dipakai sebagai batas maksimal
            // jumlah penumpang saat membuat tebengan mobil)
            'seat_capacity' => 'nullable|integer|min:1|max:20',

            'photo' => 'nullable|image|max:4096',
        ]);

        if ($validated['type'] === 'mobil' && empty($validated['seat_capacity'])) {
            return response()->json([
                'message' => 'Kapasitas maksimal penumpang wajib diisi untuk kendaraan mobil.',
            ], 422);
        }

        if ($request->hasFile('photo')) {
            $validated['photo'] = $request->file('photo')->store('mitra_vehicles', 'public');
        }

        $vehicle = MitraVehicle::create([
            ...$validated,
            'user_id' => $user->id,
        ]);

        return response()->json([
            'message' => 'Kendaraan berhasil ditambahkan',
            'vehicle' => $vehicle,
        ], 201);
    }

    /**
     * Daftar kendaraan milik mitra yang sedang login (buat halaman
     * Status Akun / profil mitra).
     */
    public function myVehicles(Request $request)
    {
        $vehicles = MitraVehicle::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($vehicles);
    }

    /**
     * Kapasitas maksimal kursi mobil mitra (dipakai NebengMobil.jsx saat
     * membuat tebengan supaya jumlah penumpang tidak melebihi kapasitas
     * kendaraan asli yang terdaftar).
     */
    public function myCarCapacity(Request $request)
    {
        $vehicle = MitraVehicle::where('user_id', $request->user()->id)
            ->where('type', 'mobil')
            ->orderByDesc('created_at')
            ->first();

        return response()->json([
            'has_vehicle' => (bool) $vehicle,
            'seat_capacity' => $vehicle->seat_capacity ?? null,
            'brand' => $vehicle->brand ?? null,
            'model' => $vehicle->model ?? null,
            'plate_number' => $vehicle->plate_number ?? null,
        ]);
    }

    public function update(Request $request, $id)
    {
        $vehicle = MitraVehicle::where('user_id', $request->user()->id)->findOrFail($id);

        $validated = $request->validate([
            'type' => 'sometimes|in:motor,mobil,barang',
            'brand' => 'sometimes|string|max:100',
            'model' => 'nullable|string|max:100',
            'plate_number' => 'sometimes|string|max:20',
            'color' => 'nullable|string|max:50',
            'seat_capacity' => 'nullable|integer|min:1|max:20',
        ]);

        $vehicle->update($validated);

        return response()->json([
            'message' => 'Kendaraan berhasil diperbarui',
            'vehicle' => $vehicle,
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $vehicle = MitraVehicle::where('user_id', $request->user()->id)->findOrFail($id);
        $vehicle->delete();

        return response()->json(['message' => 'Kendaraan berhasil dihapus']);
    }

    // ================= ADMIN =================

    /**
     * Daftar seluruh kendaraan mitra untuk halaman Admin > Kendaraan Mitra.
     */
    public function adminIndex(Request $request)
    {
        $query = MitraVehicle::with('user:id,name,avatar');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('brand', 'like', "%{$search}%")
                    ->orWhere('plate_number', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $vehicles = $query->orderByDesc('created_at')->paginate(10);

        return response()->json($vehicles);
    }

    public function adminShow($id)
    {
        $vehicle = MitraVehicle::with('user')->findOrFail($id);

        return response()->json($vehicle);
    }

    public function adminUpdate(Request $request, $id)
    {
        $vehicle = MitraVehicle::findOrFail($id);

        $validated = $request->validate([
            'type' => 'sometimes|in:motor,mobil,barang',
            'brand' => 'sometimes|string|max:100',
            'model' => 'nullable|string|max:100',
            'plate_number' => 'sometimes|string|max:20',
            'color' => 'nullable|string|max:50',
            'seat_capacity' => 'nullable|integer|min:1|max:20',
        ]);

        $vehicle->update($validated);

        return response()->json([
            'message' => 'Kendaraan berhasil diperbarui',
            'vehicle' => $vehicle,
        ]);
    }
}