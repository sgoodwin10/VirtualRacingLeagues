<?php

declare(strict_types=1);

namespace App\Domain\User\Events;

/**
 * Domain Event: User Logged In.
 * Fired when a user successfully logs in.
 */
final readonly class UserLoggedIn
{
    public function __construct(
        public int $userId,
        public string $email,
    ) {
    }
}
