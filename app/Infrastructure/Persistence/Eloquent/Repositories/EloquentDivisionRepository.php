<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Division\Entities\Division;
use App\Domain\Division\Exceptions\DivisionNotFoundException;
use App\Domain\Division\Repositories\DivisionRepositoryInterface;
use App\Domain\Division\ValueObjects\DivisionDescription;
use App\Domain\Division\ValueObjects\DivisionName;
use App\Infrastructure\Persistence\Eloquent\Models\Division as DivisionEloquent;
use DateTimeImmutable;
use Illuminate\Support\Facades\DB;

/**
 * Eloquent implementation of Division Repository.
 * Maps between domain entities and Eloquent models.
 */
final class EloquentDivisionRepository implements DivisionRepositoryInterface
{
    public function save(Division $division): void
    {
        if ($division->id() === null) {
            // Create new
            $eloquentDivision = new DivisionEloquent();
            $this->fillEloquentModel($eloquentDivision, $division);

            $eloquentDivision->save();

            // Set ID on domain entity
            $division->setId($eloquentDivision->id);
        } else {
            // Update existing - implement optimistic locking
            $eloquentDivision = DivisionEloquent::findOrFail($division->id());

            // Check if entity's updatedAt matches database (optimistic locking)
            if (
                $division->updatedAt()->format('Y-m-d H:i:s') !==
                $eloquentDivision->updated_at->format('Y-m-d H:i:s')
            ) {
                throw new \RuntimeException(
                    sprintf(
                        'Division with ID %d has been modified by another process. ' .
                        'Expected updatedAt: %s, but found: %s',
                        $division->id(),
                        $division->updatedAt()->format('Y-m-d H:i:s'),
                        $eloquentDivision->updated_at->format('Y-m-d H:i:s')
                    )
                );
            }

            $this->fillEloquentModel($eloquentDivision, $division);

            $eloquentDivision->save();
        }
    }

    public function findById(int $id): Division
    {
        $eloquentDivision = DivisionEloquent::find($id);

        if ($eloquentDivision === null) {
            throw DivisionNotFoundException::withId($id);
        }

        return $this->toDomainEntity($eloquentDivision);
    }

    /**
     * @return array<Division>
     */
    public function findBySeasonId(int $seasonId): array
    {
        /** @var \Illuminate\Database\Eloquent\Collection<int, DivisionEloquent> $eloquentDivisions */
        $eloquentDivisions = DivisionEloquent::where('season_id', $seasonId)
            ->orderBy('order', 'asc')
            ->get();

        return $eloquentDivisions->map(
            /** @param DivisionEloquent $eloquentDivision */
            fn($eloquentDivision) => $this->toDomainEntity($eloquentDivision)
        )->all();
    }

    /**
     * @return array<int, string>
     */
    public function findNamesBySeasonId(int $seasonId): array
    {
        /** @var \Illuminate\Database\Eloquent\Collection<int, DivisionEloquent> $eloquentDivisions */
        $eloquentDivisions = DivisionEloquent::where('season_id', $seasonId)
            ->orderBy('order', 'asc')
            ->get(['id', 'name']);

        return $eloquentDivisions->pluck('name', 'id')->all();
    }

    public function delete(Division $division): void
    {
        if ($division->id() === null) {
            return;
        }

        $eloquentDivision = DivisionEloquent::findOrFail($division->id());

        // Hard delete - this will cascade to set season_drivers.division_id to NULL
        $eloquentDivision->delete();
    }

    public function getDriverCount(int $divisionId): int
    {
        $eloquentDivision = DivisionEloquent::find($divisionId);

        if ($eloquentDivision === null) {
            throw DivisionNotFoundException::withId($divisionId);
        }

        return $eloquentDivision->seasonDrivers()->count();
    }

    public function getNextOrderForSeason(int $seasonId): int
    {
        /** @var int|string|null $maxOrder */
        $maxOrder = DB::table('divisions')
            ->where('season_id', $seasonId)
            ->max('order');

        return $maxOrder !== null ? ((int) $maxOrder) + 1 : 1;
    }

