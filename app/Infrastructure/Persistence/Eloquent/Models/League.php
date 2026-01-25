<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Eloquent\Traits\HasMediaCollections;
use App\Models\User;
use Database\Factories\LeagueFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property string|null $tagline
 * @property string|null $description
 * @property string $logo_path
 * @property string|null $header_image_path
 * @property string|null $banner_path
 * @property array $platform_ids
 * @property string|null $discord_url
 * @property string|null $website_url
 * @property string|null $twitter_handle
 * @property string|null $instagram_handle
 * @property string|null $youtube_url
 * @property string|null $twitch_url
 * @property string $visibility
 * @property string|null $timezone
 * @property int $owner_user_id
 * @property string|null $contact_email
 * @property string|null $organizer_name
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Infrastructure\Persistence\Eloquent\Models\Driver> $drivers
 * @property-read int|null $drivers_count
 *
 * @method static \Database\Factories\LeagueFactory factory($count = null, $state = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static>|League newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|League newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|League onlyTrashed()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|League query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|League whereContactEmail($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|League whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|League whereDeletedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|League whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|League whereDiscordUrl($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|League whereHeaderImagePath($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|League whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|League whereInstagramHandle($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|League whereLogoPath($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|League whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|League whereOrganizerName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|League whereOwnerUserId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|League wherePlatformIds($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|League whereSlug($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|League whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|League whereTagline($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|League whereTimezone($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|League whereTwitchUrl($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|League whereTwitterHandle($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|League whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|League whereVisibility($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|League whereWebsiteUrl($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|League whereYoutubeUrl($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|League withTrashed(bool $withTrashed = true)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|League withoutTrashed()
 */
class League extends Model implements HasMedia
{
    use HasFactory;
    use HasMediaCollections;
    use SoftDeletes;

    /**
     * Create a new factory instance for the model.
     */
    protected static function newFactory(): Factory
    {
        return LeagueFactory::new();
    }

    /**
     * @var array<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'tagline',
        'description',
        'logo_path',
        'header_image_path',
        'banner_path',
        'platform_ids',
        'discord_url',
        'website_url',
        'twitter_handle',
        'instagram_handle',
        'youtube_url',
        'twitch_url',
        'visibility',
        'timezone',
        'owner_user_id',
        'contact_email',
        'organizer_name',
        'status',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'platform_ids' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Get the platform_ids attribute with integer casting.
     * Laravel's 'array' cast returns strings, but we need integers for frontend compatibility.
     *
     * @return Attribute<array<int>, array<int>>
     */
    protected function platformIds(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value): array => $value
                ? array_map('intval', json_decode($value, true) ?: [])
                : [],
            set: fn (array $value): string => json_encode(array_map('intval', $value)),
        );
    }

    /**
     * Get the owner of the league.
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    /**
     * Get the managers of the league.
     */
    public function managers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'league_managers')
            ->withPivot('role')
            ->withTimestamps();
    }

    /**
     * Get the drivers in the league.
     *
     * @return BelongsToMany<Driver>
     */
    public function drivers(): BelongsToMany
    {
        return $this->belongsToMany(Driver::class, 'league_drivers', 'league_id', 'driver_id')
            ->withPivot('id', 'driver_number', 'status', 'league_notes', 'added_to_league_at', 'updated_at')
            ->withTimestamps();
    }

    /**
     * Get the competitions (seasons) for this league.
     *
     * @return HasManyThrough<SeasonEloquent>
     */
    public function seasons(): HasManyThrough
    {
        return $this->hasManyThrough(
            SeasonEloquent::class,
            Competition::class,
            'league_id',
            'competition_id',
            'id',
            'id'
        );
    }

    /**
     * Get the competitions for this league.
     *
     * @return HasMany<Competition>
     */
    public function competitions(): HasMany
    {
        return $this->hasMany(Competition::class, 'league_id');
    }

    /**
     * Register media collections for League.
     * Defines single-file collections for logo, header image, and banner.
     */
    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('logo')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);

        $this->addMediaCollection('header_image')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);

        $this->addMediaCollection('banner')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);
    }
}
