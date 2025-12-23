<?php

declare(strict_types=1);

namespace App\Domain\Competition\Exceptions;

use DomainException;

/**
 * Exception thrown when a tiebreaker rule slug is invalid.
 */
final class InvalidTiebreakerRuleSlugException extends DomainException
{
    /**
     * @param array<string> $validSlugs
     */
    public static function invalidSlug(string $slug, array $validSlugs): self
    {
        $valid = implode(', ', $validSlugs);
        return new self("Invalid tiebreaker rule slug '{$slug}'. Valid slugs are: {$valid}");
    }
}
