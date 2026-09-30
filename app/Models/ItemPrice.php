<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ItemPrice extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'price_list_id',
        'item_id',
        'price_list_rate',
        'currency',
        'valid_from',
        'valid_upto',
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
            'price_list_rate' => 'decimal:2',
            'valid_from'      => 'date',
            'valid_upto'      => 'date',
            'is_active'       => 'boolean',
            'synced_at'       => 'datetime',
        ];
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    /**
     * Price list this rate belongs to.
     */
    public function priceList(): BelongsTo
    {
        return $this->belongsTo(PriceList::class);
    }

    /**
     * Item this rate applies to.
     */
    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    // ---------------------------------------------------------------------
    // Scopes
    // ---------------------------------------------------------------------

    public function scopeForPriceList($query, int $priceListId)
    {
        return $query->where('price_list_id', $priceListId);
    }

    public function scopeForItem($query, int $itemId)
    {
        return $query->where('item_id', $itemId);
    }

    /**
     * Match a specific price list + item pair.
     * Usage: ItemPrice::for(1, 42)->first();
     */
    public function scopeFor($query, int $priceListId, int $itemId)
    {
        return $query->where('price_list_id', $priceListId)
            ->where('item_id', $itemId);
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

    /**
     * Whether this rate is currently valid on a given date.
     * Defaults to today (Asia/Karachi business date).
     */
    public function isValidOn(?\DateTimeInterface $date = null): bool
    {
        $date = $date ?: now();

        if ($this->valid_from && $date < $this->valid_from) {
            return false;
        }

        if ($this->valid_upto && $date > $this->valid_upto) {
            return false;
        }

        return true;
    }
}
