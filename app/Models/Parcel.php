<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Parcel extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'company_id',
        'courier_account_id',
        'sales_invoice_id',

        // Booking fields (M&P)
        'cn_number',
        'order_reference_id',
        'consignee_name',
        'consignee_address',
        'consignee_mobile',
        'consignee_email',
        'destination_city',
        'pieces',
        'weight',
        'cod_amount',
        'customer_reference',
        'product_description',
        'fragile',
        'service_type',
        'remarks',
        'insurance_value',
        'location_id',
        'return_location',

        // QSR fields
        'qsr_booking_date',
        'qsr_delivery_date',
        'qsr_status',
        'qsr_remarks',

        // Tracking (denormalized latest)
        'last_tracking_status',
        'last_tracking_at',
        'last_tracking_location',
        'delivered_at',
        'delivered_to',
        'delivery_attempts',

        // Alerts
        'needs_attention',
        'attention_reason',
        'attention_flagged_at',

        // Lifecycle
        'active_parcel',
        'booking_date',
        'booking_datetime',
        'booking_by',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'pieces'               => 'integer',
            'weight'               => 'decimal:3',
            'cod_amount'           => 'decimal:2',
            'insurance_value'      => 'decimal:2',
            'qsr_booking_date'     => 'date',
            'qsr_delivery_date'    => 'date',
            'last_tracking_at'     => 'datetime',
            'delivered_at'         => 'datetime',
            'delivery_attempts'    => 'integer',
            'needs_attention'      => 'boolean',
            'attention_flagged_at' => 'datetime',
            'active_parcel'        => 'boolean',
            'booking_date'         => 'date',
            'booking_datetime'     => 'datetime',
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

    /**
     * Originating sales invoice. One invoice can have at most one active parcel.
     */
    public function salesInvoice(): BelongsTo
    {
        return $this->belongsTo(SalesInvoice::class);
    }

    public function bookingBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'booking_by');
    }

    /**
     * Append-only tracking history rows.
     */
    public function statusHistory(): HasMany
    {
        return $this->hasMany(ParcelStatusHistory::class);
    }

    /**
     * Shipper advices for this parcel.
     */
    public function advices(): HasMany
    {
        return $this->hasMany(ParcelAdvice::class);
    }

    /**
     * Settlement rows for this parcel.
     */
    public function settlements(): HasMany
    {
        return $this->hasMany(ParcelSettlement::class);
    }

    /**
     * Sync logs referencing this parcel by CN.
     */
    public function syncLogs(): HasMany
    {
        return $this->hasMany(CourierSyncLog::class, 'order_reference_id', 'cn_number');
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

    public function scopeNeedsAttention($query)
    {
        return $query->where('needs_attention', true);
    }

    public function scopeDelivered($query)
    {
        return $query->whereNotNull('delivered_at');
    }

    public function scopeInTransit($query)
    {
        return $query->whereNull('delivered_at')
            ->where('active_parcel', true);
    }

    /**
     * Active parcels with no tracking progress older than N days.
     * Section 29: 4-day no-progress alert. API failure != inactivity.
     */
    public function scopeStale($query, int $days = 4)
    {
        return $query->where('active_parcel', true)
            ->whereNull('delivered_at')
            ->where(function ($q) use ($days) {
                $q->whereNull('last_tracking_at')
                    ->orWhere('last_tracking_at', '<', now()->subDays($days));
            });
    }

    public function scopeBetweenBookingDates($query, $from, $to)
    {
        return $query->whereBetween('booking_date', [$from, $to]);
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
        return $this->delivered_at !== null;
    }

    public function needsAttention(): bool
    {
        return (bool) $this->needs_attention;
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
