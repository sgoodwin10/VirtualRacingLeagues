<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Database\Factories\LeagueFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class League extends Model
{
    use HasFactory;
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
     * @return array<int>
     */
    protected function platformIds(): Attribute
    {
        return Attribute::make(
            get: fn(?string $value): array => $value
                ? array_map('intval', json_decode($value, true) ?: [])
                : [],
            set: fn(array $value): string => json_encode(array_map('intval', $value)),
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
}
