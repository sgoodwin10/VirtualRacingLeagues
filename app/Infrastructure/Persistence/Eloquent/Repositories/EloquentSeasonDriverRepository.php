<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Competition\Entities\SeasonDriver;
use App\Domain\Competition\Exceptions\SeasonDriverNotFoundException;
use App\Domain\Competition\Repositories\SeasonDriverRepositoryInterface;
use App\Domain\Competition\ValueObjects\SeasonDriverStatus;
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
        $model = SeasonDriverEloquent::find($id);

        if (!$model) {
            throw SeasonDriverNotFoundException::withId($id);
        }

        return $this->mapToEntity($model);
    }

    public function findByLeagueDriverAndSeason(int $leagueDriverId, int $seasonId): SeasonDriver
    {
        $model = SeasonDriverEloquent::where('league_driver_id', $leagueDriverId)
            ->where('season_id', $seasonId)
            ->first();

        if (!$model) {
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
            ->map(fn(SeasonDriverEloquent $model) => $this->mapToEntity($model))
            ->all();
    }

    /**
     * @param array<string, mixed> $filters
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
            ->map(fn(SeasonDriverEloquent $model) => $this->mapToEntity($model))
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
     * @param int[] $leagueDriverIds
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
     * @param array<string, mixed> $filters
     * @return array{data: array<SeasonDriver>, total: int, per_page: int, current_page: int}
     */
    public function findBySeasonPaginated(int $seasonId, int $page, int $perPage, array $filters = []): array
    {
        $query = SeasonDriverEloquent::where('season_id', $seasonId)
            ->with(['leagueDriver.driver']); // Eager load to prevent N+1 queries

        $this->applyFilters($query, $filters);

        $paginator = $query->paginate($perPage, ['*'], 'page', $page);

        return [
            'data' => $paginator->items() ? array_map(
                fn(SeasonDriverEloquent $model) => $this->mapToEntity($model),
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
     * @param \Illuminate\Database\Eloquent\Builder<SeasonDriverEloquent> $query
     * @param array<string, mixed> $filters
     */
    private function applyFilters(\Illuminate\Database\Eloquent\Builder $query, array $filters): void
    {
        // Apply status filter
        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->where('status', $filters['status']);
        }

        // Apply search filter (search by driver fields)
        if (isset($filters['search']) && $filters['search'] !== '') {
            $search = $filters['search'];
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

        // Handle special case for ordering by driver name
        if ($orderBy === 'driver_name') {
            $nameExpression = "COALESCE(drivers.nickname, " .
                "CONCAT(drivers.first_name, ' ', drivers.last_name), " .
                "drivers.first_name, drivers.last_name, 'Unknown')";

            $query->join('league_drivers', 'season_drivers.league_driver_id', '=', 'league_drivers.id')
                ->join('drivers', 'league_drivers.driver_id', '=', 'drivers.id')
                ->orderByRaw("{$nameExpression} {$orderDirection}")
                ->select('season_drivers.*'); // Ensure we only select season_drivers columns
        } else {
            $query->orderBy($orderBy, $orderDirection);
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
        ]);
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
            'status' => $seasonDriver->status()->value,
            'notes' => $seasonDriver->notes(),
            'added_at' => $seasonDriver->addedAt()->format('Y-m-d H:i:s'),
            'updated_at' => $seasonDriver->updatedAt()->format('Y-m-d H:i:s'),
        ];
    }
}
