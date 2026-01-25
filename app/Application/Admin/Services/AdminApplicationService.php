<?php

declare(strict_types=1);

namespace App\Application\Admin\Services;

use App\Application\Admin\DTOs\AdminData;
use App\Application\Admin\DTOs\CreateAdminData;
use App\Application\Admin\DTOs\DetailedAdminData;
use App\Application\Admin\DTOs\UpdateAdminData;
use App\Domain\Admin\Entities\Admin;
use App\Domain\Admin\Exceptions\AdminNotFoundException;
use App\Domain\Admin\Exceptions\CannotDeleteSelfException;
use App\Domain\Admin\Repositories\AdminRepositoryInterface;
use App\Domain\Admin\ValueObjects\AdminRole;
use App\Domain\Admin\ValueObjects\AdminStatus;
use App\Domain\Shared\ValueObjects\EmailAddress;
use App\Domain\Shared\ValueObjects\FullName;
use App\Infrastructure\Persistence\Eloquent\Models\AdminEloquent;
use App\Infrastructure\Persistence\Eloquent\Repositories\AdminReadModelService;
use DomainException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Spatie\LaravelData\Optional;

/**
 * Admin Application Service.
 * Orchestrates admin use cases and coordinates domain logic.
 */
final class AdminApplicationService
{
    public function __construct(
        private readonly AdminRepositoryInterface $adminRepository,
        private readonly AdminReadModelService $readModelService,
    ) {
    }

    /**
     * Create a new admin.
     *
     * @param  Admin|null  $performedBy  Admin performing the action (for permission checks)
     *
     * @throws DomainException
     */
    public function createAdmin(CreateAdminData $data, ?Admin $performedBy = null): AdminData
    {
        return DB::transaction(function () use ($data, $performedBy) {
            // Check if email already exists (inside transaction to prevent race conditions)
            $email = EmailAddress::from($data->email);
            if ($this->adminRepository->emailExists($email)) {
                throw new DomainException("Admin with email '{$data->email}' already exists");
            }

            // Create domain entity
            $role = AdminRole::from($data->role);

            // Permission check: only super_admins can create other super_admins
            if ($performedBy && $role->isSuperAdmin() && ! $performedBy->isSuperAdmin()) {
                throw new DomainException('Only super admins can create super admin accounts');
            }

            // Permission check: admins can only create roles below their level
            if ($performedBy && ! $performedBy->canAssignRole($role)) {
                throw new DomainException('Forbidden. You do not have permission to assign this role.');
            }

            // Generate random password if not provided (user will reset via email)
            $password = $data->password ?? \Illuminate\Support\Str::random(32);

            $admin = Admin::create(
                name: FullName::from($data->first_name, $data->last_name),
                email: EmailAddress::from($data->email),
                hashedPassword: Hash::make($password),
                role: $role,
            );

            // Persist
            $this->adminRepository->save($admin);

            // Dispatch domain events
            $this->dispatchEvents($admin);

            return AdminData::fromEntity($admin);
        });
    }

