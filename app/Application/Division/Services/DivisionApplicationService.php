<?php

declare(strict_types=1);

namespace App\Application\Division\Services;

use App\Application\Division\DTOs\AssignDriverDivisionData;
use App\Application\Division\DTOs\CreateDivisionData;
use App\Application\Division\DTOs\DivisionData;
use App\Application\Division\DTOs\ReorderDivisionsData;
use App\Application\Division\DTOs\UpdateDivisionData;
use App\Domain\Competition\Entities\Season;
use App\Domain\Competition\Repositories\CompetitionRepositoryInterface;
use App\Domain\Competition\Repositories\SeasonDriverRepositoryInterface;
use App\Domain\Competition\Repositories\SeasonRepositoryInterface;
use App\Domain\Division\Entities\Division;
use App\Domain\Division\Exceptions\DivisionNotFoundException;
use App\Domain\Division\Repositories\DivisionRepositoryInterface;
use App\Domain\Division\ValueObjects\DivisionDescription;
use App\Domain\Division\ValueObjects\DivisionName;
use App\Domain\League\Repositories\LeagueRepositoryInterface;
use App\Domain\Shared\Exceptions\UnauthorizedException;
use App\Infrastructure\Persistence\Eloquent\Models\Division as DivisionEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonDriverEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\UserEloquent;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Division Application Service.
 * Orchestrates division use cases and coordinates domain logic.
 */
