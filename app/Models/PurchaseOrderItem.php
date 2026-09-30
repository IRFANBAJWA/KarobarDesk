<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseOrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_order_id',
        'item_id',
        'erpnext_item_code',
        'item_name',
        'uom',
        'qty',
        'received_qty',
        'pending_qty',
        'rate',
        'warehouse',
        'erpnext_line_reference',
    ];

    protected function casts(): array
    {
        return [
            'qty'          => 'decimal:3',
            'received_qty' => 'decimal:3',
            'pending_qty'  => 'decimal:3',
            'rate'         => 'decimal:2',
        ];
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    // ---------------------------------------------------------------------
    // Scopes
    // ---------------------------------------------------------------------

    public function scopeForPurchaseOrder($query, int $purchaseOrderId)
    {
        return $query->where('purchase_order_id', $purchaseOrderId);
    }

    public function scopeForItem($query, int $itemId)
    {
        return $query->where('item_id', $itemId);
    }

    public function scopeForWarehouse($query, string $warehouse)
    {
        return $query->where('warehouse', $warehouse);
    }

    public function scopeFullyReceived($query)
    {
        return $query->whereColumn('received_qty', '>=', 'qty');
    }

    public function scopePartiallyReceived($query)
    {
        return $query
            ->where('received_qty', '>', 0)
            ->whereColumn('received_qty', '<', 'qty');
    }

    public function scopeNotReceived($query)
    {
        return $query->where('received_qty', 0);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function isFullyReceived(): bool
    {
        return (float) $this->received_qty >= (float) $this->qty;
    }

    public function isPartiallyReceived(): bool
    {
        return (float) $this->received_qty > 0
            && (float) $this->received_qty < (float) $this->qty;
    }

    public function isNotReceived(): bool
    {
        return (float) $this->received_qty <= 0;
    }

    public function remainingQty(): float
    {
        return max(0, (float) $this->qty - (float) $this->received_qty);
    }
}
