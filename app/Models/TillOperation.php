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

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'company_id',
        'user_id',
        'erpnext_name',
        'till_no',
        'till_name',
        'warehouse',
        'price_list_id',
        'price_list',
        'is_online',
        'return_pin',
        'source',
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
            'till_no'    => 'integer',
            'is_online'  => 'boolean',
            'return_pin' => 'integer',
            'is_active'  => 'boolean',
            'synced_at'  => 'datetime',
        ];
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'return_pin',
    ];

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    /**
     * Company this till belongs to.
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * User bound to this till (one till per user).
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Price list assigned to this till.
     */
    public function priceList(): BelongsTo
    {
        return $this->belongsTo(PriceList::class);
    }

    /**
     * Accounts linked to this till via till_operation_accounts.
     */
    public function accounts(): BelongsToMany
    {
        return $this->belongsToMany(Account::class, 'till_operation_accounts')
            ->withTimestamps();
    }

    /**
     * Shifts run on this till.
     */
    public function shifts(): HasMany
    {
        return $this->hasMany(Shift::class);
    }

    /**
     * Day closings for this till.
     */
    public function dayClosings(): HasMany
    {
        return $this->hasMany(DayClosing::class);
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

    /**
     * Verify a 4-digit PIN against this till's return PIN.
     * Plain integer comparison, per Section 19.
     */
    public function verifyReturnPin(int $pin): bool
    {
        return $this->return_pin === $pin;
    }
}
