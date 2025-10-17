<?php

declare(strict_types=1);

namespace App\Domain\User\Events;

/**
 * Domain Event: User Logged Out.
 * Fired when a user logs out.
 */
final readonly class UserLoggedOut
{
    public function __construct(
        public int $userId,
        public string $email,
    ) {
    }
}
