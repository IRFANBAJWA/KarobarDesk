<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShiftDenomination extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'shift_id',
        'type',
        // Notes
        'd5000',
        'd1000',
        'd500',
        'd100',
        'd50',
        'd20',
        'd10',
        'd5',
        'd2',
        'd1',
        'c50',
        'c25',
        'c10',
        'c5',
        'c1',
        // Totals
        'notes_total',
        'coins_total',
        'grand_total',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'd5000'       => 'integer',
            'd1000'       => 'integer',
            'd500'        => 'integer',
            'd100'        => 'integer',
            'd50'         => 'integer',
            'd20'         => 'integer',
            'd10'         => 'integer',
            'd5'          => 'integer',
            'd2'          => 'integer',
            'd1'          => 'integer',
            'c50'         => 'integer',
            'c25'         => 'integer',
            'c10'         => 'integer',
            'c5'          => 'integer',
            'c1'          => 'integer',
            'notes_total' => 'decimal:2',
            'coins_total' => 'decimal:2',
            'grand_total' => 'decimal:2',
        ];
    }

    /**
     * Denomination face values (PKR).
     * Column => face value.
     */
    public const NOTES = [
        'd5000' => 5000,
        'd1000' => 1000,
        'd500'  => 500,
        'd100'  => 100,
        'd50'   => 50,
        'd20'   => 20,
        'd10'   => 10,
        'd5'    => 5,
        'd2'    => 2,
        'd1'    => 1,
    ];

    public const COINS = [
        'c50' => 50,
        'c25' => 25,
        'c10' => 10,
        'c5'  => 5,
        'c1'  => 1,
    ];

    // ---------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------

    public function shift(): BelongsTo
    {
        return $this->belongsTo(Shift::class);
    }

    // ---------------------------------------------------------------------
    // Scopes
    // ---------------------------------------------------------------------

    public function scopeOpening($query)
    {
        return $query->where('type', 'OPENING');
    }

    public function scopeClosing($query)
    {
        return $query->where('type', 'CLOSING');
    }

    public function scopeForShift($query, int $shiftId)
    {
        return $query->where('shift_id', $shiftId);
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    public function isOpening(): bool
    {
        return $this->type === 'OPENING';
    }

    public function isClosing(): bool
    {
        return $this->type === 'CLOSING';
    }

    /**
     * Compute totals from raw counts.
     * Useful as a fallback if POS doesn't send totals.
     */
    public function computeTotals(): array
    {
        $notesTotal = 0;
        foreach (self::NOTES as $column => $faceValue) {
            $notesTotal += ((int) $this->{$column}) * $faceValue;
        }

        $coinsTotal = 0;
        foreach (self::COINS as $column => $faceValue) {
            $coinsTotal += ((int) $this->{$column}) * $faceValue;
        }

        return [
            'notes_total' => $notesTotal,
            'coins_total' => $coinsTotal,
            'grand_total' => $notesTotal + $coinsTotal,
        ];
    }
}
