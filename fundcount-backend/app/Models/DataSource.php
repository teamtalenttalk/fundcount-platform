<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DataSource extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'connection_url',
        'api_key',
        'schedule',
        'last_sync_at',
        'status',
        'config',
    ];

    protected function casts(): array
    {
        return [
            'last_sync_at' => 'datetime',
            'config' => 'array',
        ];
    }

    public function imports(): HasMany
    {
        return $this->hasMany(DataImport::class);
    }
}
