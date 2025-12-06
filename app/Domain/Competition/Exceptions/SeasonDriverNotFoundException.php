<?php

declare(strict_types=1);

namespace App\Domain\Competition\Exceptions;

use App\Domain\Shared\Exceptions\DomainNotFoundException;

/**
 * Exception thrown when a season driver is not found.
 */
final class SeasonDriverNotFoundException extends DomainNotFoundException
{
    public static function withId(int $id): self
    {
        return new self("Season driver with ID {$id} not found.");
    }

    public static function withLeagueDriver(int $leagueDriverId, int $seasonId): self
    {
        return new self(
            "League driver with ID {$leagueDriverId} not found in season ID {$seasonId}."
        );
    }

    public static function withLeagueDriverAndSeason(int $leagueDriverId, int $seasonId): self
    {
        return new self(
            "League driver with ID {$leagueDriverId} not found in season ID {$seasonId}."
        );
    }
}
