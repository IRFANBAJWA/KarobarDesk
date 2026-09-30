<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Shift extends Model
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
        'shift_code',
        'status',
        'start_time',
        'end_time',
        'opening_balance',
        'closing_balance',
        'expected_cash',
        'actual_cash',
        'cash_difference',
        'total_sales',
        'total_returns',
        'total_cash_sales',
        'total_card_sales',
        'total_discount',
        'total_expenses',
        'invoice_count',
        'return_count',
        'closed_by',
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
            'start_time'        => 'datetime',
            'end_time'          => 'datetime',
            'opening_balance'   => 'decimal:2',
            'closing_balance'   => 'decimal:2',
            'expected_cash'     => 'decimal:2',
            'actual_cash'       => 'decimal:2',
            'cash_difference'   => 'decimal:2',
            'total_sales'       => 'decimal:2',
            'total_returns'     => 'decimal:2',
            'total_cash_sales'  => 'decimal:2',
            'total_card_sales'  => 'decimal:2',
            'total_discount'    => 'decimal:2',
            'total_expenses'    => 'decimal:2',
            'invoice_count'     => 'integer',
            'return_count'      => 'integer',
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

    public function closedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    /**
     * Opening and closing denomination rows for this shift.
     * Expected exactly two rows: one OPENING, one CLOSING.
     */
    public function denominations(): HasMany
    {
        return $this->hasMany(ShiftDenomination::class);
    }

    public function openingDenomination()
    {
        return $this->hasOne(ShiftDenomination::class)->where('type', 'OPENING');
    }

    public function closingDenomination()
    {
        return $this->hasOne(ShiftDenomination::class)->where('type', 'CLOSING');
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

    public function scopeOpen($query)
    {
        return $query->whereNull('end_time');
    }

    public function scopeClosed($query)
    {
        return $query->whereNotNull('end_time');
    }

    public function scopeByCode($query, string $shiftCode)
    {
        return $query->where('shift_code', $shiftCode);
    }

    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeBetween($query, $from, $to)
    {
        return $query->whereBetween('start_time', [$from, $to]);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function isOpen(): bool
    {
        return $this->end_time === null;
    }

    public function isClosed(): bool
    {
        return $this->end_time !== null;
    }
}
