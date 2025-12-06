<?php

declare(strict_types=1);

namespace App\Domain\User\Repositories;

use App\Domain\User\Entities\User;
use App\Domain\User\Exceptions\UserNotFoundException;

/**
 * User Repository Interface.
 * Defines the contract for user persistence operations.
 */
interface UserRepositoryInterface
{
    /**
     * Find a user by ID.
     *
     * @throws UserNotFoundException
     */
    public function findById(int $id): User;

    /**
     * Find a user by ID, or return null if not found.
     */
    public function findByIdOrNull(int $id): ?User;

    /**
     * Find a user by email.
     *
     * @throws UserNotFoundException
     */
    public function findByEmail(string $email): User;

    /**
     * Find a user by email, or return null if not found.
     */
    public function findByEmailOrNull(string $email): ?User;

    /**
     * Find a user by UUID.
     *
     * @throws UserNotFoundException
     */
    public function findByUuid(string $uuid): User;

    /**
     * Find a user by UUID, or return null if not found.
     */
    public function findByUuidOrNull(string $uuid): ?User;

    /**
     * Check if a user exists by email.
     */
    public function existsByEmail(string $email): bool;

    /**
     * Check if a user exists by UUID.
     */
    public function existsByUuid(string $uuid): bool;

    /**
     * Get all users with optional filters.
     *
     * @param array<string, mixed> $filters
     * @return array<int, User>
     */
    public function all(array $filters = []): array;

    /**
     * Get paginated users with optional filters.
     *
     * @param array<string, mixed> $filters
     * @return array{data: array<int, User>, total: int, per_page: int, current_page: int}
     */
    public function paginate(int $page = 1, int $perPage = 15, array $filters = []): array;

    /**
     * Save a user (create or update).
     * Optional hashed password can be provided for creation/updates (infrastructure concern).
     */
    public function save(User $user, ?string $hashedPassword = null): void;

    /**
     * Delete a user (soft delete).
     */
    public function delete(User $user): void;

    /**
     * Restore a soft-deleted user.
     */
    public function restore(User $user): void;

    /**
     * Permanently delete a user.
     */
    public function forceDelete(User $user): void;

    /**
     * Count users with optional filters.
     *
     * @param array<string, mixed> $filters
     */
    public function count(array $filters = []): int;

    /**
     * Get recent activity logs for a user.
     *
     * @param int $userId
     * @param int $limit
     * @return array<int, mixed> Array of activity log data
     */
    public function getRecentActivities(int $userId, int $limit = 50): array;

    /**
     * Find multiple users by their IDs.
     *
     * @param array<int> $ids
     * @return array<int, array{id: int, first_name: string, last_name: string, email: string}> Keyed by user ID
     */
    public function findMultipleByIds(array $ids): array;
}
