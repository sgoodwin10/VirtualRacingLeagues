<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Driver\Entities\Driver as DriverEntity;
use App\Domain\Driver\Entities\LeagueDriver as LeagueDriverEntity;
use App\Domain\Driver\Exceptions\DriverNotFoundException;
use App\Domain\Driver\Repositories\DriverRepositoryInterface;
use App\Domain\Driver\ValueObjects\DriverName;
use App\Domain\Driver\ValueObjects\DriverStatus;
use App\Domain\Driver\ValueObjects\PlatformIdentifiers;
use App\Domain\Driver\ValueObjects\Slug;
use App\Infrastructure\Persistence\Eloquent\Models\Driver as DriverEloquent;
use DateTimeImmutable;
use Illuminate\Support\Facades\DB;

final class EloquentDriverRepository implements DriverRepositoryInterface
{
    /**
     * Allowed sort fields for driver queries.
     */
    private const ALLOWED_SORT_FIELDS = [
        'created_at',
        'updated_at',
        'first_name',
        'last_name',
        'nickname',
        'email',
    ];

    /**
     * Default sort field for driver queries.
     */
    private const DEFAULT_SORT_FIELD = 'created_at';

    /**
     * Allowed sort directions.
     */
    private const ALLOWED_SORT_DIRECTIONS = ['asc', 'desc'];

    /**
     * Default sort direction.
     */
    private const DEFAULT_SORT_DIRECTION = 'desc';

    public function findById(int $id): DriverEntity
    {
        $eloquent = DriverEloquent::withTrashed()->find($id);

        if ($eloquent === null) {
            throw DriverNotFoundException::withId($id);
        }

        return $this->mapToEntity($eloquent);
    }

    public function findByPlatformId(
        ?string $psnId,
        ?string $iracingId,
        ?int $iracingCustomerId,
        ?string $discordId = null
    ): ?DriverEntity {
        $query = DriverEloquent::query();

        // Build OR conditions for platform IDs
        $query->where(function ($q) use ($psnId, $iracingId, $iracingCustomerId, $discordId) {
            if ($psnId !== null) {
                $q->orWhere('psn_id', $psnId);
            }
            if ($iracingId !== null) {
                $q->orWhere('iracing_id', $iracingId);
            }
            if ($iracingCustomerId !== null) {
                $q->orWhere('iracing_customer_id', $iracingCustomerId);
            }
            if ($discordId !== null) {
                $q->orWhere('discord_id', $discordId);
            }
        });

        $eloquent = $query->first();

        return $eloquent ? $this->mapToEntity($eloquent) : null;
    }

    public function save(DriverEntity $driver): void
    {
        $eloquent = $driver->id() !== null
            ? DriverEloquent::withTrashed()->findOrNew($driver->id())
            : new DriverEloquent();

        $eloquent->first_name = $driver->name()->firstName();
        $eloquent->last_name = $driver->name()->lastName();
        $eloquent->nickname = $driver->name()->nickname();
        $eloquent->slug = $driver->slug()->value();
        $eloquent->email = $driver->email();
        $eloquent->phone = $driver->phone();
        $eloquent->psn_id = $driver->platformIds()->psnId();
        $eloquent->iracing_id = $driver->platformIds()->iracingId();
        $eloquent->iracing_customer_id = $driver->platformIds()->iracingCustomerId();
        $eloquent->discord_id = $driver->platformIds()->discordId();
        $eloquent->deleted_at = $driver->deletedAt()?->format('Y-m-d H:i:s');

        $eloquent->save();

        // Set ID back on entity if it's new
        if ($driver->id() === null) {
            $driver->setId($eloquent->id);
        }
    }

    public function delete(DriverEntity $driver): void
    {
        if ($driver->id() === null) {
            return;
        }

        $eloquent = DriverEloquent::find($driver->id());
        $eloquent?->delete();
    }

