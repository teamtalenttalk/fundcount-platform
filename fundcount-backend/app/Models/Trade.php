<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Trade extends Model
{
    use HasFactory;

    const TYPE_BUY = 'BUY';
    const TYPE_SELL = 'SELL';
    const TYPE_SHORT = 'SHORT';
    const TYPE_COVER = 'COVER';
    const TYPE_DIVIDEND = 'DIVIDEND';
    const TYPE_INTEREST = 'INTEREST';
    const TYPE_TRANSFER = 'TRANSFER';

    const TRADE_TYPES = [
        self::TYPE_BUY,
        self::TYPE_SELL,
        self::TYPE_SHORT,
        self::TYPE_COVER,
        self::TYPE_DIVIDEND,
        self::TYPE_INTEREST,
        self::TYPE_TRANSFER,
    ];

    const STATUS_PENDING = 'PENDING';
    const STATUS_EXECUTED = 'EXECUTED';
    const STATUS_SETTLED = 'SETTLED';
    const STATUS_CANCELLED = 'CANCELLED';

    const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_EXECUTED,
        self::STATUS_SETTLED,
        self::STATUS_CANCELLED,
    ];

    protected $fillable = [
        'trade_number',
        'portfolio_id',
        'asset_id',
        'trade_type',
        'quantity',
        'price',
        'total_amount',
        'commission',
        'fees',
        'currency',
        'exchange_rate',
        'settlement_date',
        'trade_date',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:6',
            'price' => 'decimal:6',
            'total_amount' => 'decimal:4',
            'commission' => 'decimal:4',
            'fees' => 'decimal:4',
            'exchange_rate' => 'decimal:6',
            'settlement_date' => 'date',
            'trade_date' => 'date',
        ];
    }

    public function portfolio(): BelongsTo
    {
        return $this->belongsTo(Portfolio::class);
    }

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }
}