final class DivisionApplicationService
{
    /**
     * Allowed logo file MIME types.
     */
    private const ALLOWED_LOGO_MIME_TYPES = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
    ];

    /**
     * Maximum logo file size in bytes (2MB).
     */
    private const MAX_LOGO_FILE_SIZE = 2 * 1024 * 1024;

    public function __construct(
        private readonly DivisionRepositoryInterface $divisionRepository,
        private readonly SeasonDriverRepositoryInterface $seasonDriverRepository,
        private readonly SeasonRepositoryInterface $seasonRepository,
        private readonly CompetitionRepositoryInterface $competitionRepository,
        private readonly LeagueRepositoryInterface $leagueRepository,
        private readonly \App\Application\Activity\Services\LeagueActivityLogService $activityLogService,
    ) {
    }

    /**
     * Create a new division.
     *
     * @param  CreateDivisionData  $data  The division data
     * @param  int  $seasonId  The season ID
     * @param  int  $userId  The authenticated user ID
     *
     * @throws UnauthorizedException
     */
    public function createDivision(CreateDivisionData $data, int $seasonId, int $userId): DivisionData
    {
        // Authorize FIRST (outside transaction for early failure)
        $season = $this->seasonRepository->findById($seasonId);
        $this->authorizeSeasonOwner($season, $userId);

        // Validate logo file BEFORE transaction (early failure)
        if ($data->logo) {
            $this->validateLogoFile($data->logo);
        }

        return DB::transaction(function () use ($data, $seasonId) {
            // Store logo file INSIDE transaction to prevent orphaned files
            $logoPath = null;
            if ($data->logo) {
                $logoPath = $data->logo->store("divisions/season-{$seasonId}", 'public');
                if (! $logoPath) {
                    throw new \RuntimeException('Failed to store division logo');
                }
            }

            // Get next order number for this season
            $nextOrder = $this->divisionRepository->getNextOrderForSeason($seasonId);

            // Create domain entity
            $division = Division::create(
                seasonId: $seasonId,
                name: DivisionName::from($data->name),
                description: DivisionDescription::from($data->description),
                logoUrl: $logoPath,
                order: $nextOrder,
            );

            // Persist
            $this->divisionRepository->save($division);

            // Record creation event now that ID is set
            $division->recordCreationEvent();

            // Dispatch domain events
            $this->dispatchEvents($division);

            // Log activity
            $this->logDivisionCreated($division->id());

            return DivisionData::fromEntity($division);
        });
    }

    /**
     * Update an existing division.
     *
     * @param  int  $divisionId  The division ID
     * @param  UpdateDivisionData  $data  The division data
     * @param  int  $userId  The authenticated user ID
     *
     * @throws UnauthorizedException
     */
    public function updateDivision(int $divisionId, UpdateDivisionData $data, int $userId): DivisionData
    {
        // Fetch division first (outside transaction)
        $division = $this->divisionRepository->findById($divisionId);

        // Authorize FIRST (outside transaction for early failure)
        $season = $this->seasonRepository->findById($division->seasonId());
        $this->authorizeSeasonOwner($season, $userId);

        // Validate logo file BEFORE transaction (early failure)
        if ($data->logo) {
            $this->validateLogoFile($data->logo);
        }

        // Store old logo path for cleanup AFTER successful transaction
        $oldLogoPath = $division->logoUrl();

        // Capture original data for change tracking BEFORE transaction
        $originalName = $division->name()->value();
        $originalDescription = $division->description()->value();

        return DB::transaction(function () use ($divisionId, $data, $oldLogoPath, $originalName, $originalDescription) {
            // Re-fetch division inside transaction for consistency
            $division = $this->divisionRepository->findById($divisionId);

            // Store new logo file INSIDE transaction to prevent orphaned files
            $logoPath = null;
            if ($data->logo) {
                $logoPath = $data->logo->store("divisions/season-{$division->seasonId()}", 'public');
                if (! $logoPath) {
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

            // Delete old logo AFTER successful transaction (if new logo was uploaded)
            if ($logoPath !== null && $oldLogoPath !== null) {
                Storage::disk('public')->delete($oldLogoPath);
            }

            // Log activity with changes
            $newName = $division->name()->value();
            $newDescription = $division->description()->value();

            $changes = [];
            if ($originalName !== $newName) {
                $changes['name'] = ['old' => $originalName, 'new' => $newName];
            }
            if ($originalDescription !== $newDescription) {
                $changes['description'] = ['old' => $originalDescription, 'new' => $newDescription];
            }
            if ($logoPath !== null) {
                $changes['logo'] = ['old' => $oldLogoPath, 'new' => $logoPath];
            }

            if (! empty($changes)) {
                $this->logDivisionUpdated($divisionId, ['old' => $changes, 'new' => []]);
            }

            return DivisionData::fromEntity($division);
        });
    }

    /**
     * Delete a division.
     * This will cascade to set all season_drivers.division_id to NULL.
     *
     * @param  int  $divisionId  The division ID
     * @param  int  $userId  The authenticated user ID
     *
     * @throws UnauthorizedException
     */
    public function deleteDivision(int $divisionId, int $userId): void
    {
        DB::transaction(function () use ($divisionId, $userId) {
            $division = $this->divisionRepository->findById($divisionId);
            $seasonId = $division->seasonId();

            // Authorize: user must be league owner (MUST BE FIRST - before any database operations)
            $season = $this->seasonRepository->findById($seasonId);
            $this->authorizeSeasonOwner($season, $userId);

            // Delete logo if exists
            if ($division->logoUrl()) {
                Storage::disk('public')->delete($division->logoUrl());
            }

            // Mark for deletion (records domain event)
            $division->delete();

            // Dispatch domain events
            $this->dispatchEvents($division);

            // Log activity BEFORE deletion
            $this->logDivisionDeleted($divisionId);

            // Perform hard delete (this will cascade to season_drivers.division_id)
            $this->divisionRepository->delete($division);

            // Renumber remaining divisions sequentially
            $this->divisionRepository->renumberDivisionsForSeason($seasonId);
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
     * @param  int  $seasonId  The season ID
     * @param  int  $userId  The authenticated user ID
     * @return array<DivisionData>
     *
     * @throws UnauthorizedException
     */
    public function getDivisionsBySeasonId(int $seasonId, int $userId): array
    {
        // Authorize: user must be league owner (MUST BE FIRST - before any database operations)
        $season = $this->seasonRepository->findById($seasonId);
        $this->authorizeSeasonOwner($season, $userId);

        $divisions = $this->divisionRepository->findBySeasonId($seasonId);

        return array_map(
            fn (Division $division) => DivisionData::fromEntity($division),
            $divisions
        );
    }

    /**
     * Get driver count for a specific division.
     *
     * @param  int  $divisionId  The division ID
     * @param  int  $userId  The authenticated user ID
     *
     * @throws UnauthorizedException
     */
    public function getDriverCount(int $divisionId, int $userId): int
    {
        // Fetch the division to get the season
        $division = $this->divisionRepository->findById($divisionId);

        // Authorize: user must be league owner (MUST BE FIRST - before any database operations)
        $season = $this->seasonRepository->findById($division->seasonId());
        $this->authorizeSeasonOwner($season, $userId);

        return $this->divisionRepository->getDriverCount($divisionId);
    }

    /**
     * Reorder divisions for a season.
     *
     * @param  int  $userId  The authenticated user ID
     * @return array<DivisionData>
     */
    public function reorderDivisions(int $seasonId, ReorderDivisionsData $data, int $userId): array
    {
        return DB::transaction(function () use ($seasonId, $data, $userId) {
            // Authorize: user must be league owner (MUST BE FIRST - before any database operations)
            $season = $this->seasonRepository->findById($seasonId);
            $this->authorizeSeasonOwner($season, $userId);

            // Build map of division ID => new order
            $divisionOrders = [];
            foreach ($data->divisions as $divisionOrder) {
                $divisionOrders[$divisionOrder['id']] = $divisionOrder['order'];
            }

            // Fetch all divisions for this season to validate
            $divisions = $this->divisionRepository->findBySeasonId($seasonId);

            // Extract order values for validation
            $orderValues = array_values($divisionOrders);

            // Validate: Check for duplicate order values
            if (count($orderValues) !== count(array_unique($orderValues))) {
                throw new \InvalidArgumentException('Duplicate order values are not allowed');
            }

            // Validate: All divisions in the season must be included
            if (count($divisionOrders) !== count($divisions)) {
                throw new \InvalidArgumentException(
                    'All divisions in the season must be included in the reorder request'
                );
            }

            // Validate: Order numbers must be sequential starting from 1
            sort($orderValues);
            $expectedOrder = range(1, count($orderValues));
            if ($orderValues !== $expectedOrder) {
                throw new \InvalidArgumentException(
                    'Order numbers must be sequential starting from 1 (e.g., 1, 2, 3...)'
                );
            }

            // Validate that all divisions in the reorder request belong to this season
            $divisionIds = array_map(fn (Division $division) => $division->id(), $divisions);
            foreach (array_keys($divisionOrders) as $divisionId) {
                if (! in_array($divisionId, $divisionIds, true)) {
                    throw new \InvalidArgumentException(
                        "Division ID {$divisionId} does not belong to season {$seasonId}"
                    );
                }
            }

            // Update each division's order in domain entities (this will record domain events)
            foreach ($divisions as $division) {
                $divisionId = $division->id();
                if ($divisionId === null) {
                    continue;
                }

                if (isset($divisionOrders[$divisionId])) {
                    $division->changeOrder($divisionOrders[$divisionId]);
                }
            }

            // Bulk update orders in database for performance (single query)
            $this->divisionRepository->bulkUpdateOrders($divisionOrders);

            // Dispatch events AFTER bulk update completes
            foreach ($divisions as $division) {
                $this->dispatchEvents($division);
            }

            // Log activity
            $this->logDivisionsReordered($seasonId);

            // Fetch updated divisions and return
            $updatedDivisions = $this->divisionRepository->findBySeasonId($seasonId);

            return array_map(
                fn (Division $division) => DivisionData::fromEntity($division),
                $updatedDivisions
            );
        });
    }

    /**
     * Assign a driver to a division (or remove division assignment).
     *
     * @param  int  $seasonDriverId  The season_driver ID (not driver ID)
     * @param  AssignDriverDivisionData  $data  Contains division_id or null to remove assignment
     * @param  int  $userId  The authenticated user ID
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
    public function assignDriverToDivision(int $seasonDriverId, AssignDriverDivisionData $data, int $userId): array
    {
        return DB::transaction(function () use ($seasonDriverId, $data, $userId) {
            // If division_id is provided, verify it exists and belongs to a season owned by the user
            if ($data->division_id !== null) {
                $division = $this->divisionRepository->findById($data->division_id);
                $season = $this->seasonRepository->findById($division->seasonId());
                $this->authorizeSeasonOwner($season, $userId);
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

    /**
     * Authorize that the user is the owner of the league for the season.
     *
     * @param  Season  $season  The season entity
     * @param  int  $userId  The user ID to check
     *
     * @throws UnauthorizedException
     */
    private function authorizeSeasonOwner(Season $season, int $userId): void
    {
        $competition = $this->competitionRepository->findById($season->competitionId());
        $league = $this->leagueRepository->findById($competition->leagueId());

        if ($league->ownerUserId() !== $userId) {
            throw new UnauthorizedException('Only league owner can manage divisions');
        }
    }

    /**
     * Validate logo file type and size.
     *
     * @param  \Illuminate\Http\UploadedFile  $file  The uploaded file to validate
     *
     * @throws \InvalidArgumentException if file is invalid
     */
    private function validateLogoFile(\Illuminate\Http\UploadedFile $file): void
    {
        // Validate file MIME type
        $mimeType = $file->getMimeType();
        if (! in_array($mimeType, self::ALLOWED_LOGO_MIME_TYPES, true)) {
            $allowedTypes = implode(', ', self::ALLOWED_LOGO_MIME_TYPES);
            throw new \InvalidArgumentException(
                "Invalid logo file type. Allowed types: {$allowedTypes}. Got: {$mimeType}"
            );
        }

        // Validate file size
        $fileSize = $file->getSize();
        if ($fileSize > self::MAX_LOGO_FILE_SIZE) {
            $maxSizeMb = self::MAX_LOGO_FILE_SIZE / 1024 / 1024;
            $fileSizeMb = round($fileSize / 1024 / 1024, 2);
            throw new \InvalidArgumentException(
                "Logo file size exceeds maximum allowed size of {$maxSizeMb}MB. Got: {$fileSizeMb}MB"
            );
        }
    }

    /**
     * Log division created activity.
     */
    private function logDivisionCreated(?int $divisionId): void
    {
        if ($divisionId === null) {
            return;
        }

        try {
            $user = Auth::user();
            if ($user instanceof UserEloquent) {
                $division = DivisionEloquent::findOrFail($divisionId);
                $this->activityLogService->logDivisionCreated($user, $division);
            }
        } catch (\Exception $e) {
            Log::error('Failed to log division creation activity', [
                'error' => $e->getMessage(),
                'division_id' => $divisionId,
            ]);
        }
    }

    /**
     * Log division updated activity.
     *
     * @param  array<string, mixed>  $changes
     */
    private function logDivisionUpdated(int $divisionId, array $changes): void
    {
        try {
            $user = Auth::user();
            if ($user instanceof UserEloquent) {
                $division = DivisionEloquent::findOrFail($divisionId);
                $this->activityLogService->logDivisionUpdated($user, $division, $changes);
            }
        } catch (\Exception $e) {
            Log::error('Failed to log division update activity', [
                'error' => $e->getMessage(),
                'division_id' => $divisionId,
            ]);
        }
    }

    /**
     * Log division deleted activity.
     */
    private function logDivisionDeleted(int $divisionId): void
    {
        try {
            $user = Auth::user();
            if ($user instanceof UserEloquent) {
                $division = DivisionEloquent::findOrFail($divisionId);
                $this->activityLogService->logDivisionDeleted($user, $division);
            }
        } catch (\Exception $e) {
            Log::error('Failed to log division deletion activity', [
                'error' => $e->getMessage(),
                'division_id' => $divisionId,
            ]);
        }
    }

    /**
     * Log divisions reordered activity.
     */
    private function logDivisionsReordered(int $seasonId): void
    {
        try {
            $user = Auth::user();
            if ($user instanceof UserEloquent) {
                $season = SeasonEloquent::findOrFail($seasonId);
                $this->activityLogService->logDivisionsReordered($user, $season);
            }
        } catch (\Exception $e) {
            Log::error('Failed to log division reorder activity', [
                'error' => $e->getMessage(),
                'season_id' => $seasonId,
            ]);
        }
    }
}
