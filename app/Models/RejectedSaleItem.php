<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RejectedSaleItem extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'rejected_sale_id',
        'item_id',
        'item_code',
        'item_name',
        'qty',
        'unit_price',
        'sale_price',
        'line_discount',
        'line_total',
        'is_b',
        'is_set',
        'is_b_reason',
        'return_reason',
        'discount_reason',
        'remarks',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'qty'             => 'decimal:3',
            'unit_price'      => 'decimal:2',
            'sale_price'      => 'decimal:2',
            'line_discount'   => 'decimal:2',
            'line_total'      => 'decimal:2',
            'is_b'            => 'boolean',
            'is_set'          => 'boolean',
        ];
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    /**
     * Parent rejected sale header.
     */
    public function rejectedSale(): BelongsTo
    {
        return $this->belongsTo(RejectedSale::class);
    }

    /**
     * Item reference. Nullable — the item_id might not exist if the
     * rejection happened because the item was removed from the mirror.
     * Snapshots (item_code, item_name) preserve the truth.
     */
    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    // ---------------------------------------------------------------------
    // Scopes
    // ---------------------------------------------------------------------

    public function scopeForRejectedSale($query, int $rejectedSaleId)
    {
        return $query->where('rejected_sale_id', $rejectedSaleId);
    }

    public function scopeForItem($query, int $itemId)
    {
        return $query->where('item_id', $itemId);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function isB(): bool
    {
        return (bool) $this->is_b;
    }

    public function isSet(): bool
    {
        return (bool) $this->is_set;
    }
}
