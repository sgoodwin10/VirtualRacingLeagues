<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Platform\Entities\Car;
use App\Domain\Platform\Exceptions\CarNotFoundException;
use App\Domain\Platform\Repositories\CarRepositoryInterface;
use App\Domain\Platform\ValueObjects\CarGroup;
use App\Domain\Platform\ValueObjects\CarName;
use App\Domain\Platform\ValueObjects\CarYear;
use App\Domain\Platform\ValueObjects\ExternalId;
use App\Infrastructure\Persistence\Eloquent\Models\PlatformCarEloquent;
use DateTimeImmutable;

/**
 * Eloquent implementation of Car Repository.
 */
final readonly class EloquentCarRepository implements CarRepositoryInterface
{
    public function save(Car $car): void
    {
        $eloquentCar = $car->id() !== null
            ? PlatformCarEloquent::findOrFail($car->id())
            : new PlatformCarEloquent();

        $eloquentCar->platform_id = $car->platformId();
        $eloquentCar->car_brand_id = $car->carBrandId();
        $eloquentCar->external_id = $car->externalId()->value();
        $eloquentCar->name = $car->name()->value();
        $eloquentCar->slug = $car->slug();
        $eloquentCar->car_group = $car->carGroup()->value();
        $eloquentCar->year = $car->year()->value();
        $eloquentCar->image_url = $car->imageUrl();
        $eloquentCar->is_active = $car->isActive();
        $eloquentCar->sort_order = $car->sortOrder();

        $eloquentCar->save();

        // Set ID on new entities
        if ($car->id() === null) {
            $car->setId($eloquentCar->id);
        }
    }

    public function findById(int $id): Car
    {
        $eloquentCar = PlatformCarEloquent::find($id);

        if ($eloquentCar === null) {
            throw CarNotFoundException::withId($id);
        }

        return $this->toDomain($eloquentCar);
    }

    public function findByExternalId(ExternalId $externalId, int $platformId): ?Car
    {
        $eloquentCar = PlatformCarEloquent::where('external_id', $externalId->value())
            ->where('platform_id', $platformId)
            ->first();

        if ($eloquentCar === null) {
            return null;
        }

        return $this->toDomain($eloquentCar);
    }

    /**
     * @return array<string>
     */
    public function getAllExternalIds(int $platformId): array
    {
        return PlatformCarEloquent::where('platform_id', $platformId)
            ->pluck('external_id')
            ->toArray();
    }

    public function deactivateCarsNotInList(int $platformId, array $externalIds): int
    {
        return PlatformCarEloquent::where('platform_id', $platformId)
            ->where('is_active', true)
            ->whereNotIn('external_id', $externalIds)
            ->update(['is_active' => false]);
    }

    /**
     * @return array<Car>
     */
    public function getAllByPlatform(int $platformId): array
    {
        return PlatformCarEloquent::where('platform_id', $platformId)
            ->orderBy('name')
            ->get()
            ->map(fn (PlatformCarEloquent $eloquent) => $this->toDomain($eloquent))
            ->all();
    }

    /**
     * Convert Eloquent model to Domain entity.
     */
    private function toDomain(PlatformCarEloquent $eloquent): Car
    {
        return Car::reconstitute(
            id: $eloquent->id,
            platformId: $eloquent->platform_id,
            carBrandId: $eloquent->car_brand_id,
            externalId: ExternalId::from($eloquent->external_id),
            name: CarName::from($eloquent->name),
            slug: $eloquent->slug,
            carGroup: CarGroup::from($eloquent->car_group),
            year: CarYear::from($eloquent->year),
            imageUrl: $eloquent->image_url,
            isActive: $eloquent->is_active,
            sortOrder: $eloquent->sort_order,
            createdAt: new DateTimeImmutable($eloquent->created_at->toIso8601String()),
            updatedAt: new DateTimeImmutable($eloquent->updated_at->toIso8601String()),
        );
    }
}
