<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'erpnext_company',
        'is_active',
        'erpnext_modified_at',
        'sync_status',
        'last_synced_at',
    ];

    protected function casts(): array
    {
        return [
            'is_active'           => 'boolean',
            'erpnext_modified_at' => 'datetime',
            'last_synced_at'      => 'datetime',
        ];
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function usersWithAccess(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_company_access')
            ->withTimestamps();
    }

    public function tillOperations(): HasMany
    {
        return $this->hasMany(TillOperation::class);
    }

    public function accounts(): HasMany
    {
        return $this->hasMany(Account::class);
    }

    public function itemStocks(): HasMany
    {
        return $this->hasMany(ItemStock::class);
    }

    public function stockLedgers(): HasMany
    {
        return $this->hasMany(StockLedger::class);
    }

    public function salesInvoices(): HasMany
    {
        return $this->hasMany(SalesInvoice::class);
    }

    public function shifts(): HasMany
    {
        return $this->hasMany(Shift::class);
    }

    public function dayClosings(): HasMany
    {
        return $this->hasMany(DayClosing::class);
    }

    public function journalEntries(): HasMany
    {
        return $this->hasMany(JournalEntry::class);
    }

    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class);
    }

    public function purchaseReceipts(): HasMany
    {
        return $this->hasMany(PurchaseReceipt::class);
    }

    public function courierAccounts(): HasMany
    {
        return $this->hasMany(CourierAccount::class);
    }

    public function parcels(): HasMany
    {
        return $this->hasMany(Parcel::class);
    }

    public function companyItemStatuses(): HasMany
    {
        return $this->hasMany(CompanyItemStatus::class);
    }

    public function stockAudits(): HasMany
    {
        return $this->hasMany(StockAudit::class);
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

    public function scopeSynced($query)
    {
        return $query->where('sync_status', 'synced');
    }

    public function scopePending($query)
    {
        return $query->where('sync_status', 'pending');
    }

    public function scopeFailed($query)
    {
        return $query->where('sync_status', 'failed');
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
