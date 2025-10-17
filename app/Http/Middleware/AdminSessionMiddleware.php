<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class AdminSessionMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Set admin-specific session cookie name
        $adminCookieName = env(
            'ADMIN_SESSION_COOKIE',
            Str::slug((string) env('APP_NAME', 'laravel')) . '-admin-session'
        );

        // Temporarily override the session cookie name for admin routes
        Config::set('session.cookie', $adminCookieName);

        $response = $next($request);

        // Reset to default session cookie name
        Config::set('session.cookie', env(
            'SESSION_COOKIE',
            Str::slug((string) env('APP_NAME', 'laravel')) . '-user-session'
        ));

        return $response;
    }
}

