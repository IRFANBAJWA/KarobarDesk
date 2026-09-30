<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class TillOperationAccount extends Pivot
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'till_operation_accounts';

    /**
     * Indicates if the IDs are auto-incrementing.
     *
     * @var bool
     */
    public $incrementing = true;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'till_operation_id',
        'account_id',
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

    public function tillOperation()
    {
        return $this->belongsTo(TillOperation::class);
    }

    public function account()
    {
        return $this->belongsTo(Account::class);
    }
}
