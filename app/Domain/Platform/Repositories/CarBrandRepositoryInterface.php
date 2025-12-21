<?php

declare(strict_types=1);

namespace App\Domain\Platform\Repositories;

use App\Domain\Platform\Entities\CarBrand;
use App\Domain\Platform\Exceptions\CarBrandNotFoundException;
use App\Domain\Platform\ValueObjects\BrandName;

/**
 * CarBrand Repository Interface.
 */
interface CarBrandRepositoryInterface
{
    /**
     * Save a car brand entity.
     */
    public function save(CarBrand $brand): void;

    /**
     * Find a car brand by ID.
     *
     * @throws CarBrandNotFoundException
     */
    public function findById(int $id): CarBrand;

    /**
     * Find a car brand by name.
     */
    public function findByName(BrandName $name): ?CarBrand;

    /**
     * Get all car brands.
     *
     * @return array<CarBrand>
     */
    public function getAll(): array;
}
