<?php

declare(strict_types=1);

namespace App\Application\User\DTOs;

use App\Domain\User\Entities\User;
use Spatie\LaravelData\Data;

/**
 * Data Transfer Object representing a user.
 */
final class UserData extends Data
{
    public function __construct(
        public readonly ?int $id,
        public readonly string $first_name,
        public readonly string $last_name,
        public readonly string $name,
        public readonly string $email,
        public readonly ?string $alias,
        public readonly ?string $uuid,
        public readonly string $status,
        public readonly bool $is_active,
        public readonly bool $is_deleted,
        public readonly bool $is_email_verified,
        public readonly ?string $email_verified_at,
        public readonly string $created_at,
        public readonly string $updated_at,
        public readonly ?string $deleted_at,
    ) {
    }

    /**
     * Create from domain entity.
     */
    public static function fromEntity(User $user): self
    {
        return new self(
            id: $user->id(),
            first_name: $user->fullName()->firstName(),
            last_name: $user->fullName()->lastName(),
            name: $user->fullName()->full(),
            email: $user->email()->value(),
            alias: $user->alias()?->value(),
            uuid: $user->uuid()?->value(),
            status: $user->status()->value,
            is_active: $user->isActive(),
            is_deleted: $user->isDeleted(),
            is_email_verified: $user->isEmailVerified(),
            email_verified_at: $user->emailVerifiedAt()?->format('Y-m-d H:i:s'),
            created_at: $user->createdAt()?->format('Y-m-d H:i:s') ?? '',
            updated_at: $user->updatedAt()?->format('Y-m-d H:i:s') ?? '',
            deleted_at: $user->deletedAt()?->format('Y-m-d H:i:s'),
        );
    }
}
