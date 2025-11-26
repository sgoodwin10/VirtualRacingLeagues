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

    public function findByRaceAndDriver(int $raceId, int $driverId): ?RaceResult;

    public function delete(RaceResult $result): void;

    public function deleteByRaceId(int $raceId): void;
}
