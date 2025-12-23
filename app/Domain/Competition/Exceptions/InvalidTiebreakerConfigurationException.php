<?php

declare(strict_types=1);

namespace App\Domain\Competition\Exceptions;

use DomainException;

/**
 * Exception thrown when a tiebreaker configuration is invalid.
 */
final class InvalidTiebreakerConfigurationException extends DomainException
{
    public static function invalidOrdering(): self
    {
        return new self('Tiebreaker rule ordering must be sequential starting from 1');
    }

    public static function emptyConfiguration(): self
    {
        return new self('Cannot enable tiebreaker rules with an empty configuration');
    }
}
