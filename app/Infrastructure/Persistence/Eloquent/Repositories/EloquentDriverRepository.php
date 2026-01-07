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

    /**
     * Find driver by platform ID (PSN, iRacing, or Discord).
     *
     * Uses OR logic to match ANY of the provided platform IDs.
     * This is correct behavior because a driver is considered the same person
     * if ANY of their platform IDs match (e.g., same PSN_ID = same driver).
     *
     * Example: If a driver exists with PSN_ID="abc123", searching with
     * PSN_ID="abc123" and Discord_ID="different#999" will find the existing driver,
     * because the PSN_ID matches (identifying them as the same person).
     */
    public function findByPlatformId(
        ?string $psnId,
        ?string $iracingId,
        ?int $iracingCustomerId,
        ?string $discordId = null
    ): ?DriverEntity {
        $query = DriverEloquent::query();

        // Build OR conditions for platform IDs - matches if ANY platform ID matches
        // This is intentional: a driver is the same person if ANY ID matches
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

    /**
     * Check if driver exists by platform IDs in a specific league.
     *
     * Uses OR logic to check if ANY of the provided platform IDs exist in the league.
     * This is correct behavior because it prevents duplicate driver entries for the same person.
     * If ANY platform ID matches an existing league driver, they are already in the league.
     *
     * Example: If league has a driver with PSN_ID="abc123", attempting to add another
     * driver with PSN_ID="abc123" but different Discord_ID should be blocked,
     * because it's the same person (identified by matching PSN_ID).
     */
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

        // Build OR conditions for platform IDs - returns true if ANY platform ID matches
        // This is intentional: prevents duplicate entries for the same person in a league
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
            $escapedSearch = $this->escapeLikeWildcards($search);
            $query->where(function ($q) use ($escapedSearch) {
                $q->where('drivers.first_name', 'LIKE', "%{$escapedSearch}%")
                    ->orWhere('drivers.last_name', 'LIKE', "%{$escapedSearch}%")
                    ->orWhere('drivers.nickname', 'LIKE', "%{$escapedSearch}%")
                    ->orWhere('drivers.slug', 'LIKE', "%{$escapedSearch}%")
                    ->orWhere('drivers.psn_id', 'LIKE', "%{$escapedSearch}%")
                    ->orWhere('drivers.iracing_id', 'LIKE', "%{$escapedSearch}%")
                    ->orWhere('drivers.discord_id', 'LIKE', "%{$escapedSearch}%");
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
            'last_page' => $total > 0 ? (int) ceil($total / $perPage) : 1,
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
        $counts = DB::table('league_drivers')
            ->where('league_id', $leagueId)
            ->selectRaw('
                COUNT(*) as total,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as inactive,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as banned
            ', ['active', 'inactive', 'banned'])
            ->first();

        // Handle edge case where query returns null (should never happen with COUNT, but PHPStan requires null check)
        if ($counts === null) {
            return [
                'total' => 0,
                'active' => 0,
                'inactive' => 0,
                'banned' => 0,
            ];
        }

        return [
            'total' => (int) $counts->total,
            'active' => (int) $counts->active,
            'inactive' => (int) $counts->inactive,
            'banned' => (int) $counts->banned,
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
            $escapedSearch = $this->escapeLikeWildcards($search);
            $query->where(function ($q) use ($escapedSearch) {
                $q->where('first_name', 'LIKE', "%{$escapedSearch}%")
                    ->orWhere('last_name', 'LIKE', "%{$escapedSearch}%")
                    ->orWhere('nickname', 'LIKE', "%{$escapedSearch}%")
                    ->orWhere('slug', 'LIKE', "%{$escapedSearch}%")
                    ->orWhere('email', 'LIKE', "%{$escapedSearch}%")
                    ->orWhere('psn_id', 'LIKE', "%{$escapedSearch}%")
                    ->orWhere('iracing_id', 'LIKE', "%{$escapedSearch}%")
                    ->orWhere('discord_id', 'LIKE', "%{$escapedSearch}%");
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
            'last_page' => $total > 0 ? (int) ceil($total / $perPage) : 1,
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
        $stats = DB::table('race_results')
            ->where('driver_id', $driverId)
            ->selectRaw('
                COUNT(*) as races,
                SUM(CASE WHEN position = 1 THEN 1 ELSE 0 END) as wins,
                SUM(CASE WHEN position BETWEEN 1 AND 3 THEN 1 ELSE 0 END) as podiums,
                SUM(CASE WHEN has_pole = 1 THEN 1 ELSE 0 END) as poles,
                SUM(CASE WHEN has_fastest_lap = 1 THEN 1 ELSE 0 END) as fastest_laps,
                SUM(CASE WHEN dnf = 1 THEN 1 ELSE 0 END) as dnfs,
                MIN(CASE WHEN position > 0 THEN position ELSE NULL END) as best_finish
            ')
            ->first();

        // Handle edge case where query returns null (should never happen with COUNT, but PHPStan requires null check)
        if ($stats === null) {
            return [
                'races' => 0,
                'wins' => 0,
                'podiums' => 0,
                'poles' => 0,
                'fastest_laps' => 0,
                'dnfs' => 0,
                'best_finish' => null,
            ];
        }

        return [
            'races' => (int) $stats->races,
            'wins' => (int) $stats->wins,
            'podiums' => (int) $stats->podiums,
            'poles' => (int) $stats->poles,
            'fastest_laps' => (int) $stats->fastest_laps,
            'dnfs' => (int) $stats->dnfs,
            'best_finish' => $stats->best_finish !== null ? (int) $stats->best_finish : null,
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
     * Get all seasons a league driver is participating in.
     *
     * Returns seasons sorted by:
     * 1. Active seasons first (status = 'active')
     * 2. Then by added_at descending (most recent first)
     * 3. Completed/archived seasons at the bottom
     *
     * @return array<int, array{
     *     season_id: int,
     *     season_name: string,
     *     season_slug: string,
     *     season_status: string,
     *     competition_id: int,
     *     competition_name: string,
     *     competition_slug: string,
     *     division_name: string|null,
     *     team_name: string|null,
     *     added_at: string
     * }>
     */
    public function getSeasonsForLeagueDriver(int $leagueDriverId): array
    {
        $seasons = DB::table('season_drivers')
            ->join('seasons', 'season_drivers.season_id', '=', 'seasons.id')
            ->join('competitions', 'seasons.competition_id', '=', 'competitions.id')
            ->leftJoin('divisions', 'season_drivers.division_id', '=', 'divisions.id')
            ->leftJoin('teams', 'season_drivers.team_id', '=', 'teams.id')
            ->where('season_drivers.league_driver_id', $leagueDriverId)
            ->select([
                'seasons.id as season_id',
                'seasons.name as season_name',
                'seasons.slug as season_slug',
                'seasons.status as season_status',
                'competitions.id as competition_id',
                'competitions.name as competition_name',
                'competitions.slug as competition_slug',
                'divisions.name as division_name',
                'teams.name as team_name',
                'season_drivers.added_at',
            ])
            ->orderByRaw("CASE WHEN seasons.status = 'active' THEN 0 ELSE 1 END")
            ->orderBy('season_drivers.added_at', 'desc')
            ->get();

        return $seasons->map(fn ($season) => [
            'season_id' => (int) $season->season_id,
            'season_name' => $season->season_name,
            'season_slug' => $season->season_slug,
            'season_status' => $season->season_status,
            'competition_id' => (int) $season->competition_id,
            'competition_name' => $season->competition_name,
            'competition_slug' => $season->competition_slug,
            'division_name' => $season->division_name,
            'team_name' => $season->team_name,
            'added_at' => $season->added_at,
        ])->toArray();
    }

    /**
     * Escape LIKE wildcard characters to prevent SQL injection.
     *
     * Escapes backslash, percent, and underscore characters that have special
     * meaning in LIKE clauses to prevent users from using them as wildcards.
     */
    private function escapeLikeWildcards(string $value): string
    {
        return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $value);
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
