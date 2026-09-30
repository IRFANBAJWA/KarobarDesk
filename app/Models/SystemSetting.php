<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    use HasFactory;

    protected $table = 'system_settings';

    protected $fillable = [
        'key',
        'value',
        'type',
        'group',
        'label',
        'description',
        'options',
        'is_public',
        'is_editable',
    ];

    protected function casts(): array
    {
        return [
            'is_public'   => 'boolean',
            'is_editable' => 'boolean',
        ];
    }

    // ---------------------------------------------------------------------
    // Scopes
    // ---------------------------------------------------------------------

    public function scopeByKey($query, string $key)
    {
        return $query->where('key', $key);
    }

    public function scopeGroup($query, string $group)
    {
        return $query->where('group', $group);
    }

    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }

    public function scopeEditable($query)
    {
        return $query->where('is_editable', true);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    /**
     * Read a setting value by key, with a fallback default.
     * Returns the raw string (no automatic type casting).
     */
    public static function get(string $key, ?string $default = null): ?string
    {
        $row = static::query()->where('key', $key)->first();

        return $row?->value ?? $default;
    }

    /**
     * Write a setting value. Creates the row if it doesn't exist.
     */
    public static function set(
        string $key,
        ?string $value,
        ?string $description = null,
        string $type = 'string',
        string $group = 'general'
    ): self {
        return static::query()->updateOrCreate(
            ['key' => $key],
            [
                'value'       => $value,
                'description' => $description,
                'type'        => $type,
                'group'       => $group,
            ]
        );
    }

    /**
     * Cast the value according to the `type` column.
     */
    public function typedValue(): mixed
    {
        return match ($this->type) {
            'int', 'integer' => (int) $this->value,
            'float', 'decimal' => (float) $this->value,
            'bool', 'boolean' => filter_var($this->value, FILTER_VALIDATE_BOOLEAN),
            default => $this->value,
        };
    }

    public function isPublic(): bool
    {
        return (bool) $this->is_public;
    }

    public function isEditable(): bool
    {
        return (bool) $this->is_editable;
    }
}
