<?php

declare(strict_types=1);

use App\Http\Controllers\Auth\EmailVerificationController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Auth\ProfileController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\UserImpersonationController;
use App\Http\Controllers\Public\PublicDriverController;
use App\Http\Controllers\Public\PublicLeagueController;
use App\Http\Controllers\Public\PublicPlatformController;
use App\Http\Controllers\User\CompetitionController;
use App\Http\Controllers\User\DivisionController;
use App\Http\Controllers\User\DriverController;
use App\Http\Controllers\User\LeagueActivityLogController;
use App\Http\Controllers\User\LeagueController;
use App\Http\Controllers\User\PlatformController;
use App\Http\Controllers\User\PlatformSettingsController;
use App\Http\Controllers\User\QualifierController;
use App\Http\Controllers\User\RaceController;
use App\Http\Controllers\User\RaceResultController;
use App\Http\Controllers\User\SeasonController;
use App\Http\Controllers\User\SeasonDriverController;
use App\Http\Controllers\User\SiteConfigController as UserSiteConfigController;
use App\Http\Controllers\User\TeamController;
use App\Http\Controllers\User\TimezoneController;
use App\Http\Controllers\User\TrackController;
use App\Http\Controllers\App\TiebreakerRuleController;
use App\Http\Middleware\AdminSessionMiddleware;
use Illuminate\Support\Facades\Route;

// Configure domains from environment variables
$baseDomain = config('app.domain', 'virtualracingleagues.localhost');
$adminDomain = "admin.{$baseDomain}";
$appDomain = "app.{$baseDomain}";

/**
 * Admin Subdomain Routes (admin.virtualracingleagues.localhost)
 *
 * This is the PRIMARY admin interface accessible at admin.{domain}.
 * All admin API routes are also duplicated on the main domain (see below)
 * for easier local development, testing, and CORS handling.
 */
Route::domain($adminDomain)->middleware('web')->group(function () {
    // Admin API routes - imported from admin-api.php to avoid duplication
    Route::prefix('api')->name('admin.api.')->middleware([AdminSessionMiddleware::class])->group(
        base_path('routes/admin-api.php')
    );

    // Admin SPA - catch all admin routes and let Vue Router handle them
    Route::get('/{any?}', function () {
        return view('admin');
    })->where('any', '.*');
});

/**
 * App Subdomain Routes (app.virtualracingleagues.localhost)
 *
 * IMPORTANT: This subdomain is for AUTHENTICATED USERS ONLY.
 * Users authenticate on the main domain, then access this subdomain
 * with session cookies shared via SESSION_DOMAIN=.{domain}.
 */
