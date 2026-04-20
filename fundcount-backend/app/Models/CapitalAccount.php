<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CapitalAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'partner_id',
        'period_start',
        'period_end',
        'beginning_balance',
        'contributions',
        'withdrawals',
        'income_allocation',
        'expense_allocation',
        'gain_loss_allocation',
        'management_fee',
        'performance_fee',
        'ending_balance',
    ];

    protected function casts(): array
    {
        return [
            'period_start' => 'date',
            'period_end' => 'date',
            'beginning_balance' => 'decimal:4',
            'contributions' => 'decimal:4',
            'withdrawals' => 'decimal:4',
            'income_allocation' => 'decimal:4',
            'expense_allocation' => 'decimal:4',
            'gain_loss_allocation' => 'decimal:4',
            'management_fee' => 'decimal:4',
            'performance_fee' => 'decimal:4',
            'ending_balance' => 'decimal:4',
        ];
    }

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }
}
