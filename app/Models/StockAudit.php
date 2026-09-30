<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockAudit extends Model
{
    use HasFactory;

    /**
     * Valid lifecycle states (Section 22).
     */
    public const STATUS_DRAFT      = 'draft';
    public const STATUS_COUNTING   = 'counting';
    public const STATUS_VERIFYING  = 'verifying';
    public const STATUS_FINALIZED  = 'finalized';

    /**
     * Audit areas (Section 22).
     */
    public const AREA_SHOP   = 'shop';
    public const AREA_ONLINE = 'online';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'company_id',
        'audit_date',
        'area',
        'status',
        'system_snapshot_at',
        'finalized_at',
        'finalized_by',
        'immutability_hash',
        'created_by',
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
            'audit_date'         => 'date',
            'system_snapshot_at' => 'datetime',
            'finalized_at'       => 'datetime',
        ];
    }

    /**
     * Immutability enforcement (Section 22):
     * once status = 'finalized', no updates and no deletes are allowed
     * from any user — salesperson, checker, manager, or admin.
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

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function finalizedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'finalized_by');
    }

    /**
     * Per-item snapshot + totals + discrepancy.
     */
    public function items(): HasMany
    {
        return $this->hasMany(StockAuditItem::class);
    }

    /**
     * Per-person physical counts.
     */
    public function counts(): HasMany
    {
        return $this->hasMany(StockAuditCount::class);
    }

    /**
     * Checker verifications.
     */
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

    public function scopeArea($query, string $area)
    {
        return $query->where('area', $area);
    }

    public function scopeShop($query)
    {
        return $query->where('area', self::AREA_SHOP);
    }

    public function scopeOnline($query)
    {
        return $query->where('area', self::AREA_ONLINE);
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
        return $this->area === self::AREA_SHOP;
    }

    public function isOnline(): bool
    {
        return $this->area === self::AREA_ONLINE;
    }
}
