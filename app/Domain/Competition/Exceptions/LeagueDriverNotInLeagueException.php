<?php

declare(strict_types=1);

namespace App\Domain\Competition\Exceptions;

use RuntimeException;

/**
 * Exception thrown when a league driver doesn't belong to the competition's league.
 */
final class LeagueDriverNotInLeagueException extends RuntimeException
{
    public static function create(int $leagueDriverId, int $expectedLeagueId): self
    {
        return new self(
            "League driver with ID {$leagueDriverId} does not belong to league ID {$expectedLeagueId}."
        );
    }

    public static function withId(int $leagueDriverId, int $expectedLeagueId): self
    {
        return new self(
            "League driver with ID {$leagueDriverId} does not belong to league ID {$expectedLeagueId}."
        );
    }
}
