<?php

declare(strict_types=1);

namespace App\Providers;

use App\Domain\Admin\Repositories\AdminRepositoryInterface;
use App\Domain\Competition\Repositories\CompetitionRepositoryInterface;
use App\Domain\Competition\Repositories\RaceRepositoryInterface;
use App\Domain\Competition\Repositories\SeasonDriverRepositoryInterface;
use App\Domain\Competition\Repositories\SeasonRepositoryInterface;
use App\Domain\Division\Repositories\DivisionRepositoryInterface;
use App\Domain\Driver\Repositories\DriverRepositoryInterface;
use App\Domain\League\Repositories\LeagueRepositoryInterface;
use App\Domain\Team\Repositories\TeamRepositoryInterface;
use App\Domain\User\Repositories\UserRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\Repositories\AdminReadModelService;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentAdminRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentCompetitionRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentDivisionRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentDriverRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentLeagueRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentRaceRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentSeasonDriverRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentSeasonRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentTeamRepository;
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

        // Bind Competition Repository
        $this->app->bind(
            CompetitionRepositoryInterface::class,
            EloquentCompetitionRepository::class
        );

        // Bind Season Repository
        $this->app->bind(
            SeasonRepositoryInterface::class,
            EloquentSeasonRepository::class
        );

        // Bind SeasonDriver Repository
        $this->app->bind(
            SeasonDriverRepositoryInterface::class,
            EloquentSeasonDriverRepository::class
        );

        // Bind Team Repository
        $this->app->bind(
            TeamRepositoryInterface::class,
            EloquentTeamRepository::class
        );

        // Bind Division Repository
        $this->app->bind(
            DivisionRepositoryInterface::class,
            EloquentDivisionRepository::class
        );

        // Bind Round Repository
        $this->app->bind(
            \App\Domain\Competition\Repositories\RoundRepositoryInterface::class,
            \App\Infrastructure\Persistence\Eloquent\Repositories\EloquentRoundRepository::class
        );

        // Bind Race Repository
        $this->app->bind(
            RaceRepositoryInterface::class,
            EloquentRaceRepository::class
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
