<?php

declare(strict_types=1);

namespace App\Domain\Driver\Repositories;

use App\Domain\Driver\Entities\Driver;
use App\Domain\Driver\Entities\LeagueDriver;

interface DriverRepositoryInterface
{
    /**
     * Find driver by ID.
     *
     * @throws \App\Domain\Driver\Exceptions\DriverNotFoundException
     */
    public function findById(int $id): Driver;

    /**
     * Find driver by platform ID (PSN, iRacing, or Discord).
     *
     * Uses OR logic to match ANY of the provided platform IDs.
     * This is correct behavior because a driver is considered the same person
     * if ANY of their platform IDs match (e.g., same PSN_ID = same driver).
     *
     * @param  string|null  $psnId  PlayStation Network ID to search for
     * @param  string|null  $iracingId  iRacing username to search for
     * @param  int|null  $iracingCustomerId  iRacing customer ID to search for
     * @param  string|null  $discordId  Discord ID to search for
     * @return Driver|null Returns the driver if ANY platform ID matches, null if none match
     */
    public function findByPlatformId(
        ?string $psnId,
        ?string $iracingId,
        ?int $iracingCustomerId,
        ?string $discordId = null
    ): ?Driver;

    /**
     * Save a driver (create or update).
     */
    public function save(Driver $driver): void;

    /**
     * Delete a driver (soft delete).
     */
    public function delete(Driver $driver): void;

    /**
     * Check if driver exists by platform IDs in a specific league.
     *
     * Uses OR logic to check if ANY of the provided platform IDs exist in the league.
     * This is correct behavior because it prevents duplicate driver entries for the same person.
     * If ANY platform ID matches an existing league driver, they are already in the league.
     *
     * @param  int  $leagueId  The league ID to check within
     * @param  string|null  $psnId  PlayStation Network ID to check
     * @param  string|null  $iracingId  iRacing username to check
     * @param  int|null  $iracingCustomerId  iRacing customer ID to check
     * @param  string|null  $discordId  Discord ID to check
     * @return bool True if a driver with ANY of these platform IDs exists in the league
     */
    public function existsInLeagueByPlatformId(
        int $leagueId,
        ?string $psnId,
        ?string $iracingId,
        ?int $iracingCustomerId,
        ?string $discordId = null
    ): bool;

    /**
     * Get all drivers in a league with pagination and filtering.
     *
     * @param  string|null  $deletedStatus  Filter by deleted status: 'active' (not deleted), 'deleted', 'all'
     * @return array{
     *     data: array<LeagueDriver>,
     *     driver_data: array<int, Driver>,
     *     total: int,
     *     per_page: int,
     *     current_page: int,
     *     last_page: int
     * }
     */
    public function getLeagueDrivers(
        int $leagueId,
        ?string $search = null,
        ?string $status = null,
        int $page = 1,
        int $perPage = 15,
        ?string $deletedStatus = 'active'
    ): array;

    /**
     * Get a single league driver association.
     *
     * @return array{league_driver: LeagueDriver, driver: Driver}
     *
     * @throws \App\Domain\Driver\Exceptions\DriverNotFoundException
     */
    public function getLeagueDriver(int $leagueId, int $driverId): array;

    /**
     * Add a driver to a league.
     */
    public function addToLeague(LeagueDriver $leagueDriver): void;

    /**
     * Update league-driver association.
     */
    public function updateLeagueDriver(LeagueDriver $leagueDriver): void;

    /**
     * Remove driver from league.
     */
    public function removeFromLeague(int $leagueId, int $driverId): void;

    /**
     * Soft delete a driver by ID.
     */
    public function softDeleteDriver(int $driverId): void;

    /**
     * Restore a soft-deleted driver by ID.
     */
    public function restoreDriver(int $driverId): void;

    /**
     * Check if driver is in league.
     */
    public function isDriverInLeague(int $leagueId, int $driverId): bool;

    /**
     * Get count of drivers in a league by status.
     *
     * @return array{total: int, active: int, inactive: int, banned: int}
     */
    public function getLeagueDriverCounts(int $leagueId): array;

    /**
     * Get all drivers (admin context) with pagination and filtering.
     *
     * @return array{data: array<Driver>, total: int, per_page: int, current_page: int, last_page: int}
     */
    public function getAllDriversPaginated(
        ?string $search = null,
        int $page = 1,
        int $perPage = 15,
        string $orderBy = 'created_at',
        string $orderDirection = 'desc'
    ): array;

    /**
     * Get all leagues a driver belongs to.
     *
     * @return array<int, array{id: int, name: string, status: string, role: string|null, joined_at: string|null}>
     */
    public function getDriverLeagues(int $driverId): array;

    /**
     * Get all seasons a driver has participated in.
     *
     * @return array<int, array{id: int, name: string, league_name: string, status: string}>
     */
    public function getDriverSeasons(int $driverId): array;

    /**
     * Get race statistics for a driver.
     *
     * @return array{
     *     races: int,
     *     wins: int,
     *     podiums: int,
     *     poles: int,
     *     fastest_laps: int,
     *     dnfs: int,
     *     best_finish: int|null
     * }
     */
    public function getDriverRaceStats(int $driverId): array;

    /**
     * Get linked user account for a driver.
     *
     * @return array{id: int, name: string, email: string}|null
     */
    public function getLinkedUser(int $driverId): ?array;

    /**
     * Get all seasons a league driver is participating in.
     *
     * @return array<int, array{
     *     season_id: int,
     *     season_name: string,
     *     season_slug: string,
     *     season_status: string,
     *     competition_id: int,
     *     competition_name: string,
     *     competition_slug: string,
     *     division_name: string|null,
     *     team_name: string|null,
     *     added_at: string
     * }>
     */
    public function getSeasonsForLeagueDriver(int $leagueDriverId): array;
}
