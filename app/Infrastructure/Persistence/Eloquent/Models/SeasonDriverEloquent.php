<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * SeasonDriver Eloquent Model (Anemic).
 *
 * This is a thin persistence model with NO business logic.
 * Business logic belongs in the SeasonDriver domain entity.
 *
 * @property int $id
 * @property int $season_id
 * @property int $league_driver_id
 * @property string $status Driver status in this season
 * @property string|null $notes Season-specific driver notes
 * @property \Illuminate\Support\Carbon $added_at When driver was added to season
 * @property \Illuminate\Support\Carbon $updated_at
 * @property-read \App\Infrastructure\Persistence\Eloquent\Models\LeagueDriverEloquent $leagueDriver
 * @property-read \App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent $season
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SeasonDriverEloquent newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SeasonDriverEloquent newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SeasonDriverEloquent query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SeasonDriverEloquent whereAddedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SeasonDriverEloquent whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SeasonDriverEloquent whereLeagueDriverId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SeasonDriverEloquent whereNotes($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SeasonDriverEloquent whereSeasonId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SeasonDriverEloquent whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SeasonDriverEloquent whereUpdatedAt($value)
 * @mixin \Eloquent
 */
final class SeasonDriverEloquent extends Model
{
    /**
     * The table associated with the model.
     */
    protected $table = 'season_drivers';

    /**
     * Indicates if the model should be timestamped.
     */
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'season_id',
        'league_driver_id',
        'status',
        'notes',
        'added_at',
        'updated_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'added_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the season this driver belongs to.
     *
     * @return BelongsTo<SeasonEloquent, self>
     */
    public function season(): BelongsTo
    {
        return $this->belongsTo(SeasonEloquent::class, 'season_id');
    }

    /**
     * Get the league driver.
     *
     * @return BelongsTo<LeagueDriverEloquent, self>
     */
    public function leagueDriver(): BelongsTo
    {
        return $this->belongsTo(LeagueDriverEloquent::class, 'league_driver_id');
    }
}
