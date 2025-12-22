<?php

declare(strict_types=1);

namespace App\Domain\Competition\Repositories;

use App\Domain\Competition\Entities\Competition;
use App\Infrastructure\Persistence\Eloquent\Models\Competition as CompetitionModel;

/**
 * Repository interface for Competition aggregate.
 * Defines contract for persistence operations.
 */
interface CompetitionRepositoryInterface
{
    // Persistence
    public function save(Competition $competition): void;

    public function update(Competition $competition): void;

    public function delete(Competition $competition): void;

    // Retrieval
    public function findById(int $id): Competition;

    public function findBySlug(string $slug, int $leagueId): Competition;

    /**
     * @return array<Competition>
     */
    public function findByLeagueId(int $leagueId): array;

    // Queries
    public function existsBySlug(string $slug, int $leagueId, ?int $excludeId = null): bool;

    public function isSlugAvailable(string $slug, int $leagueId, ?int $excludeId = null): bool;

    public function countByLeagueId(int $leagueId): int;

    public function countActiveByLeagueId(int $leagueId): int;

    /**
     * Get stats for a competition entity.
     *
     * @return array<string, int|string|null>
     */
    public function getStatsForEntity(Competition $competition): array;

    /**
     * Get stats for multiple competition entities.
     *
     * @param array<Competition> $competitions
     * @return array<int, array<string, int|string|null>> Keyed by competition ID
     */
    public function getStatsForEntities(array $competitions): array;

    /**
     * Get the Eloquent model for a competition by ID.
     * Used for media operations that require the Eloquent model.
     */
    public function getEloquentModel(int $id): CompetitionModel;
}
