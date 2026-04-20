<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Portfolio extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'description',
        'currency',
        'inception_date',
        'benchmark_id',
        'is_active',
        'total_value',
    ];

    protected function casts(): array
    {
        return [
            'inception_date' => 'date',
            'is_active' => 'boolean',
            'total_value' => 'decimal:4',
        ];
    }

    public function benchmark(): BelongsTo
    {
        return $this->belongsTo(Benchmark::class);
    }

    public function positions(): HasMany
    {
        return $this->hasMany(Position::class);
    }

    public function trades(): HasMany
    {
        return $this->hasMany(Trade::class);
    }

    public function navHistories(): HasMany
    {
        return $this->hasMany(NAVHistory::class);
    }

    public function performanceRecords(): HasMany
    {
        return $this->hasMany(PerformanceRecord::class);
    }

    public function partnerAllocations(): HasMany
    {
        return $this->hasMany(PartnerAllocation::class);
    }
}
