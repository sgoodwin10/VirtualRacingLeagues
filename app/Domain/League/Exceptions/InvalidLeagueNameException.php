<?php

declare(strict_types=1);

namespace App\Domain\League\Exceptions;

use DomainException;

class InvalidLeagueNameException extends DomainException
{
    public static function empty(): self
    {
        return new self('League name cannot be empty');
    }

    public static function tooShort(string $name): self
    {
        return new self("League name '{$name}' is too short. Minimum length is 3 characters");
    }

    public static function tooLong(string $name): self
    {
        return new self('League name is too long. Maximum length is 100 characters');
    }
}
