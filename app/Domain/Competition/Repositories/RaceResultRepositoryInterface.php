<?php

declare(strict_types=1);

namespace App\Domain\Competition\Repositories;

use App\Domain\Competition\Entities\RaceResult;

interface RaceResultRepositoryInterface
{
    public function save(RaceResult $result): void;

    /**
     * @param RaceResult[] $results
     */
    public function saveMany(array $results): void;

    public function findById(int $id): ?RaceResult;

    /**
     * @return RaceResult[]
     */
    public function findByRaceId(int $raceId): array;

    /**
     * Find all race results for a round (batch fetch to avoid N+1 queries).
     *
     * @return RaceResult[]
     */
    public function findByRoundId(int $roundId): array;

    public function findByRaceAndDriver(int $raceId, int $driverId): ?RaceResult;

    public function delete(RaceResult $result): void;

    public function deleteByRaceId(int $raceId): void;

    /**
     * Check if round has any orphaned results (results with NULL division_id).
     * Only relevant when season has divisions enabled.
     */
    public function hasOrphanedResultsForRound(int $roundId): bool;

    /**
     * Check if a specific race has any orphaned results (results with NULL division_id).
     * Only relevant when season has divisions enabled.
     */
    public function hasOrphanedResultsForRace(int $raceId): bool;

    /**
     * Delete all orphaned results for a specific race (results with NULL division_id).
     * Returns the number of results deleted.
     */
    public function deleteOrphanedResultsForRace(int $raceId): int;

    /**
     * Get all orphaned results for a specific race with driver information.
     * Only relevant when season has divisions enabled.
     *
     * @return array<int, array{id: int, name: string}>
     */
    public function getOrphanedResultsWithDrivers(int $raceId): array;
}
