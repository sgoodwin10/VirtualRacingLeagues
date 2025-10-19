<?php

declare(strict_types=1);

namespace App\Application\Driver\DTOs;

use App\Domain\Driver\Entities\Driver;
use App\Domain\Driver\Entities\LeagueDriver;
use Spatie\LaravelData\Data;

final class LeagueDriverData extends Data
{
    public function __construct(
        public readonly int $id,
        public readonly int $league_id,
        public readonly int $driver_id,
        public readonly ?int $driver_number,
        public readonly string $status,
        public readonly ?string $league_notes,
        public readonly string $added_to_league_at,
        public readonly string $updated_at,
        // Embedded driver data
        public readonly DriverData $driver
    ) {
    }

    /**
     * Create from domain entities.
     */
    public static function fromEntities(LeagueDriver $leagueDriver, Driver $driver): self
    {
        return new self(
            id: $leagueDriver->id() ?? 0,
            league_id: $leagueDriver->leagueId(),
            driver_id: $leagueDriver->driverId(),
            driver_number: $leagueDriver->driverNumber(),
            status: $leagueDriver->status()->value,
            league_notes: $leagueDriver->leagueNotes(),
            added_to_league_at: $leagueDriver->addedToLeagueAt()->format('Y-m-d H:i:s'),
            updated_at: $leagueDriver->updatedAt()->format('Y-m-d H:i:s'),
            driver: DriverData::fromEntity($driver)
        );
    }
}
