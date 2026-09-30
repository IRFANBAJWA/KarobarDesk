<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockAuditItem extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'stock_audit_id',
        'item_id',
        'item_code',
        'item_name',
        'system_qty',
        'total_counted_qty',
        'difference',
        'discrepancy_reason',
        'decision',
        'verified_at',
        'verified_by',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'system_qty'        => 'decimal:3',
            'total_counted_qty' => 'decimal:3',
            'difference'        => 'decimal:3',
            'verified_at'       => 'datetime',
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

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    /**
     * Per-person counts for this audit item.
     */
    public function counts(): \Illuminate\Database\Eloquent\Relations\HasMany
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

    public function scopeVerified($query)
    {
        return $query->whereNotNull('verified_at');
    }

    public function scopeUnverified($query)
    {
        return $query->whereNull('verified_at');
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function hasDiscrepancy(): bool
    {
        return (float) $this->difference !== 0.0;
    }

    public function isVerified(): bool
    {
        return $this->verified_at !== null;
    }

    /**
     * Shortage means physical count is less than system stock.
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
