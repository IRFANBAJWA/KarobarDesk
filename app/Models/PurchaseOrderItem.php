<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseOrderItem extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'purchase_order_id',
        'item_id',
        'item_code',
        'item_name',
        'qty',
        'received_qty',
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
            'received_qty'  => 'decimal:3',
            'unit_price'    => 'decimal:2',
            'line_discount' => 'decimal:2',
            'line_total'    => 'decimal:2',
        ];
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
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
