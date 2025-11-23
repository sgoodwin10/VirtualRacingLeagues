<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Application\Admin\DTOs\CreateAdminData;
use App\Application\Admin\DTOs\UpdateAdminData;
use App\Application\Admin\Services\AdminApplicationService;
use App\Domain\Admin\Exceptions\AdminNotFoundException;
use App\Domain\Admin\Exceptions\CannotDeleteSelfException;
use App\Helpers\ApiResponse;
use App\Helpers\PaginationHelper;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CreateAdminUserRequest;
use App\Http\Requests\Admin\IndexAdminUsersRequest;
use App\Http\Requests\Admin\UpdateAdminUserRequest;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentAdminRepository;
use App\Models\Admin;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;

class AdminUserController extends Controller
{
    public function __construct(
        private readonly AdminApplicationService $adminService,
        private readonly EloquentAdminRepository $adminRepository
    ) {
    }

    /**
     * Display a listing of admin users.
     *
     * Query parameters:
     * - search: search by ID, first name, last name, email
     * - status: filter by active/inactive/both (default: both)
     * - sort_by: column to sort by (id, first_name, last_name, status, last_login_at)
     * - sort_order: asc/desc
     * - per_page: pagination (default: 15)
     */
    public function index(IndexAdminUsersRequest $request): JsonResponse
    {
        try {
            $currentAdmin = $this->adminService->getCurrentAuthenticatedAdmin();
        } catch (AdminNotFoundException $e) {
            return ApiResponse::unauthorized();
        }

        Gate::forUser(Auth::guard('admin')->user())->authorize('viewAny', Admin::class);

        $result = $this->adminService->getPaginatedAdminsWithMetadata(
            $currentAdmin,
            array_merge($request->validated(), ['page' => $request->input('page', 1)])
        );

        $links = PaginationHelper::buildLinks(
            $request,
            $result['meta']['current_page'],
            $result['meta']['last_page']
        );

        return ApiResponse::paginated(
            array_map(fn($item) => $item->toArray(), $result['data']),
            $result['meta'],
            $links
        );
    }

    /**
     * Store a newly created admin user.
     */
    public function store(CreateAdminUserRequest $request): JsonResponse
    {
        try {
            $currentAdmin = $this->adminService->getCurrentAuthenticatedAdmin();
        } catch (AdminNotFoundException $e) {
            return ApiResponse::unauthorized();
        }

        // Check authorization using policy
        Gate::forUser(Auth::guard('admin')->user())->authorize('create', Admin::class);

        // Convert validated request to CreateAdminData
        $data = CreateAdminData::from($request->validated());

        try {
            $adminData = $this->adminService->createAdmin($data, $currentAdmin);
            // After creation, ID is guaranteed to be set
            assert($adminData->id !== null, 'Admin ID must be set after creation');
            $admin = $this->adminService->getAdminEntityById($adminData->id);
            $detailedData = $this->adminService->toDetailedAdminData($admin);

            return ApiResponse::created($detailedData->toArray(), 'Admin user created successfully.');
        } catch (DomainException $e) {
            // Handle domain exceptions (email exists, permission issues, etc.)
            if (str_contains($e->getMessage(), 'already exists')) {
                return ApiResponse::validationError(['email' => [$e->getMessage()]]);
            }
            if (str_contains($e->getMessage(), 'super admin')) {
                return ApiResponse::error(
                    'Forbidden. You do not have permission to create users with this role.',
                    ['role' => ['You cannot create a user with a role higher than or equal to your own role.']],
                    403
                );
            }
            return ApiResponse::forbidden($e->getMessage());
        }
    }

    /**
     * Display the specified admin user.
     */
    public function show(int $id): JsonResponse
    {
        try {
            $currentAdmin = $this->adminService->getCurrentAuthenticatedAdmin();
        } catch (AdminNotFoundException $e) {
            return ApiResponse::unauthorized();
        }

        try {
            $admin = $this->adminService->getAdminEntityById($id);
        } catch (AdminNotFoundException $e) {
            return ApiResponse::notFound('Admin user not found.');
        }

        // Check authorization using policy (use repository to get Eloquent model)
        $eloquentAdmin = $this->adminRepository->getEloquentModelById($id);
        Gate::forUser(\Auth::guard('admin')->user())->authorize('view', $eloquentAdmin);

        $detailedData = $this->adminService->toDetailedAdminData($admin);
        return ApiResponse::success($detailedData->toArray());
    }

