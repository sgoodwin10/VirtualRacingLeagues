<?php

declare(strict_types=1);

namespace App\Application\League\DTOs;

use App\Application\League\Traits\MediaArrayConversion;
use App\Domain\League\Entities\League;
use App\Infrastructure\Persistence\Eloquent\Models\League as LeagueEloquent;
use Spatie\LaravelData\Data;

/**
 * Public League DTO - excludes sensitive fields like owner info.
 * Used for public-facing API endpoints.
 */
final class PublicLeagueData extends Data
{
    use MediaArrayConversion;

    /**
     * @param array<int, array{id: int, name: string, slug: string}> $platforms
     */
    public function __construct(
        public readonly ?int $id,
        public readonly string $name,
        public readonly string $slug,
        public readonly ?string $tagline,
        public readonly ?string $description,
        // OLD FORMAT (backward compatibility)
        public readonly ?string $logo_url,
        public readonly ?string $header_image_url,
        public readonly ?string $banner_url,
        // NEW FORMAT - media objects
        public readonly ?array $logo,
        public readonly ?array $header_image,
        public readonly ?array $banner,
        public readonly array $platforms,
        public readonly ?string $discord_url,
        public readonly ?string $website_url,
        public readonly ?string $twitter_handle,
        public readonly ?string $instagram_handle,
        public readonly ?string $youtube_url,
        public readonly ?string $twitch_url,
        public readonly int $competitions_count,
        public readonly int $drivers_count,
        public readonly int $active_seasons_count,
        public readonly int $total_races_count,
    ) {
    }

    /**
     * Create from domain entity with platform data and counts.
     *
     * @param League $league Domain entity
     * @param array<int, array{id: int, name: string, slug: string}> $platforms Platform data
     * @param int $competitionsCount Competitions count
     * @param int $driversCount Drivers count
     * @param int $activeSeasonsCount Active seasons count
     * @param int $totalRacesCount Total races count
     * @param string|null $logoUrl Optional pre-computed logo URL (infrastructure concern - DEPRECATED)
     * @param string|null $headerImageUrl Optional pre-computed header image URL (infrastructure concern - DEPRECATED)
     * @param string|null $bannerUrl Optional pre-computed banner URL (infrastructure concern - DEPRECATED)
     * @param LeagueEloquent|null $eloquentModel Optional eloquent model for media
     * @return self
     */
    public static function fromEntity(
        League $league,
        array $platforms,
        int $competitionsCount,
        int $driversCount,
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
            platforms: $platforms,
            discord_url: $league->discordUrl(),
            website_url: $league->websiteUrl(),
            twitter_handle: $league->twitterHandle(),
            instagram_handle: $league->instagramHandle(),
            youtube_url: $league->youtubeUrl(),
            twitch_url: $league->twitchUrl(),
            competitions_count: $competitionsCount,
            drivers_count: $driversCount,
            active_seasons_count: $activeSeasonsCount,
            total_races_count: $totalRacesCount,
        );
    }
}
