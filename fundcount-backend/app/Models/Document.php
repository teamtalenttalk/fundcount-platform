<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Document extends Model
{
    use HasFactory;

    const TYPE_STATEMENT = 'STATEMENT';
    const TYPE_REPORT = 'REPORT';
    const TYPE_TAX_DOCUMENT = 'TAX_DOCUMENT';
    const TYPE_LEGAL = 'LEGAL';
    const TYPE_CORRESPONDENCE = 'CORRESPONDENCE';
    const TYPE_OTHER = 'OTHER';

    const TYPES = [
        self::TYPE_STATEMENT,
        self::TYPE_REPORT,
        self::TYPE_TAX_DOCUMENT,
        self::TYPE_LEGAL,
        self::TYPE_CORRESPONDENCE,
        self::TYPE_OTHER,
    ];

    protected $fillable = [
        'name',
        'type',
        'category',
        'file_path',
        'file_size',
        'mime_type',
        'uploaded_by_id',
        'is_public',
        'tags',
    ];

    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
            'is_public' => 'boolean',
            'tags' => 'array',
        ];
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by_id');
    }
}
