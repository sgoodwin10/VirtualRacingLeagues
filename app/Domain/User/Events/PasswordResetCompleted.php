<?php

declare(strict_types=1);

namespace App\Domain\User\Events;

use App\Domain\User\Entities\User;

/**
 * Domain Event: Password Reset Completed.
 * Fired when a user successfully resets their password.
 */
final readonly class PasswordResetCompleted
{
    public function __construct(
        public User $user
    ) {
    }
}
