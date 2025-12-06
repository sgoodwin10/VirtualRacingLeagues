<?php

declare(strict_types=1);

namespace App\Domain\Competition\Exceptions;

use App\Domain\Shared\Exceptions\DomainNotFoundException;

final class RaceNotFoundException extends DomainNotFoundException
{
    public static function withId(int $id): self
    {
        return new self("Race with ID {$id} not found");
    }
}
