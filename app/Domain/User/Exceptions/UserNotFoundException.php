<?php

declare(strict_types=1);

namespace App\Domain\User\Exceptions;

use DomainException;

/**
 * Exception thrown when a user is not found.
 */
final class UserNotFoundException extends DomainException
{
    public static function withId(int $id): self
    {
        return new self("User with ID {$id} not found");
    }

    public static function withEmail(string $email): self
    {
        return new self("User with email '{$email}' not found");
    }

    public static function withUuid(string $uuid): self
    {
        return new self("User with UUID '{$uuid}' not found");
    }
}
