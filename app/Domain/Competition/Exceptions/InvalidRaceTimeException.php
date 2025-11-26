<?php

declare(strict_types=1);

namespace App\Domain\Competition\Exceptions;

use DomainException;

final class InvalidRaceTimeException extends DomainException
{
    public static function invalidFormat(string $value): self
    {
        return new self("Invalid race time format: '{$value}'. Expected format: hh:mm:ss.ms");
    }
}
