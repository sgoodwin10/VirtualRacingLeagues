<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Application\Admin\DTOs\UpdateAdminData;
use App\Application\Admin\Services\AdminApplicationService;
use App\Application\Admin\Services\AdminAuthApplicationService;
use App\Domain\Admin\Exceptions\AdminNotFoundException;
use App\Domain\Admin\Exceptions\InvalidCredentialsException;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Admin;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AdminAuthController extends Controller
{
    public function __construct(
        private readonly AdminAuthApplicationService $authService,
        private readonly AdminApplicationService $adminService
    ) {
    }

    /**
     * Handle an authentication attempt.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'remember' => ['boolean'],
        ]);

        $remember = $validated['remember'] ?? false;

        try {
            // Service verifies credentials, logs in, and returns AdminData
            $adminData = $this->authService->login(
                $validated['email'],
                $validated['password'],
                $remember
            );

            // Manually update last_login_at (infrastructure concern)
            $eloquentAdmin = Admin::find($adminData->id);
            if ($eloquentAdmin) {
                $eloquentAdmin->updateLastLogin();
            }

            // Controller handles session regeneration (Laravel concern)
            $request->session()->regenerate();

            // Re-fetch AdminData with updated last_login_at
            if ($adminData->id === null) {
                throw new AdminNotFoundException('Admin ID is null after login');
            }

            $admin = $this->adminService->getAdminEntityById($adminData->id);
            $adminDataWithLogin = $this->adminService->toAdminData($admin);

            return ApiResponse::success(
                ['admin' => $adminDataWithLogin],
                'Login successful.'
            );
        } catch (InvalidCredentialsException $e) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }
    }

    /**
     * Log the admin out.
     */
    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return ApiResponse::success(null, 'Logout successful.');
    }

    /**
     * Check if admin is authenticated.
     */
    public function check(Request $request): JsonResponse
    {
        try {
            $adminData = $this->authService->getCurrentAdmin();

            if ($adminData->id === null) {
                return ApiResponse::success([
                    'authenticated' => false,
                ]);
            }

            $admin = $this->adminService->getAdminEntityById($adminData->id);

            if (!$admin->isActive()) {
                return ApiResponse::success([
                    'authenticated' => false,
                ]);
            }

            $adminDataWithLogin = $this->adminService->toAdminData($admin);

            return ApiResponse::success([
                'authenticated' => true,
                'admin' => $adminDataWithLogin,
            ]);
        } catch (AdminNotFoundException $e) {
            return ApiResponse::success([
                'authenticated' => false,
            ]);
        }
    }

    /**
     * Get current authenticated admin.
     */
    public function me(Request $request): JsonResponse
    {
        try {
            $adminData = $this->authService->getCurrentAdmin();

            if ($adminData->id === null) {
                return ApiResponse::unauthorized('Unauthenticated.');
            }

            $admin = $this->adminService->getAdminEntityById($adminData->id);
            $adminDataWithLogin = $this->adminService->toAdminData($admin);

            return ApiResponse::success([
                'admin' => $adminDataWithLogin,
            ]);
        } catch (AdminNotFoundException $e) {
            return ApiResponse::unauthorized('Unauthenticated.');
        }
    }

    /**
     * Get the authenticated admin's profile (detailed).
     */
    public function profile(Request $request): JsonResponse
    {
        try {
            $adminData = $this->authService->getCurrentAdmin();

            if ($adminData->id === null) {
                return ApiResponse::unauthorized();
            }

            $admin = $this->adminService->getAdminEntityById($adminData->id);
            $detailedData = $this->adminService->toDetailedAdminData($admin);

            return ApiResponse::success([
                'admin' => $detailedData,
            ]);
        } catch (AdminNotFoundException $e) {
            return ApiResponse::unauthorized();
        }
    }

    /**
     * Update the authenticated admin's profile.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        try {
            $currentAdmin = $this->adminService->getCurrentAuthenticatedAdmin();
        } catch (AdminNotFoundException $e) {
            return ApiResponse::unauthorized();
        }

        $adminId = $currentAdmin->id();
        if ($adminId === null) {
            return ApiResponse::unauthorized('Admin ID is null');
        }

        $validated = $request->validate([
            'first_name' => ['sometimes', 'required', 'string', 'max:255'],
            'last_name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'email', 'max:255', 'unique:admins,email,' . $adminId],
            'current_password' => ['required_with:password', 'string'],
            'password' => ['sometimes', 'required', 'string', 'min:8', 'confirmed'],
        ]);

        try {
            // Handle password update separately if provided
            if (isset($validated['password'])) {
                $adminData = $this->authService->updatePassword(
                    $adminId,
                    $validated['current_password'],
                    $validated['password']
                );
            }

            // Handle profile update if any profile fields are provided
            if (isset($validated['first_name']) || isset($validated['last_name']) || isset($validated['email'])) {
                $adminData = $this->authService->updateProfile(
                    $adminId,
                    $validated['first_name'] ?? $currentAdmin->name()->firstName(),
                    $validated['last_name'] ?? $currentAdmin->name()->lastName(),
                    $validated['email'] ?? (string) $currentAdmin->email()
                );
            }

            // Get updated admin with last_login_at
            $admin = $this->adminService->getAdminEntityById($adminId);
            $adminDataWithLogin = $this->adminService->toAdminData($admin);

            return ApiResponse::success(
                ['admin' => $adminDataWithLogin],
                'Profile updated successfully.'
            );
        } catch (InvalidCredentialsException $e) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        } catch (DomainException $e) {
            return ApiResponse::validationError(['email' => [$e->getMessage()]]);
        }
    }
}
