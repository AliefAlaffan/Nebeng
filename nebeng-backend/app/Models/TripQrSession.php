<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TripQrSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'trip_id',
        'token',
        'expired_at',
        'is_used',
        'purpose',
    ];
    
    public function trip()
    {
        return $this->belongsTo(Trip::class);
    }
}
