<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CourierAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'courier_partner_id',
        'account_name',
        'username',
        'password',
        'account_no',
        'location_id',
        'return_location',
        'insert_type',
        'sub_account_id',
        'is_default',
        'is_active',
    ];

    protected $hidden = [
        'password',
    ];

    protected function casts(): array
    {
        return [
            'password'   => 'encrypted',
            'is_default' => 'boolean',
            'is_active'  => 'boolean',
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

    public function locations(): HasMany
    {
        return $this->hasMany(CourierLocation::class);
    }

    public function parcels(): HasMany
    {
        return $this->hasMany(Parcel::class);
    }

    public function settlementImports(): HasMany
    {
        return $this->hasMany(ParcelSettlementImport::class);
    }

    public function syncLogs(): HasMany
    {
        return $this->hasMany(CourierSyncLog::class);
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

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function isActive(): bool
    {
        return (bool) $this->is_active;
    }

    public function isDefault(): bool
    {
        return (bool) $this->is_default;
    }
}
