<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JournalEntry extends Model
{
    use HasFactory;

    const STATUS_DRAFT = 'DRAFT';
    const STATUS_PENDING = 'PENDING';
    const STATUS_APPROVED = 'APPROVED';
    const STATUS_POSTED = 'POSTED';
    const STATUS_REVERSED = 'REVERSED';

    const STATUSES = [
        self::STATUS_DRAFT,
        self::STATUS_PENDING,
        self::STATUS_APPROVED,
        self::STATUS_POSTED,
        self::STATUS_REVERSED,
    ];

    protected $fillable = [
        'entry_number',
        'date',
        'description',
        'reference',
        'status',
        'is_recurring',
        'currency',
        'exchange_rate',
        'total_amount',
        'created_by_id',
        'approved_at',
        'posted_at',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'is_recurring' => 'boolean',
            'exchange_rate' => 'decimal:6',
            'total_amount' => 'decimal:4',
            'approved_at' => 'datetime',
            'posted_at' => 'datetime',
        ];
    }

    public function lines(): HasMany
    {
        return $this->hasMany(JournalLine::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }
}
