<?php

declare(strict_types=1);

namespace App\Infrastructure\Listeners;

use App\Domain\SiteConfig\Events\SiteConfigApplicationSettingsUpdated;
use App\Domain\SiteConfig\Events\SiteConfigIdentityUpdated;
use App\Domain\SiteConfig\Events\SiteConfigTrackingUpdated;
use App\Infrastructure\Persistence\Eloquent\Models\AdminEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\SiteConfigModel;
use Illuminate\Database\Eloquent\Model;

/**
 * Listener for logging SiteConfig domain events to activity log.
 * Note: Synchronous to ensure logs are immediately available.
 */
final class LogSiteConfigActivity
{
    /**
     * Handle the event.
     *
     * @param SiteConfigIdentityUpdated|SiteConfigTrackingUpdated|SiteConfigApplicationSettingsUpdated $event
     */
    public function handle(object $event): void
    {
        match (true) {
            $event instanceof SiteConfigIdentityUpdated => $this->logIdentityUpdated($event),
            $event instanceof SiteConfigTrackingUpdated => $this->logTrackingUpdated($event),
            $event instanceof SiteConfigApplicationSettingsUpdated => $this->logApplicationSettingsUpdated($event),
            default => null,
        };
    }

    private function logIdentityUpdated(SiteConfigIdentityUpdated $event): void
    {
        $siteConfig = $this->getSiteConfig($event->siteConfigId);
        if ($siteConfig === null) {
            return;
        }

        activity('site_config')
            ->causedBy($this->getCurrentAdmin())
            ->performedOn($siteConfig)
            ->withProperties([
                'updated_by' => $this->getCurrentAdminName(),
                'site_name' => $event->siteName,
                'discord_link' => $event->discordLink,
            ])
            ->log('Updated site identity settings');
    }

    private function logTrackingUpdated(SiteConfigTrackingUpdated $event): void
    {
        $siteConfig = $this->getSiteConfig($event->siteConfigId);
        if ($siteConfig === null) {
            return;
        }

        activity('site_config')
            ->causedBy($this->getCurrentAdmin())
            ->performedOn($siteConfig)
            ->withProperties([
                'updated_by' => $this->getCurrentAdminName(),
                'google_tag_manager_id' => $event->googleTagManagerId,
                'google_analytics_id' => $event->googleAnalyticsId,
                'google_search_console_code' => $event->googleSearchConsoleCode,
            ])
            ->log('Updated tracking settings');
    }

    private function logApplicationSettingsUpdated(SiteConfigApplicationSettingsUpdated $event): void
    {
        $siteConfig = $this->getSiteConfig($event->siteConfigId);
        if ($siteConfig === null) {
            return;
        }

        activity('site_config')
            ->causedBy($this->getCurrentAdmin())
            ->performedOn($siteConfig)
            ->withProperties([
                'updated_by' => $this->getCurrentAdminName(),
                'maintenance_mode' => $event->maintenanceMode,
                'timezone' => $event->timezone,
                'user_registration_enabled' => $event->userRegistrationEnabled,
            ])
            ->log('Updated application settings');
    }

    /**
     * Get SiteConfig model for activity log.
     */
    private function getSiteConfig(int $siteConfigId): ?Model
    {
        return SiteConfigModel::find($siteConfigId);
    }

    /**
     * Get current authenticated admin.
     */
    private function getCurrentAdmin(): ?Model
    {
        /** @var AdminEloquent|null $admin */
        $admin = auth('admin')->user();
        return $admin;
    }

    /**
     * Get current authenticated admin's full name.
     */
    private function getCurrentAdminName(): string
    {
        /** @var AdminEloquent|null $admin */
        $admin = auth('admin')->user();
        return $admin ? "{$admin->first_name} {$admin->last_name}" : 'System';
    }
}
