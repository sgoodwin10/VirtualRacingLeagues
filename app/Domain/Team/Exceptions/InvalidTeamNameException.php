<?php

declare(strict_types=1);

namespace App\Domain\Team\Exceptions;

use DomainException;

/**
 * Exception thrown when team name validation fails.
 */
final class InvalidTeamNameException extends DomainException
{
    public static function tooShort(string $name): self
    {
        return new self("Team name '{$name}' is too short. Minimum 2 characters required.");
    }

    public static function tooLong(string $name): self
    {
        $length = mb_strlen($name);

        return new self("Team name is too long ({$length} characters). Maximum 60 characters allowed.");
    }

    public static function empty(): self
    {
        return new self('Team name cannot be empty.');
    }
}
