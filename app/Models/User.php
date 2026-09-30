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
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'erpnext_password',
        'erpnext_token',
    ];

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
        ];
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function companies(): BelongsToMany
    {
        return $this->belongsToMany(Company::class, 'user_company_access')
            ->withTimestamps();
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_roles')
            ->withTimestamps();
    }

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

    public function scopeForCompany($query, int $companyId)
    {
        return $query->where('company_id', $companyId);
    }

    public function scopeWithSuperAdminRole($query)
    {
        return $query->whereHas('roles', function ($q) {
            $q->where('is_super_admin', true);
        });
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    /**
     * Super Admin is determined via roles, not a user column.
     */
    public function isSuperAdmin(): bool
    {
        return $this->roles()
            ->where('is_super_admin', true)
            ->exists();
    }

    public function isActive(): bool
    {
        return (bool) $this->is_active;
    }

    public function getActiveCompanyId(): ?int
    {
        return $this->company_id !== null ? (int) $this->company_id : null;
    }

    public function hasRole(string $role): bool
    {
        return $this->roles->contains('name', $role);
    }

    /**
     * @param array<int, string> $roles
     */
    public function hasAnyRole(array $roles): bool
    {
        return $this->roles->whereIn('name', $roles)->isNotEmpty();
    }

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
