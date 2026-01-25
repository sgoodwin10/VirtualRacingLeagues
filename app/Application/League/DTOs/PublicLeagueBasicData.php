<?php

declare(strict_types=1);

namespace App\Application\League\DTOs;

use App\Application\Shared\DTOs\MediaData;
use Spatie\LaravelData\Data;

/**
 * Public League Basic Information DTO.
 * Contains all basic league information for public display.
 *
 * MEDIA MIGRATION STRATEGY:
 * This DTO contains both old format (direct URLs) and new format (MediaData objects)
 * during the transition to Spatie Media Library.
 *
 * OLD FORMAT (Deprecated - for backward compatibility only):
 * - logo_url: Direct URL to the logo file (e.g., /storage/leagues/logos/abc123.jpg)
 * - header_image_url: Direct URL to the header image
 * - banner_url: Direct URL to the banner
 *
 * NEW FORMAT (Recommended - use this for all new implementations):
 * - logo: MediaData object containing original URL + responsive conversions (thumb, small, medium, large, og)
 * - header_image: MediaData object with conversions
 * - banner: MediaData object with conversions
 *
 * FRONTEND IMPLEMENTATION GUIDE:
 * 1. ALWAYS prioritize the NEW FORMAT (MediaData objects) when available
 * 2. Fall back to OLD FORMAT URLs only if MediaData is null
 * 3. Use MediaData.conversions for responsive images with srcset
 * 4. The OLD FORMAT will be removed in a future version once all data is migrated
 *
 * Example:
 * ```typescript
 * const logoUrl = league.logo?.conversions?.medium || league.logo_url || '/default-logo.png';
 * ```
 */
final class PublicLeagueBasicData extends Data
{
    /**
     * @param int $id
     * @param string $name
     * @param string $slug
     * @param string|null $tagline
     * @param string|null $description
     * @param string|null $logo_url [DEPRECATED] Backward compatibility (removed after migration)
     * @param string|null $header_image_url [DEPRECATED] Backward compatibility (removed after migration)
     * @param string|null $banner_url [DEPRECATED] Backward compatibility (removed after migration)
     * @param MediaData|null $logo [RECOMMENDED] New format with responsive conversions
     * @param MediaData|null $header_image [RECOMMENDED] New format with responsive conversions
     * @param MediaData|null $banner [RECOMMENDED] New format with responsive conversions
     * @param array<int, array{id: int, name: string, slug: string}> $platforms
     * @param string $visibility
     * @param string|null $discord_url
     * @param string|null $website_url
     * @param string|null $twitter_handle
     * @param string|null $instagram_handle
     * @param string|null $youtube_url
     * @param string|null $twitch_url
     * @param string $created_at
     */
    public function __construct(
        public readonly int $id,
        public readonly string $name,
        public readonly string $slug,
        public readonly ?string $tagline,
        public readonly ?string $description,
        // OLD FORMAT (backward compatibility)
        public readonly ?string $logo_url,
        public readonly ?string $header_image_url,
        public readonly ?string $banner_url,
        // NEW FORMAT - media objects with conversions
        public readonly ?MediaData $logo,
        public readonly ?MediaData $header_image,
        public readonly ?MediaData $banner,
        public readonly array $platforms,
        public readonly string $visibility,
        public readonly ?string $discord_url,
        public readonly ?string $website_url,
        public readonly ?string $twitter_handle,
        public readonly ?string $instagram_handle,
        public readonly ?string $youtube_url,
        public readonly ?string $twitch_url,
        public readonly string $created_at,
    ) {
    }
}
