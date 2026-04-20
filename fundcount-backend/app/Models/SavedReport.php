<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SavedReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'description',
        'config',
        'schedule',
        'last_run_at',
    ];

    protected function casts(): array
    {
        return [
            'config' => 'array',
            'last_run_at' => 'datetime',
        ];
    }
}
