<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourierLocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'courier_account_id',
        'location_id',
        'location_name',
        'location_address',
        'is_default',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
        ];
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    public function courierAccount(): BelongsTo
    {
        return $this->belongsTo(CourierAccount::class);
    }

    // ---------------------------------------------------------------------
    // Scopes
    // ---------------------------------------------------------------------

    public function scopeForAccount($query, int $courierAccountId)
    {
        return $query->where('courier_account_id', $courierAccountId);
    }

    public function scopeByLocationId($query, string $locationId)
    {
        return $query->where('location_id', $locationId);
    }

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function isDefault(): bool
    {
        return (bool) $this->is_default;
    }
}
