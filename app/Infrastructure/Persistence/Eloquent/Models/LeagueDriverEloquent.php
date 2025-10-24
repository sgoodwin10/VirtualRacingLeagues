<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use App\Domain\Driver\ValueObjects\DriverStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * LeagueDriver Eloquent Model (Anemic).
 *
 * This is a thin persistence model with NO business logic.
 * Business logic belongs in the LeagueDriver domain entity.
 *
 * @property int $id
 * @property int $league_id
 * @property int $driver_id
 * @property int|null $driver_number
 * @property DriverStatus $status
 * @property string|null $league_notes
 * @property \Illuminate\Support\Carbon $added_to_league_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property-read \App\Infrastructure\Persistence\Eloquent\Models\Driver $driver
 * @property-read int|null $number
 * @property-read null|null $team_name
 * @property-read \App\Infrastructure\Persistence\Eloquent\Models\League $league
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeagueDriverEloquent newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeagueDriverEloquent newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeagueDriverEloquent query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeagueDriverEloquent whereAddedToLeagueAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeagueDriverEloquent whereDriverId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeagueDriverEloquent whereDriverNumber($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeagueDriverEloquent whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeagueDriverEloquent whereLeagueId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeagueDriverEloquent whereLeagueNotes($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeagueDriverEloquent whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|LeagueDriverEloquent whereUpdatedAt($value)
 */
final class LeagueDriverEloquent extends Model
{
    /**
     * The table associated with the model.
     */
    protected $table = 'league_drivers';

    /**
     * Indicates if the model should be timestamped.
     * We use custom timestamp columns.
     */
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'league_id',
        'driver_id',
        'driver_number',
        'status',
        'league_notes',
        'added_to_league_at',
        'updated_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'driver_number' => 'integer',
        'status' => DriverStatus::class,
        'added_to_league_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the league this driver belongs to.
     *
     * @return BelongsTo<League, LeagueDriverEloquent>
     */
    public function league(): BelongsTo
    {
        return $this->belongsTo(League::class, 'league_id');
    }

    /**
     * Get the driver.
     *
     * @return BelongsTo<Driver, LeagueDriverEloquent>
     */
    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class, 'driver_id');
    }

    /**
     * Accessor for 'number' - alias for 'driver_number'.
     * Provides backward compatibility with existing code.
     */
    public function getNumberAttribute(): ?int
    {
        return $this->driver_number;
    }

    /**
     * Accessor for 'team_name' - placeholder for future implementation.
     * Currently returns null as the schema doesn't include team_name yet.
     */
    public function getTeamNameAttribute(): null
    {
        return null;
    }
}
