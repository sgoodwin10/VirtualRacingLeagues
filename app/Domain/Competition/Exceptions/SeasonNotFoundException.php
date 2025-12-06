<?php

declare(strict_types=1);

namespace App\Domain\Competition\Exceptions;

use App\Domain\Shared\Exceptions\DomainNotFoundException;

/**
 * Exception thrown when a season is not found.
 */
final class SeasonNotFoundException extends DomainNotFoundException
{
    public static function withId(int $id): self
    {
        return new self("Season with ID {$id} not found.");
    }

    public static function withSlug(string $slug, int $competitionId): self
    {
        return new self("Season with slug '{$slug}' not found for competition ID {$competitionId}.");
    }
}
