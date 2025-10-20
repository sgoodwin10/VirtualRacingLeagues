<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
