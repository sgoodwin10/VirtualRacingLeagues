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

        return $this->mapPlatformToArray($platform);
    }

    /**
     * Find platforms by IDs (returns only existing platforms).
     * Returns array keyed by platform ID for efficient lookups.
     *
     * @param array<int> $ids
     * @return array<int, array{id: int, name: string, slug: string}>
     */
    public function findByIds(array $ids): array
    {
        if (empty($ids)) {
            return [];
        }

        /** @var \Illuminate\Database\Eloquent\Collection<int, Platform> $platforms */
        $platforms = Platform::whereIn('id', $ids)
            ->orderBy('sort_order')
            ->get(['id', 'name', 'slug']);

        return $platforms->mapWithKeys(fn(Platform $platform) => [
            $platform->id => $this->mapPlatformToArray($platform),
        ])->toArray();
    }

    /**
     * Find active platforms by IDs.
     * Returns sequential array for JSON serialization compatibility.
     *
     * @param array<int> $ids
     * @return array<array{id: int, name: string, slug: string}>
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

        return $platforms->map(fn(Platform $platform) =>
            $this->mapPlatformToArray($platform))->toArray();
    }

    /**
     * Check if a platform exists by ID.
     */
    public function exists(int $id): bool
    {
        return Platform::where('id', $id)->exists();
    }

    /**
     * Get all active platforms ordered by sort order.
     *
     * @return array<array{id: int, name: string, slug: string}>
     */
    public function getAllActive(): array
    {
        /** @var \Illuminate\Database\Eloquent\Collection<int, Platform> $platforms */
        $platforms = Platform::where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'name', 'slug']);

        return $platforms->map(fn(Platform $platform) =>
            $this->mapPlatformToArray($platform))->toArray();
    }

    /**
     * Find a platform ID by name.
     *
     * @throws PlatformNotFoundException
     */
    public function findIdByName(string $name): int
    {
        $platform = Platform::where('name', $name)->first(['id']);

        if (!$platform) {
            throw PlatformNotFoundException::withName($name);
        }

        return $platform->id;
    }

    /**
     * Map Platform model to array.
     * DRY helper to avoid repeating array structure.
     *
     * @return array{id: int, name: string, slug: string}
     */
    private function mapPlatformToArray(Platform $platform): array
    {
        return [
            'id' => $platform->id,
            'name' => $platform->name,
            'slug' => $platform->slug,
        ];
    }
}
