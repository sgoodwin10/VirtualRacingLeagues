<?php

declare(strict_types=1);

namespace App\Domain\Competition\Exceptions;

use DomainException;

final class RaceNotFoundException extends DomainException
{
    public static function withId(int $id): self
    {
        return new self("Race with ID {$id} not found");
    }
}
