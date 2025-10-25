<?php

declare(strict_types=1);

namespace App\Domain\Competition\Repositories;

use App\Domain\Competition\Entities\Race;

interface RaceRepositoryInterface
{
    public function save(Race $race): void;

    public function findById(int $id): Race;

    /**
     * @return array<Race>
     */
    public function findByRoundId(int $roundId): array;

    public function delete(Race $race): void;

    public function getNextRaceNumber(int $roundId): int;

    public function exists(int $id): bool;

    // Qualifier-specific methods
    public function findQualifierById(int $id): Race;

    public function findQualifierByRoundId(int $roundId): ?Race;

    public function qualifierExistsForRound(int $roundId): bool;
}
