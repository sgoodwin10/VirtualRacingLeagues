<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Database\Factories\CompetitionFactory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

/**
 * Anemic Eloquent Model for Competition.
 * 
 * Data container only - no business logic.
 *
 * @property int $id
 * @property int $league_id
 * @property int $platform_id
 * @property int $created_by_user_id
 * @property string $name
 * @property string $slug
 * @property string|null $description
 * @property string|null $logo_path
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $archived_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property-read string|null $logo_url
 * @property-read \App\Infrastructure\Persistence\Eloquent\Models\League $league
 * @property-read \App\Infrastructure\Persistence\Eloquent\Models\Platform $platform
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Competition active()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Competition archived()
 * @method static \Database\Factories\CompetitionFactory factory($count = null, $state = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Competition forLeague(int $leagueId)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Competition newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Competition newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Competition onlyTrashed()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Competition query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Competition whereArchivedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Competition whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Competition whereCreatedByUserId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Competition whereDeletedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Competition whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Competition whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Competition whereLeagueId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Competition whereLogoPath($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Competition whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Competition wherePlatformId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Competition whereSlug($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Competition whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Competition whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Competition withTrashed(bool $withTrashed = true)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Competition withoutTrashed()
 * @mixin \Eloquent
 */
class Competition extends Model
{
    use HasFactory;
    use SoftDeletes;

    /**
     * Create a new factory instance for the model.
     */
    protected static function newFactory(): Factory
    {
        return CompetitionFactory::new();
    }

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'league_id',
        'platform_id',
        'created_by_user_id',
        'name',
        'slug',
        'description',
        'logo_path',
        'status',
        'archived_at',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'archived_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    // Relationships

    public function league(): BelongsTo
    {
        return $this->belongsTo(League::class);
    }

    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    // Scopes

    /**
     * @param \Illuminate\Database\Eloquent\Builder<Competition> $query
     * @return \Illuminate\Database\Eloquent\Builder<Competition>
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * @param \Illuminate\Database\Eloquent\Builder<Competition> $query
     * @return \Illuminate\Database\Eloquent\Builder<Competition>
     */
    public function scopeArchived($query)
    {
        return $query->where('status', 'archived');
    }

    /**
     * @param \Illuminate\Database\Eloquent\Builder<Competition> $query
     * @return \Illuminate\Database\Eloquent\Builder<Competition>
     */
    public function scopeForLeague($query, int $leagueId)
    {
        return $query->where('league_id', $leagueId);
    }

    // Accessors

    /**
     * Get the competition's logo URL.
     *
     * @return string|null
     */
    public function getLogoUrlAttribute(): ?string
    {
        if (!$this->logo_path) {
            return null;
        }

        // @phpstan-ignore-next-line (url() method exists on LocalFilesystemAdapter)
        return Storage::disk('public')->url($this->logo_path);
    }
}
