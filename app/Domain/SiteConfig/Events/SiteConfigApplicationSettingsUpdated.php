<?php

declare(strict_types=1);

namespace App\Domain\SiteConfig\Events;

/**
 * Domain Event: SiteConfig Application Settings Updated.
 * Dispatched when application settings are updated (maintenance mode, timezone, user registration).
 */
final readonly class SiteConfigApplicationSettingsUpdated
{
    public function __construct(
        public int $siteConfigId,
        public bool $maintenanceMode,
        public string $timezone,
        public bool $userRegistrationEnabled,
    ) {
    }
}
