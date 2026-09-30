<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourierSyncLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'courier_account_id',
        'parcel_id',
        'operation',
        'endpoint',
        'request_reference',
        'response_reference',
        'order_reference_id',
        'status',
        'error',
        'retry_count',
    ];

    protected function casts(): array
    {
        return [
            'retry_count' => 'integer',
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

    public function parcel(): BelongsTo
    {
        return $this->belongsTo(Parcel::class);
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

    public function scopeForParcel($query, int $parcelId)
    {
        return $query->where('parcel_id', $parcelId);
    }

    public function scopeOperation($query, string $operation)
    {
        return $query->where('operation', $operation);
    }

    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeSuccess($query)
    {
        return $query->where('status', 'success');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    public function scopeByOrderReference($query, string $orderReferenceId)
    {
        return $query->where('order_reference_id', $orderReferenceId);
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

    public function isSuccess(): bool
    {
        return $this->status === 'success';
    }

    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }
}
