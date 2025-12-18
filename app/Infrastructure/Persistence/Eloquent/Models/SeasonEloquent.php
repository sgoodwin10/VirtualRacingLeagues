<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Eloquent\Traits\HasMediaCollections;
use Database\Factories\SeasonFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;

/**
 * Season Eloquent Model (Anemic).
 *
 * This is a thin persistence model with NO business logic.
 * Business logic belongs in the Season domain entity.
 *
 * @property int $id
 * @property int $competition_id
 * @property string $name
 * @property string $slug
 * @property string|null $car_class
 * @property string|null $description
 * @property string|null $technical_specs
 * @property string|null $logo_path
 * @property string|null $banner_path
 * @property bool $team_championship_enabled
 * @property int|null $teams_drivers_for_calculation
 * @property bool $teams_drop_rounds
 * @property int|null $teams_total_drop_rounds
 * @property bool $race_divisions_enabled
 * @property bool $race_times_required
 * @property bool $drop_round
 * @property int $total_drop_rounds
 * @property string $status
 * @property int $created_by_user_id
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @method static SeasonEloquent firstOrCreate(array<string, mixed> $attributes, array<string, mixed> $values = [])
 */
final class SeasonEloquent extends Model implements HasMedia
{
    use HasFactory;
    use SoftDeletes;
    use HasMediaCollections;

    /**
     * The table associated with the model.
     */
    protected $table = 'seasons';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'competition_id',
        'name',
        'slug',
        'car_class',
        'description',
        'technical_specs',
        'logo_path',
        'banner_path',
        'team_championship_enabled',
        'teams_drivers_for_calculation',
        'teams_drop_rounds',
        'teams_total_drop_rounds',
        'race_divisions_enabled',
        'race_times_required',
        'drop_round',
        'total_drop_rounds',
        'status',
        'created_by_user_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'team_championship_enabled' => 'boolean',
        'teams_drivers_for_calculation' => 'integer',
        'teams_drop_rounds' => 'boolean',
        'teams_total_drop_rounds' => 'integer',
        'race_divisions_enabled' => 'boolean',
        'race_times_required' => 'boolean',
        'drop_round' => 'boolean',
        'total_drop_rounds' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Get the competition that owns the season.
     *
     * @return BelongsTo<Competition, self>
     */
    public function competition(): BelongsTo
    {
        return $this->belongsTo(Competition::class, 'competition_id');
    }

    /**
     * Get the user who created the season.
     *
     * @return BelongsTo<UserEloquent, self>
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(UserEloquent::class, 'created_by_user_id');
    }

    /**
     * Get the drivers in this season.
     *
     * @return HasMany<SeasonDriverEloquent>
     */
    public function seasonDrivers(): HasMany
    {
        return $this->hasMany(SeasonDriverEloquent::class, 'season_id');
    }

    /**
     * Get the rounds in this season.
     *
     * @return HasMany<Round>
     */
    public function rounds(): HasMany
    {
        return $this->hasMany(Round::class, 'season_id');
    }

    /**
     * Create a new factory instance for the model.
     */
    protected static function newFactory(): SeasonFactory
    {
        return SeasonFactory::new();
    }

    /**
     * Register media collections for the season.
     */
    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('logo')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);

        $this->addMediaCollection('banner')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);
    }
}
