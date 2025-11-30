<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use App\Domain\Competition\Entities\RaceResult;
use Spatie\LaravelData\Data;

final class RaceResultData extends Data
{
    /**
     * @param array<string, mixed>|null $driver
     */
    public function __construct(
        public int $id,
        public int $race_id,
        public int $driver_id,
        public ?int $division_id,
        public ?int $position,
        public ?string $race_time,
        public ?string $race_time_difference,
        public ?string $fastest_lap,
        public ?string $penalties,
        public bool $has_fastest_lap,
        public bool $has_pole,
        public bool $dnf,
        public string $status,
        public int $race_points,
        public ?int $positions_gained,
        public string $created_at,
        public string $updated_at,
        public ?array $driver = null,
    ) {
    }

    /**
     * @param array<string, mixed>|null $driverData
     */
    public static function fromEntity(RaceResult $entity, ?array $driverData = null): self
    {
        return new self(
            id: $entity->id() ?? 0,
            race_id: $entity->raceId(),
            driver_id: $entity->driverId(),
            division_id: $entity->divisionId(),
            position: $entity->position(),
            race_time: $entity->raceTime()->value(),
            race_time_difference: $entity->raceTimeDifference()->value(),
            fastest_lap: $entity->fastestLap()->value(),
            penalties: $entity->penalties()->value(),
            has_fastest_lap: $entity->hasFastestLap(),
            has_pole: $entity->hasPole(),
            dnf: $entity->dnf(),
            status: $entity->status()->value,
            race_points: $entity->racePoints(),
            positions_gained: $entity->positionsGained(),
            created_at: $entity->createdAt()->format('Y-m-d H:i:s'),
            updated_at: $entity->updatedAt()->format('Y-m-d H:i:s'),
            driver: $driverData,
        );
    }
}
