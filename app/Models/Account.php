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

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'company_id',
        'erpnext_account',
        'account_name',
        'account_type',
        'root_type',
        'source',
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
            'is_active'   => 'boolean',
            'is_disabled' => 'boolean',
            'synced_at'   => 'datetime',
        ];
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    /**
     * Company this account belongs to.
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Till operations linked to this account via till_operation_accounts.
     */
    public function tillOperations(): BelongsToMany
    {
        return $this->belongsToMany(TillOperation::class, 'till_operation_accounts')
            ->withTimestamps();
    }

    /**
     * Payments made into / out of this account.
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Journal entry lines referencing this account.
     */
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
        return $query->where('is_active', true)
            ->where('is_disabled', false);
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

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function isActive(): bool
    {
        return (bool) $this->is_active && ! (bool) $this->is_disabled;
    }

    public function isErpnext(): bool
    {
        return $this->source === 'erpnext';
    }

    public function isLocal(): bool
    {
        return $this->source === 'local';
    }
}
