<?php

declare(strict_types=1);

namespace App\Application\User\DTOs;

use App\Domain\User\Entities\User;
use Spatie\LaravelData\Data;

class DetailedUserData extends Data
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
        public readonly ?string $created_at,
        public readonly ?string $updated_at,
    ) {
    }

    /**
     * Create DetailedUserData from User domain entity.
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
            created_at: $user->createdAt()?->format('c'),
            updated_at: $user->updatedAt()?->format('c'),
        );
    }
}
