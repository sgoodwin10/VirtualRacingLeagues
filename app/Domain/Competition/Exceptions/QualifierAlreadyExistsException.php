<?php

declare(strict_types=1);

namespace App\Domain\Competition\Exceptions;

use DomainException;

final class QualifierAlreadyExistsException extends DomainException
{
    public static function forRound(int $roundId): self
    {
        return new self("A qualifier already exists for round {$roundId}. Only one qualifier is allowed per round.");
    }
}
