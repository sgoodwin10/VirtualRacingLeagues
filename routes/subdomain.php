<?php

declare(strict_types=1);

use App\Http\Controllers\Admin\AdminActivityLogController;
use App\Http\Controllers\Admin\AdminAuthController;
use App\Http\Controllers\Admin\AdminLeagueController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Admin\SiteConfigController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Auth\EmailVerificationController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Auth\ProfileController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\UserImpersonationController;
use App\Http\Controllers\User\CompetitionController;
use App\Http\Controllers\User\DriverController;
use App\Http\Controllers\User\LeagueController;
use App\Http\Controllers\User\PlatformController;
use App\Http\Controllers\User\SeasonController;
use App\Http\Controllers\User\SeasonDriverController;
use App\Http\Controllers\User\SiteConfigController as UserSiteConfigController;
use App\Http\Controllers\User\TeamController;
use App\Http\Controllers\User\TimezoneController;
use App\Http\Middleware\AdminOrSuperAdminOnly;
use App\Http\Middleware\AdminSessionMiddleware;
use App\Http\Middleware\SuperAdminOnly;
use Illuminate\Support\Facades\Route;

// Admin subdomain routes (admin.virtualracingleagues.localhost)
Route::domain('admin.virtualracingleagues.localhost')->middleware('web')->group(function () {
    // Admin API routes
    Route::prefix('api')->name('admin.api.')->middleware([AdminSessionMiddleware::class])->group(function () {
        // CSRF cookie route
        Route::get('/csrf-cookie', function () {
            return response()->json(['message' => 'CSRF cookie set']);
        });

        // Public routes (no authentication required)
        Route::post('/login', [AdminAuthController::class, 'login'])
            ->middleware('throttle:5,1')
            ->name('login');

        // Auth check routes - these check if user is authenticated but don't require auth middleware
        Route::get('/auth/check', [AdminAuthController::class, 'check'])->name('check');
        Route::get('/auth/me', [AdminAuthController::class, 'me'])->name('me');

        // Protected routes (authentication required)
        Route::middleware(['auth:admin', 'admin.authenticate', 'throttle:60,1'])->group(function () {
            Route::post('/logout', [AdminAuthController::class, 'logout'])->name('logout');
            Route::get('/profile', [AdminAuthController::class, 'profile'])->name('profile');
            Route::put('/profile', [AdminAuthController::class, 'updateProfile'])->name('profile.update');

            // Admin User Management
            Route::prefix('admins')->name('admins.')->group(function () {
                Route::get('/', [AdminUserController::class, 'index'])->name('index');
                Route::post('/', [AdminUserController::class, 'store'])->name('store');
                Route::get('/{id}', [AdminUserController::class, 'show'])->name('show');
                Route::put('/{id}', [AdminUserController::class, 'update'])->name('update');
                Route::delete('/{id}', [AdminUserController::class, 'destroy'])->name('destroy'); // Deactivates admin
                Route::post('/{id}/restore', [AdminUserController::class, 'restore'])->name('restore'); // Reactivates admin
            });

            // Activity Log Management
            Route::prefix('activities')->name('activities.')->group(function () {
                Route::get('/', [AdminActivityLogController::class, 'index'])->name('index');
                Route::get('/admins', [AdminActivityLogController::class, 'adminActivities'])->name('admins');
                Route::get('/admin/{adminId}', [AdminActivityLogController::class, 'adminActivity'])->name('admin');
                Route::get('/users', [AdminActivityLogController::class, 'userActivities'])->name('users');
                Route::get('/user/{userId}', [AdminActivityLogController::class, 'userActivity'])->name('user');
                Route::get('/{id}', [AdminActivityLogController::class, 'show'])->name('show');
                Route::post('/clean', [AdminActivityLogController::class, 'clean'])
                    ->middleware(SuperAdminOnly::class)
                    ->name('clean');
            });

            // User Management
            Route::apiResource('users', UserController::class);
            Route::post('users/{user}/restore', [UserController::class, 'restore'])
                ->name('users.restore');
            Route::patch('users/{user}/verify-email', [UserController::class, 'verifyEmail'])
                ->name('users.verify-email');
            Route::post('users/{user}/resend-verification', [UserController::class, 'resendVerification'])
                ->name('users.resend-verification');

            // User Impersonation (Admin and Super Admin only)
            Route::post('users/{user}/login-as', [UserController::class, 'loginAs'])
                ->middleware(AdminOrSuperAdminOnly::class)
                ->name('users.login-as');

            // Site Configuration (Super Admin only)
            Route::middleware([SuperAdminOnly::class])->group(function () {
                Route::get('/site-config', [SiteConfigController::class, 'show'])->name('site-config.show');
                Route::put('/site-config', [SiteConfigController::class, 'update'])->name('site-config.update');
            });

            // Leagues Management (Admin)
            Route::prefix('leagues')->name('leagues.')->group(function () {
                Route::get('/', [AdminLeagueController::class, 'index'])->name('index');
                Route::get('/{id}', [AdminLeagueController::class, 'show'])->name('show');
                Route::post('/{id}/archive', [AdminLeagueController::class, 'archive'])->name('archive');
                Route::delete('/{id}', [AdminLeagueController::class, 'destroy'])->name('destroy');
            });
        });
    });

    // Admin SPA - catch all admin routes and let Vue Router handle them
    Route::get('/{any?}', function () {
        return view('admin');
    })->where('any', '.*');
});

