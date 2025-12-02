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
            // Update existing
            $eloquentDivision = DivisionEloquent::findOrFail($division->id());
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
            ->orderBy('name', 'asc')
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
            ->orderBy('name', 'asc')
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

    /**
     * Fill Eloquent model from domain entity.
     */
    private function fillEloquentModel(DivisionEloquent $eloquentDivision, Division $division): void
    {
        $eloquentDivision->season_id = $division->seasonId();
        $eloquentDivision->name = $division->name()->value();
        $eloquentDivision->description = $division->description()->value();
        $eloquentDivision->logo_url = $division->logoUrl();
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
            createdAt: new DateTimeImmutable($eloquentDivision->created_at->toDateTimeString()),
            updatedAt: new DateTimeImmutable($eloquentDivision->updated_at->toDateTimeString()),
        );
    }
}
