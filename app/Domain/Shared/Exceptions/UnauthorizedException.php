<?php

declare(strict_types=1);

namespace App\Domain\Shared\Exceptions;

use RuntimeException;

/**
 * Exception thrown when a user is not authorized to perform an action.
 */
class UnauthorizedException extends RuntimeException
{
    public static function forResource(string $resource): self
    {
        return new self("Unauthorized to access this {$resource}");
    }

    public static function withMessage(string $message): self
    {
        return new self($message);
    }

    public static function notAuthenticated(): self
    {
        return new self('User must be authenticated');
    }
}
