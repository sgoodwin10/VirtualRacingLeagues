<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Infrastructure\Persistence\Eloquent\Models\AdminEloquent;

/**
 * Read Model Service for Admin infrastructure-specific queries.
 * Handles queries that require infrastructure-level fields (like last_login_at).
 *
 * This service is separate from the domain repository to maintain clean architecture.
 * It provides read-only access to infrastructure fields that are not part of the domain model.
 */
final class AdminReadModelService
{
    /**
     * Get last login timestamps for multiple admins.
     * Returns an associative array of admin_id => last_login_at (ISO string or null).
     *
     * @param array<int> $adminIds
     * @return array<int, string|null>
     */
    public function getLastLoginTimestamps(array $adminIds): array
    {
        if (empty($adminIds)) {
            return [];
        }

        $admins = AdminEloquent::whereIn('id', $adminIds)
            ->select(['id', 'last_login_at'])
            ->get();

        $result = [];
        foreach ($admins as $admin) {
            $result[$admin->id] = $admin->last_login_at?->toISOString();
        }

        return $result;
    }

    /**
     * Get last login timestamp for a single admin.
     * Returns ISO string or null.
     */
    public function getLastLoginTimestamp(int $adminId): ?string
    {
        $admin = AdminEloquent::where('id', $adminId)
            ->select(['id', 'last_login_at'])
            ->first();

        return $admin?->last_login_at?->toISOString();
    }
}