    public function renumberDivisionsForSeason(int $seasonId): void
    {
        /** @var \Illuminate\Database\Eloquent\Collection<int, DivisionEloquent> $eloquentDivisions */
        $eloquentDivisions = DivisionEloquent::where('season_id', $seasonId)
            ->orderBy('order', 'asc')
            ->get(['id']);

        if ($eloquentDivisions->isEmpty()) {
            return;
        }

        // Build map of division ID => new order
        $divisionOrders = [];
        $order = 1;
        foreach ($eloquentDivisions as $eloquentDivision) {
            $divisionOrders[$eloquentDivision->id] = $order++;
        }

        // Use existing bulk update method for performance (single query)
        $this->bulkUpdateOrders($divisionOrders);
    }

    /**
     * Bulk update division orders using a single CASE/WHEN query.
     *
     * @param array<int, int> $divisionOrders Map of division ID => order
     * @throws \InvalidArgumentException if array contains non-integer values
     */
    public function bulkUpdateOrders(array $divisionOrders): void
    {
        if (empty($divisionOrders)) {
            return;
        }

        $cases = [];
        $ids = [];
        $bindings = [];

        foreach ($divisionOrders as $divisionId => $order) {
            $cases[] = "WHEN id = ? THEN ?";
            $bindings[] = $divisionId;
            $bindings[] = $order;
            $ids[] = $divisionId;
        }

        $casesString = implode(' ', $cases);
        $idsPlaceholders = implode(',', array_fill(0, count($ids), '?'));

        DB::update(
            "UPDATE divisions SET `order` = CASE {$casesString} END WHERE id IN ({$idsPlaceholders})",
            array_merge($bindings, $ids)
        );
    }

    /**
     * @return array<int, string>
     */
    public function findNamesByIds(array $divisionIds): array
    {
        if (empty($divisionIds)) {
            return [];
        }

        /** @var \Illuminate\Database\Eloquent\Collection<int, DivisionEloquent> $eloquentDivisions */
        $eloquentDivisions = DivisionEloquent::whereIn('id', $divisionIds)
            ->get(['id', 'name']);

        $divisionNames = [];
        /** @var DivisionEloquent $division */
        foreach ($eloquentDivisions as $division) {
            $divisionNames[$division->id] = $division->name ?? 'Unknown Division';
        }

        return $divisionNames;
    }

    /**
     * @return array<int, array{name: string, order: int}>
     */
    public function findDataByIds(array $divisionIds): array
    {
        if (empty($divisionIds)) {
            return [];
        }

        /** @var \Illuminate\Database\Eloquent\Collection<int, DivisionEloquent> $eloquentDivisions */
        $eloquentDivisions = DivisionEloquent::whereIn('id', $divisionIds)
            ->get(['id', 'name', 'order']);

        $divisionData = [];
        /** @var DivisionEloquent $division */
        foreach ($eloquentDivisions as $division) {
            $divisionData[$division->id] = [
                'name' => $division->name ?? 'Unknown Division',
                'order' => $division->order ?? 0,
            ];
        }

        return $divisionData;
    }

    /**
     * Fill Eloquent model from domain entity.
     */
    private function fillEloquentModel(DivisionEloquent $eloquentDivision, Division $division): void
    {
        $eloquentDivision->season_id = $division->seasonId();
        $eloquentDivision->name = $division->name()->value();
        $eloquentDivision->description = $division->description()->value();
        $eloquentDivision->logo_url = $division->logoUrl();
        $eloquentDivision->order = $division->order();
    }

    /**
     * Map Eloquent model to domain entity.
     */
    private function toDomainEntity(DivisionEloquent $eloquentDivision): Division
    {
        return Division::reconstitute(
            id: $eloquentDivision->id,
            seasonId: $eloquentDivision->season_id,
            name: DivisionName::from($eloquentDivision->name),
            description: DivisionDescription::from($eloquentDivision->description),
            logoUrl: $eloquentDivision->logo_url,
            order: $eloquentDivision->order,
            createdAt: new DateTimeImmutable($eloquentDivision->created_at->toDateTimeString()),
            updatedAt: new DateTimeImmutable($eloquentDivision->updated_at->toDateTimeString()),
        );
    }
}
