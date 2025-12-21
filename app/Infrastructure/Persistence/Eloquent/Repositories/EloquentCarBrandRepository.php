<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Platform\Entities\CarBrand;
use App\Domain\Platform\Exceptions\CarBrandNotFoundException;
use App\Domain\Platform\Repositories\CarBrandRepositoryInterface;
use App\Domain\Platform\ValueObjects\BrandName;
use App\Infrastructure\Persistence\Eloquent\Models\CarBrandEloquent;
use DateTimeImmutable;

/**
 * Eloquent implementation of CarBrand Repository.
 */
final readonly class EloquentCarBrandRepository implements CarBrandRepositoryInterface
{
    public function save(CarBrand $brand): void
    {
        $eloquentBrand = $brand->id() !== null
            ? CarBrandEloquent::findOrFail($brand->id())
            : new CarBrandEloquent();

        $eloquentBrand->name = $brand->name()->value();
        $eloquentBrand->slug = $brand->slug();
        $eloquentBrand->logo_url = $brand->logoUrl();
        $eloquentBrand->is_active = $brand->isActive();
        $eloquentBrand->sort_order = $brand->sortOrder();

        $eloquentBrand->save();

        // Set ID on new entities
        if ($brand->id() === null) {
            $brand->setId($eloquentBrand->id);
        }
    }

    public function findById(int $id): CarBrand
    {
        $eloquentBrand = CarBrandEloquent::find($id);

        if ($eloquentBrand === null) {
            throw CarBrandNotFoundException::withId($id);
        }

        return $this->toDomain($eloquentBrand);
    }

    public function findByName(BrandName $name): ?CarBrand
    {
        $eloquentBrand = CarBrandEloquent::where('name', $name->value())->first();

        if ($eloquentBrand === null) {
            return null;
        }

        return $this->toDomain($eloquentBrand);
    }

    /**
     * @return array<CarBrand>
     */
    public function getAll(): array
    {
        return CarBrandEloquent::orderBy('name')
            ->get()
            ->map(fn (CarBrandEloquent $eloquent) => $this->toDomain($eloquent))
            ->all();
    }

    /**
     * Convert Eloquent model to Domain entity.
     */
    private function toDomain(CarBrandEloquent $eloquent): CarBrand
    {
        return CarBrand::reconstitute(
            id: $eloquent->id,
            name: BrandName::from($eloquent->name),
            slug: $eloquent->slug,
            logoUrl: $eloquent->logo_url,
            isActive: $eloquent->is_active,
            sortOrder: $eloquent->sort_order,
            createdAt: new DateTimeImmutable($eloquent->created_at->toIso8601String()),
            updatedAt: new DateTimeImmutable($eloquent->updated_at->toIso8601String()),
        );
    }
}
