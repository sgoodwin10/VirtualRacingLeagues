<?php

declare(strict_types=1);

namespace App\Domain\Platform\Repositories;

use App\Application\Competition\DTOs\PlatformData;

/**
 * Platform Repository Interface.
 * Handles platform data retrieval.
 */
interface PlatformRepositoryInterface
{
    /**
     * Find platform by ID and return as DTO.
     *
     * @throws \RuntimeException if platform not found
     */
    public function findById(int $id): PlatformData;

    /**
     * Find active platforms by IDs.
     *
     * @param array<int> $ids
     * @return array<array{id: int, name: string, slug: string}>
     */
    public function findActiveByIds(array $ids): array;
}
