<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Item extends Model
{
    use HasFactory;

    protected $fillable = [
        'erpnext_item_code',
        'item_name',
        'item_group',
        'brand',
        'uom',
        'barcode',
        'alias',
        'description',
        'weight',
        'weight_uom',
        'cost_price',
        'standard_rate',
        'last_purchase_rate',
        'average_rate',
        'tax_rate',
        'is_stock_item',
        'is_taxable',
        'is_active',
        'has_variants',
        'woocommerce_id',
        'erpnext_modified_at',
        'sync_status',
        'last_synced_at',
    ];

    protected function casts(): array
    {
        return [
            'weight'              => 'decimal:3',
            'cost_price'          => 'decimal:2',
            'standard_rate'       => 'decimal:2',
            'last_purchase_rate'  => 'decimal:2',
            'average_rate'        => 'decimal:2',
            'tax_rate'            => 'decimal:2',
            'is_stock_item'       => 'boolean',
            'is_taxable'          => 'boolean',
            'is_active'           => 'boolean',
            'has_variants'        => 'boolean',
            'woocommerce_id'      => 'integer',
            'erpnext_modified_at' => 'datetime',
            'last_synced_at'      => 'datetime',
        ];
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    public function itemPrices(): HasMany
    {
        return $this->hasMany(ItemPrice::class);
    }

    public function itemStocks(): HasMany
    {
        return $this->hasMany(ItemStock::class);
    }

    public function stockLedgers(): HasMany
    {
        return $this->hasMany(StockLedger::class);
    }

    public function salesInvoiceItems(): HasMany
    {
        return $this->hasMany(SalesInvoiceItem::class);
    }

    public function purchaseOrderItems(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    public function purchaseReceiptItems(): HasMany
    {
        return $this->hasMany(PurchaseReceiptItem::class);
    }

    public function companyItemStatuses(): HasMany
    {
        return $this->hasMany(CompanyItemStatus::class);
    }

    public function stockAuditItems(): HasMany
    {
        return $this->hasMany(StockAuditItem::class);
    }

    public function rejectedSaleItems(): HasMany
    {
        return $this->hasMany(RejectedSaleItem::class);
    }

    // ---------------------------------------------------------------------
    // Scopes
    // ---------------------------------------------------------------------

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeStockItems($query)
    {
        return $query->where('is_stock_item', true);
    }

    public function scopeByCode($query, string $erpnextItemCode)
    {
        return $query->where('erpnext_item_code', $erpnextItemCode);
    }

    public function scopeSynced($query)
    {
        return $query->where('sync_status', 'synced');
    }

    public function scopePending($query)
    {
        return $query->where('sync_status', 'pending');
    }

    public function scopeFailed($query)
    {
        return $query->where('sync_status', 'failed');
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function hasVariants(): bool
    {
        return (bool) $this->has_variants;
    }

    public function isStockItem(): bool
    {
        return (bool) $this->is_stock_item;
    }

    public function isActive(): bool
    {
        return (bool) $this->is_active;
    }

    public function isSynced(): bool
    {
        return $this->sync_status === 'synced';
    }
}
