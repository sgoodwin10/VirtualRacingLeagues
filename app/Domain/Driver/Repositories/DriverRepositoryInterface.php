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
     * Returns null if not found.
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
     * @return array{data: array<LeagueDriver>, driver_data: array<int, Driver>, total: int, per_page: int, current_page: int, last_page: int}
     */
    public function getLeagueDrivers(
        int $leagueId,
        ?string $search = null,
        ?string $status = null,
        int $page = 1,
        int $perPage = 15
    ): array;

    /**
     * Get a single league driver association.
     *
     * @return array{league_driver: LeagueDriver, driver: Driver}
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
     * Check if driver is in league.
     */
    public function isDriverInLeague(int $leagueId, int $driverId): bool;

    /**
     * Get count of drivers in a league by status.
     *
     * @return array{total: int, active: int, inactive: int, banned: int}
     */
    public function getLeagueDriverCounts(int $leagueId): array;
}
