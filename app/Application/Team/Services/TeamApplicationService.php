<?php

declare(strict_types=1);

namespace App\Application\Team\Services;

use App\Application\Team\DTOs\AssignDriverTeamData;
use App\Application\Team\DTOs\CreateTeamData;
use App\Application\Team\DTOs\TeamData;
use App\Application\Team\DTOs\UpdateTeamData;
use App\Domain\Competition\Repositories\CompetitionRepositoryInterface;
use App\Domain\Competition\Repositories\SeasonDriverRepositoryInterface;
use App\Domain\Competition\Repositories\SeasonRepositoryInterface;
use App\Domain\League\Repositories\LeagueRepositoryInterface;
use App\Domain\Shared\Exceptions\UnauthorizedException;
use App\Domain\Team\Entities\Team;
use App\Domain\Team\Exceptions\TeamNotFoundException;
use App\Domain\Team\Repositories\TeamRepositoryInterface;
use App\Domain\Team\ValueObjects\TeamName;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonDriverEloquent;
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
        private readonly SeasonRepositoryInterface $seasonRepository,
        private readonly CompetitionRepositoryInterface $competitionRepository,
        private readonly LeagueRepositoryInterface $leagueRepository,
    ) {
    }

    /**
     * Create a new team.
     *
     * @throws UnauthorizedException
     */
    public function createTeam(CreateTeamData $data, int $seasonId, int $userId): TeamData
    {
        return DB::transaction(function () use ($data, $seasonId, $userId) {
            // Authorize user owns the league
            $this->authorizeSeasonOwner($seasonId, $userId);
            // Store logo if provided
            $logoPath = null;
            if ($data->logo) {
                $logoPath = $data->logo->store('teams/logos', 'public');
                if (! $logoPath) {
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
     *
     * @throws UnauthorizedException
     */
    public function updateTeam(int $teamId, UpdateTeamData $data, int $userId): TeamData
    {
        return DB::transaction(function () use ($teamId, $data, $userId) {
            $team = $this->teamRepository->findById($teamId);

            // Authorize user owns the league
            $this->authorizeSeasonOwner($team->seasonId(), $userId);

            // Store new logo if provided
            $logoPath = null;
            if ($data->logo) {
                // Delete old logo if exists
                if ($team->logoUrl()) {
                    Storage::disk('public')->delete($team->logoUrl());
                }

                $logoPath = $data->logo->store('teams/logos', 'public');
                if (! $logoPath) {
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
     *
     * @throws UnauthorizedException
     */
    public function deleteTeam(int $teamId, int $userId): void
    {
        DB::transaction(function () use ($teamId, $userId) {
            $team = $this->teamRepository->findById($teamId);

            // Authorize user owns the league
            $this->authorizeSeasonOwner($team->seasonId(), $userId);

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
            fn (Team $team) => TeamData::fromEntity($team),
            $teams
        );
    }

    /**
     * Assign a driver to a team (or make them Privateer).
     *
     * @param  int  $seasonDriverId  The season_driver ID (not driver ID)
     * @param  AssignDriverTeamData  $data  Contains team_id or null for Privateer
     * @return array{
     *     id: int,
     *     season_id: int,
     *     league_driver_id: int,
     *     driver_id: int,
     *     first_name: string|null,
     *     last_name: string|null,
     *     nickname: string|null,
     *     driver_number: string|null,
     *     psn_id: string|null,
     *     iracing_id: string|null,
     *     discord_id: string|null,
     *     team_name: string|null,
     *     status: string,
     *     is_active: bool,
     *     is_reserve: bool,
     *     is_withdrawn: bool,
     *     notes: string|null,
     *     added_at: string,
     *     updated_at: string
     * }
     *
     * @throws UnauthorizedException
     */
    public function assignDriverToTeam(int $seasonDriverId, AssignDriverTeamData $data, int $userId): array
    {
        return DB::transaction(function () use ($seasonDriverId, $data, $userId) {
            // Fetch the season driver to get the season ID for authorization
            $seasonDriverModel = $this->seasonDriverRepository->findByIdWithRelations($seasonDriverId);

            // Authorize user owns the league
            $this->authorizeSeasonOwner($seasonDriverModel->season_id, $userId);

            // If team_id is provided, verify it exists
            if ($data->team_id !== null) {
                $this->teamRepository->findById($data->team_id);
            }

            // Update season_driver.team_id
            $this->seasonDriverRepository->updateTeamId($seasonDriverId, $data->team_id);

            // Fetch the updated season driver with all relationships
            $seasonDriverModel = $this->seasonDriverRepository->findByIdWithRelations($seasonDriverId);

            // Convert to array format matching SeasonDriverData
            return $this->toSeasonDriverArray($seasonDriverModel);
        });
    }

    /**
     * Convert SeasonDriverEloquent model to array format matching SeasonDriverData.
     *
     * @return array{
     *     id: int,
     *     season_id: int,
     *     league_driver_id: int,
     *     driver_id: int,
     *     first_name: string|null,
     *     last_name: string|null,
     *     nickname: string|null,
     *     driver_number: string|null,
     *     psn_id: string|null,
     *     iracing_id: string|null,
     *     discord_id: string|null,
     *     team_name: string|null,
     *     status: string,
     *     is_active: bool,
     *     is_reserve: bool,
     *     is_withdrawn: bool,
     *     notes: string|null,
     *     added_at: string,
     *     updated_at: string
     * }
     */
    private function toSeasonDriverArray(SeasonDriverEloquent $seasonDriverModel): array
    {
        $leagueDriver = $seasonDriverModel->leagueDriver;
        $driver = $leagueDriver->driver ?? null;
        $team = $seasonDriverModel->team;

        // Prefer team name from season team relationship, fallback to league driver's team_name
        $teamName = $team !== null ? $team->name : $leagueDriver->team_name;

        return [
            'id' => $seasonDriverModel->id,
            'season_id' => $seasonDriverModel->season_id,
            'league_driver_id' => $seasonDriverModel->league_driver_id,
            'driver_id' => $leagueDriver->driver_id,
            'first_name' => $driver?->first_name,
            'last_name' => $driver?->last_name,
            'nickname' => $driver?->nickname,
            'driver_number' => $leagueDriver->number !== null ? (string) $leagueDriver->number : null,
            'psn_id' => $driver?->psn_id,
            'iracing_id' => $driver?->iracing_id,
            'discord_id' => $driver?->discord_id,
            'team_name' => $teamName,
            'status' => $seasonDriverModel->status,
            'is_active' => $seasonDriverModel->status === 'active',
            'is_reserve' => $seasonDriverModel->status === 'reserve',
            'is_withdrawn' => $seasonDriverModel->status === 'withdrawn',
            'notes' => $seasonDriverModel->notes,
            'added_at' => $seasonDriverModel->added_at->format('Y-m-d H:i:s'),
            'updated_at' => $seasonDriverModel->updated_at->format('Y-m-d H:i:s'),
        ];
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

    /**
     * Authorize that user owns the league for the given season.
     *
     * @throws UnauthorizedException
     */
    private function authorizeSeasonOwner(int $seasonId, int $userId): void
    {
        // Get season -> competition -> league chain
        $season = $this->seasonRepository->findById($seasonId);
        $competition = $this->competitionRepository->findById($season->competitionId());
        $league = $this->leagueRepository->findById($competition->leagueId());

        if ($league->ownerUserId() !== $userId) {
            throw new UnauthorizedException('Only league owner can manage teams');
        }
    }
}
