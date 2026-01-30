<?php

declare(strict_types=1);

namespace App\Application\Competition\Services;

use App\Application\Competition\DTOs\AddSeasonDriverData;
use App\Application\Competition\DTOs\SeasonDriverData;
use App\Application\Competition\DTOs\UpdateSeasonDriverData;
use App\Domain\Competition\Entities\SeasonDriver;
use App\Domain\Competition\Exceptions\LeagueDriverNotInLeagueException;
use App\Domain\Competition\Exceptions\SeasonDriverAlreadyExistsException;
use App\Domain\Competition\Exceptions\SeasonDriverNotFoundException;
use App\Domain\Competition\Exceptions\SeasonNotFoundException;
use App\Domain\Competition\Repositories\CompetitionRepositoryInterface;
use App\Domain\Competition\Repositories\SeasonDriverRepositoryInterface;
use App\Domain\Competition\Repositories\SeasonRepositoryInterface;
use App\Domain\Competition\ValueObjects\SeasonDriverStatus;
use App\Domain\League\Repositories\LeagueRepositoryInterface;
use App\Domain\Shared\Exceptions\UnauthorizedException;
use App\Infrastructure\Persistence\Eloquent\Models\LeagueDriverEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonDriverEloquent;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;

/**
 * SeasonDriver Application Service.
 * Orchestrates season-driver association use cases.
 *
 * Responsibilities:
 * - Transaction management
 * - Authorization checks
 * - Business rule validation (driver in league, not duplicate)
 * - DTO transformations
 * - Event dispatching
 */
final class SeasonDriverApplicationService
{
    public function __construct(
        private readonly SeasonDriverRepositoryInterface $seasonDriverRepository,
        private readonly SeasonRepositoryInterface $seasonRepository,
        private readonly CompetitionRepositoryInterface $competitionRepository,
        private readonly LeagueRepositoryInterface $leagueRepository,
    ) {
    }

    /**
     * Add a driver to a season.
     *
     * @throws SeasonNotFoundException
     * @throws SeasonDriverAlreadyExistsException
     * @throws LeagueDriverNotInLeagueException
     * @throws UnauthorizedException
     */
    public function addDriverToSeason(int $seasonId, AddSeasonDriverData $data, int $userId): SeasonDriverData
    {
        return DB::transaction(function () use ($seasonId, $data, $userId) {
            // 1. Validate season exists
            $season = $this->seasonRepository->findById($seasonId);
            $competition = $this->competitionRepository->findById($season->competitionId());

            // 2. Authorize (league owner)
            $this->authorizeLeagueOwner($competition, $userId);

            // 3. Validate league driver exists and belongs to competition's league
            $leagueDriver = $this->validateLeagueDriver($data->league_driver_id, $competition->leagueId());

            // 4. Check if driver is already in season
            if ($this->seasonDriverRepository->existsInSeason($data->league_driver_id, $seasonId)) {
                throw SeasonDriverAlreadyExistsException::withLeagueDriver($data->league_driver_id, $seasonId);
            }

            // 5. Create season-driver entity
            $seasonDriver = SeasonDriver::create(
                seasonId: $seasonId,
                leagueDriverId: $data->league_driver_id,
                status: SeasonDriverStatus::fromString($data->status),
                notes: $data->notes,
            );

            // 6. Save via repository
            $this->seasonDriverRepository->save($seasonDriver);

            // 7. Record creation event and dispatch
            $seasonDriver->recordCreationEvent($leagueDriver->driver_id);
            $this->dispatchEvents($seasonDriver);

            // 8. Return SeasonDriverData DTO
            return $this->toSeasonDriverData($seasonDriver);
        });
    }

    /**
     * Bulk add drivers to a season.
     *
     * @param  int[]  $leagueDriverIds
     * @return array<SeasonDriverData>
     */
    public function addDriversToSeason(int $seasonId, array $leagueDriverIds, int $userId): array
    {
        return DB::transaction(function () use ($seasonId, $leagueDriverIds, $userId) {
            // 1. Validate season exists
            $season = $this->seasonRepository->findById($seasonId);
            $competition = $this->competitionRepository->findById($season->competitionId());

            // 2. Authorize (league owner)
            $this->authorizeLeagueOwner($competition, $userId);

            // 3. Validate all league drivers
            foreach ($leagueDriverIds as $leagueDriverId) {
                $this->validateLeagueDriver($leagueDriverId, $competition->leagueId());
            }

            // 4. Bulk add (repository handles duplicates)
            $this->seasonDriverRepository->bulkAdd($seasonId, $leagueDriverIds, 'active');

            // 5. Return all season drivers
            return $this->getSeasonDrivers($seasonId);
        });
    }

