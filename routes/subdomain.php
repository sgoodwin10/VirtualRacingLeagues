<?php

declare(strict_types=1);

use App\Http\Controllers\Admin\AdminActivityLogController;
use App\Http\Controllers\Admin\AdminAuthController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Admin\SiteConfigController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Auth\EmailVerificationController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Auth\ProfileController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\UserImpersonationController;
use App\Http\Middleware\AdminOrSuperAdminOnly;
use App\Http\Middleware\AdminSessionMiddleware;
use App\Http\Middleware\SuperAdminOnly;
use Illuminate\Support\Facades\Route;

// Admin subdomain routes (admin.generictemplate.localhost)
Route::domain('admin.generictemplate.localhost')->middleware('web')->group(function () {
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
        });
    });

    // Admin SPA - catch all admin routes and let Vue Router handle them
    Route::get('/{any?}', function () {
        return view('admin');
    })->where('any', '.*');
});

// App subdomain routes (app.generictemplate.localhost)
// IMPORTANT: This subdomain is for AUTHENTICATED USERS ONLY
Route::domain('app.generictemplate.localhost')->middleware('web')->group(function () {
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

            // Add future authenticated user API routes here
        });
    });

    // User SPA - catch all user routes and let Vue Router handle them
    // This renders the Vue app but frontend should redirect to public domain if not authenticated
    Route::get('/{any?}', function () {
        return view('app');
    })->where('any', '.*');
});

// Main domain routes (generictemplate.localhost)
Route::domain('generictemplate.localhost')->middleware('web')->group(function () {
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
