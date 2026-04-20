<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BenchmarkReturn extends Model
{
    use HasFactory;

    protected $fillable = [
        'benchmark_id',
        'date',
        'daily_return',
        'mtd_return',
        'ytd_return',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'daily_return' => 'decimal:6',
            'mtd_return' => 'decimal:6',
            'ytd_return' => 'decimal:6',
        ];
    }

    public function benchmark(): BelongsTo
    {
        return $this->belongsTo(Benchmark::class);
    }
}