    /**
     * Update an existing admin.
     *
     * @param  Admin|null  $performedBy  Admin performing the action (for permission checks)
     */
    public function updateAdmin(int $adminId, UpdateAdminData $data, ?Admin $performedBy = null): AdminData
    {
        return DB::transaction(function () use ($adminId, $data, $performedBy) {
            $admin = $this->adminRepository->findById($adminId);

            // Permission check: can the performer manage this admin?
            $this->ensureCanManage($admin, $performedBy);

            // Check email uniqueness if being changed
            if (! $data->email instanceof Optional && $data->email !== (string) $admin->email()) {
                $newEmail = EmailAddress::from($data->email);
                if ($this->adminRepository->emailExists($newEmail, $adminId)) {
                    throw new DomainException("Email '{$data->email}' is already in use");
                }
            }

            // Update profile
            $hasProfileUpdate = ! $data->first_name instanceof Optional
                || ! $data->last_name instanceof Optional
                || ! $data->email instanceof Optional;

            if ($hasProfileUpdate) {
                $firstName = ! $data->first_name instanceof Optional
                    ? $data->first_name
                    : $admin->name()->firstName();

                $lastName = ! $data->last_name instanceof Optional
                    ? $data->last_name
                    : $admin->name()->lastName();

                $email = ! $data->email instanceof Optional
                    ? EmailAddress::from($data->email)
                    : $admin->email();

                $admin->updateProfile(
                    name: FullName::from($firstName, $lastName),
                    email: $email,
                );
            }

            // Update password
            if (! $data->password instanceof Optional) {
                $admin->changePassword(Hash::make($data->password));
            }

            // Update role
            if (! $data->role instanceof Optional && $data->role !== $admin->role()->value) {
                $newRole = AdminRole::from($data->role);
                if ($performedBy) {
                    $admin->changeRole($newRole, $performedBy);
                } else {
                    // If no performer, allow role change (system operation)
                    throw new DomainException('Role changes require an authorized admin');
                }
            }

            // Update status
            if (! $data->status instanceof Optional && $data->status !== $admin->status()->value) {
                $newStatus = AdminStatus::from($data->status);
                if ($newStatus->isActive()) {
                    $admin->activate();
                } else {
                    $admin->deactivate();
                }
            }

            // Persist
            $this->adminRepository->save($admin);

            // Dispatch domain events
            $this->dispatchEvents($admin);

            return AdminData::fromEntity($admin);
        });
    }

    /**
     * Get an admin entity by ID (returns domain entity).
     *
     * @throws AdminNotFoundException
     */
    public function getAdminEntityById(int $adminId): Admin
    {
        return $this->adminRepository->findById($adminId);
    }

    /**
     * Get an admin by ID (returns DTO).
     *
     * @throws AdminNotFoundException
     */
    public function getAdminById(int $adminId): AdminData
    {
        $admin = $this->adminRepository->findById($adminId);

        return AdminData::fromEntity($admin);
    }

    /**
     * Get an admin by email.
     *
     * @throws AdminNotFoundException
     */
    public function getAdminByEmail(string $email): AdminData
    {
        $admin = $this->adminRepository->findByEmail(EmailAddress::from($email));

        if (! $admin) {
            throw AdminNotFoundException::withEmail($email);
        }

        return AdminData::fromEntity($admin);
    }

    /**
     * Get paginated admins with optional filters.
     *
     * @param  array<string, mixed>  $filters
     * @return array{data: array<int, AdminData>, total: int, per_page: int, current_page: int}
     */
    public function getPaginatedAdmins(int $page = 1, int $perPage = 15, array $filters = []): array
    {
        $result = $this->adminRepository->getPaginated($page, $perPage, $filters);

        return [
            'data' => array_map(
                fn (Admin $admin) => AdminData::fromEntity($admin),
                $result['data']
            ),
            'total' => $result['total'],
            'per_page' => $result['per_page'],
            'current_page' => $result['current_page'],
        ];
    }

