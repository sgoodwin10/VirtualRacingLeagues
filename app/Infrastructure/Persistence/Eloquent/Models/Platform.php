<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Database\Factories\PlatformFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property string|null $description
 * @property string|null $logo_url
 * @property bool $is_active
 * @property int $sort_order
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Infrastructure\Persistence\Eloquent\Models\PlatformTrack> $tracks
 * @property-read int|null $tracks_count
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Platform active()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Platform newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Platform newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Platform ordered()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Platform query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Platform whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Platform whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Platform whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Platform whereIsActive($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Platform whereLogoUrl($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Platform whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Platform whereSlug($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Platform whereSortOrder($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Platform whereUpdatedAt($value)
 */
class Platform extends Model
{
    use HasFactory;

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
     * @param  Builder<Platform>  $query
     * @return Builder<Platform>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope query to order platforms by sort_order.
     *
     * @param  Builder<Platform>  $query
     * @return Builder<Platform>
     */
    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order');
    }

    /**
     * Create a new factory instance for the model.
     */
    protected static function newFactory(): PlatformFactory
    {
        return PlatformFactory::new();
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
