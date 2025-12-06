<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Application\Competition\DTOs\PlatformData;
use App\Domain\Platform\Repositories\PlatformRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\Models\Platform;

/**
 * Eloquent implementation of PlatformRepositoryInterface.
 * Handles platform data retrieval from database.
 */
final class EloquentPlatformRepository implements PlatformRepositoryInterface
{
    public function findById(int $id): PlatformData
    {
        $platform = Platform::find($id);

        if (!$platform) {
            throw new \RuntimeException("Platform not found with ID: {$id}");
        }

        return new PlatformData(
            id: $platform->id,
            name: $platform->name,
            slug: $platform->slug,
        );
    }

    public function findActiveByIds(array $ids): array
    {
        if (empty($ids)) {
            return [];
        }

        return Platform::query()
            ->whereIn('id', $ids)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'name', 'slug'])
            ->map(fn($platform) => [
                'id' => $platform->id,
                'name' => $platform->name,
                'slug' => $platform->slug,
            ])
            ->toArray();
    }
}
