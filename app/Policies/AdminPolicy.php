<?php

declare(strict_types=1);

namespace App\Policies;

use App\Domain\Admin\Entities\Admin;
use App\Domain\Admin\Repositories\AdminRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\Models\AdminEloquent;
use Illuminate\Auth\Access\Response;

/**
 * AdminPolicy for authorization checks.
 * Works with domain entities, not Eloquent models.
 */
class AdminPolicy
{
    public function __construct(
        private readonly AdminRepositoryInterface $adminRepository
    ) {
    }

    /**
     * Convert AdminEloquent to Admin domain entity for policy checks.
     * Uses repository to ensure consistent mapping logic.
     */
    private function toEntity(AdminEloquent $eloquentAdmin): Admin
    {
        return $this->adminRepository->findById($eloquentAdmin->id);
    }

    /**
     * Determine whether the admin can view any admins.
     */
    public function viewAny(AdminEloquent $eloquentAdmin): Response
    {
        $admin = $this->toEntity($eloquentAdmin);

        // Moderators cannot view admin users (business rule in domain)
        if ($admin->isModerator()) {
            return Response::deny('Forbidden. Moderators do not have access to admin user management.');
        }

        return Response::allow();
    }

    /**
     * Determine whether the admin can view the model.
     */
    public function view(AdminEloquent $eloquentAdmin, AdminEloquent $eloquentTargetAdmin): Response
    {
        $admin = $this->toEntity($eloquentAdmin);
        $targetAdmin = $this->toEntity($eloquentTargetAdmin);

        // Moderators cannot view admin users
        if ($admin->isModerator()) {
            return Response::deny('Forbidden. Moderators do not have access to admin user management.');
        }

        // Use domain logic for permission check
        if (! $admin->canManage($targetAdmin)) {
            return Response::deny('Forbidden. You do not have permission to view this admin user.');
        }

        return Response::allow();
    }

    /**
     * Determine whether the admin can create models.
     */
    public function create(AdminEloquent $eloquentAdmin): Response
    {
        $admin = $this->toEntity($eloquentAdmin);

        // Moderators cannot create admin users
        if ($admin->isModerator()) {
            return Response::deny('Forbidden. Moderators do not have permission to create admin users.');
        }

        return Response::allow();
    }

    /**
     * Determine whether the admin can update the model.
     */
    public function update(AdminEloquent $eloquentAdmin, AdminEloquent $eloquentTargetAdmin): Response
    {
        $admin = $this->toEntity($eloquentAdmin);
        $targetAdmin = $this->toEntity($eloquentTargetAdmin);

        // Moderators cannot update admin users
        if ($admin->isModerator()) {
            return Response::deny('Forbidden. Moderators do not have access to admin user management.');
        }

        // Use domain logic for permission check
        if (! $admin->canManage($targetAdmin)) {
            return Response::deny('Forbidden. You do not have permission to update this admin user.');
        }

        return Response::allow();
    }

    /**
     * Determine whether the admin can delete the model.
     */
    public function delete(AdminEloquent $eloquentAdmin, AdminEloquent $eloquentTargetAdmin): Response
    {
        $admin = $this->toEntity($eloquentAdmin);
        $targetAdmin = $this->toEntity($eloquentTargetAdmin);

        // Moderators cannot delete admin users
        if ($admin->isModerator()) {
            return Response::deny('Forbidden. Moderators do not have access to admin user management.');
        }

        // Admins cannot delete themselves (business rule)
        // Note: This returns 403, but controller should catch this and return 422
        if ($admin->id() === $targetAdmin->id()) {
            return Response::deny('You cannot delete your own account.');
        }

        // Use domain logic for permission check
        if (! $admin->canManage($targetAdmin)) {
            return Response::deny('Forbidden. You do not have permission to delete this admin user.');
        }

        return Response::allow();
    }

    /**
     * Determine whether the admin can restore the model.
     */
    public function restore(AdminEloquent $eloquentAdmin, AdminEloquent $eloquentTargetAdmin): Response
    {
        $admin = $this->toEntity($eloquentAdmin);
        $targetAdmin = $this->toEntity($eloquentTargetAdmin);

        // Moderators cannot restore admin users
        if ($admin->isModerator()) {
            return Response::deny('Forbidden. Moderators do not have access to admin user management.');
        }

        // Use domain logic for permission check
        if (! $admin->canManage($targetAdmin)) {
            return Response::deny('Forbidden. You do not have permission to restore this admin user.');
        }

        return Response::allow();
    }

    /**
     * Determine whether the admin can permanently delete the model.
     */
    public function forceDelete(AdminEloquent $eloquentAdmin, AdminEloquent $eloquentTargetAdmin): Response
    {
        $admin = $this->toEntity($eloquentAdmin);
        $targetAdmin = $this->toEntity($eloquentTargetAdmin);

        // Admins cannot permanently delete themselves
        if ($admin->id() === $targetAdmin->id()) {
            return Response::deny('You cannot permanently delete your own account.');
        }

        // Use domain logic for permission check
        if (! $admin->canManage($targetAdmin)) {
            return Response::deny('Forbidden. You do not have permission to permanently delete this admin user.');
        }

        return Response::allow();
    }
}
