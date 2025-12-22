<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $round_id
 * @property bool $is_qualifier
 * @property int|null $race_number
 * @property string|null $name
 * @property string|null $race_type
 * @property string $qualifying_format
 * @property int|null $qualifying_length
 * @property string|null $qualifying_tire
 * @property string $grid_source
 * @property int|null $grid_source_race_id
 * @property string $length_type
 * @property int $length_value
 * @property bool $extra_lap_after_time
 * @property string|null $weather
 * @property string|null $tire_restrictions
 * @property string|null $fuel_usage
 * @property string|null $damage_model
 * @property bool $track_limits_enforced
 * @property bool $false_start_detection
 * @property bool $collision_penalties
 * @property bool $mandatory_pit_stop
 * @property int|null $minimum_pit_time
 * @property string|null $assists_restrictions
 * @property int|null $fastest_lap
 * @property bool $fastest_lap_top_10
 * @property int|null $qualifying_pole
 * @property bool $qualifying_pole_top_10
 * @property array<int, int> $points_system
 * @property int $dnf_points
 * @property int $dns_points
 * @property bool $race_points
 * @property string|null $race_notes
 * @property string $status
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @method static Race firstOrCreate(array<string, mixed> $attributes, array<string, mixed> $values = [])
 *
 * @method static \Illuminate\Database\Eloquent\Builder<Race> where($column, $operator = null, $value = null, $boolean = 'and')
 * @method static Race|null find(int $id, $columns = ['*'])
 * @method static Race findOrFail(int $id, $columns = ['*'])
 */
final class Race extends Model
{
    use HasFactory;

    protected $table = 'races';

    /**
     * Create a new factory instance for the model.
     *
     * @return \Database\Factories\RaceFactory
     */
    protected static function newFactory(): \Database\Factories\RaceFactory
    {
        return \Database\Factories\RaceFactory::new();
    }

    protected $fillable = [
        'round_id',
        'is_qualifier',
        'race_number',
        'name',
        'race_type',
        // Qualifying
        'qualifying_format',
        'qualifying_length',
        'qualifying_tire',
        // Grid
        'grid_source',
        'grid_source_race_id',
        // Length
        'length_type',
        'length_value',
        'extra_lap_after_time',
        // Platform settings
        'weather',
        'tire_restrictions',
        'fuel_usage',
        'damage_model',
        // Penalties & Rules
        'track_limits_enforced',
        'false_start_detection',
        'collision_penalties',
        'mandatory_pit_stop',
        'minimum_pit_time',
        'assists_restrictions',
        // Bonus Points
        'fastest_lap',
        'fastest_lap_top_10',
        'qualifying_pole',
        'qualifying_pole_top_10',
        // Points
        'points_system',
        'dnf_points',
        'dns_points',
        'race_points',
        // Notes
        'race_notes',
        // Status
        'status',
    ];

    protected $casts = [
        'is_qualifier' => 'boolean',
        'race_number' => 'integer',
        'qualifying_length' => 'integer',
        'grid_source_race_id' => 'integer',
        'length_value' => 'integer',
        'extra_lap_after_time' => 'boolean',
        'track_limits_enforced' => 'boolean',
        'false_start_detection' => 'boolean',
        'collision_penalties' => 'boolean',
        'mandatory_pit_stop' => 'boolean',
        'minimum_pit_time' => 'integer',
        'fastest_lap' => 'integer',
        'fastest_lap_top_10' => 'boolean',
        'qualifying_pole' => 'integer',
        'qualifying_pole_top_10' => 'boolean',
        'points_system' => 'array',
        'dnf_points' => 'integer',
        'dns_points' => 'integer',
        'race_points' => 'boolean',
    ];

    /**
     * @return BelongsTo<Round, Race>
     */
    public function round(): BelongsTo
    {
        return $this->belongsTo(Round::class, 'round_id');
    }

    /**
     * @return BelongsTo<Race, Race>
     */
    public function gridSourceRace(): BelongsTo
    {
        return $this->belongsTo(Race::class, 'grid_source_race_id');
    }

    /**
     * Scope to filter only qualifiers
     *
     * @param \Illuminate\Database\Eloquent\Builder<Race> $query
     * @return \Illuminate\Database\Eloquent\Builder<Race>
     */
    public function scopeQualifiers(\Illuminate\Database\Eloquent\Builder $query): \Illuminate\Database\Eloquent\Builder
    {
        return $query->where('is_qualifier', true);
    }

    /**
     * Scope to filter only races (not qualifiers)
     *
     * @param \Illuminate\Database\Eloquent\Builder<Race> $query
     * @return \Illuminate\Database\Eloquent\Builder<Race>
     */
    public function scopeRaces(\Illuminate\Database\Eloquent\Builder $query): \Illuminate\Database\Eloquent\Builder
    {
        return $query->where('is_qualifier', false);
    }

    /**
     * Scope to filter by round
     *
     * @param \Illuminate\Database\Eloquent\Builder<Race> $query
     * @param int $roundId
     * @return \Illuminate\Database\Eloquent\Builder<Race>
     */
    public function scopeForRound(\Illuminate\Database\Eloquent\Builder $query, int $roundId): \Illuminate\Database\Eloquent\Builder
    {
        return $query->where('round_id', $roundId);
    }

    /**
     * Get the results for this race.
     *
     * @return HasMany<RaceResult>
     */
    public function results(): HasMany
    {
        return $this->hasMany(RaceResult::class, 'race_id');
    }
}
