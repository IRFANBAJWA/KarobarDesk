<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockLedger extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'warehouse',
        'item_id',
        'qty',
        'balance_after',
        'reference_type',
        'reference_id',
        'notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'qty'           => 'decimal:3',
            'balance_after' => 'decimal:3',
        ];
    }

    /**
     * Stock ledger is append-only (Section 20).
     */
    protected static function booted(): void
    {
        static::updating(function () {
            throw new \RuntimeException('StockLedger is append-only. Update is not allowed.');
        });

        static::deleting(function () {
            throw new \RuntimeException('StockLedger is append-only. Delete is not allowed.');
        });
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /*
     * Reference resolution note:
     *
     * `reference_type` uses short strings — 'sale', 'return',
     * 'purchase_receipt', 'adjustment', 'transfer', 'opening' (Section 20).
     *
     * No `reference()` relationship is defined here by design.
     * If polymorphic eager-loading is needed later, register a morph map
     * in AppServiceProvider::boot() and add a `reference()` morphTo method.
     */

    // ---------------------------------------------------------------------
    // Scopes
    // ---------------------------------------------------------------------

    public function scopeForCompany($query, int $companyId)
    {
        return $query->where('company_id', $companyId);
    }

    public function scopeForWarehouse($query, string $warehouse)
    {
        return $query->where('warehouse', $warehouse);
    }

    public function scopeForItem($query, int $itemId)
    {
        return $query->where('item_id', $itemId);
    }

    public function scopeReferenceType($query, string $referenceType)
    {
        return $query->where('reference_type', $referenceType);
    }

    public function scopeReferenceId($query, int $referenceId)
    {
        return $query->where('reference_id', $referenceId);
    }

    public function scopeForReference($query, string $referenceType, int $referenceId)
    {
        return $query->where('reference_type', $referenceType)
            ->where('reference_id', $referenceId);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function isIncrease(): bool
    {
        return (float) $this->qty > 0;
    }

    public function isDecrease(): bool
    {
        return (float) $this->qty < 0;
    }
}
