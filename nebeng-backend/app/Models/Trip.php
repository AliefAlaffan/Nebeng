<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Services\Maps\OSRMService;
use App\Models\PickupPoint;

class Trip extends Model
{
    protected $fillable = [

        'mitra_id',

        'vehicle_type',

        'departure_date',
        'departure_time',

        'price',

        'seat_total',
        'seat_available',

        'baggage_capacity',

        'status',

        'origin_point_id',
        'destination_point_id',

        // =================
        // MAPS
        // =================

        'estimated_distance_km',
        'estimated_duration_min',
        'route_geojson'

    ];

    public function mitra()
    {
        return $this->belongsTo(User::class, 'mitra_id');
    }

    public function originPoint()
    {
        return $this->belongsTo(PickupPoint::class, 'origin_point_id');
    }

    public function destinationPoint()
    {
        return $this->belongsTo(PickupPoint::class, 'destination_point_id');
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function trackings()
    {
        return $this->hasMany(TripTracking::class);
    }

    public function reviews()
    {
        return $this->hasMany(TripReview::class);
    }

}