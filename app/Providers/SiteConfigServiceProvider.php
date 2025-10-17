<?php

declare(strict_types=1);

namespace App\Providers;

use App\Domain\SiteConfig\Repositories\FileStorageServiceInterface;
use App\Domain\SiteConfig\Repositories\SiteConfigRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentSiteConfigRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\LocalFileStorageService;
use Illuminate\Support\ServiceProvider;

class SiteConfigServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Bind repository interface to concrete implementation
        $this->app->singleton(
            SiteConfigRepositoryInterface::class,
            EloquentSiteConfigRepository::class
        );

        // Bind file storage interface to concrete implementation
        // Can be easily swapped to S3FileStorageService or CloudflareR2FileStorageService
        $this->app->singleton(
            FileStorageServiceInterface::class,
            LocalFileStorageService::class
        );
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
