<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class TillOperationAccount extends Pivot
{
    protected $table = 'till_operation_accounts';

    public $incrementing = true;

    protected $fillable = [
        'till_operation_id',
        'account_id',
        'is_default',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
        ];
    }

    public function tillOperation()
    {
        return $this->belongsTo(TillOperation::class);
    }

    public function account()
    {
        return $this->belongsTo(Account::class);
    }
}
