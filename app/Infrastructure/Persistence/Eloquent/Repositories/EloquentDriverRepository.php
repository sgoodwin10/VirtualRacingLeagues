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
