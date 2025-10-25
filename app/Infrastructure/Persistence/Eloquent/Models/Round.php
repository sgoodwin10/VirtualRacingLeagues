<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
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
 * @property string $status
 * @property int $created_by_user_id
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 *
 * @method static \Illuminate\Database\Eloquent\Builder<Round> where($column, $operator = null, $value = null, $boolean = 'and')
 * @method static Round|null find(int $id, $columns = ['*'])
 * @method static Round findOrFail(int $id, $columns = ['*'])
 * @method static \Database\Factories\RoundFactory factory($count = null, $state = [])
 */
final class Round extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'rounds';

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
        'status',
        'created_by_user_id',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'scheduled_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
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
}
