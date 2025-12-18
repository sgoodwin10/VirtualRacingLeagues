<?php

declare(strict_types=1);

namespace App\Application\League\DTOs;

use App\Domain\League\Entities\League;
use Spatie\LaravelData\Data;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

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
    ) {
    }

    /**
     * Create from domain entity with platform data and counts.
     *
     * @param League $league Domain entity
     * @param array<int, array{id: int, name: string, slug: string}> $platforms Platform data
     * @param int $competitionsCount Competitions count
     * @param int $driversCount Drivers count
     * @param string|null $logoUrl Optional pre-computed logo URL (infrastructure concern - DEPRECATED)
     * @param string|null $headerImageUrl Optional pre-computed header image URL (infrastructure concern - DEPRECATED)
     * @param string|null $bannerUrl Optional pre-computed banner URL (infrastructure concern - DEPRECATED)
     * @param \App\Infrastructure\Persistence\Eloquent\Models\League|null $eloquentModel Optional eloquent model for media
     * @return self
     */
    public static function fromEntity(
        League $league,
        array $platforms,
        int $competitionsCount,
        int $driversCount,
        ?string $logoUrl = null,
        ?string $headerImageUrl = null,
        ?string $bannerUrl = null,
        ?\App\Infrastructure\Persistence\Eloquent\Models\League $eloquentModel = null
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
        );
    }

    /**
     * Convert Spatie Media model to array representation
     *
     * @param Media|null $media
     * @return array{id: int, original: string, conversions: array<string, string>, srcset: string}|null
     */
    public static function mediaToArray(?Media $media): ?array
    {
        if ($media === null) {
            return null;
        }

        $conversions = [];
        $conversionNames = ['thumb', 'small', 'medium', 'large', 'og'];

        foreach ($conversionNames as $conversion) {
            try {
                $conversions[$conversion] = $media->getUrl($conversion);
            } catch (\Exception $e) {
                // Conversion may not exist yet (queued) or may not apply to this file type
                // Skip silently
            }
        }

        // Generate srcset for responsive images
        $srcsetParts = [];
        $widths = [
            'thumb' => '150w',
            'small' => '320w',
            'medium' => '640w',
            'large' => '1280w',
        ];

        foreach ($widths as $conversionName => $width) {
            if (isset($conversions[$conversionName])) {
                $srcsetParts[] = "{$conversions[$conversionName]} {$width}";
            }
        }

        return [
            'id' => $media->getKey(),
            'original' => $media->getUrl(),
            'conversions' => $conversions,
            'srcset' => implode(', ', $srcsetParts),
        ];
    }
}
