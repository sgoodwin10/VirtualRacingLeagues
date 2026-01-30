<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\ServiceProvider;
use Sentry\State\Scope;

final class SentryServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap Sentry user context.
     */
    public function boot(): void
    {
        if (!$this->app->bound('sentry')) {
            return;
        }

        \Sentry\configureScope(function (Scope $scope): void {
            // Set user context for web guard (regular users)
            if (Auth::guard('web')->check()) {
                $user = Auth::guard('web')->user();
                if ($user !== null) {
                    $scope->setUser([
                        'id' => (string) $user->id,
                        'email' => $user->email ?? null,
                        'username' => $user->name ?? null,
                        'segment' => 'user',
                    ]);
                    $scope->setTag('user_type', 'user');
                }
            }

            // Set user context for admin guard
            if (Auth::guard('admin')->check()) {
                $admin = Auth::guard('admin')->user();
                if ($admin !== null) {
                    $scope->setUser([
                        'id' => (string) $admin->id,
                        'email' => $admin->email ?? null,
                        'username' => $admin->name ?? null,
                        'segment' => 'admin',
                    ]);
                    $scope->setTag('user_type', 'admin');
                }
            }

            // Set global tags
            $scope->setTag('app_version', config('app.version', '1.0.0'));
            $scope->setTag('environment', config('app.env'));
        });
    }
}
