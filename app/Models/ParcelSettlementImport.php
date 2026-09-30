<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ParcelSettlementImport extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'courier_account_id',
        'source',
        'file_path',
        'file_format',
        'period_from',
        'period_to',
        'rows_received',
        'rows_inserted',
        'rows_updated',
        'rows_unmatched',
        'status',
        'error',
        'triggered_by',
        'imported_by',
    ];

    protected function casts(): array
    {
        return [
            'period_from'    => 'date',
            'period_to'      => 'date',
            'rows_received'  => 'integer',
            'rows_inserted'  => 'integer',
            'rows_updated'   => 'integer',
            'rows_unmatched' => 'integer',
        ];
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function courierAccount(): BelongsTo
    {
        return $this->belongsTo(CourierAccount::class);
    }

    public function triggeredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'triggered_by');
    }

    public function importedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'imported_by');
    }

    // ---------------------------------------------------------------------
    // Scopes
    // ---------------------------------------------------------------------

    public function scopeForCompany($query, int $companyId)
    {
        return $query->where('company_id', $companyId);
    }

    public function scopeForAccount($query, int $courierAccountId)
    {
        return $query->where('courier_account_id', $courierAccountId);
    }

    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeProcessing($query)
    {
        return $query->where('status', 'processing');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    public function scopeSource($query, string $source)
    {
        return $query->where('source', $source);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isProcessing(): bool
    {
        return $this->status === 'processing';
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }

    public function hasErrors(): bool
    {
        return (int) $this->rows_unmatched > 0;
    }
}
