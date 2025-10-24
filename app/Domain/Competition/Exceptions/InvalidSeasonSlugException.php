<?php

declare(strict_types=1);

namespace App\Domain\Competition\Exceptions;

use InvalidArgumentException;

/**
 * Exception thrown when a season slug is invalid.
 */
final class InvalidSeasonSlugException extends InvalidArgumentException
{
    public static function withValue(string $value): self
    {
        return new self(
            "Invalid season slug: '{$value}'. Slug must be lowercase alphanumeric with hyphens, max 150 characters."
        );
    }
}
