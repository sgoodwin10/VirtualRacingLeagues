<?php

declare(strict_types=1);

namespace App\Domain\Competition\Exceptions;

use DomainException;

/**
 * Exception thrown when trying to add a duplicate tiebreaker rule to a season.
 */
final class DuplicateTiebreakerRuleException extends DomainException
{
    public static function duplicateRule(): self
    {
        return new self('A tiebreaker rule can only be added once per season');
    }
}
