<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Application\Admin\Services\AdminUserImpersonationService;
use App\Application\User\DTOs\CreateUserData;
use App\Application\User\DTOs\UpdateUserData;
use App\Application\User\Services\UserApplicationService;
use App\Domain\User\Exceptions\UserAlreadyExistsException;
use App\Domain\User\Exceptions\UserNotDeletedException;
use App\Domain\User\Exceptions\UserNotFoundException;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\User as UserModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * User Controller (Admin API).
 * Thin controller that delegates to the application service.
 */
final class UserController extends Controller
{
    public function __construct(
        private readonly UserApplicationService $userService,
        private readonly AdminUserImpersonationService $impersonationService,
    ) {
    }

    /**
     * Display a listing of users.
     */
    public function index(Request $request): JsonResponse
    {
        // Cast string boolean to actual boolean before validation
        $request->merge([
            'include_deleted' => filter_var(
                $request->input('include_deleted'),
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            ),
        ]);

        // Validate input parameters
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'in:active,inactive,suspended'],
            'include_deleted' => ['nullable', 'boolean'],
            'sort_field' => ['nullable', 'in:first_name,last_name,email,alias,uuid,status,created_at,updated_at'],
            'sort_order' => ['nullable', 'in:asc,desc'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $filters = [
            'include_deleted' => $validated['include_deleted'] ?? false,
            'order_by' => $validated['sort_field'] ?? 'created_at',
            'order_direction' => $validated['sort_order'] ?? 'desc',
        ];

        // Only add search if provided
        if (!empty($validated['search'])) {
            $filters['search'] = $validated['search'];
        }

        // Only add status if provided
        if (!empty($validated['status'])) {
            $filters['status'] = $validated['status'];
        }

        $perPage = (int) ($validated['per_page'] ?? 15);
        $page = (int) $request->input('page', 1);

        $result = $this->userService->getPaginatedUsers($page, $perPage, $filters);

        // Convert Data objects to arrays
        $data = array_map(fn($item) => $item->toArray(), $result['data']);

        // Build pagination links
        $baseUrl = $request->url();
        $queryParams = $request->except('page');
        $lastPage = $result['last_page'];
        $currentPage = $result['current_page'];

        $firstPage = $baseUrl . '?' . http_build_query(array_merge($queryParams, ['page' => 1]));
        $lastPageUrl = $baseUrl . '?' . http_build_query(array_merge($queryParams, ['page' => $lastPage]));
        $prevPage = $currentPage > 1
            ? $baseUrl . '?' . http_build_query(array_merge($queryParams, ['page' => $currentPage - 1]))
            : null;
        $nextPage = $currentPage < $lastPage
            ? $baseUrl . '?' . http_build_query(array_merge($queryParams, ['page' => $currentPage + 1]))
            : null;

        // Return paginated response with proper structure
        return ApiResponse::paginated(
            data: $data,
            meta: [
                'total' => $result['total'],
                'per_page' => $result['per_page'],
                'current_page' => $result['current_page'],
                'last_page' => $result['last_page'],
            ],
            links: [
                'first' => $firstPage,
                'last' => $lastPageUrl,
                'prev' => $prevPage,
                'next' => $nextPage,
            ]
        );
    }

    /**
     * Display the specified user with activity logs.
     */
    public function show(int $id): JsonResponse
    {
        try {
            $result = $this->userService->getUserWithActivities($id);
            return ApiResponse::success($result);
        } catch (UserNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        }
    }

    /**
     * Store a newly created user.
     */
    public function store(Request $request): JsonResponse
    {
        // Validate the request
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'alias' => 'nullable|string|max:100',
            'uuid' => 'nullable|string|max:60',
            'status' => 'nullable|in:active,inactive,suspended',
        ]);

        try {
            $data = CreateUserData::from([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'email' => $validated['email'],
                'password' => $validated['password'],
                'alias' => $validated['alias'] ?? null,
                'uuid' => $validated['uuid'] ?? null,
                'status' => $validated['status'] ?? 'active',
            ]);

            $userData = $this->userService->createUser($data);

            return ApiResponse::created($userData->toArray(), 'User created successfully');
        } catch (UserAlreadyExistsException $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        }
    }

    /**
     * Update the specified user.
     */
    public function update(UpdateUserRequest $request, int $id): JsonResponse
    {
        try {
            $data = UpdateUserData::from($request->validated());
            $userData = $this->userService->updateUser($id, $data);

            return ApiResponse::success($userData->toArray(), 'User updated successfully');
        } catch (UserNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        } catch (UserAlreadyExistsException $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        }
    }

    /**
     * Remove the specified user (soft delete).
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->userService->deleteUser($id);

            return ApiResponse::success(null, 'User deactivated successfully');
        } catch (UserNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        }
    }

    /**
     * Restore a soft-deleted user.
     */
    public function restore(int $id): JsonResponse
    {
        try {
            $userData = $this->userService->restoreUser($id);

            return ApiResponse::success($userData->toArray(), 'User reactivated successfully');
        } catch (UserNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        } catch (UserNotDeletedException $e) {
            return ApiResponse::error('User is not deactivated', null, 400);
        }
    }

    /**
     * Manually verify a user's email address (admin action).
     */
    public function verifyEmail(int $id): JsonResponse
    {
        try {
            $userData = $this->userService->verifyUserEmail($id);

            return ApiResponse::success($userData->toArray(), 'User email verified successfully');
        } catch (UserNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        }
    }

    /**
     * Resend email verification notification to a user (admin action).
     */
    public function resendVerification(int $id): JsonResponse
    {
        try {
            $userData = $this->userService->resendUserEmailVerification($id);

            return ApiResponse::success($userData->toArray(), 'Verification email sent successfully');
        } catch (UserNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        }
    }

    /**
     * Generate an impersonation token to log in as a user.
     * Only accessible to super_admin and admin roles.
     */
    public function loginAs(int $id): JsonResponse
    {
        try {
            /** @var \App\Infrastructure\Persistence\Eloquent\Models\AdminEloquent|null $admin */
            $admin = Auth::guard('admin')->user();

            if (!$admin) {
                return ApiResponse::error('Unauthorized', null, 401);
            }

            // Generate impersonation token
            $token = $this->impersonationService->generateImpersonationToken($id, $admin->id);

            return ApiResponse::success([
                'token' => $token,
                'expires_in' => 300, // 5 minutes
            ], 'Impersonation token generated successfully');
        } catch (UserNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        } catch (\DomainException $e) {
            return ApiResponse::error($e->getMessage(), null, 403);
        }
    }
}
