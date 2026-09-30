<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'erpnext_customer',
        'customer_name',
        'customer_type',
        'phone',
        'email',
        'address',
        'city',
        'country',
        'credit_limit',
        'current_balance',
        'tax_number',
        'loyalty_card_number',
        'loyalty_member',
        'special_discount',
        'loyalty_points',
        'loyalty_program',
        'loyalty_expiry',
        'is_active',
        'erpnext_modified_at',
        'sync_status',
        'last_synced_at',
    ];

    protected function casts(): array
    {
        return [
            'credit_limit'        => 'decimal:2',
            'current_balance'     => 'decimal:2',
            'special_discount'    => 'decimal:2',
            'loyalty_points'      => 'integer',
            'loyalty_member'      => 'boolean',
            'loyalty_expiry'      => 'date',
            'is_active'           => 'boolean',
            'erpnext_modified_at' => 'datetime',
            'last_synced_at'      => 'datetime',
        ];
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

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

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByErpnextName($query, string $erpnextCustomer)
    {
        return $query->where('erpnext_customer', $erpnextCustomer);
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
        return (bool) $this->is_active;
    }

    public function isSynced(): bool
    {
        return $this->sync_status === 'synced';
    }
}
