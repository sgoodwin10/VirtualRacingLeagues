<?php

declare(strict_types=1);

namespace App\Domain\Division\Repositories;

use App\Domain\Division\Entities\Division;
use App\Domain\Division\Exceptions\DivisionNotFoundException;

/**
 * Repository interface for Division aggregate.
 */
interface DivisionRepositoryInterface
{
    /**
     * Save a division (create or update).
     */
    public function save(Division $division): void;

    /**
     * Find division by ID.
     *
     * @throws DivisionNotFoundException
     */
    public function findById(int $id): Division;

    /**
     * Find all divisions for a specific season.
     *
     * @return array<Division>
     */
    public function findBySeasonId(int $seasonId): array;

    /**
     * Find all divisions for a specific season, returning an array of [id => name].
     *
     * @return array<int, string> Division ID => Division Name
     */
    public function findNamesBySeasonId(int $seasonId): array;

    /**
     * Delete a division.
     * This will cascade to set all season_drivers.division_id to NULL.
     */
    public function delete(Division $division): void;

    /**
     * Get driver count for a specific division.
     */
    public function getDriverCount(int $divisionId): int;
}
