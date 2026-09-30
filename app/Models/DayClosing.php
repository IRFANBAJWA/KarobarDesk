<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DayClosing extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'company_id',
        'till_operation_id',
        'user_id',
        'closing_user_id',
        'business_date',
        'status',
        'closing_time',
        'total_sales',
        'total_returns',
        'total_cash_sales',
        'total_card_sales',
        'total_discount',
        'total_expenses',
        'total_payments_in',
        'total_payments_out',
        'opening_balance',
        'closing_balance',
        'expected_cash',
        'actual_cash',
        'cash_difference',
        'invoice_count',
        'return_count',
        'closing_remarks',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'business_date'      => 'date',
            'closing_time'       => 'datetime',
            'total_sales'        => 'decimal:2',
            'total_returns'      => 'decimal:2',
            'total_cash_sales'   => 'decimal:2',
            'total_card_sales'   => 'decimal:2',
            'total_discount'     => 'decimal:2',
            'total_expenses'     => 'decimal:2',
            'total_payments_in'  => 'decimal:2',
            'total_payments_out' => 'decimal:2',
            'opening_balance'    => 'decimal:2',
            'closing_balance'    => 'decimal:2',
            'expected_cash'      => 'decimal:2',
            'actual_cash'        => 'decimal:2',
            'cash_difference'    => 'decimal:2',
            'invoice_count'      => 'integer',
            'return_count'       => 'integer',
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

    public function closingUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closing_user_id');
    }

    // ---------------------------------------------------------------------
    // Scopes
    // ---------------------------------------------------------------------

    public function scopeForCompany($query, int $companyId)
    {
        return $query->where('company_id', $companyId);
    }

    public function scopeForTill($query, int $tillOperationId)
    {
        return $query->where('till_operation_id', $tillOperationId);
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByBusinessDate($query, $date)
    {
        return $query->where('business_date', $date);
    }

    public function scopeBetweenBusinessDates($query, $from, $to)
    {
        return $query->whereBetween('business_date', [$from, $to]);
    }

    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeClosed($query)
    {
        return $query->where('status', 'closed');
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function isClosed(): bool
    {
        return $this->status === 'closed';
    }
}
