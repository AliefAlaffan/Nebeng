<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@nebeng.com'],
            [
                'name' => 'Alief Admin',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'phone' => '081122334455',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
        
        User::updateOrCreate(
            ['email' => 'posmitra@nebeng.com'],
            [
                'name' => 'Alief Pos Mitra',
                'password' => Hash::make('password'),
                'role' => 'pos_mitra', // Sesuaikan dengan string enum/role pos mitra di project kamu
                'phone' => '085544332211',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }
}