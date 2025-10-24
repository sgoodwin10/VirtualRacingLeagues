<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Database\Factories\SeasonFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

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
 * @property bool $race_divisions_enabled
 * @property string $status
 * @property int $created_by_user_id
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 */
final class SeasonEloquent extends Model
{
    use HasFactory;
    use SoftDeletes;

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
        'race_divisions_enabled',
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
        'race_divisions_enabled' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Get the competition that owns the season.
     *
     * @return BelongsTo<CompetitionEloquent, self>
     */
    public function competition(): BelongsTo
    {
        return $this->belongsTo(CompetitionEloquent::class, 'competition_id');
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
     * Create a new factory instance for the model.
     */
    protected static function newFactory(): SeasonFactory
    {
        return SeasonFactory::new();
    }
}
