<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JournalEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'user_id',
        'entry_number',
        'posting_date',
        'voucher_type',
        'title',
        'user_remark',
        'total_debit',
        'total_credit',
        'erpnext_jv_reference',
        'erpnext_jv_status',
        'sync_status',
        'sync_error',
        'sync_attempts',
    ];

    protected function casts(): array
    {
        return [
            'posting_date'  => 'date',
            'total_debit'   => 'decimal:2',
            'total_credit'  => 'decimal:2',
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

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function accounts(): HasMany
    {
        return $this->hasMany(JournalEntryAccount::class);
    }

    // ---------------------------------------------------------------------
    // Scopes
    // ---------------------------------------------------------------------

    public function scopeForCompany($query, int $companyId)
    {
        return $query->where('company_id', $companyId);
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByEntryNumber($query, string $entryNumber)
    {
        return $query->where('entry_number', $entryNumber);
    }

    public function scopeByPostingDate($query, $date)
    {
        return $query->where('posting_date', $date);
    }

    public function scopeBetweenPostingDates($query, $from, $to)
    {
        return $query->whereBetween('posting_date', [$from, $to]);
    }

    public function scopeVoucherType($query, string $voucherType)
    {
        return $query->where('voucher_type', $voucherType);
    }

    public function scopeSyncStatus($query, string $syncStatus)
    {
        return $query->where('sync_status', $syncStatus);
    }

    public function scopePending($query)
    {
        return $query->where('sync_status', 'pending');
    }

    public function scopeSynced($query)
    {
        return $query->where('sync_status', 'synced');
    }

    public function scopeFailed($query)
    {
        return $query->where('sync_status', 'failed');
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function isSynced(): bool
    {
        return $this->sync_status === 'synced'
            && $this->erpnext_jv_reference !== null;
    }

    public function isBalanced(): bool
    {
        return (float) $this->total_debit === (float) $this->total_credit;
    }

    public function isExpense(): bool
    {
        return $this->voucher_type === 'expense';
    }
}
