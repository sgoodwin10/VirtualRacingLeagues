<?php

declare(strict_types=1);

namespace App\Domain\Admin\Entities;

use App\Domain\Shared\ValueObjects\EmailAddress;
use App\Domain\Shared\ValueObjects\FullName;
use App\Domain\Admin\ValueObjects\AdminRole;
use App\Domain\Admin\ValueObjects\AdminStatus;
use App\Domain\Admin\Events\AdminCreated;
use App\Domain\Admin\Events\AdminPasswordChanged;
use App\Domain\Admin\Events\AdminProfileUpdated;
use App\Domain\Admin\Events\AdminActivated;
use App\Domain\Admin\Events\AdminDeactivated;
use App\Domain\Admin\Events\AdminDeleted;
use App\Domain\Admin\Events\AdminRestored;
use App\Domain\Admin\Events\AdminRoleChanged;
use App\Domain\Admin\Exceptions\AdminAlreadyDeletedException;
use App\Domain\Admin\Exceptions\InsufficientPermissionsException;
use DateTimeImmutable;
use InvalidArgumentException;

final class Admin
{
    /** @var array<object> */
    private array $domainEvents = [];
    private ?DateTimeImmutable $deletedAt = null;

    private function __construct(
        private ?int $id,
        private FullName $name,
        private EmailAddress $email,
        private string $hashedPassword,
        private AdminRole $role,
        private AdminStatus $status,
        private readonly DateTimeImmutable $createdAt,
        private DateTimeImmutable $updatedAt,
    ) {
    }

    /**
     * Create a new admin (aggregate root factory method)
     */
    public static function create(
        FullName $name,
        EmailAddress $email,
        string $hashedPassword,
        AdminRole $role,
    ): self {
        $admin = new self(
            id: null,
            name: $name,
            email: $email,
            hashedPassword: $hashedPassword,
            role: $role,
            status: AdminStatus::ACTIVE,
            createdAt: new DateTimeImmutable(),
            updatedAt: new DateTimeImmutable(),
        );

        $admin->recordDomainEvent(new AdminCreated($admin));

        return $admin;
    }

    /**
     * Set the ID after persistence (repository use only).
     * This is called after the entity is saved to the database.
     */
    public function setId(int $id): void
    {
        if ($this->id !== null) {
            throw new \RuntimeException('Cannot change ID of an existing admin');
        }

        $this->id = $id;
    }

    /**
     * Reconstruct from persistence (repository use only)
     */
    public static function reconstitute(
        int $id,
        FullName $name,
        EmailAddress $email,
        string $hashedPassword,
        AdminRole $role,
        AdminStatus $status,
        DateTimeImmutable $createdAt,
        DateTimeImmutable $updatedAt,
        ?DateTimeImmutable $deletedAt = null,
    ): self {
        $admin = new self($id, $name, $email, $hashedPassword, $role, $status, $createdAt, $updatedAt);
        $admin->deletedAt = $deletedAt;

        return $admin;
    }

    // Business logic methods

    /**
     * Change the admin's password.
     *
     * @param string $newHashedPassword The new hashed password
     * @throws AdminAlreadyDeletedException if admin is deleted
     */
    public function changePassword(string $newHashedPassword): void
    {
        if ($this->isDeleted()) {
            throw new AdminAlreadyDeletedException('Cannot change password for deleted admin');
        }

        $this->hashedPassword = $newHashedPassword;
        $this->updatedAt = new DateTimeImmutable();
        $this->recordDomainEvent(new AdminPasswordChanged($this));
    }

    /**
     * Change the admin's role.
     *
     * Business rules:
     * - Only super admins can change roles of other super admins
     * - Admins can only assign roles below their own level
     *
     * @param AdminRole $newRole The new role to assign
     * @param Admin $performedBy The admin performing the role change
     * @throws AdminAlreadyDeletedException if admin is deleted
     * @throws InsufficientPermissionsException if performer lacks permission
     */
    public function changeRole(AdminRole $newRole, Admin $performedBy): void
    {
        if ($this->isDeleted()) {
            throw new AdminAlreadyDeletedException('Cannot change role for deleted admin');
        }

        // Business rule: Only super_admins can change roles of other super_admins
        if ($this->role->isSuperAdmin() && !$performedBy->role->isSuperAdmin()) {
            throw new InsufficientPermissionsException('Only super admins can modify super admin roles');
        }

        // Business rule: Admins can only assign roles below their own level
        if (!$performedBy->canAssignRole($newRole)) {
            throw new InsufficientPermissionsException('Forbidden. You do not have permission to assign this role.');
        }

        $oldRole = $this->role;
        $this->role = $newRole;
        $this->updatedAt = new DateTimeImmutable();
        $this->recordDomainEvent(new AdminRoleChanged($this, $oldRole, $newRole));
    }

    /**
     * Activate the admin account.
     *
     * @throws AdminAlreadyDeletedException if admin is deleted
     */
    public function activate(): void
    {
        if ($this->isDeleted()) {
            throw new AdminAlreadyDeletedException('Cannot activate deleted admin');
        }

        if ($this->status->isActive()) {
            return; // Already active, no-op
        }

        $this->status = AdminStatus::ACTIVE;
        $this->updatedAt = new DateTimeImmutable();
        $this->recordDomainEvent(new AdminActivated($this));
    }

