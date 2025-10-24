<?php

declare(strict_types=1);

namespace App\Application\Team\Services;

use App\Application\Team\DTOs\AssignDriverTeamData;
use App\Application\Team\DTOs\CreateTeamData;
use App\Application\Team\DTOs\TeamData;
use App\Application\Team\DTOs\UpdateTeamData;
use App\Domain\Competition\Repositories\SeasonDriverRepositoryInterface;
use App\Domain\Team\Entities\Team;
use App\Domain\Team\Exceptions\TeamNotFoundException;
use App\Domain\Team\Repositories\TeamRepositoryInterface;
use App\Domain\Team\ValueObjects\TeamName;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;

/**
 * Team Application Service.
 * Orchestrates team use cases and coordinates domain logic.
 */
final class TeamApplicationService
{
    public function __construct(
        private readonly TeamRepositoryInterface $teamRepository,
        private readonly SeasonDriverRepositoryInterface $seasonDriverRepository,
    ) {
    }

    /**
     * Create a new team.
     */
    public function createTeam(CreateTeamData $data, int $seasonId): TeamData
    {
        return DB::transaction(function () use ($data, $seasonId) {
            // Store logo if provided
            $logoPath = null;
            if ($data->logo) {
                $logoPath = $data->logo->store('teams/logos', 'public');
                if (!$logoPath) {
                    throw new \RuntimeException('Failed to store team logo');
                }
            }

            // Create domain entity
            $team = Team::create(
                seasonId: $seasonId,
                name: TeamName::from($data->name),
                logoUrl: $logoPath,
            );

            // Persist
            $this->teamRepository->save($team);

            // Record creation event now that ID is set
            $team->recordCreationEvent();

            // Dispatch domain events
            $this->dispatchEvents($team);

            return TeamData::fromEntity($team);
        });
    }

    /**
     * Update an existing team.
     */
    public function updateTeam(int $teamId, UpdateTeamData $data): TeamData
    {
        return DB::transaction(function () use ($teamId, $data) {
            $team = $this->teamRepository->findById($teamId);

            // Store new logo if provided
            $logoPath = null;
            if ($data->logo) {
                // Delete old logo if exists
                if ($team->logoUrl()) {
                    Storage::disk('public')->delete($team->logoUrl());
                }

                $logoPath = $data->logo->store('teams/logos', 'public');
                if (!$logoPath) {
                    throw new \RuntimeException('Failed to store team logo');
                }
            }

            // Update team details
            if ($data->name !== null || $logoPath !== null) {
                $team->updateDetails(
                    name: $data->name !== null ? TeamName::from($data->name) : $team->name(),
                    logoUrl: $logoPath ?? $team->logoUrl(),
                );
            }

            // Persist
            $this->teamRepository->save($team);

            // Dispatch domain events
            $this->dispatchEvents($team);

            return TeamData::fromEntity($team);
        });
    }

    /**
     * Delete a team.
     * This will cascade to set all season_drivers.team_id to NULL.
     */
    public function deleteTeam(int $teamId): void
    {
        DB::transaction(function () use ($teamId) {
            $team = $this->teamRepository->findById($teamId);

            // Delete logo if exists
            if ($team->logoUrl()) {
                Storage::disk('public')->delete($team->logoUrl());
            }

            // Mark for deletion (records domain event)
            $team->delete();

            // Dispatch domain events
            $this->dispatchEvents($team);

            // Perform hard delete (this will cascade to season_drivers.team_id)
            $this->teamRepository->delete($team);
        });
    }

    /**
     * Get team by ID.
     *
     * @throws TeamNotFoundException
     */
    public function getTeamById(int $teamId): TeamData
    {
        $team = $this->teamRepository->findById($teamId);
        return TeamData::fromEntity($team);
    }

    /**
     * Get all teams for a specific season.
     *
     * @return array<TeamData>
     */
    public function getTeamsBySeasonId(int $seasonId): array
    {
        $teams = $this->teamRepository->findBySeasonId($seasonId);

        return array_map(
            fn(Team $team) => TeamData::fromEntity($team),
            $teams
        );
    }

    /**
     * Assign a driver to a team (or make them Privateer).
     *
     * @param int $seasonDriverId The season_driver ID (not driver ID)
     * @param AssignDriverTeamData $data Contains team_id or null for Privateer
     */
    public function assignDriverToTeam(int $seasonDriverId, AssignDriverTeamData $data): void
    {
        DB::transaction(function () use ($seasonDriverId, $data) {
            // If team_id is provided, verify it exists
            if ($data->team_id !== null) {
                $this->teamRepository->findById($data->team_id);
            }

            // Update season_driver.team_id
            $this->seasonDriverRepository->updateTeamId($seasonDriverId, $data->team_id);
        });
    }

    /**
     * Dispatch domain events.
     */
    private function dispatchEvents(Team $team): void
    {
        foreach ($team->releaseEvents() as $event) {
            Event::dispatch($event);
        }
    }
}
