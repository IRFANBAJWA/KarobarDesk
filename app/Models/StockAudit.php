<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockAudit extends Model
{
    use HasFactory;

    protected $table = 'stock_audits';

    public const STATUS_DRAFT     = 'draft';
    public const STATUS_COUNTING  = 'counting';
    public const STATUS_VERIFYING = 'verifying';
    public const STATUS_FINALIZED = 'finalized';

    public const AREA_SHOP   = 'shop';
    public const AREA_ONLINE = 'online';

    protected $fillable = [
        'company_id',
        'audit_date',
        'audit_type',
        'status',
        'system_snapshot_at',
        'started_by',
        'finalized_by',
        'finalized_at',
        'immutability_hash',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'audit_date'         => 'date',
            'system_snapshot_at' => 'datetime',
            'finalized_at'       => 'datetime',
        ];
    }

    /**
     * Immutability enforcement (Section 22):
     * once status = 'finalized', no updates and no deletes.
     */
    protected static function booted(): void
    {
        static::updating(function (StockAudit $audit) {
            if ($audit->getOriginal('status') === self::STATUS_FINALIZED) {
                throw new \RuntimeException('StockAudit is immutable after finalization. Update is not allowed.');
            }
        });

        static::deleting(function (StockAudit $audit) {
            if ($audit->status === self::STATUS_FINALIZED) {
                throw new \RuntimeException('StockAudit is immutable after finalization. Delete is not allowed.');
            }
        });
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function startedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'started_by');
    }

    public function finalizedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'finalized_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(StockAuditItem::class);
    }

    public function counts(): HasMany
    {
        return $this->hasMany(StockAuditCount::class, 'stock_audit_item_id');
    }

    public function verifications(): HasMany
    {
        return $this->hasMany(StockAuditVerification::class);
    }

    // ---------------------------------------------------------------------
    // Scopes
    // ---------------------------------------------------------------------

    public function scopeForCompany($query, int $companyId)
    {
        return $query->where('company_id', $companyId);
    }

    public function scopeByAuditDate($query, $date)
    {
        return $query->where('audit_date', $date);
    }

    public function scopeBetweenAuditDates($query, $from, $to)
    {
        return $query->whereBetween('audit_date', [$from, $to]);
    }

    public function scopeType($query, string $type)
    {
        return $query->where('audit_type', $type);
    }

    public function scopeShop($query)
    {
        return $query->where('audit_type', self::AREA_SHOP);
    }

    public function scopeOnline($query)
    {
        return $query->where('audit_type', self::AREA_ONLINE);
    }

    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeDraft($query)
    {
        return $query->where('status', self::STATUS_DRAFT);
    }

    public function scopeCounting($query)
    {
        return $query->where('status', self::STATUS_COUNTING);
    }

    public function scopeVerifying($query)
    {
        return $query->where('status', self::STATUS_VERIFYING);
    }

    public function scopeFinalized($query)
    {
        return $query->where('status', self::STATUS_FINALIZED);
    }

    public function scopeOpen($query)
    {
        return $query->whereIn('status', [
            self::STATUS_DRAFT,
            self::STATUS_COUNTING,
            self::STATUS_VERIFYING,
        ]);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function isCounting(): bool
    {
        return $this->status === self::STATUS_COUNTING;
    }

    public function isVerifying(): bool
    {
        return $this->status === self::STATUS_VERIFYING;
    }

    public function isFinalized(): bool
    {
        return $this->status === self::STATUS_FINALIZED;
    }

    public function isShop(): bool
    {
        return $this->audit_type === self::AREA_SHOP;
    }

    public function isOnline(): bool
    {
        return $this->audit_type === self::AREA_ONLINE;
    }
}
