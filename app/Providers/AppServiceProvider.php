<?php

declare(strict_types=1);

namespace App\Providers;

use App\Application\Shared\Factories\MediaDataFactory;
use App\Application\Shared\Services\MediaServiceInterface;
use App\Infrastructure\Media\Services\MediaConversionService;
use App\Infrastructure\Media\Services\MediaConversionServiceInterface;
use App\Infrastructure\Media\SpatieMediaService;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Register MediaConversionServiceInterface binding (singleton - stateless service)
        $this->app->singleton(MediaConversionServiceInterface::class, MediaConversionService::class);

        // Register MediaServiceInterface binding (singleton - stateless service)
        $this->app->singleton(MediaServiceInterface::class, SpatieMediaService::class);

        // Register MediaDataFactory binding (singleton - stateless factory)
        $this->app->singleton(MediaDataFactory::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Force URL generation to always use APP_URL with port
        // This ensures email verification URLs and other generated URLs include the correct port
        URL::forceRootUrl(config('app.url'));
    }
}
