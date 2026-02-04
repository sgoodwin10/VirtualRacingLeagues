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
use App\Helpers\FilterBuilder;
use App\Helpers\PaginationHelper;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CreateUserRequest;
use App\Http\Requests\Admin\IndexUsersRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Infrastructure\Persistence\Eloquent\Models\AdminEloquent;
use Illuminate\Http\JsonResponse;
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
    public function index(IndexUsersRequest $request): JsonResponse
    {
        $filters = FilterBuilder::buildWithMapping(
            $request->validated(),
            ['sort_field' => 'order_by', 'sort_order' => 'order_direction'],
            ['include_deleted' => false, 'order_by' => 'created_at', 'order_direction' => 'desc']
        );

        $perPage = (int) ($request->validated()['per_page'] ?? 15);
        $page = (int) $request->input('page', 1);

        $result = $this->userService->getPaginatedUsers($page, $perPage, $filters);

        $links = PaginationHelper::buildLinks($request, $result['current_page'], $result['last_page']);

        return ApiResponse::paginated(
            data: array_map(fn ($item) => $item->toArray(), $result['data']),
            meta: [
                'total' => $result['total'],
                'per_page' => $result['per_page'],
                'current_page' => $result['current_page'],
                'last_page' => $result['last_page'],
            ],
            links: $links
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
    public function store(CreateUserRequest $request): JsonResponse
    {
        try {
            $data = CreateUserData::from(array_merge(
                $request->validated(),
                ['status' => $request->validated()['status'] ?? 'active']
            ));

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
     * Permanently delete the specified user (hard delete).
     * This deletes all the user's leagues and associated data first,
     * then permanently deletes the user record.
     */
    public function hardDelete(int $user): JsonResponse
    {
        try {
            $this->userService->hardDeleteUser($user);

            return ApiResponse::success(null, 'User permanently deleted successfully');
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
            /** @var AdminEloquent|null $admin */
            $admin = Auth::guard('admin')->user();

            if (! $admin) {
                return ApiResponse::error('Unauthorized', null, 401);
            }

            // Check role authorization - only super_admin and admin can impersonate
            if (! in_array($admin->role, ['super_admin', 'admin'], true)) {
                return ApiResponse::error('Insufficient permissions to impersonate users', null, 403);
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
