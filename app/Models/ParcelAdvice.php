<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ParcelAdvice extends Model
{
    use HasFactory;
    protected $table = 'parcel_advices';
    protected $fillable = [
        'parcel_id',
        'company_id',
        'advice_option',
        'reattempt_option',
        'remarks',
        'consignee_address',
        'consignee_no',
        'status',
        'response_reference',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'advice_option'    => 'integer',
            'reattempt_option' => 'integer',
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

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ---------------------------------------------------------------------
    // Scopes
    // ---------------------------------------------------------------------

    public function scopeForParcel($query, int $parcelId)
    {
        return $query->where('parcel_id', $parcelId);
    }

    public function scopeForCompany($query, int $companyId)
    {
        return $query->where('company_id', $companyId);
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

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function isReattempt(): bool
    {
        return $this->advice_option === 3;
    }
}
