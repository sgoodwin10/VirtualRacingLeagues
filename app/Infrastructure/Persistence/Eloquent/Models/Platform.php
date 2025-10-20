<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Platform extends Model
{
    /**
     * @var array<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'description',
        'logo_url',
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
     * Scope query to only active platforms.
     *
     * @param  \Illuminate\Database\Eloquent\Builder<Platform>  $query
     * @return \Illuminate\Database\Eloquent\Builder<Platform>
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope query to order platforms by sort_order.
     *
     * @param  \Illuminate\Database\Eloquent\Builder<Platform>  $query
     * @return \Illuminate\Database\Eloquent\Builder<Platform>
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order');
    }

    /**
     * Get the tracks for this platform.
     *
     * @return HasMany<PlatformTrack>
     */
    public function tracks(): HasMany
    {
        return $this->hasMany(PlatformTrack::class);
    }
}
