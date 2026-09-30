<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockAuditVerification extends Model
{
    use HasFactory;

    protected $table = 'stock_audit_verifications';

    protected $fillable = [
        'stock_audit_id',
        'verified_by',
        'verification_status',
        'verification_notes',
        'verified_at',
    ];

    protected function casts(): array
    {
        return [
            'verified_at' => 'datetime',
        ];
    }

    /**
     * Immutability enforcement (Section 22):
     * once the parent audit is finalized, no updates and no deletes.
     */
    protected static function booted(): void
    {
        static::updating(function (StockAuditVerification $verification) {
            if ($verification->stockAudit?->isFinalized()) {
                throw new \RuntimeException('StockAuditVerification is immutable after parent audit finalization. Update is not allowed.');
            }
        });

        static::deleting(function (StockAuditVerification $verification) {
            if ($verification->stockAudit?->isFinalized()) {
                throw new \RuntimeException('StockAuditVerification is immutable after parent audit finalization. Delete is not allowed.');
            }
        });
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    public function stockAudit(): BelongsTo
    {
        return $this->belongsTo(StockAudit::class);
    }

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    // ---------------------------------------------------------------------
    // Scopes
    // ---------------------------------------------------------------------

    public function scopeForAudit($query, int $stockAuditId)
    {
        return $query->where('stock_audit_id', $stockAuditId);
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('verified_by', $userId);
    }

    public function scopeStatus($query, string $status)
    {
        return $query->where('verification_status', $status);
    }

    public function scopeVerified($query)
    {
        return $query->where('verification_status', 'verified');
    }

    public function scopeRejected($query)
    {
        return $query->where('verification_status', 'rejected');
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function isVerified(): bool
    {
        return $this->verification_status === 'verified';
    }

    public function isRejected(): bool
    {
        return $this->verification_status === 'rejected';
    }
}
