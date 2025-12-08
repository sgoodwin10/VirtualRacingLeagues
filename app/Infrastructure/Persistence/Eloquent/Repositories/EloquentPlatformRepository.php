<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Platform\Exceptions\PlatformNotFoundException;
use App\Domain\Platform\Repositories\PlatformRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\Models\Platform;

/**
 * Eloquent implementation of PlatformRepositoryInterface.
 * Handles platform data retrieval from database.
 * Returns raw array data following DDD principles (no Application layer dependencies).
 */
final class EloquentPlatformRepository implements PlatformRepositoryInterface
{
    /**
     * Find platform by ID.
     *
     * @return array{id: int, name: string, slug: string}
     * @throws PlatformNotFoundException
     */
    public function findById(int $id): array
    {
        $platform = Platform::find($id);

        if (!$platform) {
            throw PlatformNotFoundException::withId($id);
        }

        return [
            'id' => $platform->id,
            'name' => $platform->name,
            'slug' => $platform->slug,
        ];
    }

    /**
     * Find active platforms by IDs.
     *
     * @param array<int> $ids
     * @return array<int, array{id: int, name: string, slug: string}>
     */
    public function findActiveByIds(array $ids): array
    {
        if (empty($ids)) {
            return [];
        }

        /** @var \Illuminate\Database\Eloquent\Collection<int, Platform> $platforms */
        $platforms = Platform::whereIn('id', $ids)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'name', 'slug']);

        return $platforms->map(fn($platform) => [
            'id' => $platform->id,
            'name' => $platform->name,
            'slug' => $platform->slug,
        ])->toArray();
    }

    /**
     * Get all active platforms ordered by sort order.
     *
     * @return array<int, array{id: int, name: string, slug: string}>
     */
    public function getAllActive(): array
    {
        /** @var \Illuminate\Database\Eloquent\Collection<int, Platform> $platforms */
        $platforms = Platform::where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'name', 'slug']);

        return $platforms->map(fn($platform) => [
            'id' => $platform->id,
            'name' => $platform->name,
            'slug' => $platform->slug,
        ])->toArray();
    }
}
