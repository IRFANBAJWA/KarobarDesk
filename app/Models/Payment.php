<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'sales_invoice_id',
        'account_id',
        'erpnext_account',
        'amount',
        'payment_time',
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
            'amount'       => 'decimal:2',
            'payment_time' => 'datetime:H:i:s',
        ];
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    /**
     * Sales invoice (sale or return) this payment applies to.
     */
    public function salesInvoice(): BelongsTo
    {
        return $this->belongsTo(SalesInvoice::class);
    }

    /**
     * Account used for this payment.
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
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

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function isPositive(): bool
    {
        return (float) $this->amount > 0;
    }

    public function isNegative(): bool
    {
        return (float) $this->amount < 0;
    }
}
