<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FieldPermission extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'role_id',
        'form',
        'field',
        'can_view',
        'can_edit',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'can_view' => 'boolean',
            'can_edit' => 'boolean',
        ];
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    /**
     * Role this field permission belongs to.
     * Field permissions are tied to a role (Section 9).
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    // ---------------------------------------------------------------------
    // Scopes
    // ---------------------------------------------------------------------

    public function scopeForRole($query, int $roleId)
    {
        return $query->where('role_id', $roleId);
    }

    public function scopeForForm($query, string $form)
    {
        return $query->where('form', $form);
    }

    /**
     * Match a specific role + form + field.
     * Usage: FieldPermission::for('manager_role_id', 'sales_invoice', 'cost_price')->first();
     */
    public function scopeFor($query, int $roleId, string $form, string $field)
    {
        return $query
            ->where('role_id', $roleId)
            ->where('form', $form)
            ->where('field', $field);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function canView(): bool
    {
        return (bool) $this->can_view;
    }

    public function canEdit(): bool
    {
        return (bool) $this->can_edit;
    }
}
