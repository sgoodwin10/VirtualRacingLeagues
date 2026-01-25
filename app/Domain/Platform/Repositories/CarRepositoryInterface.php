<?php

declare(strict_types=1);

namespace App\Domain\Platform\Repositories;

use App\Domain\Platform\Entities\Car;
use App\Domain\Platform\Exceptions\CarNotFoundException;
use App\Domain\Platform\ValueObjects\ExternalId;

/**
 * Car Repository Interface.
 */
interface CarRepositoryInterface
{
    /**
     * Save a car entity.
     */
    public function save(Car $car): void;

    /**
     * Find a car by ID.
     *
     * @throws CarNotFoundException
     */
    public function findById(int $id): Car;

    /**
     * Find a car by external ID and platform ID.
     */
    public function findByExternalId(ExternalId $externalId, int $platformId): ?Car;

    /**
     * Get all external IDs for a platform.
     *
     * @return array<string>
     */
    public function getAllExternalIds(int $platformId): array;

    /**
     * Deactivate cars not in the provided list of external IDs.
     *
     * @param  array<string>  $externalIds
     * @return int Number of cars deactivated
     */
    public function deactivateCarsNotInList(int $platformId, array $externalIds): int;

    /**
     * Get all cars for a platform.
     *
     * @return array<Car>
     */
    public function getAllByPlatform(int $platformId): array;
}
