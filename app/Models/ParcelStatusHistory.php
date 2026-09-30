<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ParcelStatusHistory extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'parcel_id',
        'cn_number',
        'fingerprint',
        'status',
        'status_code',
        'tracking_datetime',
        'location',
        'remarks',
        'raw_status',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tracking_datetime' => 'datetime',
        ];
    }

    /**
     * Tracking history is append-only (Section 29, Rule 10).
     * No updates, no deletes. Dedup is by `fingerprint`.
     */
    protected static function booted(): void
    {
        static::updating(function () {
            throw new \RuntimeException('ParcelStatusHistory is append-only. Update is not allowed.');
        });

        static::deleting(function () {
            throw new \RuntimeException('ParcelStatusHistory is append-only. Delete is not allowed.');
        });
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    public function parcel(): BelongsTo
    {
        return $this->belongsTo(Parcel::class);
    }

    // ---------------------------------------------------------------------
    // Scopes
    // ---------------------------------------------------------------------

    public function scopeForParcel($query, int $parcelId)
    {
        return $query->where('parcel_id', $parcelId);
    }

    public function scopeByCn($query, string $cnNumber)
    {
        return $query->where('cn_number', $cnNumber);
    }

    public function scopeByFingerprint($query, string $fingerprint)
    {
        return $query->where('fingerprint', $fingerprint);
    }

    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeBetweenTrackingDates($query, $from, $to)
    {
        return $query->whereBetween('tracking_datetime', [$from, $to]);
    }

    public function scopeLatestFirst($query)
    {
        return $query->orderByDesc('tracking_datetime');
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function isDelivered(): bool
    {
        return strtolower((string) $this->status) === 'delivered';
    }

    public function isReturned(): bool
    {
        return strtolower((string) $this->status) === 'returned';
    }
}
