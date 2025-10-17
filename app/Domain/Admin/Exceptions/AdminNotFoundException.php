<?php

declare(strict_types=1);

namespace App\Domain\Admin\Exceptions;

use DomainException;

/**
 * Exception thrown when an admin is not found.
 */
final class AdminNotFoundException extends DomainException
{
    public static function withId(int $id): self
    {
        return new self("Admin with ID {$id} not found");
    }

    public static function withEmail(string $email): self
    {
        return new self("Admin with email '{$email}' not found");
    }
}
