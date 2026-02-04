<?php

declare(strict_types=1);

namespace App\Http\View\Composers;

use App\Domain\SiteConfig\Entities\SiteConfig;
use App\Domain\SiteConfig\Repositories\SiteConfigRepositoryInterface;
use Illuminate\View\View;
use Throwable;

/**
 * Site Configuration View Composer
 *
 * Shares site configuration data with all Blade templates.
 * This composer is automatically applied to all views through
 * the ViewServiceProvider.
 *
 * Fallback chain: Database (site_configs) -> .env -> config/site.php -> config/app.php
 */
class SiteConfigComposer
{
    public function __construct(
        private readonly SiteConfigRepositoryInterface $siteConfigRepository
    ) {
    }

    /**
     * Bind data to the view.
     */
    public function compose(View $view): void
    {
        $siteConfig = $this->getSiteConfig();

        // Pass to Blade template
        $view->with('siteConfig', $siteConfig);

        // Also make available as JSON for JavaScript
        $view->with(
            'siteConfigJson',
            json_encode($siteConfig, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT)
        );
    }

    /**
     * Get site configuration array.
     *
     * Fallback chain: Database -> .env -> config/site.php -> config/app.php
     *
     * @return array<string, mixed>
     */
    private function getSiteConfig(): array
    {
        // Try to get from database first
        $dbConfig = $this->getActiveConfigFromDatabase();

        if ($dbConfig !== null) {
            return $this->buildConfigFromEntity($dbConfig);
        }

        // Fallback to config files
        return $this->buildConfigFromFiles();
    }

    /**
     * Get active configuration from database.
     */
    private function getActiveConfigFromDatabase(): ?SiteConfig
    {
        try {
            return $this->siteConfigRepository->getActive();
        } catch (Throwable) {
            // No active config in database, use fallback
            return null;
        }
    }

    /**
     * Build config array from database entity.
     * All values use fallback chain: DB -> config/site.php (.env) -> config/app.php
     *
     * @return array<string, mixed>
     */
    private function buildConfigFromEntity(SiteConfig $entity): array
    {
        $discordUrl = $entity->discordLink()
            ?? config('site.discord.url');

        return [
            // Site name: DB -> config/site.php (.env APP_NAME) -> config/app.php
            'name' => $entity->siteName()->value()
                ?: config('site.name', config('app.name')),

            // Timezone: DB -> config/site.php (.env APP_TIMEZONE) -> config/app.php
            'timezone' => $entity->timezone()->value()
                ?: config('site.timezone', config('app.timezone', 'UTC')),

            'discord' => [
                // Discord: DB -> config/site.php (.env DISCORD_URL)
                'url' => $discordUrl,
                'inviteCode' => $this->extractDiscordInviteCode($discordUrl)
                    ?? config('site.discord.invite_code'),
            ],

            'maintenance' => [
                // Maintenance: DB value (no config fallback - DB is authoritative)
                'enabled' => $entity->isMaintenanceMode(),
                'message' => config('site.maintenance.message'),
            ],

            'registration' => [
                // Registration: DB -> config/site.php (.env REGISTRATION_ENABLED)
                'enabled' => $entity->isUserRegistrationEnabled(),
            ],

            'google' => [
                // Google IDs: DB -> config/site.php (.env) -> config/app.php
                'analyticsId' => $entity->googleAnalyticsId()?->value()
                    ?? config('site.google.analytics_id')
                    ?? config('app.google.analytics_id'),
                'tagManagerId' => $entity->googleTagManagerId()?->value()
                    ?? config('site.google.tag_manager_id')
                    ?? config('app.google.tag_manager_id'),
                'searchConsoleCode' => $entity->googleSearchConsoleCode(),
            ],

            'emails' => [
                'support' => $entity->supportEmail()?->value(),
                'contact' => $entity->contactEmail()?->value(),
                'admin' => $entity->adminEmail()?->value(),
            ],
        ];
    }

    /**
     * Build config array from config files (fallback).
     *
     * @return array<string, mixed>
     */
    private function buildConfigFromFiles(): array
    {
        return [
            'name' => config('site.name', config('app.name')),
            'timezone' => config('site.timezone', config('app.timezone', 'UTC')),
            'discord' => [
                'url' => config('site.discord.url'),
                'inviteCode' => config('site.discord.invite_code'),
            ],
            'maintenance' => [
                'enabled' => config('site.maintenance.enabled', false),
                'message' => config('site.maintenance.message'),
            ],
            'registration' => [
                'enabled' => config('site.registration.enabled', true),
            ],
            'google' => [
                'analyticsId' => config('site.google.analytics_id', config('app.google.analytics_id')),
                'tagManagerId' => config('site.google.tag_manager_id', config('app.google.tag_manager_id')),
                'searchConsoleCode' => null,
            ],
            'emails' => [
                'support' => null,
                'contact' => null,
                'admin' => null,
            ],
        ];
    }

    /**
     * Extract Discord invite code from URL.
     */
    private function extractDiscordInviteCode(?string $discordLink): ?string
    {
        if ($discordLink === null) {
            return null;
        }

        // Extract invite code from URLs like https://discord.gg/CODE
        if (preg_match('/discord\.gg\/([a-zA-Z0-9]+)/', $discordLink, $matches)) {
            return $matches[1];
        }

        return null;
    }
}
