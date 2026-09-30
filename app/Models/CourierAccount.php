<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CourierAccount extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'company_id',
        'courier_partner_id',
        'username',
        'password',
        'account_no',
        'location_id',
        'return_location',
        'insert_type',
        'sub_account_id',
        'is_active',
        'last_tested_at',
        'last_error',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password'       => 'encrypted',
            'is_active'      => 'boolean',
            'last_tested_at' => 'datetime',
        ];
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function courierPartner(): BelongsTo
    {
        return $this->belongsTo(CourierPartner::class);
    }

    /**
     * Locations known for this account (from M&P Get_locations).
     */
    public function locations(): HasMany
    {
        return $this->hasMany(CourierLocation::class);
    }

    /**
     * Parcels booked through this account.
     */
    public function parcels(): HasMany
    {
        return $this->hasMany(Parcel::class);
    }

    /**
     * Settlement imports processed for this account.
     */
    public function settlementImports(): HasMany
    {
        return $this->hasMany(ParcelSettlementImport::class);
    }

    // ---------------------------------------------------------------------
    // Scopes
    // ---------------------------------------------------------------------

    public function scopeForCompany($query, int $companyId)
    {
        return $query->where('company_id', $companyId);
    }

    public function scopeForPartner($query, int $partnerId)
    {
        return $query->where('courier_partner_id', $partnerId);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function isActive(): bool
    {
        return (bool) $this->is_active;
    }
}
