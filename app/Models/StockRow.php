<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockRow extends Model
{
    use HasFactory;

    protected $table = 'stock_rows';

    protected $fillable = [
        'company_id',
        'name',
        'code',
        'assigned_user_id',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    public function itemAssignments(): HasMany
    {
        return $this->hasMany(ItemRowAssignment::class);
    }

    public function stockAuditItems(): HasMany
    {
        return $this->hasMany(StockAuditItem::class);
    }
}
