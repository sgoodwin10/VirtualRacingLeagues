<?php

declare(strict_types=1);

namespace App\Domain\Division\Exceptions;

use DomainException;

/**
 * Exception thrown when a division is not found.
 */
final class DivisionNotFoundException extends DomainException
{
    public static function withId(int $id): self
    {
        return new self(sprintf('Division with ID %d not found', $id));
    }
}
