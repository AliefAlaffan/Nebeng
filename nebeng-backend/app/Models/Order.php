<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Trip;
use App\Models\User;
use App\Models\ItemOrder;
use App\Models\OrderQrSession;

class Order extends Model
{
    protected $fillable = [
        'trip_id',
        'customer_id',
        'pickup_address',
        'drop_address',
        'price',
        'status',
        'item_order_id',
        'payment_method',
        'readiness_status',
    ];

    public function trip()
    {
        return $this->belongsTo(Trip::class);
    }

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function itemOrder()
    {
        return $this->belongsTo(ItemOrder::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function qrSessions()
    {
        return $this->hasMany(OrderQrSession::class);
    }
}