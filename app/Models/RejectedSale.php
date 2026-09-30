<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RejectedSale extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'till_operation_id',
        'user_id',
        'customer_id',
        'shift_id',
        'client_request_id',
        'invoice_number',
        'subtotal',
        'discount_amount',
        'tax_amount',
        'grand_total',
        'rejection_reason',
        'status',
        'sales_invoice_id',
        'sync_status',
        'synced_to_pos_at',
        'resolved_by',
        'resolved_at',
        'resolution_notes',
        'payload_snapshot',
    ];

    protected function casts(): array
    {
        return [
            'subtotal'         => 'decimal:2',
            'discount_amount'  => 'decimal:2',
            'tax_amount'       => 'decimal:2',
            'grand_total'      => 'decimal:2',
            'synced_to_pos_at' => 'datetime',
            'resolved_at'      => 'datetime',
        ];
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function tillOperation(): BelongsTo
    {
        return $this->belongsTo(TillOperation::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function shift(): BelongsTo
    {
        return $this->belongsTo(Shift::class);
    }

    public function salesInvoice(): BelongsTo
    {
        return $this->belongsTo(SalesInvoice::class);
    }

    public function resolvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(RejectedSaleItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(RejectedSalePayment::class);
    }

    // ---------------------------------------------------------------------
    // Scopes
    // ---------------------------------------------------------------------

    public function scopeForCompany($query, int $companyId)
    {
        return $query->where('company_id', $companyId);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeCancelled($query)
    {
        return $query->where('status', 'cancelled');
    }

    public function scopeSyncStatus($query, string $syncStatus)
    {
        return $query->where('sync_status', $syncStatus);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    public function isResolved(): bool
    {
        return $this->resolved_at !== null;
    }
}
