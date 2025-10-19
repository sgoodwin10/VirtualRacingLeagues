<?php

declare(strict_types=1);

namespace App\Domain\League\Exceptions;

use DomainException;

class InvalidTaglineException extends DomainException
{
    public static function empty(): self
    {
        return new self('Tagline cannot be empty');
    }

    public static function tooLong(string $tagline): self
    {
        return new self("Tagline is too long. Maximum length is 150 characters");
    }
}
