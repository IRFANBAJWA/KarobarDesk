<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseReceiptItem extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'purchase_receipt_id',
        'purchase_order_item_id',
        'item_id',
        'item_code',
        'item_name',
        'qty',
        'unit_price',
        'line_discount',
        'line_total',
        'warehouse',
        'uom',
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
            'qty'           => 'decimal:3',
            'unit_price'    => 'decimal:2',
            'line_discount' => 'decimal:2',
            'line_total'    => 'decimal:2',
        ];
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    public function purchaseReceipt(): BelongsTo
    {
        return $this->belongsTo(PurchaseReceipt::class);
    }

    /**
     * Originating PO line. Nullable — direct receipts have no PO line.
     */
    public function purchaseOrderItem(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrderItem::class);
    }

    /**
     * Item reference. Nullable in practice.
     * Snapshots (item_code, item_name) preserve truth.
     */
    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    // ---------------------------------------------------------------------
    // Scopes
    // ---------------------------------------------------------------------

    public function scopeForPurchaseReceipt($query, int $purchaseReceiptId)
    {
        return $query->where('purchase_receipt_id', $purchaseReceiptId);
    }

    public function scopeForItem($query, int $itemId)
    {
        return $query->where('item_id', $itemId);
    }

    public function scopeForWarehouse($query, string $warehouse)
    {
        return $query->where('warehouse', $warehouse);
    }

    public function scopeFromPurchaseOrderItem($query, int $purchaseOrderItemId)
    {
        return $query->where('purchase_order_item_id', $purchaseOrderItemId);
    }
}
