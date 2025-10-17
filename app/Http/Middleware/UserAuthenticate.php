<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class UserAuthenticate
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::guard('web')->user();

        // Check if user is authenticated
        if (! $user) {
            // If this is a web request (not API), redirect to login
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Unauthenticated.',
                ], 401);
            }

            // Determine redirect URL based on current subdomain
            $host = $request->getHost();
            if (str_contains($host, 'app.')) {
                // Already on app subdomain, redirect to login on main domain
                $publicUrl = str_replace('//app.', '//', config('app.url'));
                return redirect($publicUrl . '/login');
            } else {
                // On main domain, redirect to login
                return redirect()->route('login');
            }
        }

        // Check if user account is active
        if (! $user->isActive()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Your account has been deactivated. Please contact support.',
                ], 403);
            }

            $publicUrl = str_replace('//app.', '//', config('app.url'));
            return redirect($publicUrl . '/login')
                ->with('error', 'Your account has been deactivated. Please contact support.');
        }

        return $next($request);
    }
}

