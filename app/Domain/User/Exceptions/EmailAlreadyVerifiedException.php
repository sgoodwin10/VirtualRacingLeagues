<?php

declare(strict_types=1);

namespace App\Domain\User\Exceptions;

use DomainException;

/**
 * Exception thrown when attempting to verify an already verified email.
 */
final class EmailAlreadyVerifiedException extends DomainException
{
    public function __construct()
    {
        parent::__construct('Email address is already verified');
    }

    public static function forUser(int $userId): self
    {
        $exception = new self();
        $exception->message = sprintf('Email address for user %d is already verified', $userId);

        return $exception;
    }
}
