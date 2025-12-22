<?php

declare(strict_types=1);

use App\Application\Admin\Services\SiteConfigApplicationService;
use App\Domain\SiteConfig\Entities\SiteConfig;

if (! function_exists('site_config')) {
    /**
     * Get site configuration value by key.
     * Supports dot notation for nested values.
     *
     * @param  string|null  $key  The configuration key (e.g., 'site_name', 'files.logo.url')
     * @param  mixed  $default  Default value if key not found
     * @return mixed The configuration value or entire configuration object if key is null
     *
     * @example
     * site_config('site_name') // Returns: "My Application"
     * site_config('files.logo.url') // Returns: "/storage/site-config/logo.png"
     * site_config('maintenance_mode', false) // Returns: false if not set
     * site_config() // Returns: SiteConfig entity
     */
    function site_config(?string $key = null, mixed $default = null): mixed
    {
        try {
            $service = app(SiteConfigApplicationService::class);
            $config = $service->getConfiguration();

            // If no key specified, return entire config entity
            if ($key === null) {
                return $config;
            }

            // Convert to array for dot notation access
            $data = configToArray($config);

            // Support dot notation
            return data_get($data, $key, $default);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('Failed to retrieve site configuration', [
                'key' => $key,
                'error' => $e->getMessage(),
            ]);

            return $default;
        }
    }
}

if (! function_exists('configToArray')) {
    /**
     * Convert SiteConfig entity to array.
     *
     * @return array<string, mixed>
     */
    function configToArray(SiteConfig $config): array
    {
        $files = [];
        foreach ($config->files() as $file) {
            $files[$file->getFileType()] = [
                'id' => $file->getId(),
                'url' => \Illuminate\Support\Facades\Storage::disk($file->getStorageDisk())->url($file->getFilePath()),
                'file_name' => $file->getFileName(),
                'mime_type' => $file->getMimeType(),
                'file_size' => $file->getFileSize(),
            ];
        }

        return [
            'id' => $config->id(),
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
            'files' => $files,
        ];
    }
}
