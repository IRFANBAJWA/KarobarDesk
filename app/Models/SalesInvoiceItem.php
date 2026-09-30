<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalesInvoiceItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'sales_invoice_id',
        'item_id',
        'line_number',
        'item_code',
        'item_name',
        'uom',
        'qty',
        'free_qty',
        'return_qty',
        'unit_price',
        'sale_price',
        'cost_price',
        'line_discount',
        'line_discount_percent',
        'tax_rate',
        'is_returned',
        'is_b',
        'is_set',
        'is_b_reason',
        'return_reason',
        'discount_reason',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'line_number'           => 'integer',
            'qty'                   => 'decimal:3',
            'free_qty'              => 'decimal:3',
            'return_qty'            => 'decimal:3',
            'unit_price'            => 'decimal:2',
            'sale_price'            => 'decimal:2',
            'cost_price'            => 'decimal:2',
            'line_discount'         => 'decimal:2',
            'line_discount_percent' => 'decimal:2',
            'tax_rate'              => 'decimal:2',
            'is_returned'           => 'boolean',
            'is_b'                  => 'boolean',
            'is_set'                => 'boolean',
        ];
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    public function salesInvoice(): BelongsTo
    {
        return $this->belongsTo(SalesInvoice::class);
    }

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

    public function scopeReturned($query)
    {
        return $query->where('is_returned', true);
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

    public function isReturned(): bool
    {
        return (bool) $this->is_returned;
    }

    public function lineTotal(): float
    {
        return (float) $this->qty * (float) $this->sale_price - (float) $this->line_discount;
    }
}