// App subdomain routes (app.virtualracingleagues.localhost)
// IMPORTANT: This subdomain is for AUTHENTICATED USERS ONLY
Route::domain('app.virtualracingleagues.localhost')->middleware('web')->group(function () {
    // User impersonation (GET route for server-side redirect)
    // Must come BEFORE API routes to avoid route conflicts
    Route::get('/login-as', [UserImpersonationController::class, 'impersonateViaGet'])
        ->middleware('throttle:10,1')
        ->name('login-as');

    // User API routes
    Route::prefix('api')->name('api.')->group(function () {
        // CSRF cookie route (public, needed before authentication)
        Route::get('/csrf-cookie', function () {
            return response()->json(['message' => 'CSRF cookie set']);
        })->name('csrf-cookie');

        // Auth check route (checks authentication without requiring it)
        Route::get('/me', [LoginController::class, 'me'])->name('me');

        // Impersonation endpoint (public, token-based) - DEPRECATED, use GET /login-as instead
        Route::post('/impersonate', [UserImpersonationController::class, 'impersonate'])
            ->middleware('throttle:10,1')
            ->name('impersonate');

        // Authenticated routes (web guard) - ALL app subdomain API routes require auth
        Route::middleware(['auth:web', 'user.authenticate'])->group(function () {
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
            Route::post('/leagues', [LeagueController::class, 'store'])->name('leagues.store');
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
            Route::post('/leagues/{league}/drivers/import-csv', [DriverController::class, 'importCsv'])->name('leagues.drivers.import-csv');

            // League Competitions
            Route::get('/leagues/{leagueId}/competitions', [CompetitionController::class, 'index'])->name('leagues.competitions.index');
            Route::post('/leagues/{leagueId}/competitions', [CompetitionController::class, 'store'])->name('leagues.competitions.store');
            Route::post('/leagues/{leagueId}/competitions/check-slug', [CompetitionController::class, 'checkSlug'])->name('leagues.competitions.check-slug');

            // Competitions
            Route::get('/competitions/{id}', [CompetitionController::class, 'show'])->name('competitions.show');
            Route::put('/competitions/{id}', [CompetitionController::class, 'update'])->name('competitions.update');
            Route::delete('/competitions/{id}', [CompetitionController::class, 'destroy'])->name('competitions.destroy');
            Route::post('/competitions/{id}/archive', [CompetitionController::class, 'archive'])->name('competitions.archive');

            // Competition Seasons
            Route::get('/competitions/{competitionId}/seasons', [SeasonController::class, 'index'])->name('competitions.seasons.index');
            Route::post('/competitions/{competitionId}/seasons', [SeasonController::class, 'store'])->name('competitions.seasons.store');
            Route::post('/competitions/{competitionId}/seasons/check-slug', [SeasonController::class, 'checkSlug'])->name('competitions.seasons.check-slug');

            // Seasons
            Route::get('/seasons/{id}', [SeasonController::class, 'show'])->name('seasons.show');
            Route::put('/seasons/{id}', [SeasonController::class, 'update'])->name('seasons.update');
            Route::delete('/seasons/{id}', [SeasonController::class, 'destroy'])->name('seasons.destroy');
            Route::post('/seasons/{id}/archive', [SeasonController::class, 'archive'])->name('seasons.archive');
            Route::post('/seasons/{id}/activate', [SeasonController::class, 'activate'])->name('seasons.activate');
            Route::post('/seasons/{id}/complete', [SeasonController::class, 'complete'])->name('seasons.complete');
            Route::post('/seasons/{id}/restore', [SeasonController::class, 'restore'])->name('seasons.restore');

            // Season Drivers
            Route::get('/seasons/{seasonId}/drivers', [SeasonDriverController::class, 'index'])->name('seasons.drivers.index');
            Route::post('/seasons/{seasonId}/drivers', [SeasonDriverController::class, 'store'])->name('seasons.drivers.store');
            Route::get('/seasons/{seasonId}/available-drivers', [SeasonDriverController::class, 'available'])->name('seasons.drivers.available');
            Route::get('/seasons/{seasonId}/drivers/stats', [SeasonDriverController::class, 'stats'])->name('seasons.drivers.stats');
            Route::post('/seasons/{seasonId}/drivers/bulk', [SeasonDriverController::class, 'bulk'])->name('seasons.drivers.bulk');
            Route::put('/seasons/{seasonId}/drivers/{leagueDriverId}', [SeasonDriverController::class, 'update'])->name('seasons.drivers.update');
            Route::delete('/seasons/{seasonId}/drivers/{leagueDriverId}', [SeasonDriverController::class, 'destroy'])->name('seasons.drivers.destroy');

            // Teams
            Route::get('/seasons/{seasonId}/teams', [TeamController::class, 'index'])->name('seasons.teams.index');
            Route::post('/seasons/{seasonId}/teams', [TeamController::class, 'store'])->name('seasons.teams.store');
            Route::put('/seasons/{seasonId}/teams/{teamId}', [TeamController::class, 'update'])->name('seasons.teams.update');
            Route::delete('/seasons/{seasonId}/teams/{teamId}', [TeamController::class, 'destroy'])->name('seasons.teams.destroy');
            Route::put('/seasons/{seasonId}/drivers/{seasonDriverId}/team', [TeamController::class, 'assignDriver'])->name('seasons.drivers.team.assign');
        });
    });

    // User SPA - catch all user routes and let Vue Router handle them
    // This renders the Vue app but frontend should redirect to public domain if not authenticated
    Route::get('/{any?}', function () {
        return view('app');
    })->where('any', '.*');
});