    /**
     * Get paginated admins with metadata for API responses.
     * Includes DetailedAdminData with last_login_at and pagination metadata.
     *
     * @param  array<string, mixed>  $queryParams
     * @return array{data: array<int, DetailedAdminData>, meta: array<string, mixed>}
     */
    public function getPaginatedAdminsWithMetadata(Admin $currentAdmin, array $queryParams): array
    {
        // Extract and validate parameters
        $search = $queryParams['search'] ?? null;
        $status = $queryParams['status'] ?? 'both';
        $sortBy = $queryParams['sort_by'] ?? 'id';
        $sortOrder = $queryParams['sort_order'] ?? 'asc';
        $perPage = (int) ($queryParams['per_page'] ?? 15);
        $page = (int) ($queryParams['page'] ?? 1);

        // Build filters for the repository
        $filters = [
            'order_by' => $sortBy,
            'order_direction' => $sortOrder,
        ];

        // Apply search filter
        if ($search !== null && $search !== '') {
            $filters['search'] = $search;
        }

        // Apply status filter
        if ($status !== 'both') {
            $filters['status'] = $status;
        }

        // Apply role-based filtering
        // Admins can only see admin and moderator users, not super_admins
        if ($currentAdmin->isAdmin()) {
            $filters['exclude_roles'] = ['super_admin'];
        }

        // Get paginated admins from domain layer
        $result = $this->getPaginatedAdmins($page, $perPage, $filters);

        // Fetch infrastructure fields (last_login_at) using read model service
        $adminIds = array_map(fn ($adminData) => $adminData->id, $result['data']);
        /** @var array<int> $cleanAdminIds */
        $cleanAdminIds = array_filter($adminIds, fn ($id) => $id !== null);
        /** @var array<int, string|null> $lastLoginTimestamps */
        $lastLoginTimestamps = $this->readModelService->getLastLoginTimestamps(array_values($cleanAdminIds));

        // Convert AdminData to DetailedAdminData with last_login_at
        $data = [];
        foreach ($result['data'] as $adminData) {
            $lastLoginAt = $lastLoginTimestamps[$adminData->id] ?? null;

            // Convert AdminData to DetailedAdminData (add role/permission fields)
            $data[] = new DetailedAdminData(
                id: $adminData->id,
                first_name: $adminData->first_name,
                last_name: $adminData->last_name,
                name: $adminData->name,
                email: $adminData->email,
                role: $adminData->role,
                status: $adminData->status,
                is_active: $adminData->is_active,
                is_deleted: $adminData->is_deleted,
                is_super_admin: $adminData->role === 'super_admin',
                is_admin: $adminData->role === 'admin',
                is_moderator: $adminData->role === 'moderator',
                role_hierarchy_level: match ($adminData->role) {
                    'super_admin' => 3,
                    'admin' => 2,
                    'moderator' => 1,
                    default => throw new DomainException("Invalid admin role: {$adminData->role}")
                },
                last_login_at: $lastLoginAt,
                created_at: $adminData->created_at,
                updated_at: $adminData->updated_at,
                deleted_at: $adminData->deleted_at,
            );
        }

        // Calculate pagination metadata
        $total = $result['total'];
        $currentPage = $result['current_page'];
        $lastPage = (int) ceil($total / $perPage);
        $from = ($currentPage - 1) * $perPage + 1;
        $to = min($currentPage * $perPage, $total);

        return [
            'data' => $data,
            'meta' => [
                'current_page' => $currentPage,
                'from' => $from > $total ? null : $from,
                'last_page' => $lastPage,
                'per_page' => $perPage,
                'to' => $to > $total ? null : $to,
                'total' => $total,
            ],
        ];
    }

    /**
     * Activate an admin.
     *
     * @param  Admin|null  $performedBy  Admin performing the action
     */
    public function activateAdmin(int $adminId, ?Admin $performedBy = null): AdminData
    {
        return DB::transaction(function () use ($adminId, $performedBy) {
            $admin = $this->adminRepository->findById($adminId);

            // Permission check
            $this->ensureCanManage($admin, $performedBy);

            $admin->activate();

            $this->adminRepository->save($admin);
            $this->dispatchEvents($admin);

            return AdminData::fromEntity($admin);
        });
    }

    /**
     * Deactivate an admin.
     *
     * @param  Admin|null  $performedBy  Admin performing the action
     */
    public function deactivateAdmin(int $adminId, ?Admin $performedBy = null): AdminData
    {
        return DB::transaction(function () use ($adminId, $performedBy) {
            $admin = $this->adminRepository->findById($adminId);

            // Permission check
            $this->ensureCanManage($admin, $performedBy);

            $admin->deactivate();

            $this->adminRepository->save($admin);
            $this->dispatchEvents($admin);

            return AdminData::fromEntity($admin);
        });
    }

