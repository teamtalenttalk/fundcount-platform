<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Partner extends Model
{
    use HasFactory;

    const TYPE_GENERAL_PARTNER = 'GENERAL_PARTNER';
    const TYPE_LIMITED_PARTNER = 'LIMITED_PARTNER';
    const TYPE_MANAGING_MEMBER = 'MANAGING_MEMBER';
    const TYPE_MEMBER = 'MEMBER';

    const TYPES = [
        self::TYPE_GENERAL_PARTNER,
        self::TYPE_LIMITED_PARTNER,
        self::TYPE_MANAGING_MEMBER,
        self::TYPE_MEMBER,
    ];

    protected $fillable = [
        'name',
        'type',
        'email',
        'phone',
        'tax_id',
        'commitment_amount',
        'paid_in_capital',
        'distributed_amount',
        'ownership_pct',
        'is_active',
        'join_date',
    ];

    protected function casts(): array
    {
        return [
            'commitment_amount' => 'decimal:4',
            'paid_in_capital' => 'decimal:4',
            'distributed_amount' => 'decimal:4',
            'ownership_pct' => 'decimal:4',
            'is_active' => 'boolean',
            'join_date' => 'date',
        ];
    }

    public function capitalAccounts(): HasMany
    {
        return $this->hasMany(CapitalAccount::class);
    }

    public function allocations(): HasMany
    {
        return $this->hasMany(PartnerAllocation::class);
    }

    public function capitalTransactions(): HasMany
    {
        return $this->hasMany(CapitalTransaction::class);
    }

    public function investorProfile(): HasOne
    {
        return $this->hasOne(InvestorProfile::class);
    }
}
