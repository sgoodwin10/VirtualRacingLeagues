<?php

declare(strict_types=1);

namespace App\Application\Admin\Services;

use App\Domain\SiteConfig\Entities\ConfigurationFile;
use App\Domain\SiteConfig\Entities\SiteConfig;
use App\Domain\SiteConfig\Repositories\SiteConfigRepositoryInterface;
use App\Infrastructure\Persistence\FileStorage\FileStorageServiceInterface;
use App\Domain\Shared\ValueObjects\EmailAddress;
use App\Domain\SiteConfig\ValueObjects\SiteName;
use App\Domain\SiteConfig\ValueObjects\Timezone;
use App\Domain\SiteConfig\ValueObjects\TrackingId;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Application service for Site Configuration use cases.
 * Orchestrates domain logic, handles caching, and manages transactions.
 */
class SiteConfigApplicationService
{
    private const CACHE_KEY = 'site_config:active';
    private const FILE_DIRECTORY = 'site-config';

    public function __construct(
        private readonly SiteConfigRepositoryInterface $repository,
        private readonly FileStorageServiceInterface $fileStorage,
    ) {
    }

    /**
     * Get the active site configuration.
     *
     * Uses Redis cache to avoid database queries on every request.
     * Cache is invalidated on configuration updates.
     */
    public function getConfiguration(): SiteConfig
    {
        return Cache::rememberForever(self::CACHE_KEY, function () {
            return $this->repository->getActive();
        });
    }

    /**
     * Update the site configuration.
     *
     * @param  array<string, mixed>  $data
     */
    public function updateConfiguration(array $data): SiteConfig
    {
        return DB::transaction(function () use ($data) {
            $currentConfig = $this->repository->getActive();

            // Update identity
            $currentConfig->updateIdentity(
                siteName: SiteName::from($data['site_name']),
                discordLink: $data['discord_link'] ?? null
            );

            // Update tracking
            $currentConfig->updateTracking(
                googleTagManagerId: isset($data['google_tag_manager_id'])
                    ? TrackingId::googleTagManager($data['google_tag_manager_id'])
                    : null,
                googleAnalyticsId: isset($data['google_analytics_id'])
                    ? TrackingId::googleAnalytics($data['google_analytics_id'])
                    : null,
                googleSearchConsoleCode: $data['google_search_console_code'] ?? null
            );

            // Update email addresses
            $currentConfig->updateEmailAddresses(
                supportEmail: EmailAddress::fromNullable($data['support_email'] ?? null, 'support_email'),
                contactEmail: EmailAddress::fromNullable($data['contact_email'] ?? null, 'contact_email'),
                adminEmail: EmailAddress::fromNullable($data['admin_email'] ?? null, 'admin_email')
            );

            // Update application settings
            $currentConfig->updateApplicationSettings(
                maintenanceMode: (bool) $data['maintenance_mode'],
                timezone: Timezone::from($data['timezone']),
                userRegistrationEnabled: (bool) $data['user_registration_enabled']
            );

            // Save configuration
            $updatedConfig = $this->repository->save($currentConfig);

            // Handle file uploads and removals
            $this->handleFiles($updatedConfig, $data);

            // Invalidate cache
            Cache::forget(self::CACHE_KEY);

            // Return fresh configuration
            return $this->repository->getActive();
        });
    }

    /**
     * Handle file uploads and removals.
     *
     * @param  array<string, mixed>  $data
     */
    private function handleFiles(SiteConfig $config, array $data): void
    {
        $fileTypes = ['logo', 'favicon', 'og_image'];

        foreach ($fileTypes as $fileType) {
            // Handle file removal
            if (! empty($data["remove_{$fileType}"])) {
                $this->removeFile($config, $fileType);
                continue;
            }

            // Handle file upload
            if (isset($data[$fileType]) && $data[$fileType] instanceof UploadedFile) {
                $this->uploadFile($config, $fileType, $data[$fileType]);
            }
        }
    }

    /**
     * Upload a file for the configuration.
     */
    private function uploadFile(SiteConfig $config, string $fileType, UploadedFile $file): void
    {
        $siteConfigId = $config->id();

        if ($siteConfigId === null) {
            throw new \RuntimeException('Site config must have an ID before files can be uploaded');
        }

        // Remove existing file of same type
        $existingFile = $config->getFileByType($fileType);
        if ($existingFile !== null) {
            try {
                $this->fileStorage->delete($existingFile->getFilePath(), $existingFile->getStorageDisk());
            } catch (\Exception $e) {
                // Log error but continue with upload
                Log::warning("Failed to delete existing file: {$e->getMessage()}");
            }

            $this->repository->removeFileByType($siteConfigId, $fileType);
        }

        // Store new file
        $result = $this->fileStorage->store($file, self::FILE_DIRECTORY);

        $mimeType = $file->getMimeType();
        if ($mimeType === null) {
            throw new \RuntimeException('Unable to determine file MIME type');
        }

        // Create ConfigurationFile entity
        $configFile = new ConfigurationFile(
            id: null,
            siteConfigId: $siteConfigId,
            fileType: $fileType,
            fileName: $file->getClientOriginalName(),
            filePath: $result['path'],
            storageDisk: 'public',
            mimeType: $mimeType,
            fileSize: $file->getSize(),
        );

        // Save to database
        $this->repository->addFile($siteConfigId, $configFile);
    }

    /**
     * Remove a file from the configuration.
     */
    private function removeFile(SiteConfig $config, string $fileType): void
    {
        $siteConfigId = $config->id();

        if ($siteConfigId === null) {
            throw new \RuntimeException('Site config must have an ID before files can be removed');
        }

        $existingFile = $config->getFileByType($fileType);

        if ($existingFile !== null) {
            try {
                $this->fileStorage->delete($existingFile->getFilePath(), $existingFile->getStorageDisk());
            } catch (\Exception $e) {
                Log::warning("Failed to delete file: {$e->getMessage()}");
            }

            $this->repository->removeFileByType($siteConfigId, $fileType);
        }
    }

    /**
     * Clear the configuration cache.
     */
    public function clearCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }
}
