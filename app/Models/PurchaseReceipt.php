<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseReceipt extends Model
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
        'purchase_order_id',
        'supplier',
        'erpnext_pr_reference',
        'pr_number',
        'receipt_date',
        'status',
        'erpnext_status',
        'warehouse',
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
            'receipt_date'   => 'date',
            'subtotal'       => 'decimal:2',
            'discount_total' => 'decimal:2',
            'tax_total'      => 'decimal:2',
            'grand_total'    => 'decimal:2',
            'synced_at'      => 'datetime',
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
     * Originating purchase order. Nullable — a receipt can be created
     * without a PO (direct purchase), matching ERPNext behavior.
     */
    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseReceiptItem::class);
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

    public function scopeByNumber($query, string $prNumber)
    {
        return $query->where('pr_number', $prNumber);
    }

    public function scopeByErpnextReference($query, string $reference)
    {
        return $query->where('erpnext_pr_reference', $reference);
    }

    public function scopeForPurchaseOrder($query, int $purchaseOrderId)
    {
        return $query->where('purchase_order_id', $purchaseOrderId);
    }

    public function scopeForWarehouse($query, string $warehouse)
    {
        return $query->where('warehouse', $warehouse);
    }

    public function scopeByReceiptDate($query, $date)
    {
        return $query->where('receipt_date', $date);
    }

    public function scopeBetweenReceiptDates($query, $from, $to)
    {
        return $query->whereBetween('receipt_date', [$from, $to]);
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

    public function scopeSyncStatus($query, string $syncStatus)
    {
        return $query->where('sync_status', $syncStatus);
    }

    public function scopePending($query)
    {
        return $query->where('sync_status', 'pending');
    }

    public function scopeSynced($query)
    {
        return $query->where('sync_status', 'synced');
    }

    public function scopeFailed($query)
    {
        return $query->where('sync_status', 'failed');
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
            && $this->erpnext_pr_reference !== null;
    }

    public function hasPurchaseOrder(): bool
    {
        return $this->purchase_order_id !== null;
    }
}
