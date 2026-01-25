<?php

declare(strict_types=1);

namespace App\Domain\Division\Exceptions;

use DomainException;

/**
 * Exception thrown when a division description is invalid.
 */
final class InvalidDivisionDescriptionException extends DomainException
{
    public static function tooShort(string $description): self
    {
        $length = mb_strlen($description);

        return new self(
            sprintf(
                'Division description must be at least 10 characters long when provided. Got %d characters: "%s"',
                $length,
                $description
            )
        );
    }

    public static function tooLong(string $description): self
    {
        $length = mb_strlen($description);

        return new self(
            sprintf('Division description must not exceed 500 characters. Got %d characters', $length)
        );
    }
}
