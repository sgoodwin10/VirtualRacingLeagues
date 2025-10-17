<?php

declare(strict_types=1);

namespace App\Domain\User\Exceptions;

use DomainException;

/**
 * Exception thrown when attempting to restore a user that is not deleted.
 */
final class UserNotDeletedException extends DomainException
{
    public static function withId(int $id): self
    {
        return new self("User with ID {$id} is not deleted and cannot be restored");
    }
}
