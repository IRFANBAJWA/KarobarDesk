<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RejectedSalePayment extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'rejected_sale_id',
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
     * Parent rejected sale.
     */
    public function rejectedSale(): BelongsTo
    {
        return $this->belongsTo(RejectedSale::class);
    }

    /**
     * Account used for this payment.
     * Nullable in practice — the account might not exist locally yet.
     * `erpnext_account` preserves the string identifier.
     */
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

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function isPositive(): bool
    {
        return (float) $this->amount > 0;
    }
}
