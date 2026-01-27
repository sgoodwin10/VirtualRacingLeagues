<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Competition\Entities\SeasonDriver;
use App\Domain\Competition\Exceptions\SeasonDriverNotFoundException;
use App\Domain\Competition\Repositories\SeasonDriverRepositoryInterface;
use App\Domain\Competition\ValueObjects\SeasonDriverStatus;
use App\Infrastructure\Persistence\Eloquent\Models\Driver;
use App\Infrastructure\Persistence\Eloquent\Models\LeagueDriverEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonDriverEloquent;
use DateTimeImmutable;

/**
 * Eloquent implementation of SeasonDriverRepositoryInterface.
 * Handles mapping between SeasonDriver domain entities and Eloquent models.
 */
final class EloquentSeasonDriverRepository implements SeasonDriverRepositoryInterface
{
    public function save(SeasonDriver $seasonDriver): void
    {
        $data = $this->mapToEloquent($seasonDriver);

        if ($seasonDriver->id() === null) {
            // Create new season driver
            $model = SeasonDriverEloquent::create($data);
            $seasonDriver->setId($model->id);
        } else {
            // Update existing season driver
            SeasonDriverEloquent::where('id', $seasonDriver->id())->update($data);
        }
    }

    public function findById(int $id): SeasonDriver
    {
        $model = SeasonDriverEloquent::with(['leagueDriver.driver', 'team', 'division'])->find($id);

        if (! $model) {
            throw SeasonDriverNotFoundException::withId($id);
        }

        return $this->mapToEntity($model);
    }

    public function findByLeagueDriverAndSeason(int $leagueDriverId, int $seasonId): SeasonDriver
    {
        $model = SeasonDriverEloquent::where('league_driver_id', $leagueDriverId)
            ->where('season_id', $seasonId)
            ->first();

        if (! $model) {
            throw SeasonDriverNotFoundException::withLeagueDriverAndSeason($leagueDriverId, $seasonId);
        }

        return $this->mapToEntity($model);
    }

    public function existsInSeason(int $leagueDriverId, int $seasonId): bool
    {
        return SeasonDriverEloquent::where('league_driver_id', $leagueDriverId)
            ->where('season_id', $seasonId)
            ->exists();
    }

    /**
     * @return array<SeasonDriver>
     */
    public function findBySeason(int $seasonId): array
    {
        return SeasonDriverEloquent::where('season_id', $seasonId)
            ->orderBy('added_at', 'desc')
            ->get()
            ->map(fn (SeasonDriverEloquent $model) => $this->mapToEntity($model))
            ->all();
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<SeasonDriver>
     */
    public function findBySeasonWithFilters(int $seasonId, array $filters = []): array
    {
        $query = SeasonDriverEloquent::where('season_id', $seasonId);

        // Apply status filter
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // Order by
        $orderBy = $filters['order_by'] ?? 'added_at';
        $orderDir = $filters['order_dir'] ?? 'desc';
        $query->orderBy($orderBy, $orderDir);

        return $query->get()
            ->map(fn (SeasonDriverEloquent $model) => $this->mapToEntity($model))
            ->all();
    }

    public function countDriversInSeason(int $seasonId): int
    {
        return SeasonDriverEloquent::where('season_id', $seasonId)->count();
    }

    public function countActiveDriversInSeason(int $seasonId): int
    {
        return SeasonDriverEloquent::where('season_id', $seasonId)
            ->where('status', 'active')
            ->count();
    }

    public function delete(SeasonDriver $seasonDriver): void
    {
        SeasonDriverEloquent::where('id', $seasonDriver->id())->delete();
    }

    public function deleteAllForSeason(int $seasonId): void
    {
        SeasonDriverEloquent::where('season_id', $seasonId)->delete();
    }

    /**
     * @param  int[]  $leagueDriverIds
     */
    public function bulkAdd(int $seasonId, array $leagueDriverIds, string $status = 'active'): int
    {
        $now = new DateTimeImmutable();
        $records = [];

        foreach ($leagueDriverIds as $leagueDriverId) {
            // Skip if already exists
            if ($this->existsInSeason($leagueDriverId, $seasonId)) {
                continue;
            }

            $records[] = [
                'season_id' => $seasonId,
                'league_driver_id' => $leagueDriverId,
                'status' => $status,
                'notes' => null,
                'added_at' => $now->format('Y-m-d H:i:s'),
                'updated_at' => $now->format('Y-m-d H:i:s'),
            ];
        }

        if (empty($records)) {
            return 0;
        }

        SeasonDriverEloquent::insert($records);

        return count($records);
    }

    /**
     * Get paginated season drivers with optional filters.
     *
     * @param  array<string, mixed>  $filters
     * @return array{data: array<SeasonDriver>, total: int, per_page: int, current_page: int}
     */
    public function findBySeasonPaginated(int $seasonId, int $page, int $perPage, array $filters = []): array
    {
        $query = SeasonDriverEloquent::where('season_drivers.season_id', $seasonId)
            ->with(['leagueDriver.driver', 'team', 'division']); // Eager load to prevent N+1 queries

        $this->applyFilters($query, $filters);

        $paginator = $query->paginate($perPage, ['season_drivers.*'], 'page', $page);

        return [
            'data' => $paginator->items() ? array_map(
                fn (SeasonDriverEloquent $model) => $this->mapToEntity($model),
                $paginator->items()
            ) : [],
            'total' => $paginator->total(),
            'per_page' => $paginator->perPage(),
            'current_page' => $paginator->currentPage(),
        ];
    }

    /**
     * Apply filters to the query.
     *
     * @param  \Illuminate\Database\Eloquent\Builder<SeasonDriverEloquent>  $query
     * @param  array<string, mixed>  $filters
     */
    private function applyFilters(\Illuminate\Database\Eloquent\Builder $query, array $filters): void
    {
        // Apply status filter
        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->where('season_drivers.status', $filters['status']);
        }

        // Apply division_id filter
        if (isset($filters['division_id'])) {
            // Special value 0 means filter for NULL (drivers without a division)
            if ($filters['division_id'] === 0) {
                $query->whereNull('season_drivers.division_id');
            } else {
                $query->where('season_drivers.division_id', $filters['division_id']);
            }
        }

        // Apply team_id filter
        if (isset($filters['team_id'])) {
            // Special value 0 means filter for NULL (privateers without a team)
            if ($filters['team_id'] === 0) {
                $query->whereNull('season_drivers.team_id');
            } else {
                $query->where('season_drivers.team_id', $filters['team_id']);
            }
        }

        // Apply search filter (search by driver fields)
        if (isset($filters['search']) && $filters['search'] !== '') {
            // Escape wildcard characters to prevent SQL injection
            $search = str_replace(['%', '_'], ['\\%', '\\_'], $filters['search']);
            $query->whereHas('leagueDriver.driver', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('nickname', 'like', "%{$search}%")
                    ->orWhere('discord_id', 'like', "%{$search}%")
                    ->orWhere('psn_id', 'like', "%{$search}%")
                    ->orWhere('iracing_id', 'like', "%{$search}%");
            });
        }

