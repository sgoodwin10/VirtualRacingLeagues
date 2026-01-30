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

        // Add Sentry transaction middleware to all requests
        $middleware->append(\App\Http\Middleware\SentryTransactionMiddleware::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Sentry integration for exception reporting
        $exceptions->reportable(function (Throwable $e) {
            if (app()->bound('sentry')) {
                \Sentry\configureScope(function (\Sentry\State\Scope $scope) use ($e): void {
                    // Add request context
                    if ($request = request()) {
                        $scope->setContext('request', [
                            'url' => $request->fullUrl(),
                            'method' => $request->method(),
                            'ip' => $request->ip(),
                            'user_agent' => $request->userAgent(),
                        ]);
                    }

                    // Add authenticated user context (web guard)
                    if (auth()->guard('web')->check()) {
                        $user = auth()->guard('web')->user();
                        $scope->setUser([
                            'id' => (string) $user->id,
                            'email' => $user->email ?? null,
                            'username' => $user->name ?? null,
                        ]);
                        $scope->setTag('user_type', 'user');
                    }

                    // Add authenticated admin context (admin guard)
                    if (auth()->guard('admin')->check()) {
                        $admin = auth()->guard('admin')->user();
                        $scope->setUser([
                            'id' => (string) $admin->id,
                            'email' => $admin->email ?? null,
                            'username' => $admin->name ?? null,
                        ]);
                        $scope->setTag('user_type', 'admin');
                    }

                    // Add environment tags
                    $scope->setTag('environment', config('app.env'));
                    $scope->setTag('subdomain', request()->getHost());
                });

                \Sentry\captureException($e);
            }
        });

        // Handle all domain "not found" exceptions with 404 responses
        // All domain NotFoundException classes extend DomainNotFoundException for centralized handling
        $exceptions->render(function (\App\Domain\Shared\Exceptions\DomainNotFoundException $e) {
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
