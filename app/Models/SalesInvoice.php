<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SalesInvoice extends Model
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
        'customer_id',
        'client_request_id',
        'invoice_number',
        'invoice_type',
        'invoice_date',
        'invoice_time',
        'working_date',
        'status',
        'subtotal',
        'discount_total',
        'tax_total',
        'grand_total',
        'paid_total',
        'balance_due',
        'erpnext_status',
        'erpnext_invoice_reference',
        'pos_sync_status',
        'pos_erpnext_sync_status',
        'is_void',
        'void_reason',
        'void_by',
        'void_time',
        'cancelled_at',
        'cancelled_by',
        'cancel_reason',
        'return_reason',
        'original_invoice_id',
        'source_rejected_sale_id',
        'fbr_invoice_reference',
        'payload_hash',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'invoice_date'   => 'date',
            'invoice_time'   => 'datetime:H:i:s',
            'working_date'   => 'date',
            'subtotal'       => 'decimal:2',
            'discount_total' => 'decimal:2',
            'tax_total'      => 'decimal:2',
            'grand_total'    => 'decimal:2',
            'paid_total'     => 'decimal:2',
            'balance_due'    => 'decimal:2',
            'is_void'        => 'boolean',
            'void_time'      => 'datetime',
            'cancelled_at'   => 'datetime',
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

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function voidBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'void_by');
    }

    public function cancelledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    /**
     * For returns: the original sale invoice being returned against.
     */
    public function originalInvoice(): BelongsTo
    {
        return $this->belongsTo(SalesInvoice::class, 'original_invoice_id');
    }

    /**
     * For sales: returns issued against this invoice.
     */
    public function returns(): HasMany
    {
        return $this->hasMany(SalesInvoice::class, 'original_invoice_id');
    }

    /**
     * If this sale originated from an approved rejected sale.
     */
    public function sourceRejectedSale(): BelongsTo
    {
        return $this->belongsTo(RejectedSale::class, 'source_rejected_sale_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(SalesInvoiceItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    // ---------------------------------------------------------------------
    // Scopes
    // ---------------------------------------------------------------------

    public function scopeForCompany($query, int $companyId)
    {
        return $query->where('company_id', $companyId);
    }

    public function scopeSales($query)
    {
        return $query->where('invoice_type', 'sale');
    }

    public function scopeReturns($query)
    {
        return $query->where('invoice_type', 'return');
    }

    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    public function scopeUnpaid($query)
    {
        return $query->where('status', 'unpaid');
    }

    public function scopePartial($query)
    {
        return $query->where('status', 'partial');
    }

    public function scopeCancelled($query)
    {
        return $query->where('status', 'cancelled');
    }

    public function scopeNotVoid($query)
    {
        return $query->where('is_void', false);
    }

    public function scopeByClientRequestId($query, string $clientRequestId)
    {
        return $query->where('client_request_id', $clientRequestId);
    }

    public function scopeByInvoiceNumber($query, string $invoiceNumber)
    {
        return $query->where('invoice_number', $invoiceNumber);
    }

    public function scopeWorkingDate($query, $date)
    {
        return $query->where('working_date', $date);
    }

    public function scopeBetweenWorkingDates($query, $from, $to)
    {
        return $query->whereBetween('working_date', [$from, $to]);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function isSale(): bool
    {
        return $this->invoice_type === 'sale';
    }

    public function isReturn(): bool
    {
        return $this->invoice_type === 'return';
    }

    public function isVoid(): bool
    {
        return (bool) $this->is_void;
    }

    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }

    public function isFullySyncedToErpnext(): bool
    {
        return $this->erpnext_invoice_reference !== null
            && $this->pos_erpnext_sync_status === 'synced';
    }
}