    /**
     * Update the specified admin user.
     */
    public function update(UpdateAdminUserRequest $request, int $id): JsonResponse
    {
        try {
            $currentAdmin = $this->adminService->getCurrentAuthenticatedAdmin();
        } catch (AdminNotFoundException $e) {
            return ApiResponse::unauthorized();
        }

        try {
            $admin = $this->adminService->getAdminEntityById($id);
        } catch (AdminNotFoundException $e) {
            return ApiResponse::notFound('Admin user not found.');
        }

        // Check authorization using policy (use repository to get Eloquent model)
        $eloquentAdmin = $this->adminRepository->getEloquentModelById($id);
        Gate::forUser(\Auth::guard('admin')->user())->authorize('update', $eloquentAdmin);

        // Convert validated request to UpdateAdminData
        $updateData = UpdateAdminData::from($request->validated());

        try {
            $adminData = $this->adminService->updateAdmin($id, $updateData, $currentAdmin);
            // After update, ID is guaranteed to be set
            assert($adminData->id !== null, 'Admin ID must be set after update');
            $admin = $this->adminService->getAdminEntityById($adminData->id);
            $detailedData = $this->adminService->toDetailedAdminData($admin);

            return ApiResponse::success($detailedData->toArray(), 'Admin user updated successfully.');
        } catch (DomainException $e) {
            if (str_contains($e->getMessage(), 'already in use')) {
                return ApiResponse::validationError(['email' => [$e->getMessage()]]);
            }
            return ApiResponse::forbidden($e->getMessage());
        }
    }

    /**
     * Deactivate the specified admin user.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $currentAdmin = $this->adminService->getCurrentAuthenticatedAdmin();
        } catch (AdminNotFoundException $e) {
            return ApiResponse::unauthorized();
        }

        try {
            $admin = $this->adminService->getAdminEntityById($id);
        } catch (AdminNotFoundException $e) {
            return ApiResponse::notFound('Admin user not found.');
        }

        // Check for self-deletion first (return 422 as per test expectations)
        if ($currentAdmin->id() === $admin->id()) {
            return ApiResponse::error('You cannot delete your own account.', null, 422);
        }

        // Check authorization using policy (use repository to get Eloquent model)
        $eloquentAdmin = $this->adminRepository->getEloquentModelById($id);
        if ($eloquentAdmin === null) {
            return ApiResponse::notFound('Admin user not found.');
        }
        Gate::forUser(\Auth::guard('admin')->user())->authorize('delete', $eloquentAdmin);

        try {
            $this->adminService->deactivateAdmin($id, $currentAdmin);

            // Manual activity logging for the delete action
            $currentAdminId = $currentAdmin->id();
            assert($currentAdminId !== null, 'Current admin ID must be set');
            $currentAdminEloquent = $this->adminRepository->getEloquentModelById($currentAdminId);
            if ($currentAdminEloquent === null) {
                return ApiResponse::unauthorized();
            }

            activity('admin')
                ->causedBy($currentAdminEloquent)
                ->performedOn($eloquentAdmin)
                ->withProperties([
                    'admin_email' => $admin->email()->value(),
                    'admin_role' => $admin->role()->value,
                    'deleted_by' => $currentAdmin->name()->full(),
                ])
                ->log('Deleted admin user');

            return ApiResponse::success(null, 'Admin user deleted successfully.');
        } catch (DomainException $e) {
            return ApiResponse::forbidden($e->getMessage());
        }
    }

    /**
     * Restore a deactivated admin user (mark as active).
     */
    public function restore(int $id): JsonResponse
    {
        try {
            $currentAdmin = $this->adminService->getCurrentAuthenticatedAdmin();
        } catch (AdminNotFoundException $e) {
            return ApiResponse::unauthorized();
        }

        try {
            $admin = $this->adminService->getAdminEntityById($id);
        } catch (AdminNotFoundException $e) {
            return ApiResponse::notFound('Admin user not found.');
        }

        // Check authorization using policy (use repository to get Eloquent model)
        $eloquentAdmin = $this->adminRepository->getEloquentModelById($id);
        Gate::forUser(\Auth::guard('admin')->user())->authorize('restore', $eloquentAdmin);

        // Check if admin is already active
        if ($admin->isActive()) {
            return ApiResponse::error('Admin user is already active.', null, 400);
        }

        try {
            $adminData = $this->adminService->activateAdmin($id, $currentAdmin);
            // After activation, ID is guaranteed to be set
            assert($adminData->id !== null, 'Admin ID must be set after activation');
            $admin = $this->adminService->getAdminEntityById($adminData->id);
            $detailedData = $this->adminService->toDetailedAdminData($admin);

            return ApiResponse::success($detailedData->toArray(), 'Admin user restored successfully.');
        } catch (DomainException $e) {
            return ApiResponse::forbidden($e->getMessage());
        }
    }
}
