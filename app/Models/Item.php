<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Item extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'erpnext_item_code',
        'item_name',
        'item_group',
        'brand',
        'description',
        'uom',
        'stock_uom',
        'weight',
        'has_variants',
        'variant_of',
        'is_stock_item',
        'is_active',
        'is_disabled',
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
            'weight'        => 'decimal:3',
            'has_variants'  => 'boolean',
            'is_stock_item' => 'boolean',
            'is_active'     => 'boolean',
            'is_disabled'   => 'boolean',
            'synced_at'     => 'datetime',
        ];
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    /**
     * Prices for this item across price lists.
     */
    public function itemPrices(): HasMany
    {
        return $this->hasMany(ItemPrice::class);
    }

    /**
     * Current stock snapshot rows for this item across companies.
     */
    public function itemStocks(): HasMany
    {
        return $this->hasMany(ItemStock::class);
    }

    /**
     * Stock ledger entries for this item.
     */
    public function stockLedgers(): HasMany
    {
        return $this->hasMany(StockLedger::class);
    }

    /**
     * Sales invoice line items referencing this item.
     */
    public function salesInvoiceItems(): HasMany
    {
        return $this->hasMany(SalesInvoiceItem::class);
    }

    /**
     * Purchase order line items referencing this item.
     */
    public function purchaseOrderItems(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    /**
     * Purchase receipt line items referencing this item.
     */
    public function purchaseReceiptItems(): HasMany
    {
        return $this->hasMany(PurchaseReceiptItem::class);
    }

    /**
     * Per-company display statuses for this item.
     */
    public function companyItemStatuses(): HasMany
    {
        return $this->hasMany(CompanyItemStatus::class);
    }

    /**
     * Stock audit snapshot lines for this item.
     */
    public function stockAuditItems(): HasMany
    {
        return $this->hasMany(StockAuditItem::class);
    }

    /**
     * Stock audit physical counts for this item.
     */
    public function stockAuditCounts(): HasMany
    {
        return $this->hasMany(StockAuditCount::class);
    }

    // ---------------------------------------------------------------------
    // Scopes
    // ---------------------------------------------------------------------

    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where('is_disabled', false);
    }

    public function scopeStockItems($query)
    {
        return $query->where('is_stock_item', true);
    }

    public function scopeByCode($query, string $erpnextItemCode)
    {
        return $query->where('erpnext_item_code', $erpnextItemCode);
    }

    public function scopeVariantsOf($query, string $templateCode)
    {
        return $query->where('variant_of', $templateCode);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function isVariant(): bool
    {
        return $this->variant_of !== null;
    }

    public function hasVariants(): bool
    {
        return (bool) $this->has_variants;
    }

    public function isActive(): bool
    {
        return (bool) $this->is_active && ! (bool) $this->is_disabled;
    }
}
