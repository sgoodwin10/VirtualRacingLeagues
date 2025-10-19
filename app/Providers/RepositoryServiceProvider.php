<?php

declare(strict_types=1);

namespace App\Providers;

use App\Domain\Admin\Repositories\AdminRepositoryInterface;
use App\Domain\Driver\Repositories\DriverRepositoryInterface;
use App\Domain\League\Repositories\LeagueRepositoryInterface;
use App\Domain\User\Repositories\UserRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\Repositories\AdminReadModelService;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentAdminRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentDriverRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentLeagueRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentUserRepository;
use Illuminate\Support\ServiceProvider;

/**
 * Service Provider for binding repository interfaces to implementations.
 */
final class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register repository bindings.
     */
    public function register(): void
    {
        // Bind User Repository
        $this->app->bind(
            UserRepositoryInterface::class,
            EloquentUserRepository::class
        );

        // Bind Admin Repository
        $this->app->bind(
            AdminRepositoryInterface::class,
            EloquentAdminRepository::class
        );

        // Bind League Repository
        $this->app->bind(
            LeagueRepositoryInterface::class,
            EloquentLeagueRepository::class
        );

        // Bind Driver Repository
        $this->app->bind(
            DriverRepositoryInterface::class,
            EloquentDriverRepository::class
        );

        // Bind Admin Read Model Service (singleton for better performance)
        $this->app->singleton(AdminReadModelService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
