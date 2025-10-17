<?php

declare(strict_types=1);

namespace App\Domain\User\Events;

/**
 * Domain Event: User Deactivated.
 * Dispatched when a user account is deactivated.
 */
final readonly class UserDeactivated
{
    public function __construct(
        public readonly int $userId,
    ) {
    }
}
