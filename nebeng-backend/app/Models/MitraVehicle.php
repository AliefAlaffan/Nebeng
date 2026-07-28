<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MitraVehicle extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'brand',
        'model',
        'plate_number',
        'color',
        'seat_capacity',
        'photo',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}