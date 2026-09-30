<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TillOperation extends Model
{
    use HasFactory;

    protected $fillable = [
        'erpnext_name',
        'source',
        'company_id',
        'user_id',
        'price_list_id',
        'price_list',
        'warehouse',
        'erpnext_role',
        'shop_code',
        'till_no',
        'shop_name',
        'address',
        'phone',
        'is_online',
        'allow_rate',
        'return_pin',
        'is_active',
        'erpnext_modified_at',
        'sync_status',
        'last_synced_at',
    ];

    protected $hidden = [
        'return_pin',
    ];

    protected function casts(): array
    {
        return [
            'till_no'             => 'integer',
            'is_online'           => 'boolean',
            'allow_rate'          => 'boolean',
            'return_pin'          => 'integer',
            'is_active'           => 'boolean',
            'erpnext_modified_at' => 'datetime',
            'last_synced_at'      => 'datetime',
        ];
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function priceList(): BelongsTo
    {
        return $this->belongsTo(PriceList::class);
    }

    public function accounts(): BelongsToMany
    {
        return $this->belongsToMany(Account::class, 'till_operation_accounts')
            ->withPivot('is_default')
            ->withTimestamps();
    }

    public function shifts(): HasMany
    {
        return $this->hasMany(Shift::class);
    }

    public function dayClosings(): HasMany
    {
        return $this->hasMany(DayClosing::class);
    }

    public function salesInvoices(): HasMany
    {
        return $this->hasMany(SalesInvoice::class);
    }

    public function rejectedSales(): HasMany
    {
        return $this->hasMany(RejectedSale::class);
    }

    // ---------------------------------------------------------------------
    // Scopes
    // ---------------------------------------------------------------------

    public function scopeForCompany($query, int $companyId)
    {
        return $query->where('company_id', $companyId);
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOnline($query)
    {
        return $query->where('is_online', true);
    }

    public function scopeSource($query, string $source)
    {
        return $query->where('source', $source);
    }

    public function scopeErpnext($query)
    {
        return $query->where('source', 'erpnext');
    }

    public function scopeLocal($query)
    {
        return $query->where('source', 'local');
    }

    public function scopeSynced($query)
    {
        return $query->where('sync_status', 'synced');
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function isOnline(): bool
    {
        return (bool) $this->is_online;
    }

    public function isActive(): bool
    {
        return (bool) $this->is_active;
    }

    public function isErpnext(): bool
    {
        return $this->source === 'erpnext';
    }

    public function isLocal(): bool
    {
        return $this->source === 'local';
    }

    public function isSynced(): bool
    {
        return $this->sync_status === 'synced';
    }

    public function verifyReturnPin(int $pin): bool
    {
        return $this->return_pin === $pin;
    }
}
