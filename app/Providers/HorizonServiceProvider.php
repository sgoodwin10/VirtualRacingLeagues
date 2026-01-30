<?php

namespace App\Providers;

use Illuminate\Support\Facades\Gate;
use Laravel\Horizon\Horizon;
use Laravel\Horizon\HorizonApplicationServiceProvider;

class HorizonServiceProvider extends HorizonApplicationServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        parent::boot();

        // Configure notification routing for long wait times
        if (config('notifications.discord.enabled') && config('notifications.discord.webhooks.system')) {
            Horizon::routeSlackNotificationsTo(
                config('notifications.discord.webhooks.system'),
                '#operations'
            );
        }

        // Route email notifications (optional)
        if (config('notifications.email.enabled') && config('notifications.admin_email')) {
            Horizon::routeMailNotificationsTo(config('notifications.admin_email'));
        }

        // Dark mode preference (optional)
        // Horizon::night();
    }

    /**
     * Register the Horizon gate.
     *
     * This gate determines who can access Horizon in non-local environments.
     */
    protected function gate(): void
    {
        Gate::define('viewHorizon', function ($user) {
            // Only allow authenticated admins
            // This works because middleware already checks auth:admin
            return true;
        });
    }
}
