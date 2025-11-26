<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use App\Domain\Competition\Entities\SeasonDriver;
use Spatie\LaravelData\Data;

/**
 * Output DTO representing a season driver association.
 */
class SeasonDriverData extends Data
{
    public function __construct(
        public int $id,
        public int $season_id,
        public int $league_driver_id,
        public int $driver_id,
        public ?string $first_name,
        public ?string $last_name,
        public ?string $nickname,
        public ?string $driver_number,
        public ?string $psn_id,
        public ?string $iracing_id,
        public ?string $discord_id,
        public ?string $team_name,
        public ?int $division_id,
        public ?string $division_name,
        public string $status,
        public bool $is_active,
        public bool $is_reserve,
        public bool $is_withdrawn,
        public ?string $notes,
        public string $added_at,
        public string $updated_at,
    ) {
    }

    /**
     * Create from domain entity with driver data.
     *
     * @param array{
     *     id: int,
     *     first_name: string|null,
     *     last_name: string|null,
     *     nickname: string|null,
     *     number: string|null,
     *     psn_id: string|null,
     *     iracing_id: string|null,
     *     discord_id: string|null,
     *     team_name: string|null,
     *     division_id: int|null,
     *     division_name: string|null
     * } $driverData
     */
    public static function fromEntity(
        SeasonDriver $seasonDriver,
        int $driverId,
        array $driverData
    ): self {
        return new self(
            id: $seasonDriver->id() ?? 0,
            season_id: $seasonDriver->seasonId(),
            league_driver_id: $seasonDriver->leagueDriverId(),
            driver_id: $driverId,
            first_name: $driverData['first_name'] ?? null,
            last_name: $driverData['last_name'] ?? null,
            nickname: $driverData['nickname'] ?? null,
            driver_number: $driverData['number'] ?? null,
            psn_id: $driverData['psn_id'] ?? null,
            iracing_id: $driverData['iracing_id'] ?? null,
            discord_id: $driverData['discord_id'] ?? null,
            team_name: $driverData['team_name'] ?? null,
            division_id: $driverData['division_id'] ?? null,
            division_name: $driverData['division_name'] ?? null,
            status: $seasonDriver->status()->value,
            is_active: $seasonDriver->isActive(),
            is_reserve: $seasonDriver->isReserve(),
            is_withdrawn: $seasonDriver->isWithdrawn(),
            notes: $seasonDriver->notes(),
            added_at: $seasonDriver->addedAt()->format('Y-m-d H:i:s'),
            updated_at: $seasonDriver->updatedAt()->format('Y-m-d H:i:s'),
        );
    }
}
