<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ParcelAdvice extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'parcel_id',
        'advice_option',
        'reattempt_option',
        'remarks',
        'consignee_address',
        'consignee_no',
        'erpnext_advice_reference',
        'status',
        'advice_sent_at',
        'sent_by',
        'sync_status',
        'sync_error',
        'synced_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'advice_option'    => 'integer',
            'reattempt_option' => 'integer',
            'advice_sent_at'   => 'datetime',
            'synced_at'        => 'datetime',
        ];
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    public function parcel(): BelongsTo
    {
        return $this->belongsTo(Parcel::class);
    }

    public function sentBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sent_by');
    }

    // ---------------------------------------------------------------------
    // Scopes
    // ---------------------------------------------------------------------

    public function scopeForParcel($query, int $parcelId)
    {
        return $query->where('parcel_id', $parcelId);
    }

    public function scopeAdviceOption($query, int $adviceOption)
    {
        return $query->where('advice_option', $adviceOption);
    }

    public function scopeReattemptOption($query, int $reattemptOption)
    {
        return $query->where('reattempt_option', $reattemptOption);
    }

    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
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
            && $this->erpnext_advice_reference !== null;
    }

    public function isReattempt(): bool
    {
        return $this->advice_option === 3;
    }
}
