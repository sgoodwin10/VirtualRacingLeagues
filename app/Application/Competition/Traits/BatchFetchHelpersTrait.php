<?php

declare(strict_types=1);

namespace App\Application\Competition\Traits;

/**
 * Trait BatchFetchHelpersTrait
 *
 * Provides batch fetch helper methods to avoid N+1 queries
 * when fetching driver names and division names.
 *
 * This trait uses repository interfaces to maintain DDD layering.
 * Services using this trait must have:
 * - SeasonDriverRepositoryInterface injected as $seasonDriverRepository
 * - DivisionRepositoryInterface injected as $divisionRepository
 */
trait BatchFetchHelpersTrait
{
    /**
     * Batch fetch driver names for multiple season driver IDs to avoid N+1 queries.
     *
     * @param  array<int>  $seasonDriverIds
     * @return array<int, string> Map of season driver ID => driver name
     */
    private function batchFetchDriverNames(array $seasonDriverIds): array
    {
        return $this->seasonDriverRepository->findDriverNamesByIds($seasonDriverIds);
    }

    /**
     * Batch fetch division names for multiple division IDs to avoid N+1 queries.
     *
     * @param  array<int>  $divisionIds
     * @return array<int, string> Map of division ID => division name
     */
    private function batchFetchDivisionNames(array $divisionIds): array
    {
        return $this->divisionRepository->findNamesByIds($divisionIds);
    }

    /**
     * Batch fetch division data (name and order) for multiple division IDs to avoid N+1 queries.
     *
     * @param  array<int>  $divisionIds
     * @return array<int, array{name: string, order: int}> Map of division ID => division data
     */
    private function batchFetchDivisionData(array $divisionIds): array
    {
        return $this->divisionRepository->findDataByIds($divisionIds);
    }

    /**
     * Batch fetch team data for multiple team IDs to avoid N+1 queries.
     *
     * @param  array<int>  $teamIds
     * @return array<int, array{name: string, logo_url: string|null}> Map of team ID => team data
     */
    private function batchFetchTeamData(array $teamIds): array
    {
        return $this->teamRepository->findDataByIds($teamIds);
    }

    /**
     * Batch fetch team IDs for season drivers.
     * Returns a map of season_driver_id => team_id|null.
     *
     * Note: The $seasonDriverIds are season_drivers.id values (from round_results JSON).
     *
     * @param  array<int>  $seasonDriverIds  List of season driver IDs (season_drivers.id)
     * @return array<int, int|null> Map of season driver ID => team ID (null if not on a team)
     */
    private function batchFetchDriverTeams(int $seasonId, array $seasonDriverIds): array
    {
        return $this->seasonDriverRepository->findTeamIdsByDriverIds($seasonId, $seasonDriverIds);
    }
}
