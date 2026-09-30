<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'erpnext_company',
        'abbr',
        'is_active',
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
            'is_active' => 'boolean',
            'synced_at' => 'datetime',
        ];
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    /**
     * Users whose active company is this company.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Users who have access to this company via user_company_access.
     * Manager / Admin multi-company access.
     */
    public function usersWithAccess(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_company_access')
            ->withTimestamps();
    }

    /**
     * Till operations belonging to this company.
     */
    public function tillOperations(): HasMany
    {
        return $this->hasMany(TillOperation::class);
    }

    /**
     * Accounts (Cash / Bank / Expense) synced for this company.
     */
    public function accounts(): HasMany
    {
        return $this->hasMany(Account::class);
    }

    /**
     * Current stock snapshot rows for this company.
     */
    public function itemStocks(): HasMany
    {
        return $this->hasMany(ItemStock::class);
    }

    /**
     * Stock ledger entries for this company.
     */
    public function stockLedgers(): HasMany
    {
        return $this->hasMany(StockLedger::class);
    }

    /**
     * Sales invoices for this company.
     */
    public function salesInvoices(): HasMany
    {
        return $this->hasMany(SalesInvoice::class);
    }

    /**
     * Shifts for this company.
     */
    public function shifts(): HasMany
    {
        return $this->hasMany(Shift::class);
    }

    /**
     * Day closings for this company.
     */
    public function dayClosings(): HasMany
    {
        return $this->hasMany(DayClosing::class);
    }

    /**
     * Journal entries (expenses) for this company.
     */
    public function journalEntries(): HasMany
    {
        return $this->hasMany(JournalEntry::class);
    }

    /**
     * Purchase orders for this company.
     */
    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class);
    }

    /**
     * Purchase receipts for this company.
     */
    public function purchaseReceipts(): HasMany
    {
        return $this->hasMany(PurchaseReceipt::class);
    }

    /**
     * Courier accounts for this company.
     */
    public function courierAccounts(): HasMany
    {
        return $this->hasMany(CourierAccount::class);
    }

    /**
     * Parcels for this company.
     */
    public function parcels(): HasMany
    {
        return $this->hasMany(Parcel::class);
    }

    /**
     * Per-company item display statuses.
     */
    public function companyItemStatuses(): HasMany
    {
        return $this->hasMany(CompanyItemStatus::class);
    }

    /**
     * Stock audits for this company.
     */
    public function stockAudits(): HasMany
    {
        return $this->hasMany(StockAudit::class);
    }

    /**
     * Rejected sales for this company.
     */
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

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function isActive(): bool
    {
        return (bool) $this->is_active;
    }
}
