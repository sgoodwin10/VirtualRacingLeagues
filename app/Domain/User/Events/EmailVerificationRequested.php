<?php

declare(strict_types=1);

namespace App\Domain\User\Events;

use App\Domain\User\Entities\User;

/**
 * Domain Event: Email Verification Requested.
 * Fired when a user requests email verification.
 */
final readonly class EmailVerificationRequested
{
    public function __construct(
        public User $user
    ) {
    }
}
