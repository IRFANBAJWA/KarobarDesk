<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockAuditCount extends Model
{
    use HasFactory;

    protected $table = 'stock_audit_counts';

    protected $fillable = [
        'stock_audit_item_id',
        'user_id',
        'role_area',
        'physical_qty',
        'remarks',
        'entered_at',
    ];

    protected function casts(): array
    {
        return [
            'physical_qty' => 'decimal:3',
            'entered_at'   => 'datetime',
        ];
    }

    /**
     * Immutability enforcement (Section 22):
     * once the parent audit is finalized, no updates and no deletes.
     * Parent audit resolved via stockAuditItem.
     */
    protected static function booted(): void
    {
        static::updating(function (StockAuditCount $count) {
            if ($count->stockAuditItem?->stockAudit?->isFinalized()) {
                throw new \RuntimeException('StockAuditCount is immutable after parent audit finalization. Update is not allowed.');
            }
        });

        static::deleting(function (StockAuditCount $count) {
            if ($count->stockAuditItem?->stockAudit?->isFinalized()) {
                throw new \RuntimeException('StockAuditCount is immutable after parent audit finalization. Delete is not allowed.');
            }
        });
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

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

    public function scopeRoleArea($query, string $roleArea)
    {
        return $query->where('role_area', $roleArea);
    }

    public function scopeShop($query)
    {
        return $query->where('role_area', 'shop');
    }

    public function scopeOnline($query)
    {
        return $query->where('role_area', 'online');
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function isZero(): bool
    {
        return (float) $this->physical_qty === 0.0;
    }
}
