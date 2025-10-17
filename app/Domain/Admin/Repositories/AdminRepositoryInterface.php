<?php

declare(strict_types=1);

namespace App\Domain\Admin\Repositories;

use App\Domain\Admin\Entities\Admin;
use App\Domain\Admin\Exceptions\AdminNotFoundException;
use App\Domain\Shared\ValueObjects\EmailAddress;

interface AdminRepositoryInterface
{
    /**
     * Save admin entity (create or update)
     */
    public function save(Admin $admin): void;

    /**
     * Find admin by ID
     *
     * @throws AdminNotFoundException
     */
    public function findById(int $id): Admin;

    /**
     * Find admin by email
     */
    public function findByEmail(EmailAddress $email): ?Admin;

    /**
     * Check if email exists (optionally excluding a specific admin ID)
     */
    public function emailExists(EmailAddress $email, ?int $excludeId = null): bool;

    /**
     * Get paginated admins
     *
     * @param int $page
     * @param int $perPage
     * @param array<string, mixed> $filters
     * @return array{data: Admin[], total: int, per_page: int, current_page: int}
     */
    public function getPaginated(int $page, int $perPage, array $filters = []): array;

    /**
     * Delete admin (for repository cleanup, not business logic)
     */
    public function delete(Admin $admin): void;
}
