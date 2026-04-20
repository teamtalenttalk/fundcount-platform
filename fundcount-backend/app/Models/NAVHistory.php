<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NAVHistory extends Model
{
    use HasFactory;

    protected $table = 'nav_histories';

    protected $fillable = [
        'portfolio_id',
        'date',
        'nav',
        'total_assets',
        'total_liabilities',
        'shares_outstanding',
        'nav_per_share',
        'daily_return',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'nav' => 'decimal:4',
            'total_assets' => 'decimal:4',
            'total_liabilities' => 'decimal:4',
            'shares_outstanding' => 'decimal:6',
            'nav_per_share' => 'decimal:6',
            'daily_return' => 'decimal:6',
        ];
    }

    public function portfolio(): BelongsTo
    {
        return $this->belongsTo(Portfolio::class);
    }
}
