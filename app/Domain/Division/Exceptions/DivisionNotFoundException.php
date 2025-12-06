<?php

declare(strict_types=1);

namespace App\Domain\Division\Exceptions;

use App\Domain\Shared\Exceptions\DomainNotFoundException;

/**
 * Exception thrown when a division is not found.
 */
final class DivisionNotFoundException extends DomainNotFoundException
{
    public static function withId(int $id): self
    {
        return new self(sprintf('Division with ID %d not found', $id));
    }

    public static function withSeasonId(int $seasonId): self
    {
        return new self(sprintf('No divisions found for season ID %d', $seasonId));
    }
}
