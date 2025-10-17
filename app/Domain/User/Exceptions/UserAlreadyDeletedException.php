<?php

declare(strict_types=1);

namespace App\Domain\User\Exceptions;

use DomainException;

/**
 * Exception thrown when attempting to delete a user that is already deleted.
 */
final class UserAlreadyDeletedException extends DomainException
{
    public static function withId(int $id): self
    {
        return new self("User with ID {$id} is already deleted");
    }
}
