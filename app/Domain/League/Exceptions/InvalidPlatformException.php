<?php

declare(strict_types=1);

namespace App\Domain\League\Exceptions;

use DomainException;

/**
 * Exception thrown when invalid platform IDs are provided.
 */
final class InvalidPlatformException extends DomainException
{
    /**
     * Create exception for invalid platform IDs.
     *
     * @param array<int> $invalidIds
     */
    public static function forInvalidIds(array $invalidIds): self
    {
        $ids = implode(', ', $invalidIds);
        return new self("Invalid or inactive platform ID(s): {$ids}");
    }

    /**
     * Create exception for empty platform IDs.
     */
    public static function forEmptyPlatforms(): self
    {
        return new self('At least one platform must be specified');
    }
}
