<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens;
    use HasFactory;
    use Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'username',
        'password',
        'company_id',
        'erpnext_user',
        'erpnext_password',
        'erpnext_token',
        'erpnext_last_tested_at',
        'erpnext_last_error',
        'is_active',
        'is_super_admin',
        'last_login_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'erpnext_password',
        'erpnext_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at'      => 'datetime',
            'password'               => 'hashed',
            'erpnext_password'       => 'encrypted',
            'erpnext_token'          => 'encrypted',
            'erpnext_last_tested_at' => 'datetime',
            'last_login_at'          => 'datetime',
            'is_active'              => 'boolean',
            'is_super_admin'         => 'boolean',
        ];
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    /**
     * Active company. Nullable for Super Admin.
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Companies this user can access (Manager / Admin).
     * Cashier / Sales Person have a single company via users.company_id.
     * Super Admin has none (sees all).
     */
    public function companies(): BelongsToMany
    {
        return $this->belongsToMany(Company::class, 'user_company_access')
            ->withTimestamps();
    }

    /**
     * Roles assigned to this user.
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_roles')
            ->withTimestamps();
    }

    /**
     * Till operation bound to this user (one per user).
     * Cashier must have one. Others optional.
     */
    public function tillOperation(): HasOne
    {
        return $this->hasOne(TillOperation::class);
    }

    // ---------------------------------------------------------------------
    // Scopes
    // ---------------------------------------------------------------------

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeSuperAdmins($query)
    {
        return $query->where('is_super_admin', true);
    }

    public function scopeForCompany($query, int $companyId)
    {
        return $query->where('company_id', $companyId);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function isSuperAdmin(): bool
    {
        return (bool) $this->is_super_admin;
    }

    public function isActive(): bool
    {
        return (bool) $this->is_active;
    }

    public function getActiveCompanyId(): ?int
    {
        return $this->company_id !== null ? (int) $this->company_id : null;
    }

    /**
     * Check if user has a role by name.
     */
    public function hasRole(string $role): bool
    {
        return $this->roles->contains('name', $role);
    }

    /**
     * Check if user has any of the given roles.
     *
     * @param array<int, string> $roles
     */
    public function hasAnyRole(array $roles): bool
    {
        return $this->roles->whereIn('name', $roles)->isNotEmpty();
    }

    /**
     * Check module + action permission via roles -> role_permissions -> permissions.
     * Super Admin bypasses all permission checks.
     */
    public function hasPermission(string $module, string $action): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        return $this->roles()
            ->whereHas('permissions', function ($q) use ($module, $action) {
                $q->where('module', $module)->where('action', $action);
            })
            ->exists();
    }

    /**
     * Check whether this user can access a given company.
     * Super Admin: always. Others: active company or pivot row.
     */
    public function canAccessCompany(int $companyId): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        if ((int) $this->company_id === $companyId) {
            return true;
        }

        return $this->companies()->where('companies.id', $companyId)->exists();
    }
}
