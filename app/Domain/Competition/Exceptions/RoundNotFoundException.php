<?php

declare(strict_types=1);

namespace App\Domain\Competition\Exceptions;

use DomainException;

/**
 * Exception thrown when a round is not found.
 */
final class RoundNotFoundException extends DomainException
{
    public static function withId(int $id): self
    {
        return new self("Round with ID {$id} not found");
    }
}
