<?php

declare(strict_types=1);

namespace App\Domain\SiteConfig\Entities;

use App\Domain\Shared\ValueObjects\EmailAddress;
use App\Domain\SiteConfig\Events\SiteConfigApplicationSettingsUpdated;
use App\Domain\SiteConfig\Events\SiteConfigIdentityUpdated;
use App\Domain\SiteConfig\Events\SiteConfigTrackingUpdated;
use App\Domain\SiteConfig\ValueObjects\SiteName;
use App\Domain\SiteConfig\ValueObjects\Timezone;
use App\Domain\SiteConfig\ValueObjects\TrackingId;
use DateTimeImmutable;

/**
 * Aggregate Root for Site Configuration.
 * Represents the global application settings.
 */
final class SiteConfig
{
    /** @var array<object> */
    private array $domainEvents = [];

    /**
     * @param  array<ConfigurationFile>  $files
     */
    private function __construct(
        private ?int $id,
        private SiteName $siteName,
        private ?TrackingId $googleTagManagerId,
        private ?TrackingId $googleAnalyticsId,
        private ?string $googleSearchConsoleCode,
        private ?string $discordLink,
        private ?EmailAddress $supportEmail,
        private ?EmailAddress $contactEmail,
        private ?EmailAddress $adminEmail,
        private bool $maintenanceMode,
        private Timezone $timezone,
        private bool $userRegistrationEnabled,
        private bool $isActive,
        private array $files = [],
        private ?DateTimeImmutable $createdAt = null,
        private ?DateTimeImmutable $updatedAt = null,
    ) {
    }

    /**
     * Create a new site configuration.
     */
    public static function create(
        SiteName $siteName,
        Timezone $timezone,
        ?TrackingId $googleTagManagerId = null,
        ?TrackingId $googleAnalyticsId = null,
        ?string $googleSearchConsoleCode = null,
        ?string $discordLink = null,
        ?EmailAddress $supportEmail = null,
        ?EmailAddress $contactEmail = null,
        ?EmailAddress $adminEmail = null,
        bool $maintenanceMode = false,
        bool $userRegistrationEnabled = true,
        array $files = []
    ): self {
        $config = new self(
            id: null,
            siteName: $siteName,
            googleTagManagerId: $googleTagManagerId,
            googleAnalyticsId: $googleAnalyticsId,
            googleSearchConsoleCode: $googleSearchConsoleCode,
            discordLink: $discordLink,
            supportEmail: $supportEmail,
            contactEmail: $contactEmail,
            adminEmail: $adminEmail,
            maintenanceMode: $maintenanceMode,
            timezone: $timezone,
            userRegistrationEnabled: $userRegistrationEnabled,
            isActive: true,
            files: $files,
            createdAt: new DateTimeImmutable(),
            updatedAt: new DateTimeImmutable(),
        );

        return $config;
    }

    /**
     * Reconstitute from persistence.
     */
    public static function reconstitute(
        int $id,
        SiteName $siteName,
        ?TrackingId $googleTagManagerId,
        ?TrackingId $googleAnalyticsId,
        ?string $googleSearchConsoleCode,
        ?string $discordLink,
        ?EmailAddress $supportEmail,
        ?EmailAddress $contactEmail,
        ?EmailAddress $adminEmail,
        bool $maintenanceMode,
        Timezone $timezone,
        bool $userRegistrationEnabled,
        bool $isActive,
        array $files,
        DateTimeImmutable $createdAt,
        DateTimeImmutable $updatedAt,
    ): self {
        return new self(
            id: $id,
            siteName: $siteName,
            googleTagManagerId: $googleTagManagerId,
            googleAnalyticsId: $googleAnalyticsId,
            googleSearchConsoleCode: $googleSearchConsoleCode,
            discordLink: $discordLink,
            supportEmail: $supportEmail,
            contactEmail: $contactEmail,
            adminEmail: $adminEmail,
            maintenanceMode: $maintenanceMode,
            timezone: $timezone,
            userRegistrationEnabled: $userRegistrationEnabled,
            isActive: $isActive,
            files: $files,
            createdAt: $createdAt,
            updatedAt: $updatedAt,
        );
    }

    // Getters (no setters!)
    public function id(): ?int
    {
        return $this->id;
    }

    public function siteName(): SiteName
    {
        return $this->siteName;
    }

    public function googleTagManagerId(): ?TrackingId
    {
        return $this->googleTagManagerId;
    }

    public function googleAnalyticsId(): ?TrackingId
    {
        return $this->googleAnalyticsId;
    }

    public function googleSearchConsoleCode(): ?string
    {
        return $this->googleSearchConsoleCode;
    }

    public function discordLink(): ?string
    {
        return $this->discordLink;
    }

    public function supportEmail(): ?EmailAddress
    {
        return $this->supportEmail;
    }

    public function contactEmail(): ?EmailAddress
    {
        return $this->contactEmail;
    }

    public function adminEmail(): ?EmailAddress
    {
        return $this->adminEmail;
    }

    public function createdAt(): ?DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function updatedAt(): ?DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function isMaintenanceMode(): bool
    {
        return $this->maintenanceMode;
    }

    public function timezone(): Timezone
    {
        return $this->timezone;
    }

