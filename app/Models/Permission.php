<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Permission extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'module',
        'action',
        'display_name',
        'description',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [];
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    /**
     * Roles granted this permission.
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_permissions')
            ->withTimestamps();
    }

    // ---------------------------------------------------------------------
    // Scopes
    // ---------------------------------------------------------------------

    public function scopeModule($query, string $module)
    {
        return $query->where('module', $module);
    }

    public function scopeAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    /**
     * Match a specific module + action pair.
     * Usage: Permission::for('stock_audit', 'verify')->first();
     */
    public function scopeFor($query, string $module, string $action)
    {
        return $query->where('module', $module)->where('action', $action);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    /**
     * Full permission key, e.g. "stock_audit.verify".
     * Note: named "key()" to avoid clashing with Laravel's getKeyName().
     */
    public function key(): string
    {
        return $this->module . '.' . $this->action;
    }

    /**
     * Human-friendly label fallback if display_name is null.
     */
    public function label(): string
    {
        return $this->display_name ?: $this->key();
    }
}
