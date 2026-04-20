<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PerformanceRecord extends Model
{
    use HasFactory;

    const PERIOD_DAILY = 'DAILY';
    const PERIOD_WEEKLY = 'WEEKLY';
    const PERIOD_MONTHLY = 'MONTHLY';
    const PERIOD_QUARTERLY = 'QUARTERLY';
    const PERIOD_YEARLY = 'YEARLY';

    const PERIOD_TYPES = [
        self::PERIOD_DAILY,
        self::PERIOD_WEEKLY,
        self::PERIOD_MONTHLY,
        self::PERIOD_QUARTERLY,
        self::PERIOD_YEARLY,
    ];

    protected $fillable = [
        'portfolio_id',
        'date',
        'period_type',
        'total_return',
        'benchmark_return',
        'alpha_return',
        'allocation_effect',
        'selection_effect',
        'interaction_effect',
        'currency_effect',
        'sharpe_ratio',
        'volatility',
        'max_drawdown',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'total_return' => 'decimal:6',
            'benchmark_return' => 'decimal:6',
            'alpha_return' => 'decimal:6',
            'allocation_effect' => 'decimal:6',
            'selection_effect' => 'decimal:6',
            'interaction_effect' => 'decimal:6',
            'currency_effect' => 'decimal:6',
            'sharpe_ratio' => 'decimal:6',
            'volatility' => 'decimal:6',
            'max_drawdown' => 'decimal:6',
        ];
    }

    public function portfolio(): BelongsTo
    {
        return $this->belongsTo(Portfolio::class);
    }
}
