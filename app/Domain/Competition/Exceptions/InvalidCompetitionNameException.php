<?php

declare(strict_types=1);

namespace App\Domain\Competition\Exceptions;

/**
 * Exception thrown when a competition name is invalid.
 */
class InvalidCompetitionNameException extends \DomainException
{
    public static function tooShort(string $name): self
    {
        return new self("Competition name '{$name}' is too short. Minimum length is 3 characters.");
    }

    public static function tooLong(string $name): self
    {
        return new self('Competition name is too long. Maximum length is 100 characters.');
    }

    public static function invalidCharacters(string $name): self
    {
        return new self("Competition name '{$name}' contains invalid characters. Only letters, numbers, spaces, hyphens, and apostrophes are allowed.");
    }
}
