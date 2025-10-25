<?php

declare(strict_types=1);

namespace App\Domain\Competition\Exceptions;

use DomainException;

/**
 * Exception thrown when a round number is invalid.
 */
final class InvalidRoundNumberException extends DomainException
{
    public static function outOfRange(int $value): self
    {
        return new self("Round number must be between 1 and 99, got {$value}");
    }
}
