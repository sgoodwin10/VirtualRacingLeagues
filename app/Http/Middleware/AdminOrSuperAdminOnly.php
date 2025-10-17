<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware to restrict access to admin and super_admin roles only.
 * Moderators are NOT allowed.
 */
class AdminOrSuperAdminOnly
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $admin = Auth::guard('admin')->user();

        if (!$admin || (!$admin->isAdmin() && !$admin->isSuperAdmin())) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden. Only admins and super admins can access this resource.',
            ], 403);
        }

        return $next($request);
    }
}
