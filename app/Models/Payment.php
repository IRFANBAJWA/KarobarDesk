<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'sales_invoice_id',
        'company_id',
        'account_id',
        'erpnext_account',
        'payment_method',
        'payment_amount',
        'reference_number',
        'card_last_4',
        'card_type',
        'payment_date',
        'payment_time',
        'received_by',
    ];

    protected function casts(): array
    {
        return [
            'payment_amount' => 'decimal:2',
            'payment_date'   => 'date',
            'payment_time'   => 'datetime:H:i:s',
        ];
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    public function salesInvoice(): BelongsTo
    {
        return $this->belongsTo(SalesInvoice::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    // ---------------------------------------------------------------------
    // Scopes
    // ---------------------------------------------------------------------

    public function scopeForSalesInvoice($query, int $salesInvoiceId)
    {
        return $query->where('sales_invoice_id', $salesInvoiceId);
    }

    public function scopeForAccount($query, int $accountId)
    {
        return $query->where('account_id', $accountId);
    }

    public function scopeForCompany($query, int $companyId)
    {
        return $query->where('company_id', $companyId);
    }

    public function scopePaymentMethod($query, string $paymentMethod)
    {
        return $query->where('payment_method', $paymentMethod);
    }

    public function scopeByPaymentDate($query, $date)
    {
        return $query->where('payment_date', $date);
    }

    public function scopeBetweenPaymentDates($query, $from, $to)
    {
        return $query->whereBetween('payment_date', [$from, $to]);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function isPositive(): bool
    {
        return (float) $this->payment_amount > 0;
    }

    public function isNegative(): bool
    {
        return (float) $this->payment_amount < 0;
    }
}
