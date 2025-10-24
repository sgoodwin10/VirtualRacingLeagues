<?php

declare(strict_types=1);

namespace App\Domain\Competition\Exceptions;

use RuntimeException;

/**
 * Exception thrown when trying to create a season that already exists.
 */
final class SeasonAlreadyExistsException extends RuntimeException
{
    public static function withSlug(string $slug, int $competitionId): self
    {
        return new self(
            "Season with slug '{$slug}' already exists for competition ID {$competitionId}."
        );
    }
}
