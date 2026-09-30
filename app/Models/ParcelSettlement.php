<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ParcelSettlement extends Model
{
    use HasFactory;

    protected $fillable = [
        'parcel_id',
        'company_id',
        'courier_account_id',
        'cn_number',
        'settlement_date',
        'cod_amount',
        'courier_charge',
        'courier_gst',
        'courier_total',
        'debit',
        'net_payable',
        'tracking',
        'payment_id',
        'instrument_mode',
        'instrument_number',
        'source',
        'raw_data',
    ];

    protected function casts(): array
    {
        return [
            'settlement_date' => 'date',
            'cod_amount'      => 'decimal:2',
            'courier_charge'  => 'decimal:2',
            'courier_gst'     => 'decimal:2',
            'courier_total'   => 'decimal:2',
            'debit'           => 'decimal:2',
            'net_payable'     => 'decimal:2',
        ];
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    public function parcel(): BelongsTo
    {
        return $this->belongsTo(Parcel::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function courierAccount(): BelongsTo
    {
        return $this->belongsTo(CourierAccount::class);
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

    public function scopeForAccount($query, int $courierAccountId)
    {
        return $query->where('courier_account_id', $courierAccountId);
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

    public function scopeSource($query, string $source)
    {
        return $query->where('source', $source);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function isPositiveNet(): bool
    {
        return (float) $this->net_payable > 0;
    }
}
