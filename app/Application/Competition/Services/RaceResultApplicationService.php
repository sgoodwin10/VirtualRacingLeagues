<?php

declare(strict_types=1);

namespace App\Application\Competition\Services;

use App\Application\Competition\DTOs\BulkRaceResultsData;
use App\Application\Competition\DTOs\CreateRaceResultData;
use App\Application\Competition\DTOs\RaceResultData;
use App\Domain\Competition\Entities\RaceResult;
use App\Domain\Competition\Exceptions\RaceResultException;
use App\Domain\Competition\Repositories\RaceRepositoryInterface;
use App\Domain\Competition\Repositories\RaceResultRepositoryInterface;
use Illuminate\Support\Facades\DB;

final class RaceResultApplicationService
{
    public function __construct(
        private RaceResultRepositoryInterface $raceResultRepository,
        private RaceRepositoryInterface $raceRepository,
    ) {
    }

    /**
     * Get all results for a race.
     *
     * @return RaceResultData[]
     */
    public function getResultsForRace(int $raceId): array
    {
        $results = $this->raceResultRepository->findByRaceId($raceId);

        return array_map(
            fn(RaceResult $result) => RaceResultData::fromEntity($result),
            $results
        );
    }

    /**
     * Save/update results for a race (bulk operation).
     * Replaces all existing results for the race.
     *
     * @return RaceResultData[]
     */
    public function saveResults(int $raceId, BulkRaceResultsData $data): array
    {
        // Verify race exists
        if (!$this->raceRepository->exists($raceId)) {
            throw RaceResultException::raceNotFound($raceId);
        }

        return DB::transaction(function () use ($raceId, $data) {
            // Delete existing results
            $this->raceResultRepository->deleteByRaceId($raceId);

            // Create new results
            $entities = [];
            foreach ($data->results as $resultData) {
                /** @var CreateRaceResultData $resultData */
                $entity = RaceResult::create(
                    raceId: $raceId,
                    driverId: $resultData->driver_id,
                    divisionId: $resultData->division_id,
                    position: $resultData->position,
                    raceTime: $resultData->race_time,
                    raceTimeDifference: $resultData->race_time_difference,
                    fastestLap: $resultData->fastest_lap,
                    penalties: $resultData->penalties,
                    hasFastestLap: $resultData->has_fastest_lap,
                    hasPole: $resultData->has_pole,
                    dnf: $resultData->dnf,
                );
                $entities[] = $entity;
            }

            // Save all
            $this->raceResultRepository->saveMany($entities);

            // Record creation events
            foreach ($entities as $entity) {
                $entity->recordCreationEvent();
            }

            return array_map(
                fn(RaceResult $result) => RaceResultData::fromEntity($result),
                $entities
            );
        });
    }

    /**
     * Delete all results for a race.
     */
    public function deleteResults(int $raceId): void
    {
        $this->raceResultRepository->deleteByRaceId($raceId);
    }
}
