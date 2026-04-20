<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Benchmark extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'description',
        'provider',
    ];

    public function returns(): HasMany
    {
        return $this->hasMany(BenchmarkReturn::class);
    }

    public function portfolios(): HasMany
    {
        return $this->hasMany(Portfolio::class);
    }
}
