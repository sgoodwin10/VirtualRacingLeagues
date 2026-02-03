<?php

declare(strict_types=1);

namespace App\Application\League\DTOs;

use App\Application\League\Traits\MediaArrayConversion;
use App\Domain\League\Entities\League;
use App\Infrastructure\Persistence\Eloquent\Models\League as LeagueEloquent;
use Spatie\LaravelData\Data;

/**
 * Data Transfer Object representing a league.
 */
final class LeagueData extends Data
{
    use MediaArrayConversion;

    public function __construct(
        public readonly ?int $id,
        public readonly string $name,
        public readonly string $slug,
        public readonly ?string $tagline,
        public readonly ?string $description,
        // OLD FORMAT (backward compatibility) - will be deprecated
        public readonly ?string $logo_url,
        public readonly ?string $header_image_url,
        public readonly ?string $banner_url,
        // NEW FORMAT - media objects with all conversion URLs
        public readonly ?array $logo,
        public readonly ?array $header_image,
        public readonly ?array $banner,
        /** @var array<int> */
        public readonly array $platform_ids,
        /** @var array<array{id: int, name: string, slug: string}> */
        public readonly array $platforms,
        public readonly ?string $discord_url,
        public readonly ?string $website_url,
        public readonly ?string $twitter_handle,
        public readonly ?string $instagram_handle,
        public readonly ?string $youtube_url,
        public readonly ?string $twitch_url,
        public readonly ?string $facebook_handle,
        public readonly string $visibility,
        public readonly ?string $timezone,
        public readonly int $owner_user_id,
        /** @var array{id: int, first_name: string, last_name: string, email: string}|null */
        public readonly ?array $owner,
        public readonly ?string $contact_email,
        public readonly ?string $organizer_name,
        public readonly string $status,
        public readonly bool $is_active,
        public readonly bool $is_archived,
        public readonly int $competitions_count,
        public readonly int $drivers_count,
        public readonly int $active_seasons_count,
        public readonly int $total_races_count,
    ) {}

    /**
     * Create from domain entity with platform data.
     *
     * @param  League  $league  Domain entity
     * @param  array<array{id: int, name: string, slug: string}>  $platforms  Platform data
     * @param  array{id: int, first_name: string, last_name: string, email: string}|null  $owner  Owner data
     * @param  int  $competitionsCount  Competitions count
     * @param  int  $driversCount  Drivers count
     * @param  int  $activeSeasonsCount  Active seasons count
     * @param  int  $totalRacesCount  Total races count
     * @param  string|null  $logoUrl  Optional pre-computed logo URL (infrastructure concern - DEPRECATED)
     * @param  string|null  $headerImageUrl  Optional pre-computed header image URL (infrastructure concern - DEPRECATED)
     * @param  string|null  $bannerUrl  Optional pre-computed banner URL (infrastructure concern - DEPRECATED)
     * @param  LeagueEloquent|null  $eloquentModel  Optional eloquent model for media
     */
    public static function fromEntity(
        League $league,
        array $platforms = [],
        ?array $owner = null,
        int $competitionsCount = 0,
        int $driversCount = 0,
        int $activeSeasonsCount = 0,
        int $totalRacesCount = 0,
        ?string $logoUrl = null,
        ?string $headerImageUrl = null,
        ?string $bannerUrl = null,
        ?LeagueEloquent $eloquentModel = null
    ): self {
        // Extract media from eloquent model if available
        $logo = null;
        $headerImage = null;
        $banner = null;

        if ($eloquentModel !== null) {
            $logo = self::mediaToArray($eloquentModel->getFirstMedia('logo'));
            $headerImage = self::mediaToArray($eloquentModel->getFirstMedia('header_image'));
            $banner = self::mediaToArray($eloquentModel->getFirstMedia('banner'));
        }

        return new self(
            id: $league->id(),
            name: $league->name()->value(),
            slug: $league->slug()->value(),
            tagline: $league->tagline()?->value(),
            description: $league->description(),
            // OLD FORMAT (backward compatibility)
            logo_url: $logoUrl,
            header_image_url: $headerImageUrl,
            banner_url: $bannerUrl,
            // NEW FORMAT
            logo: $logo,
            header_image: $headerImage,
            banner: $banner,
            platform_ids: $league->platformIds(),
            platforms: $platforms,
            discord_url: $league->discordUrl(),
            website_url: $league->websiteUrl(),
            twitter_handle: $league->twitterHandle(),
            instagram_handle: $league->instagramHandle(),
            youtube_url: $league->youtubeUrl(),
            twitch_url: $league->twitchUrl(),
            facebook_handle: $league->facebookHandle(),
            visibility: $league->visibility()->value,
            timezone: $league->timezone(),
            owner_user_id: $league->ownerUserId(),
            owner: $owner,
            contact_email: $league->contactEmail()?->value(),
            organizer_name: $league->organizerName(),
            status: $league->status(),
            is_active: $league->isActive(),
            is_archived: $league->isArchived(),
            competitions_count: $competitionsCount,
            drivers_count: $driversCount,
            active_seasons_count: $activeSeasonsCount,
            total_races_count: $totalRacesCount,
        );
    }
}