    public function isUserRegistrationEnabled(): bool
    {
        return $this->userRegistrationEnabled;
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }

    /**
     * @return array<ConfigurationFile>
     */
    public function files(): array
    {
        return $this->files;
    }

    // Exception: needed for persistence
    public function setId(int $id): void
    {
        $this->id = $id;
    }

    /**
     * Get a specific file by type.
     */
    public function getFileByType(string $fileType): ?ConfigurationFile
    {
        foreach ($this->files as $file) {
            if ($file->getFileType() === $fileType) {
                return $file;
            }
        }

        return null;
    }

    /**
     * Update site identity information.
     */
    public function updateIdentity(
        SiteName $siteName,
        ?string $discordLink = null
    ): void {
        $this->siteName = $siteName;
        $this->discordLink = $discordLink;
        $this->updatedAt = new DateTimeImmutable();

        // Record domain event
        if ($this->id !== null) {
            $this->recordEvent(new SiteConfigIdentityUpdated(
                siteConfigId: $this->id,
                siteName: $siteName->value(),
                discordLink: $discordLink,
            ));
        }
    }

    /**
     * Update tracking IDs.
     */
    public function updateTracking(
        ?TrackingId $googleTagManagerId = null,
        ?TrackingId $googleAnalyticsId = null,
        ?string $googleSearchConsoleCode = null
    ): void {
        $this->googleTagManagerId = $googleTagManagerId;
        $this->googleAnalyticsId = $googleAnalyticsId;
        $this->googleSearchConsoleCode = $googleSearchConsoleCode;
        $this->updatedAt = new DateTimeImmutable();

        // Record domain event
        if ($this->id !== null) {
            $this->recordEvent(new SiteConfigTrackingUpdated(
                siteConfigId: $this->id,
                googleTagManagerId: $googleTagManagerId?->value(),
                googleAnalyticsId: $googleAnalyticsId?->value(),
                googleSearchConsoleCode: $googleSearchConsoleCode,
            ));
        }
    }

    /**
     * Update email addresses.
     */
    public function updateEmailAddresses(
        ?EmailAddress $supportEmail,
        ?EmailAddress $contactEmail,
        ?EmailAddress $adminEmail
    ): void {
        $this->supportEmail = $supportEmail;
        $this->contactEmail = $contactEmail;
        $this->adminEmail = $adminEmail;
        $this->updatedAt = new DateTimeImmutable();
    }

    /**
     * Enable maintenance mode.
     */
    public function enableMaintenanceMode(): void
    {
        if ($this->maintenanceMode) {
            return; // Already enabled
        }

        $this->maintenanceMode = true;
        $this->updatedAt = new DateTimeImmutable();
    }

    /**
     * Disable maintenance mode.
     */
    public function disableMaintenanceMode(): void
    {
        if (! $this->maintenanceMode) {
            return; // Already disabled
        }

        $this->maintenanceMode = false;
        $this->updatedAt = new DateTimeImmutable();
    }

    /**
     * Update application settings.
     */
    public function updateApplicationSettings(
        bool $maintenanceMode,
        Timezone $timezone,
        bool $userRegistrationEnabled
    ): void {
        $this->maintenanceMode = $maintenanceMode;
        $this->timezone = $timezone;
        $this->userRegistrationEnabled = $userRegistrationEnabled;
        $this->updatedAt = new DateTimeImmutable();

        // Record domain event
        if ($this->id !== null) {
            $this->recordEvent(new SiteConfigApplicationSettingsUpdated(
                siteConfigId: $this->id,
                maintenanceMode: $maintenanceMode,
                timezone: $timezone->value(),
                userRegistrationEnabled: $userRegistrationEnabled,
            ));
        }
    }

    /**
     * Add a file to the configuration.
     */
    public function addFile(ConfigurationFile $file): void
    {
        // Remove existing file of same type
        $this->removeFileByType($file->getFileType());

        $this->files[] = $file;
        $this->updatedAt = new DateTimeImmutable();
    }

    /**
     * Remove a file by type.
     */
    public function removeFileByType(string $fileType): void
    {
        $this->files = array_filter(
            $this->files,
            fn (ConfigurationFile $file) => $file->getFileType() !== $fileType
        );
        $this->updatedAt = new DateTimeImmutable();
    }

    /**
     * Activate this configuration.
     */
    public function activate(): void
    {
        if ($this->isActive) {
            return; // Already active
        }

        $this->isActive = true;
        $this->updatedAt = new DateTimeImmutable();
    }

    /**
     * Deactivate this configuration.
     */
    public function deactivate(): void
    {
        if (! $this->isActive) {
            return; // Already inactive
        }

        $this->isActive = false;
        $this->updatedAt = new DateTimeImmutable();
    }

    // Domain events management

    /**
     * Record a domain event.
     */
    private function recordEvent(object $event): void
    {
        $this->domainEvents[] = $event;
    }

    /**
     * Get recorded domain events.
     *
     * @return array<object>
     */
    public function releaseEvents(): array
    {
        $events = $this->domainEvents;
        $this->domainEvents = [];

        return $events;
    }

    /**
     * Check if entity has recorded events.
     */
    public function hasEvents(): bool
    {
        return ! empty($this->domainEvents);
    }
}
