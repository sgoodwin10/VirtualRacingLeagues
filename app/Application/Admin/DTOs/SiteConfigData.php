<?php

declare(strict_types=1);

namespace App\Application\Admin\DTOs;

use App\Domain\SiteConfig\Entities\SiteConfig;
use Spatie\LaravelData\Data;

class SiteConfigData extends Data
{
    public function __construct(
        public readonly ?int $id,
        public readonly string $site_name,
        public readonly ?string $google_tag_manager_id,
        public readonly ?string $google_analytics_id,
        public readonly ?string $google_search_console_code,
        public readonly ?string $discord_link,
        public readonly ?string $support_email,
        public readonly ?string $contact_email,
        public readonly ?string $admin_email,
        public readonly bool $maintenance_mode,
        public readonly string $timezone,
        public readonly bool $user_registration_enabled,
        /** @var array<string, SiteConfigFileData> */
        public readonly array $files,
        public readonly ?string $created_at,
        public readonly ?string $updated_at,
    ) {
    }

    /**
     * Create SiteConfigData from SiteConfig domain entity.
     */
    public static function fromEntity(SiteConfig $entity): self
    {
        // Organize files by type for easier frontend access
        $files = [];
        foreach ($entity->files() as $file) {
            $files[$file->getFileType()] = SiteConfigFileData::fromEntity($file);
        }

        return new self(
            id: $entity->id(),
            site_name: $entity->siteName()->value(),
            google_tag_manager_id: $entity->googleTagManagerId()?->value(),
            google_analytics_id: $entity->googleAnalyticsId()?->value(),
            google_search_console_code: $entity->googleSearchConsoleCode(),
            discord_link: $entity->discordLink(),
            support_email: $entity->supportEmail()?->value(),
            contact_email: $entity->contactEmail()?->value(),
            admin_email: $entity->adminEmail()?->value(),
            maintenance_mode: $entity->isMaintenanceMode(),
            timezone: $entity->timezone()->value(),
            user_registration_enabled: $entity->isUserRegistrationEnabled(),
            files: $files,
            created_at: $entity->createdAt()?->format('c'),
            updated_at: $entity->updatedAt()?->format('c'),
        );
    }
}
