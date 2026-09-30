<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DayClosing extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'till_operation_id',
        'user_id',
        'closing_user_id',
        'business_date',
        'shift_count',
        'total_transactions',
        'sale_count',
        'return_count',
        'void_count',
        'total_sales',
        'cash_sales',
        'card_sales',
        'other_sales',
        'total_discount',
        'total_tax',
        'total_returns',
        'total_expenses',
        'opening_balance',
        'closing_balance',
        'expected_cash',
        'actual_cash',
        'cash_difference',
        'closing_time',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'business_date'      => 'date',
            'closing_time'       => 'datetime',
            'shift_count'        => 'integer',
            'total_transactions' => 'integer',
            'sale_count'         => 'integer',
            'return_count'       => 'integer',
            'void_count'         => 'integer',
            'total_sales'        => 'decimal:2',
            'cash_sales'         => 'decimal:2',
            'card_sales'         => 'decimal:2',
            'other_sales'        => 'decimal:2',
            'total_discount'     => 'decimal:2',
            'total_tax'          => 'decimal:2',
            'total_returns'      => 'decimal:2',
            'total_expenses'     => 'decimal:2',
            'opening_balance'    => 'decimal:2',
            'closing_balance'    => 'decimal:2',
            'expected_cash'      => 'decimal:2',
            'actual_cash'        => 'decimal:2',
            'cash_difference'    => 'decimal:2',
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
