<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ItemPrice extends Model
{
    use HasFactory;

    protected $fillable = [
        'price_list_id',
        'item_id',
        'rate',
        'pack_rate',
        'is_active',
        'erpnext_modified_at',
        'sync_status',
        'last_synced_at',
    ];

    protected function casts(): array
    {
        return [
            'rate'                => 'decimal:2',
            'pack_rate'           => 'decimal:2',
            'is_active'           => 'boolean',
            'erpnext_modified_at' => 'datetime',
            'last_synced_at'      => 'datetime',
        ];
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    public function priceList(): BelongsTo
    {
        return $this->belongsTo(PriceList::class);
    }

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

    public function scopeFor($query, int $priceListId, int $itemId)
    {
        return $query->where('price_list_id', $priceListId)
            ->where('item_id', $itemId);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeSynced($query)
    {
        return $query->where('sync_status', 'synced');
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function isActive(): bool
    {
        return (bool) $this->is_active;
    }

    public function isSynced(): bool
    {
        return $this->sync_status === 'synced';
    }
}
