<?php

declare(strict_types=1);

namespace App\Domain\Competition\Repositories;

use App\Domain\Competition\Entities\Season;
use App\Domain\Competition\Exceptions\SeasonNotFoundException;

/**
 * Season Repository Interface.
 *
 * Defines contract for season persistence operations.
 */
interface SeasonRepositoryInterface
{
    /**
     * Save a season (create or update).
     *
     * @throws \Exception
     */
    public function save(Season $season): void;

    /**
     * Find season by ID.
     *
     * @throws SeasonNotFoundException
     */
    public function findById(int $id): Season;

    /**
     * Find season by ID including soft-deleted.
     *
     * @throws SeasonNotFoundException
     */
    public function findByIdWithTrashed(int $id): Season;

    /**
     * Find season by slug within a competition.
     *
     * @throws SeasonNotFoundException
     */
    public function findBySlugAndCompetition(string $slug, int $competitionId): Season;

    /**
     * Check if season exists by slug within a competition.
     */
    public function existsBySlugAndCompetition(string $slug, int $competitionId): bool;

    /**
     * Check if slug is available (doesn't exist) within a competition.
     * Optionally exclude a specific season (useful for edit scenarios).
     */
    public function isSlugAvailable(string $slug, int $competitionId, ?int $excludeId = null): bool;

    /**
     * Get all seasons for a competition.
     *
     * @return array<Season>
     */
    public function findByCompetition(int $competitionId): array;

    /**
     * Get paginated seasons for a competition.
     *
     * @param array<string, mixed> $filters
     * @return array{data: array<Season>, total: int, per_page: int, current_page: int, last_page: int}
     */
    public function paginate(int $page, int $perPage, array $filters = []): array;

    /**
     * Delete a season (soft delete).
     */
    public function delete(Season $season): void;

    /**
     * Force delete a season (permanent deletion, bypassing soft delete).
     */
    public function forceDelete(int $id): void;

    /**
     * Restore a soft-deleted season.
     */
    public function restore(int $id): void;

    /**
     * Get next available slug for a competition.
     * Handles conflict resolution by appending -01, -02, etc.
     */
    public function generateUniqueSlug(string $baseSlug, int $competitionId, ?int $excludeSeasonId = null): string;

    /**
     * Get all seasons for a competition with statistics.
     * Returns seasons ordered by most recent first (latest created_at).
     *
     * @return array<array{season: Season, stats: array{driver_count: int, round_count: int, race_count: int}}>
     */
    public function getSeasonsWithStatsForCompetition(int $competitionId): array;

    /**
     * Batch get all seasons with statistics for multiple competitions.
     * Returns seasons ordered by most recent first (latest created_at).
     *
     * @param array<int> $competitionIds
     * @return array<int, array<array{
     *     season: Season,
     *     stats: array{driver_count: int, round_count: int, race_count: int}
     * }>>
     */
    public function getBatchSeasonsWithStatsForCompetitions(array $competitionIds): array;
}
