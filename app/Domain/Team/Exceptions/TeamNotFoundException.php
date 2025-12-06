<?php

declare(strict_types=1);

namespace App\Domain\Team\Exceptions;

use App\Domain\Shared\Exceptions\DomainNotFoundException;

/**
 * Exception thrown when a team is not found.
 */
final class TeamNotFoundException extends DomainNotFoundException
{
    public static function withId(int $id): self
    {
        return new self("Team with ID {$id} not found.");
    }

    public static function withIdInSeason(int $teamId, int $seasonId): self
    {
        return new self("Team with ID {$teamId} not found in season {$seasonId}.");
    }
}
