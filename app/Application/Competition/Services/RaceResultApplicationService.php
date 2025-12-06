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
     * @throws RaceResultException if race not found or validation fails
     */
    public function saveResults(int $raceId, BulkRaceResultsData $data): array
    {
        // Verify race exists
        if (!$this->raceRepository->exists($raceId)) {
            throw RaceResultException::raceNotFound($raceId);
        }

        return DB::transaction(function () use ($raceId, $data) {
            // Fetch race to check if it's a qualifier
            $race = $this->raceRepository->findById($raceId);

            // Delete existing results
            $this->raceResultRepository->deleteByRaceId($raceId);

            // Create new results (ignore frontend has_fastest_lap value)
            $entities = [];
            foreach ($data->results as $resultData) {
                /** @var CreateRaceResultData $resultData */
                $entity = RaceResult::create(
                    raceId: $raceId,
                    driverId: $resultData->driver_id,
                    divisionId: $resultData->division_id,
                    position: $resultData->position,
                    originalRaceTime: $resultData->original_race_time,
                    originalRaceTimeDifference: $resultData->original_race_time_difference,
                    finalRaceTimeDifference: $resultData->final_race_time_difference,
                    fastestLap: $resultData->fastest_lap,
                    penalties: $resultData->penalties,
                    hasFastestLap: false, // Always false initially - we calculate this
                    hasPole: $resultData->has_pole,
                    dnf: $resultData->dnf,
                );
                $entities[] = $entity;
            }

            // Calculate fastest lap BEFORE saving (only for non-qualifier races)
            if (!$race->isQualifier()) {
                $this->calculateFastestLaps($entities);
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
     * Calculate and mark fastest lap for each division group.
     * Handles ties - multiple drivers can have fastest lap.
     *
     * @param RaceResult[] $results
     */
    private function calculateFastestLaps(array $results): void
    {
        // Group results by division (null division is treated as its own group)
        $groups = [];
        $hasDivisions = false;

        foreach ($results as $result) {
            $divisionId = $result->divisionId();
            if ($divisionId !== null) {
                $hasDivisions = true;
            }
            $groupKey = $divisionId ?? 'no_division';
            if (!isset($groups[$groupKey])) {
                $groups[$groupKey] = [];
            }
            $groups[$groupKey][] = $result;
        }

        // If no divisions exist, treat all results as one group
        if (!$hasDivisions) {
            $groups = ['all' => $results];
        }

        // Process each group
        foreach ($groups as $groupResults) {
            $this->markFastestLapInGroup($groupResults);
        }
    }

    /**
     * Find and mark the fastest lap(s) in a group of results.
     * Handles ties by marking all results with the minimum time.
     *
     * @param RaceResult[] $groupResults
     */
    private function markFastestLapInGroup(array $groupResults): void
    {
        // Find minimum fastest lap time (skip null/empty)
        $minTimeMs = null;

        foreach ($groupResults as $result) {
            $fastestLap = $result->fastestLap();
            if ($fastestLap->isNull()) {
                continue;
            }

            $timeMs = $fastestLap->toMilliseconds();
            if ($timeMs === null) {
                continue;
            }

            if ($minTimeMs === null || $timeMs < $minTimeMs) {
                $minTimeMs = $timeMs;
            }
        }

        // No valid times found
        if ($minTimeMs === null) {
            return;
        }

        // Mark all results that match the minimum time (handles ties)
        foreach ($groupResults as $result) {
            $fastestLap = $result->fastestLap();
            if ($fastestLap->isNull()) {
                continue;
            }

            $timeMs = $fastestLap->toMilliseconds();
            if ($timeMs === $minTimeMs) {
                $result->markAsFastestLap();
            }
        }
    }

    /**
     * Delete all results for a race.
     */
    public function deleteResults(int $raceId): void
    {
        DB::transaction(function () use ($raceId) {
            $this->raceResultRepository->deleteByRaceId($raceId);
        });
    }
}
