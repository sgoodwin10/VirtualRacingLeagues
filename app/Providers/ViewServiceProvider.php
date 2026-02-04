<?php

declare(strict_types=1);

namespace App\Providers;

use App\Http\View\Composers\SiteConfigComposer;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;

/**
 * View Service Provider
 *
 * Registers view composers that share data with Blade templates.
 */
class ViewServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Share site config with all views
        View::composer('*', SiteConfigComposer::class);
    }
}
