<?php

declare(strict_types=1);

namespace App\Domain\Admin\Exceptions;

use DomainException;

/**
 * Exception thrown when authentication credentials are invalid.
 */
final class InvalidCredentialsException extends DomainException
{
    public function __construct()
    {
        parent::__construct('Invalid email or password');
    }
}
