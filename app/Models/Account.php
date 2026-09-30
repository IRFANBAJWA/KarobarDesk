<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Account extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'erpnext_account',
        'source',
        'name',
        'account_type',
        'is_group',
        'is_disabled',
        'erpnext_modified_at',
        'sync_status',
        'last_synced_at',
    ];

    protected function casts(): array
    {
        return [
            'is_group'            => 'boolean',
            'is_disabled'         => 'boolean',
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

    public function tillOperations(): BelongsToMany
    {
        return $this->belongsToMany(TillOperation::class, 'till_operation_accounts')
            ->withPivot('is_default')
            ->withTimestamps();
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function rejectedSalePayments(): HasMany
    {
        return $this->hasMany(RejectedSalePayment::class);
    }

    public function journalEntryAccounts(): HasMany
    {
        return $this->hasMany(JournalEntryAccount::class);
    }

    // ---------------------------------------------------------------------
    // Scopes
    // ---------------------------------------------------------------------

    public function scopeForCompany($query, int $companyId)
    {
        return $query->where('company_id', $companyId);
    }

    public function scopeActive($query)
    {
        return $query->where('is_disabled', false);
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

    public function scopeByErpnextName($query, string $erpnextAccount)
    {
        return $query->where('erpnext_account', $erpnextAccount);
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
        return ! (bool) $this->is_disabled;
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
}
