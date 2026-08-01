<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RewardTransaction extends Model
{
    protected $fillable = [
        'user_id',
        'reward_id',
        'type',
        'points',
        'description'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reward()
    {
        return $this->belongsTo(Reward::class);
    }
}