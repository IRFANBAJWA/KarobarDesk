<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockAuditItem extends Model
{
    use HasFactory;

    protected $table = 'stock_audit_items';

    protected $fillable = [
        'stock_audit_id',
        'item_id',
        'system_qty',
        'total_counted_qty',
        'difference',
        'discrepancy_reason',
        'decision',
    ];

    protected function casts(): array
    {
        return [
            'system_qty'        => 'decimal:3',
            'total_counted_qty' => 'decimal:3',
            'difference'        => 'decimal:3',
        ];
    }

    /**
     * Immutability enforcement (Section 22):
     * once the parent audit is finalized, no updates and no deletes.
     */
    protected static function booted(): void
    {
        static::updating(function (StockAuditItem $item) {
            if ($item->stockAudit?->isFinalized()) {
                throw new \RuntimeException('StockAuditItem is immutable after parent audit finalization. Update is not allowed.');
            }
        });

        static::deleting(function (StockAuditItem $item) {
            if ($item->stockAudit?->isFinalized()) {
                throw new \RuntimeException('StockAuditItem is immutable after parent audit finalization. Delete is not allowed.');
            }
        });
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    public function stockAudit(): BelongsTo
    {
        return $this->belongsTo(StockAudit::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    public function counts(): HasMany
    {
        return $this->hasMany(StockAuditCount::class, 'stock_audit_item_id');
    }

    // ---------------------------------------------------------------------
    // Scopes
    // ---------------------------------------------------------------------

    public function scopeForAudit($query, int $stockAuditId)
    {
        return $query->where('stock_audit_id', $stockAuditId);
    }

    public function scopeForItem($query, int $itemId)
    {
        return $query->where('item_id', $itemId);
    }

    public function scopeWithDiscrepancy($query)
    {
        return $query->where('difference', '!=', 0);
    }

    public function scopeWithoutDiscrepancy($query)
    {
        return $query->where('difference', 0);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function hasDiscrepancy(): bool
    {
        return (float) $this->difference !== 0.0;
    }

    /**
     * Section 22: difference = system_qty - total_counted_qty.
     * Positive difference = shortage. Negative = excess.
     */
    public function isShortage(): bool
    {
        return (float) $this->difference > 0;
    }

    public function isExcess(): bool
    {
        return (float) $this->difference < 0;
    }
}
