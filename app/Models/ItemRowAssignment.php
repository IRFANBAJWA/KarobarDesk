<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ItemRowAssignment extends Model
{
    use HasFactory;

    protected $table = 'item_row_assignments';

    protected $fillable = [
        'company_id',
        'item_id',
        'stock_row_id',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    public function stockRow(): BelongsTo
    {
        return $this->belongsTo(StockRow::class);
    }
}
