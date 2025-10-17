<?php

declare(strict_types=1);

namespace App\Domain\User\Events;

use App\Domain\User\Entities\User;

/**
 * Domain Event: Password Reset Requested.
 * Fired when a user requests a password reset.
 */
final readonly class PasswordResetRequested
{
    public function __construct(
        public User $user
    ) {
    }
}
