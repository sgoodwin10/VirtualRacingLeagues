<?php

declare(strict_types=1);

namespace App\Domain\User\Exceptions;

use DomainException;

/**
 * Exception thrown when attempting to create a user that already exists.
 */
final class UserAlreadyExistsException extends DomainException
{
    public static function withEmail(string $email): self
    {
        return new self("User with email '{$email}' already exists");
    }

    public static function withUuid(string $uuid): self
    {
        return new self("User with UUID '{$uuid}' already exists");
    }
}
