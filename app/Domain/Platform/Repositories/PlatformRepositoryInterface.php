<?php

declare(strict_types=1);

namespace App\Domain\Platform\Repositories;

/**
 * Platform Repository Interface.
 * Handles platform data retrieval.
 * Returns raw array data to avoid Application layer dependencies.
 */
interface PlatformRepositoryInterface
{
    /**
     * Find platform by ID.
     *
     * @throws \App\Domain\Platform\Exceptions\PlatformNotFoundException if platform not found
     * @return array{id: int, name: string, slug: string}
     */
    public function findById(int $id): array;

    /**
     * Find active platforms by IDs.
     *
     * @param array<int> $ids
     * @return array<int, array{id: int, name: string, slug: string}>
     */
    public function findActiveByIds(array $ids): array;

    /**
     * Get all active platforms ordered by sort order.
     *
     * @return array<int, array{id: int, name: string, slug: string}>
     */
    public function getAllActive(): array;
}
