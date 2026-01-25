<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Application\Admin\Services\AdminUserImpersonationService;
use App\Application\User\DTOs\UserData;
use App\Domain\User\Exceptions\UserNotFoundException;
use App\Helpers\ApiResponse;
use App\Helpers\UrlHelper;
use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\Models\UserEloquent;
use App\Models\Admin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * User Impersonation Controller.
 * Handles consumption of impersonation tokens on the user app subdomain.
 */
final class UserImpersonationController extends Controller
{
    public function __construct(
        private readonly AdminUserImpersonationService $impersonationService,
    ) {
    }

    /**
     * Consume an impersonation token via GET and redirect to user dashboard.
     * This is the recommended approach - opens in new tab with server-side redirect.
     *
     * GET /login-as?token={hex-string}
     */
    public function impersonateViaGet(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string', 'size:64', 'regex:/^[a-f0-9]+$/i'],
        ]);

        try {
            // Consume the token and get the user
            $result = $this->impersonationService->consumeImpersonationToken($validated['token']);
            $user = $result['user'];

            // Get Eloquent model for authentication
            $eloquentUser = UserEloquent::find($user->id());

            if (! $eloquentUser) {
                throw new \RuntimeException('User model not found');
            }

            // Log in the user
            Auth::guard('web')->login($eloquentUser);

            // Regenerate session for security
            $request->session()->regenerate();

            // Log impersonation activity
            try {
                $admin = isset($result['admin_id']) ? Admin::find($result['admin_id']) : null;

                activity()
                    ->causedBy($admin)
                    ->performedOn($eloquentUser)
                    ->withProperties([
                        'admin_id' => $result['admin_id'] ?? null,
                        'admin_email' => $result['admin_email'] ?? null,
                        'user_email' => $eloquentUser->email,
                        'ip_address' => $request->ip(),
                    ])
                    ->log('Admin impersonated user');
            } catch (\Exception $e) {
                // Log the error but don't break the impersonation flow
                logger()->error('Failed to log impersonation activity', [
                    'error' => $e->getMessage(),
                    'admin_id' => $result['admin_id'] ?? null,
                    'user_id' => $eloquentUser->id,
                ]);
            }

            // Always redirect to app subdomain root
            return redirect(UrlHelper::appUrl())->with('success', 'Successfully logged in as ' . $eloquentUser->email);
        } catch (UserNotFoundException $e) {
            // Redirect to public login with error
            return redirect(UrlHelper::publicUrl() . '/login')
                ->with('error', 'User not found');
        } catch (\DomainException $e) {
            // Redirect to public login with error
            return redirect(UrlHelper::publicUrl() . '/login')
                ->with('error', $e->getMessage());
        } catch (\JsonException $e) {
            // Redirect to public login with error
            return redirect(UrlHelper::publicUrl() . '/login')
                ->with('error', 'Invalid token data');
        } catch (\Exception $e) {
            // Catch any other errors and redirect with generic message
            return redirect(UrlHelper::publicUrl() . '/login')
                ->with('error', 'An error occurred during login');
        }
    }

    /**
     * Consume an impersonation token and log in as the user (API endpoint).
     * DEPRECATED: Use GET /login-as instead for better UX with automatic redirect.
     *
     * POST /api/impersonate
     * Request body: { "token": "hex-string" }
     */
    public function impersonate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string', 'size:64', 'regex:/^[a-f0-9]+$/i'],
        ]);

        try {
            // Consume the token and get the user
            $result = $this->impersonationService->consumeImpersonationToken($validated['token']);
            $user = $result['user'];

            // Get Eloquent model for authentication
            $eloquentUser = UserEloquent::find($user->id());

            if (! $eloquentUser) {
                throw new \RuntimeException('User model not found');
            }

            // Log in the user
            Auth::guard('web')->login($eloquentUser);

            // Regenerate session for security
            $request->session()->regenerate();

            // Log impersonation activity
            try {
                $admin = isset($result['admin_id']) ? Admin::find($result['admin_id']) : null;

                activity()
                    ->causedBy($admin)
                    ->performedOn($eloquentUser)
                    ->withProperties([
                        'admin_id' => $result['admin_id'] ?? null,
                        'admin_email' => $result['admin_email'] ?? null,
                        'user_email' => $eloquentUser->email,
                        'ip_address' => $request->ip(),
                    ])
                    ->log('Admin impersonated user');
            } catch (\Exception $e) {
                // Log the error but don't break the impersonation flow
                logger()->error('Failed to log impersonation activity', [
                    'error' => $e->getMessage(),
                    'admin_id' => $result['admin_id'] ?? null,
                    'user_id' => $eloquentUser->id,
                ]);
            }

            // Return user data
            return ApiResponse::success(
                UserData::fromEntity($user)->toArray(),
                'Successfully impersonating user'
            );
        } catch (UserNotFoundException $e) {
            return ApiResponse::error('User not found', null, 404);
        } catch (\DomainException $e) {
            return ApiResponse::error($e->getMessage(), null, 400);
        } catch (\JsonException $e) {
            return ApiResponse::error('Invalid token data', null, 400);
        }
    }
}
