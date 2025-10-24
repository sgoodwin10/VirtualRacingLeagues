<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property string|null $country
 * @property bool $is_active
 * @property int $sort_order
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
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
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PlatformTrackLocation whereSlug($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PlatformTrackLocation whereSortOrder($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PlatformTrackLocation whereUpdatedAt($value)
 */
class PlatformTrackLocation extends Model
{
    /**
     * @var array<string>
     */
    protected $fillable = [
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
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

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
     * @param  \Illuminate\Database\Eloquent\Builder<PlatformTrackLocation>  $query
     * @return \Illuminate\Database\Eloquent\Builder<PlatformTrackLocation>
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope query to order locations by sort_order.
     *
     * @param  \Illuminate\Database\Eloquent\Builder<PlatformTrackLocation>  $query
     * @return \Illuminate\Database\Eloquent\Builder<PlatformTrackLocation>
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order');
    }
}
