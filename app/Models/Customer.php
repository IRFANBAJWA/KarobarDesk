<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'erpnext_customer',
        'customer_name',
        'customer_group',
        'territory',
        'mobile_no',
        'phone',
        'email',
        'address_line1',
        'address_line2',
        'city',
        'loyalty_program',
        'loyalty_points',
        'is_active',
        'is_disabled',
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
            'loyalty_points' => 'integer',
            'is_active'      => 'boolean',
            'is_disabled'    => 'boolean',
            'synced_at'      => 'datetime',
        ];
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    /**
     * Sales invoices issued to this customer.
     */
    public function salesInvoices(): HasMany
    {
        return $this->hasMany(SalesInvoice::class);
    }

    // ---------------------------------------------------------------------
    // Scopes
    // ---------------------------------------------------------------------

    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where('is_disabled', false);
    }

    public function scopeByErpnextName($query, string $erpnextCustomer)
    {
        return $query->where('erpnext_customer', $erpnextCustomer);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function isActive(): bool
    {
        return (bool) $this->is_active && ! (bool) $this->is_disabled;
    }
}
