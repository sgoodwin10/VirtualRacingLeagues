<?php

declare(strict_types=1);

namespace App\Domain\User\Events;

/**
 * Domain Event: User Restored.
 * Dispatched when a soft-deleted user account is restored.
 */
final readonly class UserRestored
{
    public function __construct(
        public readonly int $userId,
    ) {
    }
}
