<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\SiteConfig\Entities\ConfigurationFile;
use App\Domain\SiteConfig\Entities\SiteConfig;
use App\Domain\SiteConfig\Exceptions\InvalidConfigurationException;
use App\Domain\SiteConfig\Repositories\SiteConfigRepositoryInterface;
use App\Domain\Shared\ValueObjects\EmailAddress;
use App\Domain\SiteConfig\ValueObjects\SiteName;
use App\Domain\SiteConfig\ValueObjects\Timezone;
use App\Domain\SiteConfig\ValueObjects\TrackingId;
use App\Infrastructure\Persistence\Eloquent\Models\SiteConfigFileModel;
use App\Infrastructure\Persistence\Eloquent\Models\SiteConfigModel;

class EloquentSiteConfigRepository implements SiteConfigRepositoryInterface
{
    /**
     * Get the active site configuration.
     *
     * @throws InvalidConfigurationException
     */
    public function getActive(): SiteConfig
    {
        $model = SiteConfigModel::active()->with('files')->first();

        if ($model === null) {
            throw InvalidConfigurationException::noActiveConfiguration();
        }

        return $this->toDomain($model);
    }

    /**
     * Find configuration by ID.
     */
    public function findById(int $id): ?SiteConfig
    {
        $model = SiteConfigModel::with('files')->find($id);

        return $model !== null ? $this->toDomain($model) : null;
    }

    /**
     * Save or update a configuration.
     */
    public function save(SiteConfig $config): SiteConfig
    {
        $data = [
            'site_name' => $config->siteName()->value(),
            'google_tag_manager_id' => $config->googleTagManagerId()?->value(),
            'google_analytics_id' => $config->googleAnalyticsId()?->value(),
            'google_search_console_code' => $config->googleSearchConsoleCode(),
            'discord_link' => $config->discordLink(),
            'support_email' => $config->supportEmail()?->value(),
            'contact_email' => $config->contactEmail()?->value(),
            'admin_email' => $config->adminEmail()?->value(),
            'maintenance_mode' => $config->isMaintenanceMode(),
            'timezone' => $config->timezone()->value(),
            'user_registration_enabled' => $config->isUserRegistrationEnabled(),
            'is_active' => $config->isActive(),
        ];

        if ($config->id() !== null) {
            $model = SiteConfigModel::findOrFail($config->id());
            $model->update($data);
        } else {
            $model = SiteConfigModel::create($data);
        }

        $model->load('files');

        return $this->toDomain($model);
    }

    /**
     * Delete a configuration file.
     */
    public function deleteFile(ConfigurationFile $file): bool
    {
        if ($file->getId() === null) {
            return false;
        }

        $model = SiteConfigFileModel::find($file->getId());

        return $model !== null && $model->delete();
    }

    /**
     * Add a file to a configuration.
     */
    public function addFile(int $siteConfigId, ConfigurationFile $file): ConfigurationFile
    {
        $data = [
            'site_config_id' => $siteConfigId,
            'file_type' => $file->getFileType(),
            'file_name' => $file->getFileName(),
            'file_path' => $file->getFilePath(),
            'storage_disk' => $file->getStorageDisk(),
            'mime_type' => $file->getMimeType(),
            'file_size' => $file->getFileSize(),
        ];

        $model = SiteConfigFileModel::create($data);

        return $this->fileToDomain($model);
    }

    /**
     * Remove a file by type from a configuration.
     */
    public function removeFileByType(int $siteConfigId, string $fileType): bool
    {
        return SiteConfigFileModel::where('site_config_id', $siteConfigId)
            ->where('file_type', $fileType)
            ->delete() > 0;
    }

    /**
     * Check if an active configuration exists.
     */
    public function hasActiveConfiguration(): bool
    {
        return SiteConfigModel::active()->exists();
    }

    /**
     * Convert Eloquent model to Domain entity.
     */
    private function toDomain(SiteConfigModel $model): SiteConfig
    {
        $files = $model->files->map(fn (SiteConfigFileModel $file) => $this->fileToDomain($file))->all();

        return SiteConfig::reconstitute(
            id: $model->id,
            siteName: SiteName::from($model->site_name),
            googleTagManagerId: $model->google_tag_manager_id !== null
                ? TrackingId::googleTagManager($model->google_tag_manager_id)
                : null,
            googleAnalyticsId: $model->google_analytics_id !== null
                ? TrackingId::googleAnalytics($model->google_analytics_id)
                : null,
            googleSearchConsoleCode: $model->google_search_console_code,
            discordLink: $model->discord_link,
            supportEmail: EmailAddress::fromNullable($model->support_email, 'support_email'),
            contactEmail: EmailAddress::fromNullable($model->contact_email, 'contact_email'),
            adminEmail: EmailAddress::fromNullable($model->admin_email, 'admin_email'),
            maintenanceMode: $model->maintenance_mode,
            timezone: Timezone::from($model->timezone),
            userRegistrationEnabled: $model->user_registration_enabled,
            isActive: $model->is_active,
            files: $files,
            createdAt: $model->created_at?->toImmutable() ?? new \DateTimeImmutable(),
            updatedAt: $model->updated_at?->toImmutable() ?? new \DateTimeImmutable(),
        );
    }

    /**
     * Convert Eloquent file model to Domain entity.
     */
    private function fileToDomain(SiteConfigFileModel $model): ConfigurationFile
    {
        return new ConfigurationFile(
            id: $model->id,
            siteConfigId: $model->site_config_id,
            fileType: $model->file_type,
            fileName: $model->file_name,
            filePath: $model->file_path,
            storageDisk: $model->storage_disk,
            mimeType: $model->mime_type,
            fileSize: $model->file_size,
        );
    }
}
