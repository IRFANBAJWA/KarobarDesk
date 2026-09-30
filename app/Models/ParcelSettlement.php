<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ParcelSettlement extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'company_id',
        'parcel_id',
        'parcel_settlement_import_id',
        'cn_number',
        'settlement_date',
        'gross_amount',
        'deduction_amount',
        'net_amount',
        'cod_amount',
        'service_charges',
        'gst_amount',
        'payment_status',
        'payment_reference',
        'source',
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
            'settlement_date'   => 'date',
            'gross_amount'      => 'decimal:2',
            'deduction_amount'  => 'decimal:2',
            'net_amount'        => 'decimal:2',
            'cod_amount'        => 'decimal:2',
            'service_charges'   => 'decimal:2',
            'gst_amount'        => 'decimal:2',
        ];
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Parcel this settlement applies to. Nullable — a settlement row can be
     * imported before the parcel is matched.
     */
    public function parcel(): BelongsTo
    {
        return $this->belongsTo(Parcel::class);
    }

    /**
     * Batch import this settlement row was part of.
     */
    public function import(): BelongsTo
    {
        return $this->belongsTo(ParcelSettlementImport::class, 'parcel_settlement_import_id');
    }

    // ---------------------------------------------------------------------
    // Scopes
    // ---------------------------------------------------------------------

    public function scopeForCompany($query, int $companyId)
    {
        return $query->where('company_id', $companyId);
    }

    public function scopeForParcel($query, int $parcelId)
    {
        return $query->where('parcel_id', $parcelId);
    }

    public function scopeByCn($query, string $cnNumber)
    {
        return $query->where('cn_number', $cnNumber);
    }

    public function scopeBySettlementDate($query, $date)
    {
        return $query->where('settlement_date', $date);
    }

    public function scopeBetweenSettlementDates($query, $from, $to)
    {
        return $query->whereBetween('settlement_date', [$from, $to]);
    }

    public function scopePaymentStatus($query, string $paymentStatus)
    {
        return $query->where('payment_status', $paymentStatus);
    }

    public function scopePaid($query)
    {
        return $query->where('payment_status', 'paid');
    }

    public function scopePending($query)
    {
        return $query->where('payment_status', 'pending');
    }

    public function scopeSource($query, string $source)
    {
        return $query->where('source', $source);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function isPaid(): bool
    {
        return $this->payment_status === 'paid';
    }

    public function isPending(): bool
    {
        return $this->payment_status === 'pending';
    }
}
