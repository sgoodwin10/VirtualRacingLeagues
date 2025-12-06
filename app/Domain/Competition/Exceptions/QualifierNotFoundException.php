<?php

declare(strict_types=1);

namespace App\Domain\Competition\Exceptions;

use App\Domain\Shared\Exceptions\DomainNotFoundException;

final class QualifierNotFoundException extends DomainNotFoundException
{
    public static function withId(int $id): self
    {
        return new self("Qualifier with ID {$id} not found");
    }

    public static function forRound(int $roundId): self
    {
        return new self("Qualifier for round {$roundId} not found");
    }
}
