<?php

declare(strict_types=1);

namespace App\Domain\User\Events;

/**
 * Domain Event: User Created.
 * Dispatched when a new user is created.
 */
final readonly class UserCreated
{
    public function __construct(
        public readonly int $userId,
        public readonly string $email,
        public readonly string $firstName,
        public readonly string $lastName,
        public readonly ?string $alias = null,
        public readonly ?string $uuid = null,
    ) {
    }
}
