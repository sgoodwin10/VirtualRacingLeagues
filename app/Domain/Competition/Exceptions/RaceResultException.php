<?php

declare(strict_types=1);

namespace App\Domain\Competition\Exceptions;

use DomainException;

final class RaceResultException extends DomainException
{
    public static function duplicateDriver(int $raceId, int $driverId): self
    {
        return new self("Driver {$driverId} already has a result for race {$raceId}");
    }

    public static function notFound(int $id): self
    {
        return new self("Race result with ID {$id} not found");
    }

    public static function raceNotFound(int $raceId): self
    {
        return new self("Race with ID {$raceId} not found");
    }
}
