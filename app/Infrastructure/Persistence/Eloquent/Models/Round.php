<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Eloquent\Casts\DoubleEncodedJson;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Round Eloquent Model.
 *
 * @property int $id
 * @property int $season_id
 * @property int $round_number
 * @property string|null $name
 * @property string $slug
 * @property \Illuminate\Support\Carbon|null $scheduled_at
 * @property string $timezone
 * @property int|null $platform_track_id
 * @property string|null $track_layout
 * @property string|null $track_conditions
 * @property string|null $technical_notes
 * @property string|null $stream_url
 * @property string|null $internal_notes
 * @property int|null $fastest_lap
 * @property bool $fastest_lap_top_10
 * @property int|null $qualifying_pole
 * @property bool $qualifying_pole_top_10
 * @property string|null $points_system
 * @property bool $round_points
 * @property string $status
 * @property array<mixed>|null $round_results
 * @property array<mixed>|null $qualifying_results
 * @property array<mixed>|null $race_time_results
 * @property array<mixed>|null $fastest_lap_results
 * @property array<mixed>|null $team_championship_results
 * @property array<mixed>|null $round_totals_tiebreaker_rules_information
 * @property int $created_by_user_id
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 *
 * @method static Round firstOrCreate(array<string, mixed> $attributes, array<string, mixed> $values = [])
 * @method static \Illuminate\Database\Eloquent\Builder<Round> where($column, $operator = null, $value = null)
 * @method static Round|null find(int $id, $columns = ['*'])
 * @method static Round findOrFail(int $id, $columns = ['*'])
 * @method static \Database\Factories\RoundFactory factory($count = null, $state = [])
 */
final class Round extends Model
{
    use HasFactory;

    protected $table = 'rounds';

    /**
     * Create a new factory instance for the model.
     */
    protected static function newFactory(): \Database\Factories\RoundFactory
    {
        return \Database\Factories\RoundFactory::new();
    }

    /**
     * @var array<string>
     */
    protected $fillable = [
        'season_id',
        'round_number',
        'name',
        'slug',
        'scheduled_at',
        'timezone',
        'platform_track_id',
        'track_layout',
        'track_conditions',
        'technical_notes',
        'stream_url',
        'internal_notes',
        'fastest_lap',
        'fastest_lap_top_10',
        'qualifying_pole',
        'qualifying_pole_top_10',
        'points_system',
        'round_points',
        'status',
        'round_results',
        'qualifying_results',
        'race_time_results',
        'fastest_lap_results',
        'team_championship_results',
        'round_totals_tiebreaker_rules_information',
        'created_by_user_id',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'scheduled_at' => 'datetime',
        'fastest_lap_top_10' => 'boolean',
        'qualifying_pole_top_10' => 'boolean',
        'round_points' => 'boolean',
        'round_results' => DoubleEncodedJson::class,
        'qualifying_results' => DoubleEncodedJson::class,
        'race_time_results' => DoubleEncodedJson::class,
        'fastest_lap_results' => DoubleEncodedJson::class,
        'team_championship_results' => DoubleEncodedJson::class,
        'round_totals_tiebreaker_rules_information' => DoubleEncodedJson::class,
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the season this round belongs to.
     *
     * @return BelongsTo<SeasonEloquent, Round>
     */
    public function season(): BelongsTo
    {
        return $this->belongsTo(SeasonEloquent::class, 'season_id');
    }

    /**
     * Get the platform track for this round.
     *
     * @return BelongsTo<PlatformTrack, Round>
     */
    public function platformTrack(): BelongsTo
    {
        return $this->belongsTo(PlatformTrack::class, 'platform_track_id');
    }

    /**
     * Get the user who created this round.
     *
     * @return BelongsTo<\App\Models\User, Round>
     */
    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by_user_id');
    }

    /**
     * Get the races in this round.
     *
     * @return HasMany<Race>
     */
    public function races(): HasMany
    {
        return $this->hasMany(Race::class, 'round_id');
    }
}
