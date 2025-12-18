<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Eloquent\Traits\HasMediaCollections;
use Database\Factories\TeamFactory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\MediaLibrary\HasMedia;

/**
 * Team Eloquent Model (Anemic).
 *
 * @property int $id
 * @property int $season_id
 * @property string $name
 * @property string|null $logo_url
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property-read SeasonEloquent $season
 * @property-read \Illuminate\Database\Eloquent\Collection<int, SeasonDriverEloquent> $seasonDrivers
 * @property-read int|null $season_drivers_count
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Team newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Team newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Team query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Team whereNotNull($column)
 * @method static \Illuminate\Database\Eloquent\Collection<int, Team> get($columns = ['*'])
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Team whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Team whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Team whereLogoUrl($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Team whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Team whereSeasonId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Team whereUpdatedAt($value)
 * @method static TeamFactory factory($count = null, $state = [])
 */
class Team extends Model implements HasMedia
{
    use HasFactory;
    use HasMediaCollections;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'teams';

    /**
     * Create a new factory instance for the model.
     */
    protected static function newFactory(): Factory
    {
        return TeamFactory::new();
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'season_id',
        'name',
        'logo_url',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'season_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the season that owns the team.
     *
     * @return BelongsTo<SeasonEloquent, Team>
     */
    public function season(): BelongsTo
    {
        return $this->belongsTo(SeasonEloquent::class, 'season_id');
    }

    /**
     * Get the drivers assigned to this team.
     *
     * @return HasMany<SeasonDriverEloquent>
     */
    public function seasonDrivers(): HasMany
    {
        return $this->hasMany(SeasonDriverEloquent::class, 'team_id');
    }

    /**
     * Register media collections for the team.
     *
     * @return void
     */
    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('logo')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);
    }
}