    /**
     * Update a season driver.
     *
     * @throws SeasonDriverNotFoundException
     * @throws UnauthorizedException
     */
    public function updateSeasonDriver(
        int $seasonId,
        int $leagueDriverId,
        UpdateSeasonDriverData $data,
        int $userId
    ): SeasonDriverData {
        return DB::transaction(function () use ($seasonId, $leagueDriverId, $data, $userId) {
            // 1. Find season-driver
            $seasonDriver = $this->seasonDriverRepository->findByLeagueDriverAndSeason($leagueDriverId, $seasonId);

            // 2. Authorize
            $season = $this->seasonRepository->findById($seasonId);
            $competition = $this->competitionRepository->findById($season->competitionId());
            $this->authorizeLeagueOwner($competition, $userId);

            // 3. Update status and notes
            $seasonDriver->updateStatus(SeasonDriverStatus::fromString($data->status));
            $seasonDriver->updateNotes($data->notes);

            // 4. Save
            $this->seasonDriverRepository->save($seasonDriver);
            $this->dispatchEvents($seasonDriver);

            // 5. Return DTO
            return $this->toSeasonDriverData($seasonDriver);
        });
    }

    /**
     * Remove a driver from a season.
     *
     * @throws SeasonDriverNotFoundException
     * @throws UnauthorizedException
     */
    public function removeDriverFromSeason(int $seasonId, int $leagueDriverId, int $userId): void
    {
        DB::transaction(function () use ($seasonId, $leagueDriverId, $userId) {
            // 1. Find season-driver
            $seasonDriver = $this->seasonDriverRepository->findByLeagueDriverAndSeason($leagueDriverId, $seasonId);

            // 2. Authorize
            $season = $this->seasonRepository->findById($seasonId);
            $competition = $this->competitionRepository->findById($season->competitionId());
            $this->authorizeLeagueOwner($competition, $userId);

            // 3. Record removal event and delete
            $seasonDriver->recordRemovalEvent();
            $this->dispatchEvents($seasonDriver);
            $this->seasonDriverRepository->delete($seasonDriver);
        });
    }

    /**
     * Get all drivers in a season.
     *
     * @return array<SeasonDriverData>
     */
    public function getSeasonDrivers(int $seasonId): array
    {
        $seasonDrivers = $this->seasonDriverRepository->findBySeason($seasonId);

        // Eager load all league drivers to prevent N+1 queries
        $leagueDriverIds = array_map(fn (SeasonDriver $sd) => $sd->leagueDriverId(), $seasonDrivers);
        /** @var \Illuminate\Support\Collection<int, LeagueDriverEloquent> $leagueDrivers */
        $leagueDrivers = LeagueDriverEloquent::with('driver')
            ->whereIn('id', $leagueDriverIds)
            ->get()
            ->keyBy('id');

        // Eager load SeasonDriverEloquent models to get team and division information
        $seasonDriverIds = array_map(fn (SeasonDriver $sd) => $sd->id(), $seasonDrivers);
        /** @var \Illuminate\Support\Collection<int, SeasonDriverEloquent> $seasonDriverModels */
        $seasonDriverModels = SeasonDriverEloquent::with(['team', 'division'])
            ->whereIn('id', $seasonDriverIds)
            ->get()
            ->keyBy('id');

        return array_map(
            fn (SeasonDriver $seasonDriver) => $this->toSeasonDriverData(
                $seasonDriver,
                $leagueDrivers,
                $seasonDriverModels
            ),
            $seasonDrivers
        );
    }

