<?php

declare(strict_types=1);

namespace App\Providers;

use App\Domain\Admin\Repositories\AdminRepositoryInterface;
use App\Domain\Competition\Repositories\CompetitionRepositoryInterface;
use App\Domain\Competition\Repositories\RaceRepositoryInterface;
use App\Domain\Competition\Repositories\RaceResultRepositoryInterface;
use App\Domain\Competition\Repositories\RoundTiebreakerRuleRepositoryInterface;
use App\Domain\Competition\Repositories\SeasonDriverRepositoryInterface;
use App\Domain\Competition\Repositories\SeasonRepositoryInterface;
use App\Domain\Contact\Repositories\ContactRepositoryInterface;
use App\Domain\Division\Repositories\DivisionRepositoryInterface;
use App\Domain\Driver\Repositories\DriverRepositoryInterface;
use App\Domain\League\Repositories\LeagueRepositoryInterface;
use App\Domain\Notification\Repositories\NotificationLogRepositoryInterface;
use App\Domain\Platform\Repositories\CarBrandRepositoryInterface;
use App\Domain\Platform\Repositories\CarRepositoryInterface;
use App\Domain\Platform\Repositories\PlatformRepositoryInterface;
use App\Domain\Team\Repositories\TeamRepositoryInterface;
use App\Domain\User\Repositories\UserRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\Repositories\AdminReadModelService;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentAdminRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentCarBrandRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentCarRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentCompetitionRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentContactRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentDivisionRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentDriverRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentLeagueRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentNotificationLogRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentPlatformRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentRaceRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentRaceResultRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentRoundTiebreakerRuleRepository;
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

        // Bind Platform Repository
        $this->app->bind(
            PlatformRepositoryInterface::class,
            EloquentPlatformRepository::class
        );

        // Bind Car Repository
        $this->app->bind(
            CarRepositoryInterface::class,
            EloquentCarRepository::class
        );

        // Bind CarBrand Repository
        $this->app->bind(
            CarBrandRepositoryInterface::class,
            EloquentCarBrandRepository::class
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

        // Bind RaceResult Repository
        $this->app->bind(
            RaceResultRepositoryInterface::class,
            EloquentRaceResultRepository::class
        );

        // Bind RoundTiebreakerRule Repository
        $this->app->bind(
            RoundTiebreakerRuleRepositoryInterface::class,
            EloquentRoundTiebreakerRuleRepository::class
        );

        // Bind Contact Repository
        $this->app->bind(
            ContactRepositoryInterface::class,
            EloquentContactRepository::class
        );

        // Bind NotificationLog Repository
        $this->app->bind(
            NotificationLogRepositoryInterface::class,
            EloquentNotificationLogRepository::class
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
