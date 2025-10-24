<?php

declare(strict_types=1);

namespace App\Domain\Competition\Exceptions;

use RuntimeException;

/**
 * Exception thrown when trying to add a driver already in the season.
 */
final class SeasonDriverAlreadyExistsException extends RuntimeException
{
    public static function withLeagueDriver(int $leagueDriverId, int $seasonId): self
    {
        return new self(
            "League driver with ID {$leagueDriverId} is already in season ID {$seasonId}."
        );
    }
}
