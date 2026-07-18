<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PickupPoint extends Model
{
    protected $fillable = [
        'city_id',
        'pos_name',
        'address',
        'latitude',
        'longitude'
    ];

    public function city()
    {
        return $this->belongsTo(City::class);
    }
}