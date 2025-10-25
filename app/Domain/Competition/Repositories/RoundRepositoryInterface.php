<?php

declare(strict_types=1);

namespace App\Domain\Competition\Repositories;

use App\Domain\Competition\Entities\Round;

/**
 * Repository interface for Round entity.
 */
interface RoundRepositoryInterface
{
    /**
     * Save a round (create or update).
     */
    public function save(Round $round): void;

    /**
     * Find a round by ID.
     *
     * @throws \App\Domain\Competition\Exceptions\RoundNotFoundException
     */
    public function findById(int $id): Round;

    /**
     * Find all rounds for a season.
     *
     * @return array<Round>
     */
    public function findBySeasonId(int $seasonId): array;

    /**
     * Delete a round (soft delete).
     */
    public function delete(Round $round): void;

    /**
     * Generate a unique slug for the given season.
     */
    public function generateUniqueSlug(string $baseSlug, int $seasonId, ?int $excludeId = null): string;

    /**
     * Get the next round number for a season.
     */
    public function getNextRoundNumber(int $seasonId): int;

    /**
     * Check if a round exists.
     */
    public function exists(int $id): bool;
}
