<?php

declare(strict_types=1);

namespace App\Domain\User\Events;

/**
 * Domain Event: User Impersonated.
 * Fired when an admin successfully impersonates a user (token consumed).
 */
final class UserImpersonated
{
    public function __construct(
        public readonly int $userId,
        public readonly string $userEmail,
        public readonly int $adminId,
        public readonly string $adminEmail,
    ) {
    }
}
