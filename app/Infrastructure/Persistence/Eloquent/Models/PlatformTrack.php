<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