        // Apply ordering
        $orderBy = $filters['order_by'] ?? 'added_at';
        $orderDirection = $filters['order_direction'] ?? 'desc';

        // Handle special cases for ordering
        if ($orderBy === 'driver_name') {
            $nameExpression = 'COALESCE(drivers.nickname, ' .
                'drivers.psn_id, ' .
                'drivers.iracing_id, ' .
                'drivers.discord_id, ' .
                "CONCAT(drivers.first_name, ' ', drivers.last_name), " .
                "drivers.first_name, 'Unknown')";

            $query->join('league_drivers', 'season_drivers.league_driver_id', '=', 'league_drivers.id')
                ->join('drivers', 'league_drivers.driver_id', '=', 'drivers.id')
                ->select('season_drivers.*'); // Ensure we only select season_drivers columns

            // Use separate method calls instead of string interpolation to prevent SQL injection
            if ($orderDirection === 'asc') {
                $query->orderByRaw("{$nameExpression} ASC");
            } else {
                $query->orderByRaw("{$nameExpression} DESC");
            }
        } elseif (in_array($orderBy, ['discord_id', 'psn_id', 'iracing_id'])) {
            // Sort by driver platform IDs (with NULL values last)
            $query->join('league_drivers', 'season_drivers.league_driver_id', '=', 'league_drivers.id')
                ->join('drivers', 'league_drivers.driver_id', '=', 'drivers.id')
                ->orderByRaw("drivers.{$orderBy} IS NULL")
                ->orderBy("drivers.{$orderBy}", $orderDirection)
                ->select('season_drivers.*');
        } elseif ($orderBy === 'driver_number') {
            // Sort by driver number (with NULL values last)
            $query->join('league_drivers', 'season_drivers.league_driver_id', '=', 'league_drivers.id')
                ->orderByRaw('league_drivers.driver_number IS NULL')
                ->orderBy('league_drivers.driver_number', $orderDirection)
                ->select('season_drivers.*');
        } elseif ($orderBy === 'team_name') {
            // Sort by team name (with NULL values last)
            $query->leftJoin('teams', 'season_drivers.team_id', '=', 'teams.id')
                ->orderByRaw('teams.name IS NULL')
                ->orderBy('teams.name', $orderDirection)
                ->select('season_drivers.*');
        } elseif ($orderBy === 'division_name') {
            // Sort by division name (with NULL values last)
            $query->leftJoin('divisions', 'season_drivers.division_id', '=', 'divisions.id')
                ->orderByRaw('divisions.name IS NULL')
                ->orderBy('divisions.name', $orderDirection)
                ->select('season_drivers.*');
        } else {
            // Default ordering (added_at, status, etc.)
            // Whitelist allowed orderBy columns to prevent SQL injection
            $allowedOrderBy = ['added_at', 'status', 'updated_at'];
            if (in_array($orderBy, $allowedOrderBy)) {
                $query->orderBy("season_drivers.{$orderBy}", $orderDirection);
            } else {
                // Fallback to default if invalid orderBy provided
                $query->orderBy('season_drivers.added_at', 'desc');
            }
        }
    }

    /**
     * Map Eloquent model to domain entity.
     */
    private function mapToEntity(SeasonDriverEloquent $model): SeasonDriver
    {
        return SeasonDriver::reconstitute(
            id: $model->id,
            seasonId: $model->season_id,
            leagueDriverId: $model->league_driver_id,
            teamId: $model->team_id,
            status: SeasonDriverStatus::fromString($model->status),
            notes: $model->notes,
            addedAt: new DateTimeImmutable($model->added_at->toDateTimeString()),
            updatedAt: new DateTimeImmutable($model->updated_at->toDateTimeString()),
        );
    }

    /**
     * Update the team_id for a season driver.
     */
    public function updateTeamId(int $seasonDriverId, ?int $teamId): void
    {
        SeasonDriverEloquent::where('id', $seasonDriverId)->update([
            'team_id' => $teamId,
            'updated_at' => now(),
        ]);
    }

    public function updateDivisionId(int $seasonDriverId, ?int $divisionId): void
    {
        SeasonDriverEloquent::where('id', $seasonDriverId)->update([
            'division_id' => $divisionId,
            'updated_at' => now(),
        ]);
    }

    /**
     * Find season driver by ID with all relationships loaded.
     * Used after team assignment to return complete driver data.
     *
     * @throws SeasonDriverNotFoundException
     */
    public function findByIdWithRelations(int $seasonDriverId): SeasonDriverEloquent
    {
        $model = SeasonDriverEloquent::with(['leagueDriver.driver', 'team', 'division'])->find($seasonDriverId);

        if (! $model) {
            throw SeasonDriverNotFoundException::withId($seasonDriverId);
        }

        return $model;
    }

    /**
     * @return array<int, string>
     */
    public function findDriverNamesByIds(array $seasonDriverIds): array
    {
        if (empty($seasonDriverIds)) {
            return [];
        }

        /** @var \Illuminate\Database\Eloquent\Collection<int, SeasonDriverEloquent> $seasonDrivers */
        $seasonDrivers = SeasonDriverEloquent::with('leagueDriver.driver')
            ->whereIn('id', $seasonDriverIds)
            ->get();

        $driverNames = [];
        foreach ($seasonDrivers as $seasonDriver) {
            /** @var LeagueDriverEloquent|null $leagueDriver */
            $leagueDriver = $seasonDriver->leagueDriver;
            /** @var Driver|null $driver */
            $driver = $leagueDriver !== null ? $leagueDriver->driver : null;
            $driverNames[$seasonDriver->id] = $driver !== null ? $driver->name : 'Unknown Driver';
        }

        return $driverNames;
    }

    /**
     * @return array<int, int>
     */
    public function getLeagueDriverToDriverIdMap(int $seasonId): array
    {
        /** @var \Illuminate\Database\Eloquent\Collection<int, SeasonDriverEloquent> $seasonDrivers */
        $seasonDrivers = SeasonDriverEloquent::with('leagueDriver')
            ->where('season_id', $seasonId)
            ->get();

        $map = [];
        foreach ($seasonDrivers as $seasonDriver) {
            /** @var LeagueDriverEloquent|null $leagueDriver */
            $leagueDriver = $seasonDriver->leagueDriver;
            if ($leagueDriver !== null) {
                $map[$leagueDriver->id] = $leagueDriver->driver_id;
            }
        }

        return $map;
    }

    /**
     * Batch fetch team IDs for season drivers.
     * Returns a map of season_driver_id => team_id|null.
     *
     * Note: The $seasonDriverIds parameter contains season_drivers.id values,
     * which is what's stored in round_results JSON. This matches how
     * findDriverNamesByIds() works.
     *
     * @param  array<int>  $seasonDriverIds  List of season driver IDs (season_drivers.id)
     * @return array<int, int|null> Map of season driver ID => team ID (null if not on a team)
     */
    public function findTeamIdsByDriverIds(int $seasonId, array $seasonDriverIds): array
    {
        if (empty($seasonDriverIds)) {
            return [];
        }

        // Query by season_drivers.id directly (matches how round_results stores driver_id)
        $results = SeasonDriverEloquent::query()
            ->where('season_id', $seasonId)
            ->whereIn('id', $seasonDriverIds)
            ->select('id as driver_id', 'team_id')
            ->get();

        $map = [];
        foreach ($results as $result) {
            /** @var object{driver_id: int, team_id: int|null} $result */
            $map[$result->driver_id] = $result->team_id;
        }

        return $map;
    }

    /**
     * Map domain entity to Eloquent data array.
     *
     * @return array<string, mixed>
     */
    private function mapToEloquent(SeasonDriver $seasonDriver): array
    {
        return [
            'season_id' => $seasonDriver->seasonId(),
            'league_driver_id' => $seasonDriver->leagueDriverId(),
            'team_id' => $seasonDriver->teamId(),
            'status' => $seasonDriver->status()->value,
            'notes' => $seasonDriver->notes(),
            'added_at' => $seasonDriver->addedAt()->format('Y-m-d H:i:s'),
            'updated_at' => $seasonDriver->updatedAt()->format('Y-m-d H:i:s'),
        ];
    }
}
