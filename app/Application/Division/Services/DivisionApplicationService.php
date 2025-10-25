<?php

declare(strict_types=1);

namespace App\Application\Division\Services;

use App\Application\Division\DTOs\AssignDriverDivisionData;
use App\Application\Division\DTOs\CreateDivisionData;
use App\Application\Division\DTOs\DivisionData;
use App\Application\Division\DTOs\UpdateDivisionData;
use App\Domain\Competition\Repositories\SeasonDriverRepositoryInterface;
use App\Domain\Division\Entities\Division;
use App\Domain\Division\Exceptions\DivisionNotFoundException;
use App\Domain\Division\Repositories\DivisionRepositoryInterface;
use App\Domain\Division\ValueObjects\DivisionDescription;
use App\Domain\Division\ValueObjects\DivisionName;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonDriverEloquent;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;

/**
 * Division Application Service.
 * Orchestrates division use cases and coordinates domain logic.
 */
final class DivisionApplicationService
{
    public function __construct(
        private readonly DivisionRepositoryInterface $divisionRepository,
        private readonly SeasonDriverRepositoryInterface $seasonDriverRepository,
    ) {
    }

    /**
     * Create a new division.
     */
    public function createDivision(CreateDivisionData $data, int $seasonId): DivisionData
    {
        return DB::transaction(function () use ($data, $seasonId) {
            // Store logo if provided
            $logoPath = null;
            if ($data->logo) {
                $logoPath = $data->logo->store("divisions/season-{$seasonId}", 'public');
                if (!$logoPath) {
                    throw new \RuntimeException('Failed to store division logo');
                }
            }

            // Create domain entity
            $division = Division::create(
                seasonId: $seasonId,
                name: DivisionName::from($data->name),
                description: DivisionDescription::from($data->description),
                logoUrl: $logoPath,
            );

            // Persist
            $this->divisionRepository->save($division);

            // Record creation event now that ID is set
            $division->recordCreationEvent();

            // Dispatch domain events
            $this->dispatchEvents($division);

            return DivisionData::fromEntity($division);
        });
    }

    /**
     * Update an existing division.
     */
    public function updateDivision(int $divisionId, UpdateDivisionData $data): DivisionData
    {
        return DB::transaction(function () use ($divisionId, $data) {
            $division = $this->divisionRepository->findById($divisionId);

            // Store new logo if provided
            $logoPath = null;
            if ($data->logo) {
                // Delete old logo if exists
                if ($division->logoUrl()) {
                    Storage::disk('public')->delete($division->logoUrl());
                }

                $logoPath = $data->logo->store("divisions/season-{$division->seasonId()}", 'public');
                if (!$logoPath) {
                    throw new \RuntimeException('Failed to store division logo');
                }
            }

            // Update division details
            if ($data->name !== null || $data->description !== null || $logoPath !== null) {
                $division->updateDetails(
                    name: $data->name !== null ? DivisionName::from($data->name) : $division->name(),
                    description: $data->description !== null
                        ? DivisionDescription::from($data->description)
                        : $division->description(),
                    logoUrl: $logoPath ?? $division->logoUrl(),
                );
            }

            // Persist
            $this->divisionRepository->save($division);

            // Dispatch domain events
            $this->dispatchEvents($division);

            return DivisionData::fromEntity($division);
        });
    }

    /**
     * Delete a division.
     * This will cascade to set all season_drivers.division_id to NULL.
     */
    public function deleteDivision(int $divisionId): void
    {
        DB::transaction(function () use ($divisionId) {
            $division = $this->divisionRepository->findById($divisionId);

            // Delete logo if exists
            if ($division->logoUrl()) {
                Storage::disk('public')->delete($division->logoUrl());
            }

            // Mark for deletion (records domain event)
            $division->delete();

            // Dispatch domain events
            $this->dispatchEvents($division);

            // Perform hard delete (this will cascade to season_drivers.division_id)
            $this->divisionRepository->delete($division);
        });
    }

    /**
     * Get division by ID.
     *
     * @throws DivisionNotFoundException
     */
    public function getDivisionById(int $divisionId): DivisionData
    {
        $division = $this->divisionRepository->findById($divisionId);
        return DivisionData::fromEntity($division);
    }

    /**
     * Get all divisions for a specific season.
     *
     * @return array<DivisionData>
     */
    public function getDivisionsBySeasonId(int $seasonId): array
    {
        $divisions = $this->divisionRepository->findBySeasonId($seasonId);

        return array_map(
            fn(Division $division) => DivisionData::fromEntity($division),
            $divisions
        );
    }

    /**
     * Get driver count for a specific division.
     */
    public function getDriverCount(int $divisionId): int
    {
        return $this->divisionRepository->getDriverCount($divisionId);
    }

    /**
     * Assign a driver to a division (or remove division assignment).
     *
     * @param int $seasonDriverId The season_driver ID (not driver ID)
     * @param AssignDriverDivisionData $data Contains division_id or null to remove assignment
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
     *     division_name: string|null,
     *     status: string,
     *     is_active: bool,
     *     is_reserve: bool,
     *     is_withdrawn: bool,
     *     notes: string|null,
     *     added_at: string,
     *     updated_at: string
     * }
     */
    public function assignDriverToDivision(int $seasonDriverId, AssignDriverDivisionData $data): array
    {
        return DB::transaction(function () use ($seasonDriverId, $data) {
            // If division_id is provided, verify it exists
            if ($data->division_id !== null) {
                $this->divisionRepository->findById($data->division_id);
            }

            // Update season_driver.division_id
            $this->seasonDriverRepository->updateDivisionId($seasonDriverId, $data->division_id);

            // Fetch the updated season driver with all relationships
            $seasonDriverModel = $this->seasonDriverRepository->findByIdWithRelations($seasonDriverId);

            // Convert to array format matching SeasonDriverData
            return $this->toSeasonDriverArray($seasonDriverModel);
        });
    }

    /**
     * Convert SeasonDriverEloquent model to array format matching SeasonDriverData.
     *
     * @param SeasonDriverEloquent $seasonDriverModel
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
     *     division_name: string|null,
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
        $division = $seasonDriverModel->division;

        // Prefer team name from season team relationship, fallback to league driver's team_name
        $teamName = $team !== null ? $team->name : $leagueDriver->team_name;

        // Get division name from season division relationship
        $divisionName = $division?->name;

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
            'division_name' => $divisionName,
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
    private function dispatchEvents(Division $division): void
    {
        foreach ($division->releaseEvents() as $event) {
            Event::dispatch($event);
        }
    }
}
