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
        public ?string $original_race_time,
        public ?string $final_race_time,
        public ?string $original_race_time_difference,
        public ?string $final_race_time_difference,
        public ?string $fastest_lap,
        public ?string $penalties,
        public bool $has_fastest_lap,
        public bool $has_pole,
        public bool $dnf,
        public string $status,
        public float $race_points,
        public ?int $positions_gained,
        public string $created_at,
        public string $updated_at,
        public ?array $driver = null,
    ) {
    }

    /**
     * @param array<string, mixed>|null $driverData
     *
     * @throws \LogicException If entity ID is null
     */
    public static function fromEntity(
        RaceResult $entity,
        ?array $driverData = null
    ): self {
        $entityId = $entity->id();
        if ($entityId === null) {
            throw new \LogicException('Cannot create RaceResultData from unsaved entity');
        }

        return new self(
            id: $entityId,
            race_id: $entity->raceId(),
            driver_id: $entity->driverId(),
            division_id: $entity->divisionId(),
            position: $entity->position(),
            original_race_time: $entity->originalRaceTime()->value(),
            final_race_time: $entity->finalRaceTime()->value(),
            original_race_time_difference: $entity->originalRaceTimeDifference()->value(),
            final_race_time_difference: $entity->finalRaceTimeDifference()->value(),
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
