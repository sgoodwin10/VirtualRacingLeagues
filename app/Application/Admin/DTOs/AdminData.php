<?php

declare(strict_types=1);

namespace App\Application\Admin\DTOs;

use App\Domain\Admin\Entities\Admin;
use Spatie\LaravelData\Data;

/**
 * Data Transfer Object representing an admin.
 */
final class AdminData extends Data
{
    public function __construct(
        public readonly ?int $id,
        public readonly string $first_name,
        public readonly string $last_name,
        public readonly string $name,
        public readonly string $email,
        public readonly string $role,
        public readonly string $status,
        public readonly bool $is_active,
        public readonly bool $is_deleted,
        public readonly ?string $last_login_at,
        public readonly string $created_at,
        public readonly string $updated_at,
        public readonly ?string $deleted_at,
    ) {
    }

    /**
     * Create from domain entity.
     *
     * @param  Admin  $admin  Domain entity
     * @param  string|null  $lastLoginAt  Optional last login timestamp (infrastructure concern)
     */
    public static function fromEntity(Admin $admin, ?string $lastLoginAt = null): self
    {
        return new self(
            id: $admin->id(),
            first_name: $admin->name()->firstName(),
            last_name: $admin->name()->lastName(),
            name: $admin->name()->full(),
            email: (string) $admin->email(),
            role: $admin->role()->value,
            status: $admin->status()->value,
            is_active: $admin->isActive(),
            is_deleted: $admin->isDeleted(),
            last_login_at: $lastLoginAt,
            created_at: $admin->createdAt()->format('Y-m-d H:i:s'),
            updated_at: $admin->updatedAt()->format('Y-m-d H:i:s'),
            deleted_at: $admin->deletedAt()?->format('Y-m-d H:i:s'),
        );
    }
}