// Main domain routes (virtualracingleagues.localhost)
Route::domain('virtualracingleagues.localhost')->middleware('web')->group(function () {
    // User impersonation (GET route for server-side redirect)
    // Must come BEFORE API routes to avoid route conflicts
    Route::get('/login-as', [UserImpersonationController::class, 'impersonateViaGet'])
        ->middleware('throttle:10,1')
        ->name('public.login-as');

    // Admin API routes (on main domain for easier testing and CORS)
    Route::prefix('api/admin')->name('admin.api.')->middleware([AdminSessionMiddleware::class])->group(function () {
        // CSRF cookie route
        Route::get('/csrf-cookie', function () {
            return response()->json(['message' => 'CSRF cookie set']);
        });

        // Public routes (no authentication required)
        Route::post('/login', [AdminAuthController::class, 'login'])
            ->middleware('throttle:5,1')
            ->name('login');

        // Auth check routes - these check if user is authenticated but don't require auth middleware
        Route::get('/auth/check', [AdminAuthController::class, 'check'])->name('check');
        Route::get('/auth/me', [AdminAuthController::class, 'me'])->name('me');

        // Protected routes (authentication required)
        Route::middleware(['auth:admin', 'admin.authenticate', 'throttle:60,1'])->group(function () {
            Route::post('/logout', [AdminAuthController::class, 'logout'])->name('logout');
            Route::get('/profile', [AdminAuthController::class, 'profile'])->name('profile');
            Route::put('/profile', [AdminAuthController::class, 'updateProfile'])->name('profile.update');

            // Admin User Management
            Route::prefix('admins')->name('admins.')->group(function () {
                Route::get('/', [AdminUserController::class, 'index'])->name('index');
                Route::post('/', [AdminUserController::class, 'store'])->name('store');
                Route::get('/{id}', [AdminUserController::class, 'show'])->name('show');
                Route::put('/{id}', [AdminUserController::class, 'update'])->name('update');
                Route::delete('/{id}', [AdminUserController::class, 'destroy'])->name('destroy'); // Deactivates admin
                Route::post('/{id}/restore', [AdminUserController::class, 'restore'])->name('restore'); // Reactivates admin
            });

            // Activity Log Management
            Route::prefix('activities')->name('activities.')->group(function () {
                Route::get('/', [AdminActivityLogController::class, 'index'])->name('index');
                Route::get('/admins', [AdminActivityLogController::class, 'adminActivities'])->name('admins');
                Route::get('/admin/{adminId}', [AdminActivityLogController::class, 'adminActivity'])->name('admin');
                Route::get('/users', [AdminActivityLogController::class, 'userActivities'])->name('users');
                Route::get('/user/{userId}', [AdminActivityLogController::class, 'userActivity'])->name('user');
                Route::get('/{id}', [AdminActivityLogController::class, 'show'])->name('show');
                Route::post('/clean', [AdminActivityLogController::class, 'clean'])
                    ->middleware(SuperAdminOnly::class)
                    ->name('clean');
            });

            // User Management
            Route::apiResource('users', UserController::class);
            Route::post('users/{user}/restore', [UserController::class, 'restore'])
                ->name('users.restore');
            Route::patch('users/{user}/verify-email', [UserController::class, 'verifyEmail'])
                ->name('users.verify-email');
            Route::post('users/{user}/resend-verification', [UserController::class, 'resendVerification'])
                ->name('users.resend-verification');

            // User Impersonation (Admin and Super Admin only)
            Route::post('users/{user}/login-as', [UserController::class, 'loginAs'])
                ->middleware(AdminOrSuperAdminOnly::class)
                ->name('users.login-as');

            // Site Configuration (Super Admin only)
            Route::middleware([SuperAdminOnly::class])->group(function () {
                Route::get('/site-config', [SiteConfigController::class, 'show'])->name('site-config.show');
                Route::put('/site-config', [SiteConfigController::class, 'update'])->name('site-config.update');
            });

            // Leagues Management (Admin)
            Route::prefix('leagues')->name('leagues.')->group(function () {
                Route::get('/', [AdminLeagueController::class, 'index'])->name('index');
                Route::get('/{id}', [AdminLeagueController::class, 'show'])->name('show');
                Route::post('/{id}/archive', [AdminLeagueController::class, 'archive'])->name('archive');
                Route::delete('/{id}', [AdminLeagueController::class, 'destroy'])->name('destroy');
            });
        });
    });

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

        // Authenticated routes (web guard)
        Route::middleware(['auth:web'])->group(function () {
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
        ->middleware(['signed'])
        ->name('verification.verify');

    // Public SPA - catch all public routes and let Vue Router handle them
    Route::get('/{any?}', function () {
        return view('public');
    })->where('any', '.*');
});