    /**
     * Get paginated season drivers with optional filters.
     *
     * @param  array<string, mixed>  $queryParams  Query parameters
     *                                             (page, per_page, search, status, division_id, team_id,
     *                                             order_by, order_direction)
     * @return array{
     *     data: array<SeasonDriverData>,
     *     meta: array{
     *         current_page: int,
     *         per_page: int,
     *         total: int,
     *         last_page: int,
     *         from: int|null,
     *         to: int|null
     *     }
     * }
     */
    public function getSeasonDriversPaginated(int $seasonId, array $queryParams): array
    {
        // Extract and validate parameters
        $page = (int) ($queryParams['page'] ?? 1);
        $perPage = (int) ($queryParams['per_page'] ?? 10);
        $search = $queryParams['search'] ?? null;
        $status = $queryParams['status'] ?? null;
        $divisionId = $queryParams['division_id'] ?? null;
        $teamId = $queryParams['team_id'] ?? null;
        $orderBy = $queryParams['order_by'] ?? 'added_at';
        $orderDirection = $queryParams['order_direction'] ?? 'desc';

        // Build filters for the repository
        $filters = [
            'order_by' => $orderBy,
            'order_direction' => $orderDirection,
        ];

        if ($search !== null && $search !== '') {
            $filters['search'] = $search;
        }

        if ($status !== null && $status !== '') {
            $filters['status'] = $status;
        }

        if ($divisionId !== null) {
            $filters['division_id'] = (int) $divisionId;
        }

        if ($teamId !== null) {
            $filters['team_id'] = (int) $teamId;
        }

        // Get paginated data from repository
        $result = $this->seasonDriverRepository->findBySeasonPaginated($seasonId, $page, $perPage, $filters);

        // Eager load all league drivers for the current page to prevent N+1 queries
        $leagueDriverIds = array_map(fn (SeasonDriver $sd) => $sd->leagueDriverId(), $result['data']);
        /** @var \Illuminate\Support\Collection<int, LeagueDriverEloquent> $leagueDrivers */
        $leagueDrivers = LeagueDriverEloquent::with('driver')
            ->whereIn('id', $leagueDriverIds)
            ->get()
            ->keyBy('id');

        // Eager load SeasonDriverEloquent models to get team and division information
        $seasonDriverIds = array_map(fn (SeasonDriver $sd) => $sd->id(), $result['data']);
        /** @var \Illuminate\Support\Collection<int, SeasonDriverEloquent> $seasonDriverModels */
        $seasonDriverModels = SeasonDriverEloquent::with(['team', 'division'])
            ->whereIn('id', $seasonDriverIds)
            ->get()
            ->keyBy('id');

        // Convert entities to DTOs
        $data = array_map(
            fn (SeasonDriver $seasonDriver) => $this->toSeasonDriverData(
                $seasonDriver,
                $leagueDrivers,
                $seasonDriverModels
            ),
            $result['data']
        );

        // Calculate last page
        $lastPage = (int) ceil($result['total'] / $result['per_page']);

        // Calculate from and to (Laravel standard pagination format)
        $from = $result['total'] > 0 ? (($result['current_page'] - 1) * $result['per_page']) + 1 : null;
        $to = $result['total'] > 0 ? min($from + count($data) - 1, $result['total']) : null;

        return [
            'data' => $data,
            'meta' => [
                'current_page' => $result['current_page'],
                'per_page' => $result['per_page'],
                'total' => $result['total'],
                'last_page' => $lastPage,
                'from' => $from,
                'to' => $to,
            ],
        ];
    }

    /**
     * Get available drivers (league drivers not yet in season).
     *
     * @return array<array{id: int, driver_id: int, driver_name: string, number: string|null, team_name: string|null}>
     */
    public function getAvailableDrivers(int $seasonId): array
    {
        $season = $this->seasonRepository->findById($seasonId);
        $competition = $this->competitionRepository->findById($season->competitionId());

        // Get all league drivers for this league
        $leagueDrivers = LeagueDriverEloquent::where('league_id', $competition->leagueId())
            ->with('driver')
            ->get();

        // Filter out drivers already in season
        $availableDrivers = [];
        foreach ($leagueDrivers as $leagueDriver) {
            if (! $this->seasonDriverRepository->existsInSeason($leagueDriver->id, $seasonId)) {
                $availableDrivers[] = [
                    'id' => $leagueDriver->id,
                    'driver_id' => $leagueDriver->driver_id,
                    'driver_name' => $leagueDriver->driver->name ?? 'Unknown',
                    'number' => $leagueDriver->number !== null ? (string) $leagueDriver->number : null,
                    'team_name' => $leagueDriver->team_name,
                ];
            }
        }

        return $availableDrivers;
    }

