<?php

declare(strict_types=1);

namespace App\Domain\Competition\Exceptions;

use App\Domain\Shared\Exceptions\DomainNotFoundException;

/**
 * Exception thrown when a competition is not found.
 */
class CompetitionNotFoundException extends DomainNotFoundException
{
    public static function withId(int $id): self
    {
        return new self("Competition with ID {$id} not found");
    }

    public static function withSlug(string $slug, int $leagueId): self
    {
        return new self("Competition with slug '{$slug}' not found in league {$leagueId}");
    }
}
