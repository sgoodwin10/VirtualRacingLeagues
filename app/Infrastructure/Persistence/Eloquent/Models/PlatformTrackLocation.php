<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Database\Factories\PlatformTrackLocationFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $platform_id
 * @property string $name
 * @property string $slug
 * @property string|null $country
 * @property bool $is_active
 * @property int $sort_order
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Infrastructure\Persistence\Eloquent\Models\Platform $platform
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Infrastructure\Persistence\Eloquent\Models\PlatformTrack> $tracks
 * @property-read int|null $tracks_count
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PlatformTrackLocation active()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PlatformTrackLocation newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PlatformTrackLocation newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PlatformTrackLocation ordered()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PlatformTrackLocation query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PlatformTrackLocation whereCountry($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PlatformTrackLocation whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PlatformTrackLocation whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PlatformTrackLocation whereIsActive($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PlatformTrackLocation whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PlatformTrackLocation wherePlatformId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PlatformTrackLocation whereSlug($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PlatformTrackLocation whereSortOrder($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PlatformTrackLocation whereUpdatedAt($value)
 */
class PlatformTrackLocation extends Model
{
    use HasFactory;

    /**
     * @var array<string>
     */
    protected $fillable = [
        'platform_id',
        'name',
        'slug',
        'country',
        'is_active',
        'sort_order',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'platform_id' => 'integer',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    /**
     * Create a new factory instance for the model.
     *
     * @return PlatformTrackLocationFactory
     */
    protected static function newFactory(): PlatformTrackLocationFactory
    {
        return PlatformTrackLocationFactory::new();
    }

    /**
     * Get the platform this location belongs to.
     *
     * @return BelongsTo<Platform, PlatformTrackLocation>
     */
    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    /**
     * Get the tracks for this location.
     *
     * @return HasMany<PlatformTrack>
     */
    public function tracks(): HasMany
    {
        return $this->hasMany(PlatformTrack::class);
    }

    /**
     * Scope query to only active locations.
     *
     * @param  Builder<PlatformTrackLocation>  $query
     * @return Builder<PlatformTrackLocation>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope query to order locations by sort_order.
     *
     * @param  Builder<PlatformTrackLocation>  $query
     * @return Builder<PlatformTrackLocation>
     */
    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order');
    }
}
