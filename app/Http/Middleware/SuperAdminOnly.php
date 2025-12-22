<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Infrastructure\Persistence\Eloquent\Models\AdminEloquent;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class SuperAdminOnly
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
            return response()->json([
                'success' => false,
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
                    'reason' => 'inactive_account',
                ])
                ->log('Authorization failed: Inactive admin attempted to access super admin resource');

            Auth::guard('admin')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return response()->json([
                'success' => false,
                'message' => 'Your account has been deactivated. Please contact support.',
            ], 403);
        }

        // Check if admin is a super admin
        if (! $admin->isSuperAdmin()) {
            // Log authorization failure
            activity()
                ->causedBy($admin)
                ->withProperties([
                    'admin_id' => $admin->id,
                    'email' => $admin->email,
                    'current_role' => $admin->role,
                    'required_role' => 'super_admin',
                    'reason' => 'insufficient_role',
                ])
                ->log('Authorization failed: Non-super-admin attempted to access super admin resource');

            return response()->json([
                'success' => false,
                'message' => 'Forbidden. Only super admins can access this resource.',
            ], 403);
        }

        return $next($request);
    }
}
