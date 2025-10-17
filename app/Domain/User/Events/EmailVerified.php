<?php

declare(strict_types=1);

namespace App\Domain\User\Events;

use App\Domain\User\Entities\User;

/**
 * Domain Event: Email Verified.
 * Fired when a user's email is successfully verified.
 */
final readonly class EmailVerified
{
    public function __construct(
        public User $user
    ) {
    }
}
