<?php

use App\Http\Middleware\AdminAuthenticate;
use App\Http\Middleware\AdminRole;
use App\Http\Middleware\UserAuthenticate;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            // Load subdomain routes FIRST (primary routing)
            require __DIR__.'/../routes/subdomain.php';

            // Load API routes (deprecated, kept for reference)
            require __DIR__.'/../routes/api.php';

            // Load web routes LAST (fallback only)
            require __DIR__.'/../routes/web.php';
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Register custom middleware aliases
        $middleware->alias([
            'admin.authenticate' => AdminAuthenticate::class,
            'admin.role' => AdminRole::class,
            'user.authenticate' => UserAuthenticate::class,
        ]);

        // Add Sanctum middleware for stateful API requests
        $middleware->api(prepend: [
            EnsureFrontendRequestsAreStateful::class,
        ]);

        // Exclude API routes from web CSRF verification (Sanctum handles this)
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
