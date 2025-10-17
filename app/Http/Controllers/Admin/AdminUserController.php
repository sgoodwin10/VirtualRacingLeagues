<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Application\Admin\DTOs\CreateAdminData;
use App\Application\Admin\DTOs\UpdateAdminData;
use App\Application\Admin\Services\AdminApplicationService;
use App\Domain\Admin\Exceptions\AdminNotFoundException;
use App\Domain\Admin\Exceptions\CannotDeleteSelfException;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CreateAdminUserRequest;
use App\Http\Requests\Admin\UpdateAdminUserRequest;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentAdminRepository;
use App\Models\Admin;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

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
    public function index(Request $request): JsonResponse
    {
        try {
            $currentAdmin = $this->adminService->getCurrentAuthenticatedAdmin();
        } catch (AdminNotFoundException $e) {
            return ApiResponse::unauthorized();
        }

        // Check authorization using policy
        Gate::forUser(Auth::guard('admin')->user())->authorize('viewAny', Admin::class);

        // Validate query parameters
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', Rule::in(['active', 'inactive', 'both'])],
            'sort_by' => ['nullable', 'string', Rule::in(['id', 'first_name', 'last_name', 'status', 'last_login_at'])],
            'sort_order' => ['nullable', 'string', Rule::in(['asc', 'desc'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        // Get paginated data with metadata from application service
        $result = $this->adminService->getPaginatedAdminsWithMetadata(
            $currentAdmin,
            array_merge($validated, ['page' => $request->input('page', 1)])
        );

        // Build pagination links
        $baseUrl = $request->url();
        $queryParams = $request->except('page');
        $lastPage = $result['meta']['last_page'];
        $currentPage = $result['meta']['current_page'];

        // Build pagination links
        $firstPage = $baseUrl . '?' . http_build_query(array_merge($queryParams, ['page' => 1]));
        $lastPageUrl = $baseUrl . '?' . http_build_query(array_merge($queryParams, ['page' => $lastPage]));
        $prevPage = $currentPage > 1
            ? $baseUrl . '?' . http_build_query(array_merge($queryParams, ['page' => $currentPage - 1]))
            : null;
        $nextPage = $currentPage < $lastPage
            ? $baseUrl . '?' . http_build_query(array_merge($queryParams, ['page' => $currentPage + 1]))
            : null;

        return ApiResponse::paginated(
            array_map(fn($item) => $item->toArray(), $result['data']),
            $result['meta'],
            [
                'first' => $firstPage,
                'last' => $lastPageUrl,
                'prev' => $prevPage,
                'next' => $nextPage,
            ]
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
        Gate::forUser(\Auth::guard('admin')->user())->authorize('delete', $eloquentAdmin);

        try {
            $this->adminService->deactivateAdmin($id, $currentAdmin);

            // Manual activity logging for the delete action
            $currentAdminEloquent = $this->adminRepository->getEloquentModelById($currentAdmin->id());
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
            $admin = $this->adminService->getAdminEntityById($adminData->id);
            $detailedData = $this->adminService->toDetailedAdminData($admin);

            return ApiResponse::success($detailedData->toArray(), 'Admin user restored successfully.');
        } catch (DomainException $e) {
            return ApiResponse::forbidden($e->getMessage());
        }
    }
}
