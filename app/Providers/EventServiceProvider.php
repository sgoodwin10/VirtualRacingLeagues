<?php

declare(strict_types=1);

namespace App\Providers;

use App\Domain\Admin\Events\AdminActivated;
use App\Domain\Admin\Events\AdminAuthenticated;
use App\Domain\Admin\Events\AdminCreated;
use App\Domain\Admin\Events\AdminDeactivated;
use App\Domain\Admin\Events\AdminDeleted;
use App\Domain\Admin\Events\AdminPasswordChanged;
use App\Domain\Admin\Events\AdminProfileUpdated;
use App\Domain\Admin\Events\AdminRestored;
use App\Domain\Admin\Events\AdminRoleChanged;
use App\Domain\Admin\Events\UserImpersonationStarted;
use App\Domain\Competition\Events\SeasonArchived;
use App\Domain\Competition\Events\SeasonCreated;
use App\Domain\Competition\Events\SeasonDeleted;
use App\Domain\Competition\Events\SeasonStatusChanged;
use App\Domain\Competition\Events\SeasonUpdated;
use App\Domain\Contact\Events\ContactSubmitted;
use App\Domain\SiteConfig\Events\SiteConfigApplicationSettingsUpdated;
use App\Domain\SiteConfig\Events\SiteConfigIdentityUpdated;
use App\Domain\SiteConfig\Events\SiteConfigTrackingUpdated;
use App\Domain\User\Events\EmailVerificationRequested;
use App\Domain\User\Events\EmailVerified;
use App\Domain\User\Events\PasswordResetCompleted;
use App\Domain\User\Events\PasswordResetRequested;
use App\Domain\User\Events\UserActivated;
use App\Domain\User\Events\UserCreated;
use App\Domain\User\Events\UserDeactivated;
use App\Domain\User\Events\UserDeleted;
use App\Domain\User\Events\UserLoggedIn;
use App\Domain\User\Events\UserLoggedOut;
use App\Domain\User\Events\UserRestored;
use App\Domain\User\Events\UserUpdated;
use App\Infrastructure\Listeners\LogAdminActivity;
use App\Infrastructure\Listeners\LogLeagueSeasonActivity;
use App\Infrastructure\Listeners\LogSiteConfigActivity;
use App\Infrastructure\Listeners\LogUserActivity;
use App\Infrastructure\Listeners\LogUserImpersonationStarted;
use App\Infrastructure\Listeners\SendContactNotification;
use App\Infrastructure\Listeners\SendEmailVerification;
use App\Infrastructure\Listeners\SendRegistrationDiscordNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

/**
 * Event Service Provider for registering domain event listeners.
 */
final class EventServiceProvider extends ServiceProvider
{
    /**
     * The event listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        // User Domain Events
        UserCreated::class => [
            LogUserActivity::class,
        ],
        UserUpdated::class => [
            LogUserActivity::class,
        ],
        UserActivated::class => [
            LogUserActivity::class,
        ],
        UserDeactivated::class => [
            LogUserActivity::class,
        ],
        UserDeleted::class => [
            LogUserActivity::class,
        ],
        UserRestored::class => [
            LogUserActivity::class,
        ],
        EmailVerificationRequested::class => [
            SendEmailVerification::class,
            SendRegistrationDiscordNotification::class,
            LogUserActivity::class,
        ],
        EmailVerified::class => [
            LogUserActivity::class,
        ],
        PasswordResetRequested::class => [
            LogUserActivity::class,
        ],
        PasswordResetCompleted::class => [
            LogUserActivity::class,
        ],
        UserLoggedIn::class => [
            LogUserActivity::class,
        ],
        UserLoggedOut::class => [
            LogUserActivity::class,
        ],

        // Admin Domain Events
        AdminCreated::class => [
            LogAdminActivity::class,
        ],
        AdminAuthenticated::class => [
            LogAdminActivity::class,
        ],
        AdminPasswordChanged::class => [
            LogAdminActivity::class,
        ],
        AdminProfileUpdated::class => [
            LogAdminActivity::class,
        ],
        AdminActivated::class => [
            LogAdminActivity::class,
        ],
        AdminDeactivated::class => [
            LogAdminActivity::class,
        ],
        AdminDeleted::class => [
            LogAdminActivity::class,
        ],
        AdminRestored::class => [
            LogAdminActivity::class,
        ],
        AdminRoleChanged::class => [
            LogAdminActivity::class,
        ],
        UserImpersonationStarted::class => [
            LogUserImpersonationStarted::class,
        ],

        // User Impersonation Events
        // NOTE: UserImpersonated activity logging is handled in UserImpersonationController
        // to include request-specific data (IP address) that's not available in domain events
        // UserImpersonated::class => [
        //     LogUserImpersonated::class,
        // ],

        // SiteConfig Domain Events
        SiteConfigIdentityUpdated::class => [
            LogSiteConfigActivity::class,
        ],
        SiteConfigTrackingUpdated::class => [
            LogSiteConfigActivity::class,
        ],
        SiteConfigApplicationSettingsUpdated::class => [
            LogSiteConfigActivity::class,
        ],

        // Competition/Season Domain Events
        SeasonCreated::class => [
            LogLeagueSeasonActivity::class,
        ],
        SeasonUpdated::class => [
            LogLeagueSeasonActivity::class,
        ],
        SeasonArchived::class => [
            LogLeagueSeasonActivity::class,
        ],
        SeasonDeleted::class => [
            LogLeagueSeasonActivity::class,
        ],
        SeasonStatusChanged::class => [
            LogLeagueSeasonActivity::class,
        ],

        // Contact Domain Events
        ContactSubmitted::class => [
            SendContactNotification::class,
            LogUserActivity::class,
        ],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        //
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
