<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Helpers\UrlHelper;
use App\Infrastructure\Persistence\Eloquent\Models\AdminEloquent;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AdminAuthenticate
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        /** @var AdminEloquent|null $admin */
        $admin = Auth::guard('admin')->user();

        // Check if admin is authenticated
        if (! $admin) {
            // If this is a web request (not API), redirect to admin login
            if ($request->expectsJson() || $request->is('admin/api/*')) {
                return response()->json([
                    'message' => 'Unauthenticated.',
                ], 401);
            }

            // Redirect to admin subdomain login
            return redirect(UrlHelper::adminUrl() . '/admin/login');
        }

        // Check if admin account is active
        if (! $admin->isActive()) {
            Auth::guard('admin')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            if ($request->expectsJson() || $request->is('admin/api/*')) {
                return response()->json([
                    'message' => 'Your account has been deactivated. Please contact support.',
                ], 403);
            }

            return redirect(UrlHelper::adminUrl() . '/admin/login')
                ->with('error', 'Your account has been deactivated. Please contact support.');
        }

        return $next($request);
    }
}
