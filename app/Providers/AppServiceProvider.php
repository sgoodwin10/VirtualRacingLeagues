<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
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
