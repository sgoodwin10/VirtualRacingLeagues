<?php

declare(strict_types=1);

namespace App\Domain\User\Events;

/**
 * Domain Event: User Activated.
 * Dispatched when a user account is activated.
 */
final readonly class UserActivated
{
    public function __construct(
        public readonly int $userId,
    ) {
    }
}
