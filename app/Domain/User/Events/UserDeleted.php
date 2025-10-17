<?php

declare(strict_types=1);

namespace App\Domain\User\Events;

/**
 * Domain Event: User Deleted.
 * Dispatched when a user account is soft-deleted.
 */
final readonly class UserDeleted
{
    public function __construct(
        public readonly int $userId,
    ) {
    }
}
