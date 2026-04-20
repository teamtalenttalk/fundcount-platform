<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerAllocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'partner_id',
        'portfolio_id',
        'allocation_pct',
        'class_type',
        'is_active',
        'effective_date',
    ];

    protected function casts(): array
    {
        return [
            'allocation_pct' => 'decimal:4',
            'is_active' => 'boolean',
            'effective_date' => 'date',
        ];
    }

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    public function portfolio(): BelongsTo
    {
        return $this->belongsTo(Portfolio::class);
    }
}
