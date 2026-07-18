<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PickupPoint;

class PickupPointSeeder extends Seeder
{
    public function run(): void
    {
        $points = [

            // YOGYAKARTA
            [
                'city_id' => 1,
                'pos_name' => 'Pos 1',
                'address' => 'Patihan, Kecamatan Kraton, Kota Yogyakarta'
            ],
            [
                'city_id' => 1,
                'pos_name' => 'Pos 2',
                'address' => 'Terminal Giwangan Yogyakarta'
            ],
            [
                'city_id' => 1,
                'pos_name' => 'Pos 3',
                'address' => 'Stasiun Tugu Yogyakarta'
            ],

            // PURWOKERTO
            [
                'city_id' => 2,
                'pos_name' => 'Pos 1',
                'address' => 'Terminal Bulupitu Purwokerto'
            ],
            [
                'city_id' => 2,
                'pos_name' => 'Pos 2',
                'address' => 'Alun Alun Purwokerto'
            ],
            [
                'city_id' => 2,
                'pos_name' => 'Pos 3',
                'address' => 'Stasiun Purwokerto'
            ],

            // SOLO
            [
                'city_id' => 3,
                'pos_name' => 'Pos 1',
                'address' => 'Terminal Tirtonadi Solo'
            ],
            [
                'city_id' => 3,
                'pos_name' => 'Pos 2',
                'address' => 'Stasiun Solo Balapan'
            ],
            [
                'city_id' => 3,
                'pos_name' => 'Pos 3',
                'address' => 'Alun Alun Solo'
            ],
        ];

        foreach ($points as $point) {
            PickupPoint::create($point);
        }
    }
}