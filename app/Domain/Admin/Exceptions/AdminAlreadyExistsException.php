<?php

declare(strict_types=1);

namespace App\Domain\Admin\Exceptions;

use DomainException;

/**
 * Admin Already Exists Domain Exception.
 */
final class AdminAlreadyExistsException extends DomainException
{
    public static function withEmail(string $email): self
    {
        return new self("Admin with email {$email} already exists");
    }
}
