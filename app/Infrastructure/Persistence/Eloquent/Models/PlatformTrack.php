<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $platform_id
 * @property int $platform_track_location_id
 * @property string $name
 * @property string $slug
 * @property bool $is_reverse
 * @property string|null $image_path
 * @property int|null $length_meters
 * @property bool $is_active
 * @property int $sort_order
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Infrastructure\Persistence\Eloquent\Models\PlatformTrackLocation $location
 * @property-read \App\Infrastructure\Persistence\Eloquent\Models\Platform $platform
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PlatformTrack active()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PlatformTrack forLocation(int $locationId)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PlatformTrack forPlatform(int $platformId)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PlatformTrack newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PlatformTrack newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PlatformTrack ordered()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PlatformTrack query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PlatformTrack whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PlatformTrack whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PlatformTrack whereImagePath($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PlatformTrack whereIsActive($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PlatformTrack whereIsReverse($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PlatformTrack whereLengthMeters($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PlatformTrack whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PlatformTrack wherePlatformId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PlatformTrack wherePlatformTrackLocationId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PlatformTrack whereSlug($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PlatformTrack whereSortOrder($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PlatformTrack whereUpdatedAt($value)
 */
class PlatformTrack extends Model
{
    /**
     * @var array<string>
     */
    protected $fillable = [
        'platform_id',
        'platform_track_location_id',
        'name',
        'slug',
        'is_reverse',
        'image_path',
        'length_meters',
        'is_active',
        'sort_order',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'platform_id' => 'integer',
        'platform_track_location_id' => 'integer',
        'is_reverse' => 'boolean',
        'length_meters' => 'integer',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    /**
     * Get the platform that owns the track.
     *
     * @return BelongsTo<Platform, PlatformTrack>
     */
    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    /**
     * Get the location that owns the track.
     *
     * @return BelongsTo<PlatformTrackLocation, PlatformTrack>
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(PlatformTrackLocation::class, 'platform_track_location_id');
    }

    /**
     * Scope query to only active tracks.
     *
     * @param  \Illuminate\Database\Eloquent\Builder<PlatformTrack>  $query
     * @return \Illuminate\Database\Eloquent\Builder<PlatformTrack>
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope query to order tracks by sort_order.
     *
     * @param  \Illuminate\Database\Eloquent\Builder<PlatformTrack>  $query
     * @return \Illuminate\Database\Eloquent\Builder<PlatformTrack>
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order');
    }

    /**
     * Scope query to filter by platform.
     *
     * @param  \Illuminate\Database\Eloquent\Builder<PlatformTrack>  $query
     * @param  int  $platformId
     * @return \Illuminate\Database\Eloquent\Builder<PlatformTrack>
     */
    public function scopeForPlatform($query, int $platformId)
    {
        return $query->where('platform_id', $platformId);
    }

    /**
     * Scope query to filter by location.
     *
     * @param  \Illuminate\Database\Eloquent\Builder<PlatformTrack>  $query
     * @param  int  $locationId
     * @return \Illuminate\Database\Eloquent\Builder<PlatformTrack>
     */
    public function scopeForLocation($query, int $locationId)
    {
        return $query->where('platform_track_location_id', $locationId);
    }
}
