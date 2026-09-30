<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PriceList extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'erpnext_name',
        'currency',
        'selling',
        'buying',
        'is_active',
        'synced_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'selling'   => 'boolean',
            'buying'    => 'boolean',
            'is_active' => 'boolean',
            'synced_at' => 'datetime',
        ];
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    /**
     * Item prices belonging to this price list.
     */
    public function itemPrices(): HasMany
    {
        return $this->hasMany(ItemPrice::class);
    }

    /**
     * Till operations assigned to this price list.
     * One till operation = one price list (Section 18).
     */
    public function tillOperations(): HasMany
    {
        return $this->hasMany(TillOperation::class);
    }

    // ---------------------------------------------------------------------
    // Scopes
    // ---------------------------------------------------------------------

    public function scopeSelling($query)
    {
        return $query->where('selling', true);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function isSelling(): bool
    {
        return (bool) $this->selling;
    }

    public function isActive(): bool
    {
        return (bool) $this->is_active;
    }
}
