<?php

declare(strict_types=1);

namespace App\Domain\Competition\Exceptions;

use DomainException;

final class InvalidRaceConfigurationException extends DomainException
{
    public static function create(string $message): self
    {
        return new self($message);
    }
}
