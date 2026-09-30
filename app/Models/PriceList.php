<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PriceList extends Model
{
    use HasFactory;

    protected $fillable = [
        'erpnext_name',
        'name',
        'is_selling',
        'is_active',
        'erpnext_modified_at',
        'sync_status',
        'last_synced_at',
    ];

    protected function casts(): array
    {
        return [
            'is_selling'          => 'boolean',
            'is_active'           => 'boolean',
            'erpnext_modified_at' => 'datetime',
            'last_synced_at'      => 'datetime',
        ];
    }

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    public function itemPrices(): HasMany
    {
        return $this->hasMany(ItemPrice::class);
    }

    public function tillOperations(): HasMany
    {
        return $this->hasMany(TillOperation::class);
    }

    // ---------------------------------------------------------------------
    // Scopes
    // ---------------------------------------------------------------------

    public function scopeSelling($query)
    {
        return $query->where('is_selling', true);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeSynced($query)
    {
        return $query->where('sync_status', 'synced');
    }

    public function scopePending($query)
    {
        return $query->where('sync_status', 'pending');
    }

    public function scopeFailed($query)
    {
        return $query->where('sync_status', 'failed');
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function isSelling(): bool
    {
        return (bool) $this->is_selling;
    }

    public function isActive(): bool
    {
        return (bool) $this->is_active;
    }

    public function isSynced(): bool
    {
        return $this->sync_status === 'synced';
    }
}
