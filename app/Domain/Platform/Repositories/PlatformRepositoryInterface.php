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
     * Find platforms by IDs (returns only existing platforms).
     * Returns array keyed by platform ID for efficient lookups.
     *
     * @param array<int> $ids
     * @return array<int, array{id: int, name: string, slug: string}>
     */
    public function findByIds(array $ids): array;

    /**
     * Find active platforms by IDs.
     * Returns sequential array for JSON serialization compatibility.
     *
     * @param array<int> $ids
     * @return array<array{id: int, name: string, slug: string}>
     */
    public function findActiveByIds(array $ids): array;

    /**
     * Check if a platform exists by ID.
     */
    public function exists(int $id): bool;

    /**
     * Get all active platforms ordered by sort order.
     *
     * @return array<array{id: int, name: string, slug: string}>
     */
    public function getAllActive(): array;
}
