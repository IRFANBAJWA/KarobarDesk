<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseReceiptItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_receipt_id',
        'item_id',
        'erpnext_item_code',
        'item_name',
        'uom',
        'ordered_qty',
        'received_qty',
        'remaining_qty',
        'rate',
        'warehouse',
        'erpnext_po_line_reference',
    ];

    protected function casts(): array
    {
        return [
            'ordered_qty'   => 'decimal:3',
            'received_qty'  => 'decimal:3',
            'remaining_qty' => 'decimal:3',
            'rate'          => 'decimal:2',
        ];
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    public function purchaseReceipt(): BelongsTo
    {
        return $this->belongsTo(PurchaseReceipt::class);
    }

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

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function lineTotal(): float
    {
        return (float) $this->received_qty * (float) $this->rate;
    }
}
