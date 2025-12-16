<?php

declare(strict_types=1);

namespace App\Application\League\DTOs;

use App\Domain\League\Entities\League;
use Spatie\LaravelData\Data;

/**
 * Public League DTO - excludes sensitive fields like owner info.
 * Used for public-facing API endpoints.
 */
final class PublicLeagueData extends Data
{
    /**
     * @param array<int, array{id: int, name: string, slug: string}> $platforms
     */
    public function __construct(
        public readonly ?int $id,
        public readonly string $name,
        public readonly string $slug,
        public readonly ?string $tagline,
        public readonly ?string $description,
        public readonly ?string $logo_url,
        public readonly ?string $header_image_url,
        public readonly array $platforms,
        public readonly ?string $discord_url,
        public readonly ?string $website_url,
        public readonly ?string $twitter_handle,
        public readonly ?string $instagram_handle,
        public readonly ?string $youtube_url,
        public readonly ?string $twitch_url,
        public readonly int $competitions_count,
        public readonly int $drivers_count,
    ) {
    }

    /**
     * Create from domain entity with platform data and counts.
     *
     * @param League $league Domain entity
     * @param array<int, array{id: int, name: string, slug: string}> $platforms Platform data
     * @param int $competitionsCount Competitions count
     * @param int $driversCount Drivers count
     * @param string|null $logoUrl Optional pre-computed logo URL (infrastructure concern)
     * @param string|null $headerImageUrl Optional pre-computed header image URL (infrastructure concern)
     * @return self
     */
    public static function fromEntity(
        League $league,
        array $platforms,
        int $competitionsCount,
        int $driversCount,
        ?string $logoUrl = null,
        ?string $headerImageUrl = null
    ): self {
        return new self(
            id: $league->id(),
            name: $league->name()->value(),
            slug: $league->slug()->value(),
            tagline: $league->tagline()?->value(),
            description: $league->description(),
            logo_url: $logoUrl,
            header_image_url: $headerImageUrl,
            platforms: $platforms,
            discord_url: $league->discordUrl(),
            website_url: $league->websiteUrl(),
            twitter_handle: $league->twitterHandle(),
            instagram_handle: $league->instagramHandle(),
            youtube_url: $league->youtubeUrl(),
            twitch_url: $league->twitchUrl(),
            competitions_count: $competitionsCount,
            drivers_count: $driversCount,
        );
    }
}
