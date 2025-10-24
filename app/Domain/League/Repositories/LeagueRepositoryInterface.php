<?php

declare(strict_types=1);

namespace App\Domain\League\Repositories;

use App\Domain\League\Entities\League;
use App\Domain\League\Exceptions\LeagueNotFoundException;

/**
 * League Repository Interface.
 * Defines the contract for league persistence operations.
 */
interface LeagueRepositoryInterface
{
    /**
     * Find a league by ID.
     *
     * @throws LeagueNotFoundException
     */
    public function findById(int $id): League;

    /**
     * Find a league by ID, or return null if not found.
     */
    public function findByIdOrNull(int $id): ?League;

    /**
     * Find a league by slug.
     *
     * @throws LeagueNotFoundException
     */
    public function findBySlug(string $slug): League;

    /**
     * Find a league by slug, or return null if not found.
     */
    public function findBySlugOrNull(string $slug): ?League;

    /**
     * Check if a slug is available.
     *
     * @param string $slug The slug to check
     * @param int|null $excludeLeagueId Optional league ID to exclude from the check (for updates)
     */
    public function isSlugAvailable(string $slug, ?int $excludeLeagueId = null): bool;

    /**
     * Get all leagues for a specific user (owner).
     *
     * @return array<int, League>
     */
    public function findByUserId(int $userId): array;

    /**
     * Count leagues owned by a user.
     */
    public function countByUserId(int $userId): int;

    /**
     * Get all leagues with optional filters.
     *
     * @param array<string, mixed> $filters
     * @return array<int, League>
     */
    public function all(array $filters = []): array;

    /**
     * Save a league (create or update).
     */
    public function save(League $league): void;

    /**
     * Update an existing league.
     */
    public function update(League $league): void;

    /**
     * Delete a league (soft delete).
     */
    public function delete(League $league): void;

    /**
     * Restore a soft-deleted league.
     */
    public function restore(League $league): void;

    /**
     * Permanently delete a league.
     */
    public function forceDelete(League $league): void;

    /**
     * Get platforms associated with a league.
     *
     * @param int $leagueId
     * @return array<int, array{id: int, name: string, slug: string, description: ?string, logo_url: ?string}>
     */
    public function getPlatformsByLeagueId(int $leagueId): array;

    /**
     * Get paginated leagues for admin with filters.
     *
     * @param int $page
     * @param int $perPage
     * @param array<string, mixed> $filters
     * @return array{data: array<int, League>, total: int, per_page: int, current_page: int, last_page: int}
     */
    public function getPaginatedForAdmin(int $page, int $perPage, array $filters = []): array;
}
