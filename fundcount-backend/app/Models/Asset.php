<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Asset extends Model
{
    use HasFactory;

    const CLASS_EQUITY = 'EQUITY';
    const CLASS_FIXED_INCOME = 'FIXED_INCOME';
    const CLASS_DERIVATIVE = 'DERIVATIVE';
    const CLASS_PRIVATE_EQUITY = 'PRIVATE_EQUITY';
    const CLASS_REAL_ESTATE = 'REAL_ESTATE';
    const CLASS_COMMODITY = 'COMMODITY';
    const CLASS_CURRENCY = 'CURRENCY';
    const CLASS_CASH = 'CASH';
    const CLASS_OTHER = 'OTHER';

    const ASSET_CLASSES = [
        self::CLASS_EQUITY,
        self::CLASS_FIXED_INCOME,
        self::CLASS_DERIVATIVE,
        self::CLASS_PRIVATE_EQUITY,
        self::CLASS_REAL_ESTATE,
        self::CLASS_COMMODITY,
        self::CLASS_CURRENCY,
        self::CLASS_CASH,
        self::CLASS_OTHER,
    ];

    protected $fillable = [
        'symbol',
        'name',
        'asset_class',
        'sub_class',
        'currency',
        'exchange',
        'sector',
        'country',
        'current_price',
        'price_date',
        'is_active',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'current_price' => 'decimal:6',
            'price_date' => 'date',
            'is_active' => 'boolean',
            'metadata' => 'array',
        ];
    }

    public function positions(): HasMany
    {
        return $this->hasMany(Position::class);
    }

    public function trades(): HasMany
    {
        return $this->hasMany(Trade::class);
    }

    public function priceHistories(): HasMany
    {
        return $this->hasMany(PriceHistory::class);
    }
}
