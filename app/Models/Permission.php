<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Permission extends Model
{
    use HasFactory;

    protected $fillable = [
        'module',
        'action',
        'label',
        'description',
        'is_system',
    ];

    protected function casts(): array
    {
        return [
            'is_system' => 'boolean',
        ];
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

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

    public function scopeFor($query, string $module, string $action)
    {
        return $query->where('module', $module)->where('action', $action);
    }

    public function scopeSystem($query)
    {
        return $query->where('is_system', true);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    /**
     * Full permission key, e.g. "stock_audit.verify".
     */
    public function key(): string
    {
        return $this->module . '.' . $this->action;
    }

    /**
     * Human-friendly label with fallback.
     */
    public function displayLabel(): string
    {
        return $this->label ?: $this->key();
    }

    public function isSystem(): bool
    {
        return (bool) $this->is_system;
    }
}
