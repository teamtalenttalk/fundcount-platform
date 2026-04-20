<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Position extends Model
{
    use HasFactory;

    protected $fillable = [
        'portfolio_id',
        'asset_id',
        'quantity',
        'avg_cost_basis',
        'market_value',
        'unrealized_pnl',
        'realized_pnl',
        'weight',
        'currency',
        'open_date',
        'close_date',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:6',
            'avg_cost_basis' => 'decimal:6',
            'market_value' => 'decimal:4',
            'unrealized_pnl' => 'decimal:4',
            'realized_pnl' => 'decimal:4',
            'weight' => 'decimal:4',
            'open_date' => 'date',
            'close_date' => 'date',
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
