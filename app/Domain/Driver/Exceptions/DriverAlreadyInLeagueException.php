<?php

declare(strict_types=1);

namespace App\Domain\Driver\Exceptions;

use RuntimeException;

final class DriverAlreadyInLeagueException extends RuntimeException
{
    public static function withDriverId(int $driverId, int $leagueId): self
    {
        return new self("Driver with ID {$driverId} is already in league {$leagueId}");
    }

    public static function withPlatformId(string $platformType, string $platformId, int $leagueId): self
    {
        return new self("Driver with {$platformType} ID '{$platformId}' is already in league {$leagueId}");
    }
}
