<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
 * @property bool $race_divisions
 * @property array<int, int> $points_system
 * @property array<string, int>|null $bonus_points
 * @property int $dnf_points
 * @property int $dns_points
 * @property string|null $race_notes
 * @property string $created_at
 * @property string $updated_at
 *
 * @method static \Illuminate\Database\Eloquent\Builder<Race> where($column, $operator = null, $value = null, $boolean = 'and')
 * @method static Race|null find(int $id, $columns = ['*'])
 * @method static Race findOrFail(int $id, $columns = ['*'])
 */
final class Race extends Model
{
    use HasFactory;

    protected $table = 'races';

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
        // Division
        'race_divisions',
        // Points
        'points_system',
        'bonus_points',
        'dnf_points',
        'dns_points',
        // Notes
        'race_notes',
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
        'race_divisions' => 'boolean',
        'points_system' => 'array',
        'bonus_points' => 'array',
        'dnf_points' => 'integer',
        'dns_points' => 'integer',
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
    public function scopeQualifiers($query)
    {
        return $query->where('is_qualifier', true);
    }

    /**
     * Scope to filter only races (not qualifiers)
     *
     * @param \Illuminate\Database\Eloquent\Builder<Race> $query
     * @return \Illuminate\Database\Eloquent\Builder<Race>
     */
    public function scopeRaces($query)
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
    public function scopeForRound($query, int $roundId)
    {
        return $query->where('round_id', $roundId);
    }
}