Route::domain($appDomain)->middleware('web')->group(function () {
    /**
     * User Impersonation Route (GET)
     *
     * This route allows admins to impersonate users via a signed URL.
     * It's duplicated on both app subdomain and main domain to support
     * cross-subdomain impersonation (admin -> user).
     *
     * Must come BEFORE API routes to avoid route conflicts.
     */
    Route::get('/login-as', [UserImpersonationController::class, 'impersonateViaGet'])
        ->middleware('throttle:10,1')
        ->name('login-as');

    // User API routes
    Route::prefix('api')->name('api.')->group(function () {
        // CSRF cookie route (public, needed before authentication)
        Route::get('/csrf-cookie', function () {
            return response()->json(['message' => 'CSRF cookie set']);
        })->name('csrf-cookie');

        /**
         * User Impersonation Endpoint (POST - Token-based)
         *
         * DEPRECATED: This endpoint is maintained for backwards compatibility.
         * New implementations should use GET /login-as instead.
         *
         * Accepts a signed token and authenticates the user.
         */
        Route::post('/impersonate', [UserImpersonationController::class, 'impersonate'])
            ->middleware('throttle:10,1')
            ->name('impersonate');

        // Authenticated routes (web guard) - ALL app subdomain API routes require auth
        Route::middleware(['auth:web', 'user.authenticate'])->group(function () {
            // Auth check route (requires authentication on app subdomain)
            Route::get('/me', [LoginController::class, 'me'])->name('me');

            Route::post('/logout', [LoginController::class, 'logout'])->name('logout');

            // Email verification resend
            Route::post('/email/resend', [EmailVerificationController::class, 'resend'])
                ->middleware(['throttle:6,1'])
                ->name('verification.resend');

            // Profile
            Route::put('/profile', [ProfileController::class, 'update'])->name('profile.update');

            // Site Configuration (read-only)
            Route::get('/site-config', [UserSiteConfigController::class, 'show'])->name('site-config.show');

            // Platforms (read-only)
            Route::get('/platforms', [PlatformController::class, 'index'])->name('platforms.index');

            // Timezones (read-only)
            Route::get('/timezones', [TimezoneController::class, 'index'])->name('timezones.index');

            // Leagues
            Route::get('/leagues', [LeagueController::class, 'index'])->name('leagues.index');
            Route::post('/leagues', [LeagueController::class, 'store'])
                ->middleware('throttle:10,1')
                ->name('leagues.store');
            Route::get('/leagues/{id}', [LeagueController::class, 'show'])->name('leagues.show');
            Route::put('/leagues/{id}', [LeagueController::class, 'update'])->name('leagues.update');
            Route::delete('/leagues/{id}', [LeagueController::class, 'destroy'])->name('leagues.destroy');
            Route::post('/leagues/check-slug', [LeagueController::class, 'checkSlug'])->name('leagues.check-slug');
            Route::get('/leagues/{id}/platforms', [LeagueController::class, 'platforms'])->name('leagues.platforms');
            Route::get('/leagues/{id}/driver-columns', [LeagueController::class, 'driverColumns'])->name('leagues.driver-columns');
            Route::get('/leagues/{id}/driver-form-fields', [LeagueController::class, 'driverFormFields'])->name('leagues.driver-form-fields');
            Route::get('/leagues/{id}/driver-csv-headers', [LeagueController::class, 'driverCsvHeaders'])->name('leagues.driver-csv-headers');

            // League Drivers
            Route::get('/leagues/{league}/drivers', [DriverController::class, 'index'])->name('leagues.drivers.index');
            Route::post('/leagues/{league}/drivers', [DriverController::class, 'store'])->name('leagues.drivers.store');
            Route::get('/leagues/{league}/drivers/{driver}', [DriverController::class, 'show'])->name('leagues.drivers.show');
            Route::put('/leagues/{league}/drivers/{driver}', [DriverController::class, 'update'])->name('leagues.drivers.update');
            Route::delete('/leagues/{league}/drivers/{driver}', [DriverController::class, 'destroy'])->name('leagues.drivers.destroy');
            Route::get('/leagues/{league}/drivers/{driver}/seasons', [DriverController::class, 'seasons'])->name('leagues.drivers.seasons');
            Route::post('/leagues/{league}/drivers/import-csv', [DriverController::class, 'importCsv'])
                ->middleware('throttle:5,1')
                ->name('leagues.drivers.import-csv');

            // League Activity Logs
            Route::get('/leagues/{league}/activities', [LeagueActivityLogController::class, 'index'])->name('leagues.activities.index');
            Route::get('/leagues/{league}/activities/{activityId}', [LeagueActivityLogController::class, 'show'])->name('leagues.activities.show');

            // League Competitions
            Route::get('/leagues/{leagueId}/competitions', [CompetitionController::class, 'index'])->name('leagues.competitions.index');
            Route::post('/leagues/{leagueId}/competitions', [CompetitionController::class, 'store'])->name('leagues.competitions.store');
            Route::post('/leagues/{leagueId}/competitions/check-slug', [CompetitionController::class, 'checkSlug'])->name('leagues.competitions.check-slug');

            // Competitions
            Route::get('/competitions/{id}', [CompetitionController::class, 'show'])->name('competitions.show');
            Route::put('/competitions/{id}', [CompetitionController::class, 'update'])->name('competitions.update');
            Route::delete('/competitions/{id}', [CompetitionController::class, 'destroy'])->name('competitions.destroy');
            Route::post('/competitions/{id}/archive', [CompetitionController::class, 'archive'])
                ->middleware('throttle:20,1')
                ->name('competitions.archive');

            // Competition Seasons
            Route::get('/competitions/{competitionId}/seasons', [SeasonController::class, 'index'])->name('competitions.seasons.index');
            Route::post('/competitions/{competitionId}/seasons', [SeasonController::class, 'store'])->name('competitions.seasons.store');
            Route::post('/competitions/{competitionId}/seasons/check-slug', [SeasonController::class, 'checkSlug'])->name('competitions.seasons.check-slug');

            // Seasons
            Route::get('/seasons/{id}', [SeasonController::class, 'show'])->name('seasons.show');
            Route::get('/seasons/{id}/standings', [SeasonController::class, 'standings'])
                ->middleware('throttle:30,1')
                ->name('seasons.standings');
            Route::put('/seasons/{id}', [SeasonController::class, 'update'])->name('seasons.update');
            Route::delete('/seasons/{id}', [SeasonController::class, 'destroy'])->name('seasons.destroy');
            Route::post('/seasons/{id}/archive', [SeasonController::class, 'archive'])
                ->middleware('throttle:20,1')
                ->name('seasons.archive');
            Route::post('/seasons/{id}/unarchive', [SeasonController::class, 'unarchive'])
                ->middleware('throttle:20,1')
                ->name('seasons.unarchive');
            Route::post('/seasons/{id}/activate', [SeasonController::class, 'activate'])
                ->middleware('throttle:20,1')
                ->name('seasons.activate');
            Route::post('/seasons/{id}/complete', [SeasonController::class, 'complete'])
                ->middleware('throttle:20,1')
                ->name('seasons.complete');
            Route::post('/seasons/{id}/restore', [SeasonController::class, 'restore'])
                ->middleware('throttle:20,1')
                ->name('seasons.restore');

            // Tiebreaker Rules
            Route::get('/tiebreaker-rules', [TiebreakerRuleController::class, 'index'])
                ->name('tiebreaker-rules.index');
            Route::get('/seasons/{seasonId}/tiebreaker-rules', [TiebreakerRuleController::class, 'getSeasonRules'])
                ->name('seasons.tiebreaker-rules.show');
            Route::put('/seasons/{seasonId}/tiebreaker-rules', [TiebreakerRuleController::class, 'updateSeasonRules'])
                ->name('seasons.tiebreaker-rules.update');

            // Season Drivers
            Route::get('/seasons/{seasonId}/drivers', [SeasonDriverController::class, 'index'])->name('seasons.drivers.index');
            Route::post('/seasons/{seasonId}/drivers', [SeasonDriverController::class, 'store'])->name('seasons.drivers.store');
            Route::get('/seasons/{seasonId}/available-drivers', [SeasonDriverController::class, 'available'])->name('seasons.drivers.available');
            Route::get('/seasons/{seasonId}/drivers/stats', [SeasonDriverController::class, 'stats'])->name('seasons.drivers.stats');
            Route::post('/seasons/{seasonId}/drivers/bulk', [SeasonDriverController::class, 'bulk'])
                ->middleware('throttle:10,1')
                ->name('seasons.drivers.bulk');
            Route::put('/seasons/{seasonId}/drivers/{leagueDriverId}', [SeasonDriverController::class, 'update'])->name('seasons.drivers.update');
            Route::delete('/seasons/{seasonId}/drivers/{leagueDriverId}', [SeasonDriverController::class, 'destroy'])->name('seasons.drivers.destroy');

            // Teams
            Route::get('/seasons/{seasonId}/teams', [TeamController::class, 'index'])->name('seasons.teams.index');
            Route::post('/seasons/{seasonId}/teams', [TeamController::class, 'store'])->name('seasons.teams.store');
            Route::put('/seasons/{seasonId}/teams/{teamId}', [TeamController::class, 'update'])->name('seasons.teams.update');
            Route::delete('/seasons/{seasonId}/teams/{teamId}', [TeamController::class, 'destroy'])->name('seasons.teams.destroy');
            Route::put('/seasons/{seasonId}/drivers/{seasonDriverId}/team', [TeamController::class, 'assignDriver'])->name('seasons.drivers.team.assign');

            // Divisions
            Route::get('/seasons/{seasonId}/divisions', [DivisionController::class, 'index'])
                ->whereNumber('seasonId')
                ->name('seasons.divisions.index');
            Route::post('/seasons/{seasonId}/divisions', [DivisionController::class, 'store'])
                ->whereNumber('seasonId')
                ->name('seasons.divisions.store');
            Route::put('/seasons/{seasonId}/divisions/reorder', [DivisionController::class, 'reorder'])
                ->whereNumber('seasonId')
                ->name('seasons.divisions.reorder');
            Route::put('/seasons/{seasonId}/divisions/{divisionId}', [DivisionController::class, 'update'])
                ->whereNumber(['seasonId', 'divisionId'])
                ->name('seasons.divisions.update');
            Route::delete('/seasons/{seasonId}/divisions/{divisionId}', [DivisionController::class, 'destroy'])
                ->whereNumber(['seasonId', 'divisionId'])
                ->name('seasons.divisions.destroy');
            Route::get('/seasons/{seasonId}/divisions/{divisionId}/driver-count', [DivisionController::class, 'driverCount'])
                ->whereNumber(['seasonId', 'divisionId'])
                ->name('seasons.divisions.driver-count');
            Route::put('/seasons/{seasonId}/drivers/{seasonDriverId}/division', [DivisionController::class, 'assignDriver'])
                ->whereNumber(['seasonId', 'seasonDriverId'])
                ->name('seasons.drivers.division.assign');

            // Rounds
            Route::get('/seasons/{seasonId}/rounds', [\App\Http\Controllers\User\RoundController::class, 'index'])->name('seasons.rounds.index');
            Route::post('/seasons/{seasonId}/rounds', [\App\Http\Controllers\User\RoundController::class, 'store'])->name('seasons.rounds.store');
            Route::get('/seasons/{seasonId}/rounds/next-number', [\App\Http\Controllers\User\RoundController::class, 'nextRoundNumber'])->name('seasons.rounds.next-number');
            Route::get('/rounds/{roundId}', [\App\Http\Controllers\User\RoundController::class, 'show'])->name('rounds.show');
            Route::get('/rounds/{roundId}/results', [\App\Http\Controllers\User\RoundController::class, 'results'])->name('rounds.results');
            Route::put('/rounds/{roundId}', [\App\Http\Controllers\User\RoundController::class, 'update'])->name('rounds.update');
            Route::delete('/rounds/{roundId}', [\App\Http\Controllers\User\RoundController::class, 'destroy'])->name('rounds.destroy');
            Route::put('/rounds/{roundId}/complete', [\App\Http\Controllers\User\RoundController::class, 'complete'])
                ->middleware('throttle:20,1')
                ->name('rounds.complete');
            Route::put('/rounds/{roundId}/uncomplete', [\App\Http\Controllers\User\RoundController::class, 'uncomplete'])
                ->middleware('throttle:20,1')
                ->name('rounds.uncomplete');

            // Races
            Route::get('/rounds/{roundId}/races', [RaceController::class, 'index'])
                ->whereNumber('roundId')
                ->name('rounds.races.index');
            Route::post('/rounds/{roundId}/races', [RaceController::class, 'store'])
                ->whereNumber('roundId')
                ->name('rounds.races.store');
            Route::get('/races/{raceId}', [RaceController::class, 'show'])
                ->whereNumber('raceId')
                ->name('races.show');
            Route::put('/races/{raceId}', [RaceController::class, 'update'])
                ->whereNumber('raceId')
                ->name('races.update');
            Route::delete('/races/{raceId}', [RaceController::class, 'destroy'])
                ->whereNumber('raceId')
                ->middleware('throttle:20,1')
                ->name('races.destroy');
            Route::get('/races/{raceId}/orphaned-results', [RaceController::class, 'getOrphanedResults'])
                ->whereNumber('raceId')
                ->name('races.orphaned-results.index');
            Route::delete('/races/{raceId}/orphaned-results', [RaceController::class, 'removeOrphanedResults'])
                ->whereNumber('raceId')
                ->middleware('throttle:20,1')
                ->name('races.orphaned-results.destroy');

            // Qualifiers
            Route::get('/rounds/{roundId}/qualifier', [QualifierController::class, 'show'])->name('rounds.qualifier.show');
            Route::post('/rounds/{roundId}/qualifier', [QualifierController::class, 'store'])->name('rounds.qualifier.store');
            Route::put('/qualifiers/{qualifierId}', [QualifierController::class, 'update'])->name('qualifiers.update');
            Route::delete('/qualifiers/{qualifierId}', [QualifierController::class, 'destroy'])->name('qualifiers.destroy');

            // Platform Settings
            Route::get('/platforms/{platformId}/race-settings', [PlatformSettingsController::class, 'getRaceSettings'])->name('platforms.race-settings');

            // Tracks
            Route::get('/tracks', [TrackController::class, 'index'])->name('tracks.index');
            Route::get('/tracks/{id}', [TrackController::class, 'show'])->name('tracks.show');

            // Race Results
            Route::get('/races/{raceId}/results', [RaceResultController::class, 'index'])->name('races.results.index');
            Route::post('/races/{raceId}/results', [RaceResultController::class, 'store'])->name('races.results.store');
            Route::delete('/races/{raceId}/results', [RaceResultController::class, 'destroy'])->name('races.results.destroy');
        });
    });

    // User SPA - catch all user routes and let Vue Router handle them
    // This renders the Vue app but frontend should redirect to public domain if not authenticated
    Route::get('/{any?}', function () {
        return view('app');
    })->where('any', '.*');
});

