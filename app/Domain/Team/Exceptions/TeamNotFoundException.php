<?php

declare(strict_types=1);

namespace App\Domain\Team\Exceptions;

use DomainException;

/**
 * Exception thrown when a team is not found.
 */
final class TeamNotFoundException extends DomainException
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
