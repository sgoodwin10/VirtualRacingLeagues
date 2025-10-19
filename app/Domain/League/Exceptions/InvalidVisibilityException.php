<?php

declare(strict_types=1);

namespace App\Domain\League\Exceptions;

use DomainException;

class InvalidVisibilityException extends DomainException
{
    public static function invalidValue(string $value): self
    {
        return new self("Invalid visibility value: {$value}. Must be one of: public, private, unlisted");
    }
}
