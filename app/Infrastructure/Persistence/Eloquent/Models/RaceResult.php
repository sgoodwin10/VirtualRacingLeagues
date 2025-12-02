<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $race_id
 * @property int $driver_id
 * @property int|null $division_id
 * @property int|null $position
 * @property string|null $race_time
 * @property string|null $race_time_difference
 * @property string|null $fastest_lap
 * @property string|null $penalties
 * @property bool $has_fastest_lap
 * @property bool $has_pole
 * @property bool $dnf
 * @property string $status
 * @property int $race_points
 * @property int|null $positions_gained
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 * @method static RaceResult|null find(int $id, $columns = ['*'])
 * @method static \Illuminate\Database\Eloquent\Builder<RaceResult> where(mixed $column, mixed $operator = null, mixed $value = null, string $boolean = 'and')
 * @method static \Illuminate\Database\Eloquent\Builder<RaceResult> join(string $table, string $first, string $operator = null, string $second = null, string $type = 'inner', bool $where = false)
 */
class RaceResult extends Model
{
    protected $table = 'race_results';

    protected $fillable = [
        'race_id',
        'driver_id',
        'division_id',
        'position',
        'race_time',
        'race_time_difference',
        'fastest_lap',
        'penalties',
        'has_fastest_lap',
        'has_pole',
        'dnf',
        'status',
        'race_points',
        'positions_gained',
    ];

    protected $casts = [
        'has_fastest_lap' => 'boolean',
        'has_pole' => 'boolean',
        'dnf' => 'boolean',
        'race_points' => 'integer',
        'position' => 'integer',
        'positions_gained' => 'integer',
    ];

    /**
     * @return BelongsTo<Race, self>
     */
    public function race(): BelongsTo
    {
        return $this->belongsTo(Race::class);
    }

    /**
     * @return BelongsTo<SeasonDriverEloquent, self>
     */
    public function driver(): BelongsTo
    {
        return $this->belongsTo(SeasonDriverEloquent::class, 'driver_id');
    }

    /**
     * @return BelongsTo<Division, self>
     */
    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }
}
