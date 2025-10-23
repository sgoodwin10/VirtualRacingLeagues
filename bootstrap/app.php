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
        // Handle all domain NotFoundExceptions with 404 responses
        $exceptions->render(function (\App\Domain\League\Exceptions\LeagueNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 404);
        });

        $exceptions->render(function (\App\Domain\Driver\Exceptions\DriverNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 404);
        });

        $exceptions->render(function (\App\Domain\User\Exceptions\UserNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 404);
        });

        $exceptions->render(function (\App\Domain\Admin\Exceptions\AdminNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 404);
        });

        $exceptions->render(function (\App\Domain\Competition\Exceptions\CompetitionNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 404);
        });

        // Handle UnauthorizedException with 403 responses
        $exceptions->render(function (\App\Domain\Shared\Exceptions\UnauthorizedException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 403);
        });

        // Handle Competition archived exceptions with 422 responses
        $exceptions->render(function (\App\Domain\Competition\Exceptions\CompetitionIsArchivedException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        });

        $exceptions->render(function (\App\Domain\Competition\Exceptions\CompetitionAlreadyArchivedException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        });

        // Handle InvalidPlatformException with 422 responses
        $exceptions->render(function (\App\Domain\League\Exceptions\InvalidPlatformException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        });
    })->create();