/**
 * Main Domain Routes (virtualracingleagues.localhost)
 *
 * This is the public-facing domain with authentication flows (login, register).
 * Admin API routes are also duplicated here for convenience.
 */
Route::domain($baseDomain)->middleware('web')->group(function () {
    /**
     * User Impersonation Route (GET)
     *
     * Duplicated on main domain to support admin-to-user impersonation
     * from the admin subdomain to the main/app subdomains.
     *
     * Must come BEFORE API routes to avoid route conflicts.
     */
    Route::get('/login-as', [UserImpersonationController::class, 'impersonateViaGet'])
        ->middleware('throttle:10,1')
        ->name('public.login-as');

    /**
     * Admin API Routes (Main Domain)
     *
     * These routes are DUPLICATED from the admin subdomain for:
     * 1. Easier local development (no need to configure multiple subdomains)
     * 2. Simpler CORS handling in development
     * 3. Testing convenience
     *
     * In production, the admin subdomain (admin.{domain}) should be used.
     * Both route sets share the same route definitions from routes/admin-api.php.
     */
    Route::prefix('api/admin')->name('admin.api.')->middleware([AdminSessionMiddleware::class])->group(
        base_path('routes/admin-api.php')
    );

    // Public authentication routes
    Route::prefix('api')->name('public.api.')->group(function () {
        // CSRF cookie route
        Route::get('/csrf-cookie', function () {
            return response()->json(['message' => 'CSRF cookie set']);
        })->name('csrf-cookie');

        // Public routes (no authentication required)
        Route::post('/register', [RegisterController::class, 'register'])->name('register');
        Route::post('/login', [LoginController::class, 'login'])->name('login');
        Route::post('/forgot-password', [PasswordResetController::class, 'requestReset'])->name('password.request');
        Route::post('/reset-password', [PasswordResetController::class, 'reset'])->name('password.reset');

        // Public data endpoints (no authentication required)
        Route::prefix('public')->name('public.')->middleware('throttle:60,1')->group(function () {
            Route::get('/leagues', [PublicLeagueController::class, 'index'])->name('leagues.index');
            Route::get('/leagues/{slug}', [PublicLeagueController::class, 'show'])
                ->where('slug', '[a-z0-9\-]+')
                ->name('leagues.show');
            Route::get('/leagues/{slug}/seasons/{seasonSlug}', [PublicLeagueController::class, 'seasonDetail'])
                ->where(['slug' => '[a-z0-9\-]+', 'seasonSlug' => '[a-z0-9\-]+'])
                ->middleware('throttle:20,1')
                ->name('leagues.seasons.show');
            Route::get('/races/{raceId}/results', [PublicLeagueController::class, 'raceResults'])
                ->whereNumber('raceId')
                ->name('races.results');
            Route::get('/drivers/{seasonDriverId}', [PublicDriverController::class, 'show'])
                ->whereNumber('seasonDriverId')
                ->name('drivers.show');
            Route::get('/platforms', [PublicPlatformController::class, 'index'])->name('platforms.index');
        });

        // Authenticated routes (web guard)
        Route::middleware(['auth:web', 'user.authenticate'])->group(function () {
            Route::post('/logout', [LoginController::class, 'logout'])->name('logout');
            Route::get('/me', [LoginController::class, 'me'])->name('me');

            // Email verification resend
            Route::post('/email/resend', [EmailVerificationController::class, 'resend'])
                ->middleware(['throttle:6,1'])
                ->name('verification.resend');

            // Profile
            Route::put('/profile', [ProfileController::class, 'update'])->name('profile.update');
        });
    });

    // Email verification (signed route) - must come BEFORE catch-all routes
    Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
        ->middleware(['auth:web', 'signed', 'throttle:10,1'])
        ->name('verification.verify');

    // Public SPA - catch all public routes and let Vue Router handle them
    Route::get('/{any?}', function () {
        return view('public');
    })->where('any', '.*');
});
