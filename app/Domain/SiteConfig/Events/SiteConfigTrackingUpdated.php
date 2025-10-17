<?php

declare(strict_types=1);

namespace App\Domain\SiteConfig\Events;

/**
 * Domain Event: SiteConfig Tracking Updated.
 * Dispatched when tracking IDs are updated (GTM, GA, Search Console).
 */
final readonly class SiteConfigTrackingUpdated
{
    public function __construct(
        public int $siteConfigId,
        public ?string $googleTagManagerId,
        public ?string $googleAnalyticsId,
        public ?string $googleSearchConsoleCode,
    ) {
    }
}
