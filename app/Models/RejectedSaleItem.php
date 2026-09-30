<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RejectedSaleItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'rejected_sale_id',
        'item_id',
        'item_code',
        'item_name',
        'uom',
        'qty',
        'unit_price',
        'line_discount',
        'line_total',
        'was_problem_item',
    ];

    protected function casts(): array
    {
        return [
            'qty'              => 'decimal:3',
            'unit_price'       => 'decimal:2',
            'line_discount'    => 'decimal:2',
            'line_total'       => 'decimal:2',
            'was_problem_item' => 'boolean',
        ];
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    public function rejectedSale(): BelongsTo
    {
        return $this->belongsTo(RejectedSale::class);
    }

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

    public function scopeProblemItems($query)
    {
        return $query->where('was_problem_item', true);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function wasProblemItem(): bool
    {
        return (bool) $this->was_problem_item;
    }
}
