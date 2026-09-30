<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SyncLog extends Model
{
    use HasFactory;

    protected $table = 'sync_logs';

    protected $fillable = [
        'company_id',
        'source',
        'doctype',
        'document_name',
        'operation',
        'direction',
        'status',
        'error',
        'retry_count',
        'last_attempt_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'retry_count'     => 'integer',
            'last_attempt_at' => 'datetime',
            'completed_at'    => 'datetime',
        ];
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    // ---------------------------------------------------------------------
    // Scopes
    // ---------------------------------------------------------------------

    public function scopeForCompany($query, int $companyId)
    {
        return $query->where('company_id', $companyId);
    }

    public function scopeInbound($query)
    {
        return $query->where('direction', 'in');
    }

    public function scopeOutbound($query)
    {
        return $query->where('direction', 'out');
    }

    public function scopeSource($query, string $source)
    {
        return $query->where('source', $source);
    }

    public function scopeDoctype($query, string $doctype)
    {
        return $query->where('doctype', $doctype);
    }

    public function scopeDocumentName($query, string $documentName)
    {
        return $query->where('document_name', $documentName);
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

    public function scopeSynced($query)
    {
        return $query->where('status', 'synced');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    public function scopeRetrying($query)
    {
        return $query->where('status', 'retrying');
    }

    public function scopeBetween($query, $from, $to)
    {
        return $query->whereBetween('created_at', [$from, $to]);
    }

    public function scopeLatestFirst($query)
    {
        return $query->orderByDesc('created_at');
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function isInbound(): bool
    {
        return $this->direction === 'in';
    }

    public function isOutbound(): bool
    {
        return $this->direction === 'out';
    }

    public function isSynced(): bool
    {
        return $this->status === 'synced';
    }

    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }
}
