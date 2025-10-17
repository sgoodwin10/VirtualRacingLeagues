<?php

declare(strict_types=1);

namespace App\Domain\User\Exceptions;

use DomainException;

/**
 * Exception thrown when an invalid user status operation is attempted.
 */
final class InvalidUserStatusException extends DomainException
{
    public static function alreadyActive(int $userId): self
    {
        return new self("User with ID {$userId} is already active");
    }

    public static function alreadyInactive(int $userId): self
    {
        return new self("User with ID {$userId} is already inactive");
    }

    public static function cannotActivateDeletedUser(int $userId): self
    {
        return new self("Cannot activate deleted user with ID {$userId}");
    }

    public static function cannotDeactivateDeletedUser(int $userId): self
    {
        return new self("Cannot deactivate deleted user with ID {$userId}");
    }
}
