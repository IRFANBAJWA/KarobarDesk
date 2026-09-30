<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseReceipt extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'purchase_order_id',
        'erpnext_po_reference',
        'receipt_number',
        'receipt_date',
        'supplier_name',
        'supplier_erpnext_id',
        'received_by',
        'status',
        'erpnext_pr_reference',
        'erpnext_status',
        'sync_status',
        'sync_error',
        'sync_attempts',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'receipt_date'  => 'date',
            'sync_attempts' => 'integer',
        ];
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
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

    public function scopeByNumber($query, string $receiptNumber)
    {
        return $query->where('receipt_number', $receiptNumber);
    }

    public function scopeByErpnextReference($query, string $reference)
    {
        return $query->where('erpnext_pr_reference', $reference);
    }

    public function scopeForPurchaseOrder($query, int $purchaseOrderId)
    {
        return $query->where('purchase_order_id', $purchaseOrderId);
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
