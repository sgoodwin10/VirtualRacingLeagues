<?php

declare(strict_types=1);

namespace App\Domain\Competition\Repositories;

use App\Domain\Competition\Entities\SeasonDriver;
use App\Domain\Competition\Exceptions\SeasonDriverNotFoundException;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonDriverEloquent;

/**
 * SeasonDriver Repository Interface.
 *
 * Defines contract for season-driver persistence operations.
 */
interface SeasonDriverRepositoryInterface
{
    /**
     * Save a season-driver association (create or update).
     *
     * @throws \Exception
     */
    public function save(SeasonDriver $seasonDriver): void;

    /**
     * Find season-driver by ID.
     *
     * @throws SeasonDriverNotFoundException
     */
    public function findById(int $id): SeasonDriver;

    /**
     * Find season-driver by league driver and season.
     *
     * @throws SeasonDriverNotFoundException
     */
    public function findByLeagueDriverAndSeason(int $leagueDriverId, int $seasonId): SeasonDriver;

    /**
     * Check if league driver exists in season.
     */
    public function existsInSeason(int $leagueDriverId, int $seasonId): bool;

    /**
     * Get all drivers for a season.
     *
     * @return array<SeasonDriver>
     */
    public function findBySeason(int $seasonId): array;

    /**
     * Get drivers for a season with optional filters.
     *
     * @param  array<string, mixed>  $filters
     * @return array<SeasonDriver>
     */
    public function findBySeasonWithFilters(int $seasonId, array $filters = []): array;

    /**
     * Count drivers in a season.
     */
    public function countDriversInSeason(int $seasonId): int;

    /**
     * Count active drivers in a season.
     */
    public function countActiveDriversInSeason(int $seasonId): int;

    /**
     * Delete a season-driver association.
     */
    public function delete(SeasonDriver $seasonDriver): void;

    /**
     * Delete all season-drivers for a season.
     * Used when season is deleted.
     */
    public function deleteAllForSeason(int $seasonId): void;

    /**
     * Bulk add league drivers to a season.
     *
     * @param  int[]  $leagueDriverIds
     * @return int Number of drivers added
     */
    public function bulkAdd(int $seasonId, array $leagueDriverIds, string $status = 'active'): int;

    /**
     * Get paginated season drivers with optional filters.
     *
     * @param  array<string, mixed>  $filters  Optional filters (search, status,
     *                                         division_id, team_id, order_by, order_direction)
     * @return array{data: array<SeasonDriver>, total: int, per_page: int, current_page: int}
     */
    public function findBySeasonPaginated(int $seasonId, int $page, int $perPage, array $filters = []): array;

    /**
     * Update the team_id for a season driver.
     * Used when assigning/unassigning drivers to teams.
     *
     * @param  int|null  $teamId  Null for "Privateer" (no team)
     */
    public function updateTeamId(int $seasonDriverId, ?int $teamId): void;

    /**
     * Update the division_id for a season driver.
     * Used when assigning/unassigning drivers to divisions.
     *
     * @param  int|null  $divisionId  Null to remove division assignment
     */
    public function updateDivisionId(int $seasonDriverId, ?int $divisionId): void;

    /**
     * Find season driver by ID with all relationships loaded.
     * Used after team assignment to return complete driver data.
     *
     * @throws SeasonDriverNotFoundException
     */
    public function findByIdWithRelations(int $seasonDriverId): SeasonDriverEloquent;

    /**
     * Batch fetch driver names for multiple season driver IDs.
     * Used to avoid N+1 queries when fetching driver names.
     *
     * @param  array<int>  $seasonDriverIds
     * @return array<int, string> Map of season driver ID => driver name
     */
    public function findDriverNamesByIds(array $seasonDriverIds): array;

    /**
     * Get mapping of league_driver_id to driver_id for all drivers in a season.
     * Used to avoid N+1 queries when mapping league drivers to actual drivers.
     *
     * @return array<int, int> Map of league_driver_id => driver_id
     */
    public function getLeagueDriverToDriverIdMap(int $seasonId): array;

    /**
     * Batch fetch team IDs for season drivers.
     * Returns a map of season_driver_id => team_id|null.
     *
     * Note: The $seasonDriverIds are season_drivers.id values (from round_results JSON).
     *
     * @param  array<int>  $seasonDriverIds  List of season driver IDs (season_drivers.id)
     * @return array<int, int|null> Map of season driver ID => team ID (null if not on a team)
     */
    public function findTeamIdsByDriverIds(int $seasonId, array $seasonDriverIds): array;
}
