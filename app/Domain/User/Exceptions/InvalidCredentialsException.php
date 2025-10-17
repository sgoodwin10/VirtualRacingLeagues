<?php

declare(strict_types=1);

namespace App\Domain\User\Exceptions;

use DomainException;

/**
 * Exception thrown when login credentials are invalid.
 */
final class InvalidCredentialsException extends DomainException
{
    public function __construct()
    {
        parent::__construct('The provided credentials are invalid');
    }

    public static function forLogin(): self
    {
        return new self();
    }
}