    /**
     * Delete an admin (soft delete).
     *
     * @param  Admin|null  $performedBy  Admin performing the action
     */
    public function deleteAdmin(int $adminId, ?Admin $performedBy = null): void
    {
        DB::transaction(function () use ($adminId, $performedBy) {
            $admin = $this->adminRepository->findById($adminId);

            // Business rule: cannot delete yourself
            if ($performedBy && $performedBy->id() === $admin->id()) {
                throw new CannotDeleteSelfException();
            }

            // Permission check
            $this->ensureCanManage($admin, $performedBy);

            $admin->delete();

            $this->adminRepository->save($admin);
            $this->dispatchEvents($admin);
        });
    }

    /**
     * Restore a soft-deleted admin.
     *
     * @param  Admin|null  $performedBy  Admin performing the action
     */
    public function restoreAdmin(int $adminId, ?Admin $performedBy = null): AdminData
    {
        return DB::transaction(function () use ($adminId, $performedBy) {
            $admin = $this->adminRepository->findById($adminId);

            // Permission check
            $this->ensureCanManage($admin, $performedBy);

            $admin->restore();

            $this->adminRepository->save($admin);
            $this->dispatchEvents($admin);

            return AdminData::fromEntity($admin);
        });
    }

    /**
     * Change an admin's role.
     *
     * @param  Admin  $performedBy  Admin performing the action (required)
     */
    public function changeAdminRole(int $adminId, string $newRole, Admin $performedBy): AdminData
    {
        return DB::transaction(function () use ($adminId, $newRole, $performedBy) {
            $admin = $this->adminRepository->findById($adminId);

            $role = AdminRole::from($newRole);
            $admin->changeRole($role, $performedBy);

            $this->adminRepository->save($admin);
            $this->dispatchEvents($admin);

            return AdminData::fromEntity($admin);
        });
    }

    /**
     * Get currently authenticated admin from Laravel's Auth.
     * Converts Eloquent model to domain entity.
     *
     * @throws AdminNotFoundException if no admin is authenticated
     */
    public function getCurrentAuthenticatedAdmin(): Admin
    {
        /** @var AdminEloquent|null $eloquentAdmin */
        $eloquentAdmin = \Illuminate\Support\Facades\Auth::guard('admin')->user();

        if (! $eloquentAdmin) {
            throw new AdminNotFoundException('No authenticated admin');
        }

        return $this->adminRepository->findById($eloquentAdmin->id);
    }

    /**
     * Convert domain Admin to AdminData with infrastructure fields.
     * Fetches last_login_at using read model service.
     */
    public function toAdminData(Admin $admin): AdminData
    {
        $adminId = $admin->id();
        if ($adminId === null) {
            return AdminData::fromEntity($admin);
        }

        $lastLoginAt = $this->readModelService->getLastLoginTimestamp($adminId);

        return AdminData::fromEntity($admin, $lastLoginAt);
    }

    /**
     * Convert domain Admin to DetailedAdminData with infrastructure fields.
     * Fetches last_login_at using read model service.
     */
    public function toDetailedAdminData(Admin $admin): DetailedAdminData
    {
        $adminId = $admin->id();
        if ($adminId === null) {
            return DetailedAdminData::fromEntity($admin);
        }

        $lastLoginAt = $this->readModelService->getLastLoginTimestamp($adminId);

        return DetailedAdminData::fromEntity($admin, $lastLoginAt);
    }

    /**
     * Ensure the performer has permission to manage the target admin.
     *
     * @throws DomainException if performer lacks permission
     */
    private function ensureCanManage(Admin $admin, ?Admin $performedBy): void
    {
        if ($performedBy && ! $performedBy->canManage($admin)) {
            throw new DomainException('Insufficient permissions to manage this admin');
        }
    }

    /**
     * Dispatch domain events.
     */
    private function dispatchEvents(Admin $admin): void
    {
        $events = $admin->releaseEvents();

        foreach ($events as $event) {
            Event::dispatch($event);
        }
    }
}