    /**
     * Deactivate the admin account.
     *
     * @throws AdminAlreadyDeletedException if admin is deleted
     */
    public function deactivate(): void
    {
        if ($this->isDeleted()) {
            throw new AdminAlreadyDeletedException('Cannot deactivate deleted admin');
        }

        if ($this->status->isInactive()) {
            return; // Already inactive, no-op
        }

        $this->status = AdminStatus::INACTIVE;
        $this->updatedAt = new DateTimeImmutable();
        $this->recordDomainEvent(new AdminDeactivated($this));
    }

    /**
     * Soft delete the admin account.
     *
     * @throws AdminAlreadyDeletedException if admin is already deleted
     */
    public function delete(): void
    {
        if ($this->isDeleted()) {
            throw new AdminAlreadyDeletedException('Admin already deleted');
        }

        $this->status = AdminStatus::INACTIVE;
        $this->deletedAt = new DateTimeImmutable();
        $this->updatedAt = new DateTimeImmutable();
        $this->recordDomainEvent(new AdminDeleted($this));
    }

    /**
     * Restore a soft-deleted admin account.
     *
     * @throws InvalidArgumentException if admin is not deleted
     */
    public function restore(): void
    {
        if (!$this->isDeleted()) {
            throw new InvalidArgumentException('Admin is not deleted');
        }

        $this->deletedAt = null;
        $this->status = AdminStatus::ACTIVE;
        $this->updatedAt = new DateTimeImmutable();
        $this->recordDomainEvent(new AdminRestored($this));
    }

    /**
     * Update the admin's profile information.
     *
     * @param FullName $name The new full name
     * @param EmailAddress $email The new email address
     * @throws AdminAlreadyDeletedException if admin is deleted
     */
    public function updateProfile(FullName $name, EmailAddress $email): void
    {
        if ($this->isDeleted()) {
            throw new AdminAlreadyDeletedException('Cannot update deleted admin');
        }

        // Track changes for event
        $changedAttributes = [];

        if ($this->name->firstName() !== $name->firstName()) {
            $changedAttributes['first_name'] = [
                'old' => $this->name->firstName(),
                'new' => $name->firstName(),
            ];
        }

        if ($this->name->lastName() !== $name->lastName()) {
            $changedAttributes['last_name'] = [
                'old' => $this->name->lastName(),
                'new' => $name->lastName(),
            ];
        }

        if ((string) $this->email !== (string) $email) {
            $changedAttributes['email'] = [
                'old' => (string) $this->email,
                'new' => (string) $email,
            ];
        }

        $this->name = $name;
        $this->email = $email;
        $this->updatedAt = new DateTimeImmutable();

        // Only dispatch event if something actually changed
        if (!empty($changedAttributes)) {
            $this->recordDomainEvent(new AdminProfileUpdated($this, $changedAttributes));
        }
    }

    // Authorization methods (business rules)

    /**
     * Check if this admin can manage another admin.
     *
     * Business rules:
     * - Super admins can manage anyone
     * - Admins can manage other admins and moderators
     * - Moderators cannot manage anyone
     *
     * @param Admin $targetAdmin The admin to check management permission for
     * @return bool True if this admin can manage the target admin
     */
    public function canManage(Admin $targetAdmin): bool
    {
        // Super admins can manage anyone
        if ($this->role->isSuperAdmin()) {
            return true;
        }

        // Cannot manage super admins unless you are one
        if ($targetAdmin->role->isSuperAdmin()) {
            return false;
        }

        // Admins can manage other admins and moderators
        if ($this->role->isAdmin() && ($targetAdmin->role->isAdmin() || $targetAdmin->role->isModerator())) {
            return true;
        }

        return false;
    }

    /**
     * Check if this admin can assign a specific role.
     *
     * Business rules:
     * - Super admins can assign any role
     * - Admins can assign admin or moderator roles (not super admin)
     * - Moderators cannot assign roles
     *
     * @param AdminRole $role The role to check assignment permission for
     * @return bool True if this admin can assign the role
     */
    public function canAssignRole(AdminRole $role): bool
    {
        // Can only assign roles below your own level
        return match (true) {
            $this->role->isSuperAdmin() => true, // Can assign any role
            $this->role->isAdmin() => !$role->isSuperAdmin(), // Can assign admin or moderator
            default => false, // Moderators cannot assign roles
        };
    }

    // Query methods

    public function isActive(): bool
    {
        return $this->status->isActive() && !$this->isDeleted();
    }

    public function isInactive(): bool
    {
        return $this->status->isInactive();
    }

    public function isDeleted(): bool
    {
        return $this->deletedAt !== null;
    }

    public function isSuperAdmin(): bool
    {
        return $this->role->isSuperAdmin();
    }

    public function isAdmin(): bool
    {
        return $this->role->isAdmin();
    }

    public function isModerator(): bool
    {
        return $this->role->isModerator();
    }

    // Getters

    public function id(): ?int
    {
        return $this->id;
    }

    public function name(): FullName
    {
        return $this->name;
    }

    public function email(): EmailAddress
    {
        return $this->email;
    }

    public function hashedPassword(): string
    {
        return $this->hashedPassword;
    }

    public function role(): AdminRole
    {
        return $this->role;
    }

    public function status(): AdminStatus
    {
        return $this->status;
    }

    public function createdAt(): DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function updatedAt(): DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function deletedAt(): ?DateTimeImmutable
    {
        return $this->deletedAt;
    }

    // Domain events

    private function recordDomainEvent(object $event): void
    {
        $this->domainEvents[] = $event;
    }

    /**
     * @return array<object>
     */
    public function releaseEvents(): array
    {
        $events = $this->domainEvents;
        $this->domainEvents = [];

        return $events;
    }
}
