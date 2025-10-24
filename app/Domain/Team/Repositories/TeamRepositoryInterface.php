<?php

declare(strict_types=1);

namespace App\Domain\Team\Repositories;

use App\Domain\Team\Entities\Team;
use App\Domain\Team\Exceptions\TeamNotFoundException;

/**
 * Repository interface for Team entity.
 */
interface TeamRepositoryInterface
{
    /**
     * Save a team (create or update).
     */
    public function save(Team $team): void;

    /**
     * Find a team by ID.
     *
     * @throws TeamNotFoundException
     */
    public function findById(int $id): Team;

    /**
     * Find all teams for a specific season.
     *
     * @return array<Team>
     */
    public function findBySeasonId(int $seasonId): array;

    /**
     * Delete a team.
     * This will cascade to set all season_drivers.team_id to NULL.
     */
    public function delete(Team $team): void;

    /**
     * Check if a team exists by ID.
     */
    public function exists(int $id): bool;

    /**
     * Check if a team exists in a specific season.
     */
    public function existsInSeason(int $teamId, int $seasonId): bool;
}
