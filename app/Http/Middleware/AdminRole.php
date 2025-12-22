<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Infrastructure\Persistence\Eloquent\Models\AdminEloquent;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AdminRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        /** @var AdminEloquent|null $admin */
        $admin = Auth::guard('admin')->user();

        // Check if admin is authenticated
        if (! $admin) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        // Check if admin account is active
        if (! $admin->isActive()) {
            // Log authorization failure
            activity()
                ->causedBy($admin)
                ->withProperties([
                    'admin_id' => $admin->id,
                    'email' => $admin->email,
                    'required_roles' => $roles,
                    'reason' => 'inactive_account',
                ])
                ->log('Authorization failed: Inactive admin attempted to access role-protected resource');

            Auth::guard('admin')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return response()->json([
                'message' => 'Your account has been deactivated. Please contact support.',
            ], 403);
        }

        // Check if admin has any of the required roles
        if (! $admin->hasAnyRole($roles)) {
            // Log authorization failure
            activity()
                ->causedBy($admin)
                ->withProperties([
                    'admin_id' => $admin->id,
                    'email' => $admin->email,
                    'current_role' => $admin->role,
                    'required_roles' => $roles,
                    'reason' => 'insufficient_role',
                ])
                ->log('Authorization failed: Admin attempted to access resource without required role');

            return response()->json([
                'message' => 'Forbidden. You do not have permission to access this resource.',
            ], 403);
        }

        return $next($request);
    }
}
