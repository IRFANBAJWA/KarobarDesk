<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalesInvoiceItem extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'sales_invoice_id',
        'item_id',
        'item_code',
        'item_name',
        'qty',
        'unit_price',
        'sale_price',
        'line_discount',
        'line_total',
        'is_b',
        'is_set',
        'is_b_reason',
        'return_reason',
        'discount_reason',
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
            'sale_price'    => 'decimal:2',
            'line_discount' => 'decimal:2',
            'line_total'    => 'decimal:2',
            'is_b'          => 'boolean',
            'is_set'        => 'boolean',
        ];
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    /**
     * Parent sales invoice (sale or return).
     */
    public function salesInvoice(): BelongsTo
    {
        return $this->belongsTo(SalesInvoice::class);
    }

    /**
     * Item reference. Nullable in practice — snapshot fields preserve truth
     * even if the item mirror shifts.
     */
    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    // ---------------------------------------------------------------------
    // Scopes
    // ---------------------------------------------------------------------

    public function scopeForSalesInvoice($query, int $salesInvoiceId)
    {
        return $query->where('sales_invoice_id', $salesInvoiceId);
    }

    public function scopeForItem($query, int $itemId)
    {
        return $query->where('item_id', $itemId);
    }

    public function scopeForItemCode($query, string $itemCode)
    {
        return $query->where('item_code', $itemCode);
    }

    public function scopeIsB($query)
    {
        return $query->where('is_b', true);
    }

    public function scopeIsSet($query)
    {
        return $query->where('is_set', true);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function isB(): bool
    {
        return (bool) $this->is_b;
    }

    public function isSet(): bool
    {
        return (bool) $this->is_set;
    }
}
