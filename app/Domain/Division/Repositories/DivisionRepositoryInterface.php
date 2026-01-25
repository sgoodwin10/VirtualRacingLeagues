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

    /**
     * Get the next available order number for a season.
     */
    public function getNextOrderForSeason(int $seasonId): int;

    /**
     * Renumber divisions for a season sequentially (1, 2, 3, ...).
     * Called after deletion to maintain sequential ordering.
     */
    public function renumberDivisionsForSeason(int $seasonId): void;

    /**
     * Bulk update division orders.
     *
     * @param  array<int, int>  $divisionOrders  Map of division ID to new order number
     */
    public function bulkUpdateOrders(array $divisionOrders): void;

    /**
     * Batch fetch division names for multiple division IDs.
     * Used to avoid N+1 queries when fetching division names.
     *
     * @param  array<int>  $divisionIds
     * @return array<int, string> Map of division ID => division name
     */
    public function findNamesByIds(array $divisionIds): array;

    /**
     * Batch fetch division data (name and order) for multiple division IDs.
     * Used to avoid N+1 queries when fetching division data.
     *
     * @param  array<int>  $divisionIds
     * @return array<int, array{name: string, order: int}> Map of division ID => division data
     */
    public function findDataByIds(array $divisionIds): array;
}
