<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RejectedSalePayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'rejected_sale_id',
        'account_id',
        'erpnext_account',
        'payment_method',
        'payment_amount',
        'reference_number',
        'card_last_4',
        'card_type',
    ];

    protected function casts(): array
    {
        return [
            'payment_amount' => 'decimal:2',
        ];
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    public function rejectedSale(): BelongsTo
    {
        return $this->belongsTo(RejectedSale::class);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    // ---------------------------------------------------------------------
    // Scopes
    // ---------------------------------------------------------------------

    public function scopeForRejectedSale($query, int $rejectedSaleId)
    {
        return $query->where('rejected_sale_id', $rejectedSaleId);
    }

    public function scopeForAccount($query, int $accountId)
    {
        return $query->where('account_id', $accountId);
    }

    public function scopePaymentMethod($query, string $paymentMethod)
    {
        return $query->where('payment_method', $paymentMethod);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function isPositive(): bool
    {
        return (float) $this->payment_amount > 0;
    }
}
