<?php

/**
 * Admin API Routes
 *
 * This file contains the admin API routes that are used by both:
 * - admin.virtualracingleagues.localhost (primary admin subdomain)
 * - virtualracingleagues.localhost/api/admin (fallback for easier testing/CORS)
 *
 * These routes are imported by routes/subdomain.php in both locations.
 */

declare(strict_types=1);

use App\Http\Controllers\Admin\AdminActivityLogController;
use App\Http\Controllers\Admin\AdminAuthController;
use App\Http\Controllers\Admin\AdminLeagueController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Admin\SiteConfigController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Middleware\AdminOrSuperAdminOnly;
use App\Http\Middleware\AdminSessionMiddleware;
use App\Http\Middleware\SuperAdminOnly;
use Illuminate\Support\Facades\Route;

// CSRF cookie route
Route::get('/csrf-cookie', function () {
    return response()->json(['message' => 'CSRF cookie set']);
});

// Public routes (no authentication required)
// Relax rate limiting in local environment for testing (60/min vs 5/min)
$loginThrottle = app()->environment('local') ? 'throttle:60,1' : 'throttle:5,1';
/** @var \Illuminate\Routing\Route $loginRoute */
$loginRoute = Route::post('/login', [AdminAuthController::class, 'login'])
    ->middleware($loginThrottle);
$loginRoute->name('login');

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
        /** @var \Illuminate\Routing\Route $cleanRoute */
        $cleanRoute = Route::post('/clean', [AdminActivityLogController::class, 'clean'])
            ->middleware(SuperAdminOnly::class);
        $cleanRoute->name('clean');
    });

    // User Management
    Route::apiResource('users', UserController::class);
    /** @var \Illuminate\Routing\Route $restoreRoute */
    $restoreRoute = Route::post('users/{user}/restore', [UserController::class, 'restore']);
    $restoreRoute->name('users.restore');
    Route::patch('users/{user}/verify-email', [UserController::class, 'verifyEmail'])
        ->name('users.verify-email');
    Route::post('users/{user}/resend-verification', [UserController::class, 'resendVerification'])
        ->name('users.resend-verification');

    // User Impersonation (Admin and Super Admin only)
    /** @var \Illuminate\Routing\Route $loginAsRoute */
    $loginAsRoute = Route::post('users/{user}/login-as', [UserController::class, 'loginAs'])
        ->middleware(AdminOrSuperAdminOnly::class);
    $loginAsRoute->name('users.login-as');

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
