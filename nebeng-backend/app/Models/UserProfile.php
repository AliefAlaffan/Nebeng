<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class UserProfile extends Model
{
    protected $fillable = [
        'user_id',
        'full_name',
        'birth_place',
        'birth_date',
        'gender',

        'nik',
        'religion',
        'address',

        // BANK
        'bank_name',
        'bank_account_name',
        'bank_account_number',
    ];

    protected $casts = [
        'birth_date' => 'date'
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}