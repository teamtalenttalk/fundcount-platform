<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CapitalTransaction extends Model
{
    use HasFactory;

    const TYPE_CONTRIBUTION = 'CONTRIBUTION';
    const TYPE_DISTRIBUTION = 'DISTRIBUTION';
    const TYPE_CAPITAL_CALL = 'CAPITAL_CALL';
    const TYPE_REDEMPTION = 'REDEMPTION';
    const TYPE_TRANSFER = 'TRANSFER';
    const TYPE_FEE = 'FEE';

    const TYPES = [
        self::TYPE_CONTRIBUTION,
        self::TYPE_DISTRIBUTION,
        self::TYPE_CAPITAL_CALL,
        self::TYPE_REDEMPTION,
        self::TYPE_TRANSFER,
        self::TYPE_FEE,
    ];

    protected $fillable = [
        'partner_id',
        'type',
        'amount',
        'date',
        'description',
        'reference',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:4',
            'date' => 'date',
        ];
    }

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }
}
