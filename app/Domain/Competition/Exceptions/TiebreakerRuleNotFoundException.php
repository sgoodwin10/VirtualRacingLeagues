<?php

declare(strict_types=1);

namespace App\Domain\Competition\Exceptions;

use DomainException;

/**
 * Exception thrown when a tiebreaker rule cannot be found.
 */
final class TiebreakerRuleNotFoundException extends DomainException
{
    public static function withId(int $id): self
    {
        return new self("Tiebreaker rule with ID {$id} not found");
    }

    public static function withSlug(string $slug): self
    {
        return new self("Tiebreaker rule with slug '{$slug}' not found");
    }
}
