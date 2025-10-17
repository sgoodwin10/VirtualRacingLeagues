<?php

declare(strict_types=1);

namespace App\Domain\User\Events;

/**
 * Domain Event: User Updated.
 * Dispatched when a user's information is updated.
 */
final readonly class UserUpdated
{
    /**
     * @param array<string, mixed> $changedAttributes
     */
    public function __construct(
        public readonly int $userId,
        public readonly array $changedAttributes,
    ) {
    }
}
