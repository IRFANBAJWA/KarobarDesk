<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseOrder extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'company_id',
        'user_id',
        'supplier_id',
        'erpnext_po_reference',
        'po_number',
        'transaction_date',
        'expected_delivery_date',
        'status',
        'erpnext_status',
        'subtotal',
        'discount_total',
        'tax_total',
        'grand_total',
        'remarks',
        'sync_status',
        'sync_error',
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
            'transaction_date'       => 'date',
            'expected_delivery_date' => 'date',
            'subtotal'               => 'decimal:2',
            'discount_total'         => 'decimal:2',
            'tax_total'              => 'decimal:2',
            'grand_total'            => 'decimal:2',
            'synced_at'              => 'datetime',
        ];
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Supplier — mirrored from ERPNext, but suppliers aren't a local table.
     * Stored as string identifiers on the PO. If you later add a `suppliers`
     * table, this becomes a belongsTo. For now, no relationship is defined.
     */

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    /**
     * Purchase receipts generated from this PO.
     */
    public function receipts(): HasMany
    {
        return $this->hasMany(PurchaseReceipt::class, 'purchase_order_id');
    }

    // ---------------------------------------------------------------------
    // Scopes
    // ---------------------------------------------------------------------

    public function scopeForCompany($query, int $companyId)
    {
        return $query->where('company_id', $companyId);
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByNumber($query, string $poNumber)
    {
        return $query->where('po_number', $poNumber);
    }

    public function scopeByErpnextReference($query, string $reference)
    {
        return $query->where('erpnext_po_reference', $reference);
    }

    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopeSubmitted($query)
    {
        return $query->where('status', 'submitted');
    }

    public function scopeCancelled($query)
    {
        return $query->where('status', 'cancelled');
    }

    public function scopeBetweenTransactionDates($query, $from, $to)
    {
        return $query->whereBetween('transaction_date', [$from, $to]);
    }

    public function scopeSyncStatus($query, string $syncStatus)
    {
        return $query->where('sync_status', $syncStatus);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function isSubmitted(): bool
    {
        return $this->status === 'submitted';
    }

    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    public function isSynced(): bool
    {
        return $this->sync_status === 'synced'
            && $this->erpnext_po_reference !== null;
    }
}
