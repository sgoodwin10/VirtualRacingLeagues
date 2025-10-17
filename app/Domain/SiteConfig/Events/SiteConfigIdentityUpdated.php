<?php

declare(strict_types=1);

namespace App\Domain\SiteConfig\Events;

/**
 * Domain Event: SiteConfig Identity Updated.
 * Dispatched when site identity information is updated (site name, discord link).
 */
final readonly class SiteConfigIdentityUpdated
{
    public function __construct(
        public int $siteConfigId,
        public string $siteName,
        public ?string $discordLink,
    ) {
    }
}
