<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SosLog extends Model // Pastikan ini SosLog
{
    protected $fillable = ['trip_id', 'user_id', 'latitude', 'longitude', 'status'];
}