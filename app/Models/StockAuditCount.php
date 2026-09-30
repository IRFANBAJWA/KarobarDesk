<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockAuditCount extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'stock_audit_id',
        'stock_audit_item_id',
        'user_id',
        'counted_qty',
        'remarks',
        'counted_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'counted_qty' => 'decimal:3',
            'counted_at'  => 'datetime',
        ];
    }

    /**
     * Immutability enforcement (Section 22):
     * once the parent audit is finalized, no updates and no deletes.
     */
    protected static function booted(): void
    {
        static::updating(function (StockAuditCount $count) {
            if ($count->stockAudit?->isFinalized()) {
                throw new \RuntimeException('StockAuditCount is immutable after parent audit finalization. Update is not allowed.');
            }
        });

        static::deleting(function (StockAuditCount $count) {
            if ($count->stockAudit?->isFinalized()) {
                throw new \RuntimeException('StockAuditCount is immutable after parent audit finalization. Delete is not allowed.');
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

    public function stockAuditItem(): BelongsTo
    {
        return $this->belongsTo(StockAuditItem::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ---------------------------------------------------------------------
    // Scopes
    // ---------------------------------------------------------------------

    public function scopeForAudit($query, int $stockAuditId)
    {
        return $query->where('stock_audit_id', $stockAuditId);
    }

    public function scopeForAuditItem($query, int $stockAuditItemId)
    {
        return $query->where('stock_audit_item_id', $stockAuditItemId);
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeForItemAndUser($query, int $stockAuditItemId, int $userId)
    {
        return $query->where('stock_audit_item_id', $stockAuditItemId)
            ->where('user_id', $userId);
    }

    public function scopeBetween($query, $from, $to)
    {
        return $query->whereBetween('counted_at', [$from, $to]);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function isZero(): bool
    {
        return (float) $this->counted_qty === 0.0;
    }
}
