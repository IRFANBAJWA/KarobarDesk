<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Parcel extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'courier_account_id',
        'sales_invoice_id',
        'cn_number',
        'customer_reference',
        'booking_status',
        'active_parcel',
        'consignee_name',
        'consignee_address',
        'consignee_mobile',
        'consignee_email',
        'destination_city',
        'pieces',
        'weight',
        'cod_amount',
        'product_description',
        'fragile',
        'service_type',
        'remarks',
        'insurance_value',
        'location_id',
        'return_location',
        'qsr_org_zone',
        'qsr_org_branch',
        'qsr_dest_zone',
        'qsr_dest_branch',
        'qsr_received_by',
        'qsr_delivery_time',
        'qsr_delivery_date',
        'qsr_payment_mode',
        'qsr_rr_status',
        'qsr_cheque_no',
        'current_status',
        'last_tracking_at',
        'last_location',
        'attention_required',
        'attention_reason',
        'booking_date',
        'booking_datetime',
        'booked_by',
        'sync_status',
        'sync_error',
        'sync_attempts',
    ];

    protected function casts(): array
    {
        return [
            'pieces'             => 'integer',
            'weight'             => 'decimal:3',
            'cod_amount'         => 'decimal:2',
            'insurance_value'    => 'decimal:2',
            'qsr_delivery_time'  => 'datetime',
            'qsr_delivery_date'  => 'date',
            'last_tracking_at'   => 'datetime',
            'attention_required' => 'boolean',
            'active_parcel'      => 'boolean',
            'booking_date'       => 'date',
            'booking_datetime'   => 'datetime',
            'sync_attempts'      => 'integer',
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

    public function salesInvoice(): BelongsTo
    {
        return $this->belongsTo(SalesInvoice::class);
    }

    public function bookedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'booked_by');
    }

    public function statusHistory(): HasMany
    {
        return $this->hasMany(ParcelStatusHistory::class);
    }

    public function advices(): HasMany
    {
        return $this->hasMany(ParcelAdvice::class);
    }

    public function settlements(): HasMany
    {
        return $this->hasMany(ParcelSettlement::class);
    }

    public function syncLogs(): HasMany
    {
        return $this->hasMany(CourierSyncLog::class);
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

    public function scopeForInvoice($query, int $salesInvoiceId)
    {
        return $query->where('sales_invoice_id', $salesInvoiceId);
    }

    public function scopeActive($query)
    {
        return $query->where('active_parcel', true);
    }

    public function scopeInactive($query)
    {
        return $query->where('active_parcel', false);
    }

    public function scopeByCn($query, string $cnNumber)
    {
        return $query->where('cn_number', $cnNumber);
    }

    public function scopeAttentionRequired($query)
    {
        return $query->where('attention_required', true);
    }

    public function scopeDelivered($query)
    {
        return $query->where('current_status', 'delivered');
    }

    public function scopeInTransit($query)
    {
        return $query->where('active_parcel', true)
            ->where('current_status', '!=', 'delivered');
    }

    /**
     * Section 29: 4-day no-progress alert. API failure != inactivity.
     */
    public function scopeStale($query, int $days = 4)
    {
        return $query->where('active_parcel', true)
            ->where('current_status', '!=', 'delivered')
            ->where(function ($q) use ($days) {
                $q->whereNull('last_tracking_at')
                    ->orWhere('last_tracking_at', '<', now()->subDays($days));
            });
    }

    public function scopeBetweenBookingDates($query, $from, $to)
    {
        return $query->whereBetween('booking_date', [$from, $to]);
    }

    public function scopeSynced($query)
    {
        return $query->where('sync_status', 'synced');
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function isActive(): bool
    {
        return (bool) $this->active_parcel;
    }

    public function isDelivered(): bool
    {
        return $this->current_status === 'delivered';
    }

    public function needsAttention(): bool
    {
        return (bool) $this->attention_required;
    }

    public function isFragile(): bool
    {
        return strtolower((string) $this->fragile) === 'yes';
    }

    public function isCod(): bool
    {
        return (float) $this->cod_amount > 0;
    }
}
