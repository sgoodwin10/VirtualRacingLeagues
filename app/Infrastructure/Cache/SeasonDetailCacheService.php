<?php

declare(strict_types=1);

namespace App\Infrastructure\Cache;

use App\Application\League\DTOs\PublicSeasonDetailData;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Cache service for public season detail data.
 *
 * This service manages caching of public season detail data which is displayed
 * on the public-facing season detail page. Uses Redis for cross-subdomain access
 * since all subdomains share the same backend.
 *
 * Cache is invalidated when:
 * - A round is completed or uncompleted
 * - Season data changes (standings, results recalculated)
 */
final class SeasonDetailCacheService
{
    private const CACHE_PREFIX = 'public_season_detail:';

    /**
     * Cache TTL in seconds (24 hours).
     * Season detail data only changes when rounds are completed/uncompleted.
     */
    private const CACHE_TTL = 86400;

    /**
     * Get cached season detail or null if not cached.
     */
    public function get(int $seasonId): ?PublicSeasonDetailData
    {
        $key = $this->getCacheKey($seasonId);

        try {
            /** @var array<string, mixed>|null $cached */
            $cached = Cache::store('redis')->get($key);

            if ($cached === null) {
                return null;
            }

            return PublicSeasonDetailData::from($cached);
        } catch (\Throwable $e) {
            // Log error but don't fail - cache miss is acceptable
            Log::warning('Failed to retrieve season detail from cache', [
                'season_id' => $seasonId,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Store season detail in cache.
     */
    public function put(int $seasonId, PublicSeasonDetailData $data): void
    {
        $key = $this->getCacheKey($seasonId);

        try {
            Cache::store('redis')->put($key, $data->toArray(), self::CACHE_TTL);
        } catch (\Throwable $e) {
            // Log error but don't fail - caching is optional
            Log::warning('Failed to cache season detail', [
                'season_id' => $seasonId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Invalidate (forget) cached season detail.
     */
    public function forget(int $seasonId): void
    {
        $key = $this->getCacheKey($seasonId);

        try {
            Cache::store('redis')->forget($key);
        } catch (\Throwable $e) {
            // Log error but don't fail
            Log::warning('Failed to invalidate season detail cache', [
                'season_id' => $seasonId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Check if season detail is cached.
     */
    public function has(int $seasonId): bool
    {
        $key = $this->getCacheKey($seasonId);

        try {
            return Cache::store('redis')->has($key);
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Generate cache key for season detail.
     */
    private function getCacheKey(int $seasonId): string
    {
        return self::CACHE_PREFIX . $seasonId;
    }
}
