<?php

declare(strict_types=1);

namespace App\Domain\SiteConfig\Repositories;

use App\Domain\SiteConfig\Entities\ConfigurationFile;
use App\Domain\SiteConfig\Entities\SiteConfig;
use App\Domain\SiteConfig\Exceptions\InvalidConfigurationException;

/**
 * Repository interface for Site Configuration.
 * Abstracts data persistence from domain logic.
 */
interface SiteConfigRepositoryInterface
{
    /**
     * Get the active site configuration.
     *
     * @throws InvalidConfigurationException
     */
    public function getActive(): SiteConfig;

    /**
     * Find configuration by ID.
     */
    public function findById(int $id): ?SiteConfig;

    /**
     * Save or update a configuration.
     */
    public function save(SiteConfig $config): SiteConfig;

    /**
     * Delete a configuration file.
     */
    public function deleteFile(ConfigurationFile $file): bool;

    /**
     * Add a file to a configuration.
     */
    public function addFile(int $siteConfigId, ConfigurationFile $file): ConfigurationFile;

    /**
     * Remove a file by type from a configuration.
     */
    public function removeFileByType(int $siteConfigId, string $fileType): bool;

    /**
     * Check if an active configuration exists.
     */
    public function hasActiveConfiguration(): bool;
}
