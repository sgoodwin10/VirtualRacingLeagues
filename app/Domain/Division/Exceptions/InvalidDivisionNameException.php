<?php

declare(strict_types=1);

namespace App\Domain\Division\Exceptions;

use DomainException;

/**
 * Exception thrown when a division name is invalid.
 */
final class InvalidDivisionNameException extends DomainException
{
    public static function tooShort(string $name): self
    {
        $length = mb_strlen($name);
        return new self(
            sprintf('Division name must be at least 2 characters long. Got %d characters: "%s"', $length, $name)
        );
    }

    public static function tooLong(string $name): self
    {
        $length = mb_strlen($name);
        return new self(
            sprintf('Division name must not exceed 60 characters. Got %d characters: "%s"', $length, $name)
        );
    }
}