    /**
     * Get paginated available drivers (league drivers not yet in season).
     *
     * @param  array<string, mixed>  $queryParams  Query parameters
     *                                             (page, per_page, search, league_id)
     * @return array{
     *     data: array<array{
     *         id: int,
     *         driver_id: int,
     *         driver_name: string,
     *         number: string|null,
     *         team_name: string|null,
     *         discord: string|null,
     *         psn_id: string|null,
     *         iracing_id: string|null
     *     }>,
     *     meta: array{
     *         current_page: int,
     *         per_page: int,
     *         total: int,
     *         last_page: int,
     *         from: int|null,
     *         to: int|null
     *     }
     * }
     */
    public function getAvailableDriversPaginated(int $seasonId, array $queryParams): array
    {
        // Extract and validate parameters
        $page = (int) ($queryParams['page'] ?? 1);
        $perPage = (int) ($queryParams['per_page'] ?? 10);
        $search = $queryParams['search'] ?? null;
        $providedLeagueId = $queryParams['league_id'] ?? null;

        // Validate season exists and get league ID
        $season = $this->seasonRepository->findById($seasonId);
        $competition = $this->competitionRepository->findById($season->competitionId());
        $leagueId = $competition->leagueId();

        // If league_id is provided, validate it matches the season's league
        if ($providedLeagueId !== null && (int) $providedLeagueId !== $leagueId) {
            throw new \InvalidArgumentException(
                "League ID {$providedLeagueId} does not match season's league ID {$leagueId}"
            );
        }

        // Build query for available drivers
        $query = LeagueDriverEloquent::where('league_id', $leagueId)
            ->with('driver')
            ->whereNotIn('league_drivers.id', function ($subquery) use ($seasonId) {
                $subquery->select('league_driver_id')
                    ->from('season_drivers')
                    ->where('season_id', $seasonId);
            });

        // Apply search filter - search across driver fields and league driver number
        if ($search !== null && $search !== '') {
            $query->where(function ($q) use ($search) {
                // Search driver fields
                $q->whereHas('driver', function ($driverQuery) use ($search) {
                    $driverQuery->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('nickname', 'like', "%{$search}%")
                        ->orWhere('discord_id', 'like', "%{$search}%")
                        ->orWhere('psn_id', 'like', "%{$search}%")
                        ->orWhere('iracing_id', 'like', "%{$search}%");
                })
                // Also search league_drivers.driver_number
                ->orWhere('league_drivers.driver_number', 'like', "%{$search}%");
            });
        }

        // Order by driver name
        $nameExpression = 'COALESCE(drivers.nickname, ' .
            "CONCAT(drivers.first_name, ' ', drivers.last_name), " .
            "drivers.first_name, drivers.last_name, 'Unknown')";

        $query->join('drivers', 'league_drivers.driver_id', '=', 'drivers.id')
            ->orderByRaw("{$nameExpression} asc")
            ->select('league_drivers.*');

        // Paginate
        $paginator = $query->paginate($perPage, ['*'], 'page', $page);

        // Map to response format with additional fields
        $data = array_map(function ($leagueDriver) {
            return [
                'id' => $leagueDriver->id,
                'driver_id' => $leagueDriver->driver_id,
                'driver_name' => $leagueDriver->driver->name ?? 'Unknown',
                'number' => $leagueDriver->number !== null ? (string) $leagueDriver->number : null,
                'team_name' => $leagueDriver->team_name,
                'discord' => $leagueDriver->driver->discord_id ?? null,
                'psn_id' => $leagueDriver->driver->psn_id ?? null,
                'iracing_id' => $leagueDriver->driver->iracing_id ?? null,
            ];
        }, $paginator->items());

        // Calculate pagination metadata
        $total = $paginator->total();
        $lastPage = (int) ceil($total / $perPage);
        $from = $total > 0 ? (($page - 1) * $perPage) + 1 : null;
        $to = $total > 0 ? min($from + count($data) - 1, $total) : null;

        return [
            'data' => $data,
            'meta' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => $lastPage,
                'from' => $from,
                'to' => $to,
            ],
        ];
    }

    /**
     * Get season driver statistics.
     *
     * @return array{total: int, active: int, reserve: int, withdrawn: int}
     */
    public function getSeasonDriverStats(int $seasonId): array
    {
        $drivers = $this->seasonDriverRepository->findBySeason($seasonId);

        $stats = [
            'total' => count($drivers),
            'active' => 0,
            'reserve' => 0,
            'withdrawn' => 0,
        ];

        foreach ($drivers as $driver) {
            if ($driver->isActive()) {
                $stats['active']++;
            } elseif ($driver->isReserve()) {
                $stats['reserve']++;
            } elseif ($driver->isWithdrawn()) {
                $stats['withdrawn']++;
            }
        }

        return $stats;
    }

    /**
     * Validate league driver exists and belongs to league.
     *
     * @throws LeagueDriverNotInLeagueException
     */
    private function validateLeagueDriver(int $leagueDriverId, int $leagueId): LeagueDriverEloquent
    {
        $leagueDriver = LeagueDriverEloquent::with('driver')->find($leagueDriverId);

        if (! $leagueDriver) {
            throw LeagueDriverNotInLeagueException::withId($leagueDriverId, $leagueId);
        }

        if ($leagueDriver->league_id !== $leagueId) {
            throw LeagueDriverNotInLeagueException::withId($leagueDriverId, $leagueId);
        }

        return $leagueDriver;
    }

    /**
     * Convert SeasonDriver entity to SeasonDriverData DTO.
     *
     * @param  \Illuminate\Support\Collection<int, LeagueDriverEloquent>|null  $leagueDrivers
     * @param  \Illuminate\Support\Collection<int, SeasonDriverEloquent>|null  $seasonDriverModels
     */
    private function toSeasonDriverData(
        SeasonDriver $seasonDriver,
        $leagueDrivers = null,
        $seasonDriverModels = null
    ): SeasonDriverData {
        // If preloaded drivers provided, use them (optimized path)
        if ($leagueDrivers !== null) {
            $leagueDriver = $leagueDrivers->get($seasonDriver->leagueDriverId());
        } else {
            // Fallback to individual query (used in single driver operations)
            $leagueDriver = LeagueDriverEloquent::with('driver')->find($seasonDriver->leagueDriverId());
        }

        if (! $leagueDriver) {
            throw new \RuntimeException('League driver not found');
        }

        // Get team name, division id and division name from season driver's relationships if assigned
        $teamName = null;
        $divisionId = null;
        $divisionName = null;

        if ($seasonDriverModels !== null && $seasonDriver->id() !== null) {
            $seasonDriverModel = $seasonDriverModels->get($seasonDriver->id());
            if ($seasonDriverModel) {
                if ($seasonDriverModel->team) {
                    $teamName = $seasonDriverModel->team->name;
                }
                if ($seasonDriverModel->division) {
                    $divisionId = $seasonDriverModel->division_id;
                    $divisionName = $seasonDriverModel->division->name;
                }
            }
        } elseif ($seasonDriver->id() !== null) {
            // Fallback: fetch the season driver model to get team and division info
            $seasonDriverModel = SeasonDriverEloquent::with(['team', 'division'])
                ->find($seasonDriver->id());
            if ($seasonDriverModel) {
                if ($seasonDriverModel->team) {
                    $teamName = $seasonDriverModel->team->name;
                }
                if ($seasonDriverModel->division) {
                    $divisionId = $seasonDriverModel->division_id;
                    $divisionName = $seasonDriverModel->division->name;
                }
            }
        }

        return SeasonDriverData::fromEntity(
            seasonDriver: $seasonDriver,
            driverId: $leagueDriver->driver_id,
            driverData: [
                'id' => $leagueDriver->driver_id,
                'first_name' => $leagueDriver->driver->first_name ?? null,
                'last_name' => $leagueDriver->driver->last_name ?? null,
                'nickname' => $leagueDriver->driver->nickname ?? null,
                'number' => $leagueDriver->number !== null ? (string) $leagueDriver->number : null,
                'psn_id' => $leagueDriver->driver->psn_id ?? null,
                'iracing_id' => $leagueDriver->driver->iracing_id ?? null,
                'discord_id' => $leagueDriver->driver->discord_id ?? null,
                'team_name' => $teamName,
                'division_id' => $divisionId,
                'division_name' => $divisionName,
                'deleted_at' => $leagueDriver->driver->deleted_at?->format('Y-m-d H:i:s'),
            ]
        );
    }

    /**
     * Authorize that user is league owner.
     */
    private function authorizeLeagueOwner($competition, int $userId): void
    {
        $league = $this->leagueRepository->findById($competition->leagueId());

        if ($league->ownerUserId() !== $userId) {
            throw new UnauthorizedException('Only league owner can manage season drivers');
        }
    }

    /**
     * Dispatch domain events.
     */
    private function dispatchEvents(SeasonDriver $seasonDriver): void
    {
        $events = $seasonDriver->releaseEvents();

        foreach ($events as $event) {
            Event::dispatch($event);
        }
    }
}