    public function existsInLeagueByPlatformId(
        int $leagueId,
        ?string $psnId,
        ?string $iracingId,
        ?int $iracingCustomerId,
        ?string $discordId = null
    ): bool {
        $query = DriverEloquent::query()
            ->whereHas('leagues', function ($q) use ($leagueId) {
                $q->where('leagues.id', $leagueId);
            });

        $query->where(function ($q) use ($psnId, $iracingId, $iracingCustomerId, $discordId) {
            if ($psnId !== null) {
                $q->orWhere('psn_id', $psnId);
            }
            if ($iracingId !== null) {
                $q->orWhere('iracing_id', $iracingId);
            }
            if ($iracingCustomerId !== null) {
                $q->orWhere('iracing_customer_id', $iracingCustomerId);
            }
            if ($discordId !== null) {
                $q->orWhere('discord_id', $discordId);
            }
        });

        return $query->exists();
    }

    public function getLeagueDrivers(
        int $leagueId,
        ?string $search = null,
        ?string $status = null,
        int $page = 1,
        int $perPage = 15
    ): array {
        $query = DB::table('league_drivers')
            ->join('drivers', 'league_drivers.driver_id', '=', 'drivers.id')
            ->where('league_drivers.league_id', $leagueId)
            ->whereNull('drivers.deleted_at');

        // Apply search filter
        if ($search !== null && trim($search) !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('drivers.first_name', 'LIKE', "%{$search}%")
                    ->orWhere('drivers.last_name', 'LIKE', "%{$search}%")
                    ->orWhere('drivers.nickname', 'LIKE', "%{$search}%")
                    ->orWhere('drivers.slug', 'LIKE', "%{$search}%")
                    ->orWhere('drivers.psn_id', 'LIKE', "%{$search}%")
                    ->orWhere('drivers.iracing_id', 'LIKE', "%{$search}%")
                    ->orWhere('drivers.discord_id', 'LIKE', "%{$search}%");
            });
        }

        // Apply status filter
        if ($status !== null && trim($status) !== '') {
            $query->where('league_drivers.status', $status);
        }

        // Get total count before pagination
        $total = $query->count();

        // Apply pagination
        $offset = ($page - 1) * $perPage;
        $results = $query
            ->select([
                'league_drivers.id as pivot_id',
                'league_drivers.league_id',
                'league_drivers.driver_id',
                'league_drivers.driver_number',
                'league_drivers.status',
                'league_drivers.league_notes',
                'league_drivers.added_to_league_at',
                'league_drivers.updated_at as pivot_updated_at',
                'drivers.*',
            ])
            ->orderBy('league_drivers.added_to_league_at', 'desc')
            ->offset($offset)
            ->limit($perPage)
            ->get();

        // Map to entities
        $leagueDrivers = [];
        $driverData = [];

        foreach ($results as $row) {
            // Create LeagueDriver entity
            $leagueDriver = LeagueDriverEntity::reconstitute(
                id: $row->pivot_id,
                leagueId: $row->league_id,
                driverId: $row->driver_id,
                driverNumber: $row->driver_number,
                status: DriverStatus::from($row->status),
                leagueNotes: $row->league_notes,
                addedToLeagueAt: new DateTimeImmutable($row->added_to_league_at),
                updatedAt: new DateTimeImmutable($row->pivot_updated_at)
            );

            $leagueDrivers[] = $leagueDriver;

            // Create Driver entity
            $driver = DriverEntity::reconstitute(
                id: $row->driver_id,
                name: DriverName::from($row->first_name, $row->last_name, $row->nickname),
                slug: Slug::from($row->slug),
                platformIds: PlatformIdentifiers::from(
                    $row->psn_id,
                    $row->iracing_id,
                    $row->iracing_customer_id,
                    $row->discord_id
                ),
                email: $row->email,
                phone: $row->phone,
                createdAt: new DateTimeImmutable($row->created_at),
                updatedAt: new DateTimeImmutable($row->updated_at),
                deletedAt: $row->deleted_at ? new DateTimeImmutable($row->deleted_at) : null
            );

            $driverData[$row->driver_id] = $driver;
        }

        return [
            'data' => $leagueDrivers,
            'driver_data' => $driverData,
            'total' => $total,
            'per_page' => $perPage,
            'current_page' => $page,
            'last_page' => (int) ceil($total / $perPage),
        ];
    }

    public function getLeagueDriver(int $leagueId, int $driverId): array
    {
        $row = DB::table('league_drivers')
            ->join('drivers', 'league_drivers.driver_id', '=', 'drivers.id')
            ->where('league_drivers.league_id', $leagueId)
            ->where('league_drivers.driver_id', $driverId)
            ->whereNull('drivers.deleted_at')
            ->select([
                'league_drivers.id as pivot_id',
                'league_drivers.league_id',
                'league_drivers.driver_id',
                'league_drivers.driver_number',
                'league_drivers.status',
                'league_drivers.league_notes',
                'league_drivers.added_to_league_at',
                'league_drivers.updated_at as pivot_updated_at',
                'drivers.*',
            ])
            ->first();

        if ($row === null) {
            throw DriverNotFoundException::withId($driverId);
        }

        $leagueDriver = LeagueDriverEntity::reconstitute(
            id: $row->pivot_id,
            leagueId: $row->league_id,
            driverId: $row->driver_id,
            driverNumber: $row->driver_number,
            status: DriverStatus::from($row->status),
            leagueNotes: $row->league_notes,
            addedToLeagueAt: new DateTimeImmutable($row->added_to_league_at),
            updatedAt: new DateTimeImmutable($row->pivot_updated_at)
        );

        $driver = DriverEntity::reconstitute(
            id: $row->driver_id,
            name: DriverName::from($row->first_name, $row->last_name, $row->nickname),
            slug: Slug::from($row->slug),
            platformIds: PlatformIdentifiers::from(
                $row->psn_id,
                $row->iracing_id,
                $row->iracing_customer_id,
                $row->discord_id
            ),
            email: $row->email,
            phone: $row->phone,
            createdAt: new DateTimeImmutable($row->created_at),
            updatedAt: new DateTimeImmutable($row->updated_at),
            deletedAt: $row->deleted_at ? new DateTimeImmutable($row->deleted_at) : null
        );

        return [
            'league_driver' => $leagueDriver,
            'driver' => $driver,
        ];
    }

    public function addToLeague(LeagueDriverEntity $leagueDriver): void
    {
        $id = DB::table('league_drivers')->insertGetId([
            'league_id' => $leagueDriver->leagueId(),
            'driver_id' => $leagueDriver->driverId(),
            'driver_number' => $leagueDriver->driverNumber(),
            'status' => $leagueDriver->status()->value,
            'league_notes' => $leagueDriver->leagueNotes(),
            'added_to_league_at' => $leagueDriver->addedToLeagueAt()->format('Y-m-d H:i:s'),
            'updated_at' => $leagueDriver->updatedAt()->format('Y-m-d H:i:s'),
        ]);

        // Set ID back on entity
        if ($leagueDriver->id() === null) {
            $leagueDriver->setId($id);
        }
    }

    public function updateLeagueDriver(LeagueDriverEntity $leagueDriver): void
    {
        DB::table('league_drivers')
            ->where('id', $leagueDriver->id())
            ->update([
                'driver_number' => $leagueDriver->driverNumber(),
                'status' => $leagueDriver->status()->value,
                'league_notes' => $leagueDriver->leagueNotes(),
                'updated_at' => $leagueDriver->updatedAt()->format('Y-m-d H:i:s'),
            ]);
    }

    public function removeFromLeague(int $leagueId, int $driverId): void
    {
        DB::table('league_drivers')
            ->where('league_id', $leagueId)
            ->where('driver_id', $driverId)
            ->delete();
    }

    public function isDriverInLeague(int $leagueId, int $driverId): bool
    {
        return DB::table('league_drivers')
            ->where('league_id', $leagueId)
            ->where('driver_id', $driverId)
            ->exists();
    }

    public function getLeagueDriverCounts(int $leagueId): array
    {
        $total = DB::table('league_drivers')
            ->where('league_id', $leagueId)
            ->count();

        $active = DB::table('league_drivers')
            ->where('league_id', $leagueId)
            ->where('status', 'active')
            ->count();

        $inactive = DB::table('league_drivers')
            ->where('league_id', $leagueId)
            ->where('status', 'inactive')
            ->count();

        $banned = DB::table('league_drivers')
            ->where('league_id', $leagueId)
            ->where('status', 'banned')
            ->count();

        return [
            'total' => $total,
            'active' => $active,
            'inactive' => $inactive,
            'banned' => $banned,
        ];
    }

    /**
     * Get all drivers (admin context) with pagination and filtering.
     *
     * @return array{data: array<DriverEntity>, total: int, per_page: int, current_page: int, last_page: int}
     */
    public function getAllDriversPaginated(
        ?string $search = null,
        int $page = 1,
        int $perPage = 15,
        string $orderBy = 'created_at',
        string $orderDirection = 'desc'
    ): array {
        $query = DriverEloquent::query();

        // Apply search filter
        if ($search !== null && trim($search) !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'LIKE', "%{$search}%")
                    ->orWhere('last_name', 'LIKE', "%{$search}%")
                    ->orWhere('nickname', 'LIKE', "%{$search}%")
                    ->orWhere('slug', 'LIKE', "%{$search}%")
                    ->orWhere('email', 'LIKE', "%{$search}%")
                    ->orWhere('psn_id', 'LIKE', "%{$search}%")
                    ->orWhere('iracing_id', 'LIKE', "%{$search}%")
                    ->orWhere('discord_id', 'LIKE', "%{$search}%");
            });
        }

        // Get total count before pagination
        $total = $query->count();

        // Apply sorting with validation
        if (!in_array($orderBy, self::ALLOWED_SORT_FIELDS, true)) {
            $orderBy = self::DEFAULT_SORT_FIELD;
        }

        $orderDirection = in_array(strtolower($orderDirection), self::ALLOWED_SORT_DIRECTIONS, true)
            ? strtolower($orderDirection)
            : self::DEFAULT_SORT_DIRECTION;

        // Apply pagination
        $offset = ($page - 1) * $perPage;
        /** @var \Illuminate\Database\Eloquent\Collection<int, DriverEloquent> $eloquentDrivers */
        $eloquentDrivers = $query
            ->orderBy($orderBy, $orderDirection)
            ->offset($offset)
            ->limit($perPage)
            ->get();

        // Map to entities
        $drivers = [];
        foreach ($eloquentDrivers as $eloquent) {
            $drivers[] = $this->mapToEntity($eloquent);
        }

        return [
            'data' => $drivers,
            'total' => $total,
            'per_page' => $perPage,
            'current_page' => $page,
            'last_page' => (int) ceil($total / $perPage),
        ];
    }

    /**
     * Get all leagues a driver belongs to.
     *
     * @return array<int, array{id: int, name: string, status: string, role: string|null, joined_at: string|null}>
     */
    public function getDriverLeagues(int $driverId): array
    {
        $leagues = DB::table('league_drivers')
            ->join('leagues', 'league_drivers.league_id', '=', 'leagues.id')
            ->where('league_drivers.driver_id', $driverId)
            ->select([
                'leagues.id',
                'leagues.name',
                'leagues.status',
                'league_drivers.status as driver_status',
                'league_drivers.added_to_league_at as joined_at',
            ])
            ->get();

        return $leagues->map(fn ($league) => [
            'id' => $league->id,
            'name' => $league->name,
            'status' => $league->status,
            'role' => $league->driver_status,
            'joined_at' => $league->joined_at,
        ])->toArray();
    }

    /**
     * Get all seasons a driver has participated in.
     *
     * @return array<int, array{id: int, name: string, league_name: string, status: string}>
     */
    public function getDriverSeasons(int $driverId): array
    {
        $seasons = DB::table('season_drivers')
            ->join('league_drivers', 'season_drivers.league_driver_id', '=', 'league_drivers.id')
            ->join('seasons', 'season_drivers.season_id', '=', 'seasons.id')
            ->join('competitions', 'seasons.competition_id', '=', 'competitions.id')
            ->join('leagues', 'competitions.league_id', '=', 'leagues.id')
            ->where('league_drivers.driver_id', $driverId)
            ->select([
                'seasons.id',
                'seasons.name',
                'leagues.name as league_name',
                'seasons.status',
            ])
            ->get();

        return $seasons->map(fn ($season) => [
            'id' => $season->id,
            'name' => $season->name,
            'league_name' => $season->league_name,
            'status' => $season->status,
        ])->toArray();
    }

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
    public function getDriverRaceStats(int $driverId): array
    {
        // Get total races count
        $races = DB::table('race_results')
            ->where('driver_id', $driverId)
            ->count();

        // Get wins (position = 1)
        $wins = DB::table('race_results')
            ->where('driver_id', $driverId)
            ->where('position', 1)
            ->count();

        // Get podiums (position <= 3)
        $podiums = DB::table('race_results')
            ->where('driver_id', $driverId)
            ->whereBetween('position', [1, 3])
            ->count();

        // Get pole positions
        $poles = DB::table('race_results')
            ->where('driver_id', $driverId)
            ->where('has_pole', true)
            ->count();

        // Get fastest laps
        $fastestLaps = DB::table('race_results')
            ->where('driver_id', $driverId)
            ->where('has_fastest_lap', true)
            ->count();

        // Get DNFs
        $dnfs = DB::table('race_results')
            ->where('driver_id', $driverId)
            ->where('dnf', true)
            ->count();

        // Get best finish
        $bestFinish = DB::table('race_results')
            ->where('driver_id', $driverId)
            ->where('position', '>', 0)
            ->min('position');

        return [
            'races' => $races,
            'wins' => $wins,
            'podiums' => $podiums,
            'poles' => $poles,
            'fastest_laps' => $fastestLaps,
            'dnfs' => $dnfs,
            'best_finish' => $bestFinish !== null ? (int) $bestFinish : null,
        ];
    }

    /**
     * Get linked user account for a driver.
     *
     * Note: Driver-User linking is not yet implemented in the database.
     * This method is prepared for future implementation when user_id is added to drivers table.
     *
     * @return array{id: int, name: string, email: string}|null
     */
    public function getLinkedUser(int $driverId): ?array
    {
        // Driver-User linking not yet implemented
        // When implemented, drivers table will have user_id column
        return null;
    }

    /**
     * Map Eloquent model to Domain Entity.
     */
    private function mapToEntity(DriverEloquent $eloquent): DriverEntity
    {
        return DriverEntity::reconstitute(
            id: $eloquent->id,
            name: DriverName::from(
                $eloquent->first_name,
                $eloquent->last_name,
                $eloquent->nickname
            ),
            slug: Slug::from($eloquent->slug),
            platformIds: PlatformIdentifiers::from(
                $eloquent->psn_id,
                $eloquent->iracing_id,
                $eloquent->iracing_customer_id,
                $eloquent->discord_id
            ),
            email: $eloquent->email,
            phone: $eloquent->phone,
            createdAt: new DateTimeImmutable($eloquent->created_at->toDateTimeString()),
            updatedAt: new DateTimeImmutable($eloquent->updated_at->toDateTimeString()),
            deletedAt: $eloquent->deleted_at
                ? new DateTimeImmutable($eloquent->deleted_at->toDateTimeString())
                : null
        );
    }
}
