<?php

declare(strict_types=1);

namespace App\Domain\Admin\Events;

/**
 * Domain Event: User Impersonation Started.
 * Fired when an admin generates an impersonation token for a user.
 */
final class UserImpersonationStarted
{
    public function __construct(
        public readonly int $adminId,
        public readonly string $adminEmail,
        public readonly int $userId,
        public readonly string $userEmail,
        public readonly string $token,
    ) {
    }
}
