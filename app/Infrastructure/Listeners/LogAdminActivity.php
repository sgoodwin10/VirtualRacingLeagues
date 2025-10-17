<?php

declare(strict_types=1);

namespace App\Infrastructure\Listeners;

use App\Domain\Admin\Events\AdminActivated;
use App\Domain\Admin\Events\AdminAuthenticated;
use App\Domain\Admin\Events\AdminCreated;
use App\Domain\Admin\Events\AdminDeactivated;
use App\Domain\Admin\Events\AdminDeleted;
use App\Domain\Admin\Events\AdminPasswordChanged;
use App\Domain\Admin\Events\AdminProfileUpdated;
use App\Domain\Admin\Events\AdminRestored;
use App\Domain\Admin\Events\AdminRoleChanged;
use App\Models\Admin;

/**
 * Listener for logging admin domain events to activity log.
 * Note: Synchronous to ensure logs are immediately available.
 */
final class LogAdminActivity
{
    /**
     * Handle the event.
     *
     * @param object $event One of: AdminCreated, AdminAuthenticated, AdminPasswordChanged,
     *                     AdminProfileUpdated, AdminActivated, AdminDeactivated,
     *                     AdminDeleted, AdminRestored, or AdminRoleChanged
     */
    public function handle(object $event): void
    {
        match (true) {
            $event instanceof AdminCreated => $this->logAdminCreated($event),
            $event instanceof AdminAuthenticated => $this->logAdminAuthenticated($event),
            $event instanceof AdminPasswordChanged => $this->logAdminPasswordChanged($event),
            $event instanceof AdminProfileUpdated => $this->logAdminProfileUpdated($event),
            $event instanceof AdminActivated => $this->logAdminActivated($event),
            $event instanceof AdminDeactivated => $this->logAdminDeactivated($event),
            $event instanceof AdminDeleted => $this->logAdminDeleted($event),
            $event instanceof AdminRestored => $this->logAdminRestored($event),
            $event instanceof AdminRoleChanged => $this->logAdminRoleChanged($event),
            default => null,
        };
    }

    private function logAdminCreated(AdminCreated $event): void
    {
        activity('admin')
            ->causedBy($this->getCurrentAdmin())
            ->performedOn($this->getAdmin($event->admin->id()))
            ->withProperties([
                'created_by' => $this->getCurrentAdminName(),
                'admin_email' => $event->admin->email()->toString(),
                'first_name' => $event->admin->name()->firstName(),
                'last_name' => $event->admin->name()->lastName(),
                'role' => $event->admin->role()->value,
            ])
            ->log('Created admin user');
    }

    private function logAdminAuthenticated(AdminAuthenticated $event): void
    {
        activity('admin')
            ->performedOn($this->getAdmin($event->admin->id()))
            ->causedBy($this->getAdmin($event->admin->id()))
            ->log('Admin authenticated');
    }

    private function logAdminPasswordChanged(AdminPasswordChanged $event): void
    {
        activity('admin')
            ->performedOn($this->getAdmin($event->admin->id()))
            ->causedBy($this->getAdmin($event->admin->id()))
            ->log('Admin password changed');
    }

    private function logAdminActivated(AdminActivated $event): void
    {
        activity('admin')
            ->performedOn($this->getAdmin($event->admin->id()))
            ->log('Admin account activated');
    }

    private function logAdminDeactivated(AdminDeactivated $event): void
    {
        activity('admin')
            ->performedOn($this->getAdmin($event->admin->id()))
            ->log('Admin account deactivated');
    }

    private function logAdminDeleted(AdminDeleted $event): void
    {
        activity('admin')
            ->causedBy($this->getCurrentAdmin())
            ->performedOn($this->getAdminWithTrashed($event->admin->id()))
            ->withProperties([
                'deleted_by' => $this->getCurrentAdminName(),
                'admin_email' => $event->admin->email()->toString(),
                'admin_role' => $event->admin->role()->value,
            ])
            ->log('Deleted admin user');
    }

    private function logAdminRestored(AdminRestored $event): void
    {
        activity('admin')
            ->performedOn($this->getAdmin($event->admin->id()))
            ->log('Admin account restored');
    }

    private function logAdminProfileUpdated(AdminProfileUpdated $event): void
    {
        // Extract original and new values from changed attributes
        $updatedFields = array_keys($event->changedAttributes);
        $originalValues = [];
        $newValues = [];

        foreach ($event->changedAttributes as $field => $change) {
            $originalValues[$field] = $change['old'];
            $newValues[$field] = $change['new'];
        }

        activity('admin')
            ->causedBy($this->getCurrentAdmin())
            ->performedOn($this->getAdmin($event->admin->id()))
            ->withProperties([
                'updated_by' => $this->getCurrentAdminName(),
                'updated_fields' => $updatedFields,
                'original_values' => $originalValues,
                'new_values' => $newValues,
            ])
            ->log('Updated admin user');
    }

    private function logAdminRoleChanged(AdminRoleChanged $event): void
    {
        activity('admin')
            ->causedBy($this->getCurrentAdmin())
            ->performedOn($this->getAdmin($event->admin->id()))
            ->withProperties([
                'updated_by' => $this->getCurrentAdminName(),
                'old_role' => $event->oldRole->value,
                'new_role' => $event->newRole->value,
            ])
            ->log('Admin role changed');
    }

    /**
     * Get admin model for activity log.
     */
    private function getAdmin(int $adminId): ?\Illuminate\Database\Eloquent\Model
    {
        if ($adminId === 0) {
            return null;
        }

        return Admin::find($adminId);
    }

    /**
     * Get admin model for activity log (including soft-deleted).
     */
    private function getAdminWithTrashed(int $adminId): ?\Illuminate\Database\Eloquent\Model
    {
        if ($adminId === 0) {
            return null;
        }

        return Admin::withTrashed()->find($adminId);
    }

    /**
     * Get current authenticated admin.
     */
    private function getCurrentAdmin(): ?\Illuminate\Database\Eloquent\Model
    {
        return auth('admin')->user();
    }

    /**
     * Get current authenticated admin's full name.
     */
    private function getCurrentAdminName(): string
    {
        $admin = auth('admin')->user();
        return $admin ? "{$admin->first_name} {$admin->last_name}" : 'System';
    }
}
