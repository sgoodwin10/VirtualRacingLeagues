<?php

declare(strict_types=1);

namespace App\Infrastructure\Cache;

use App\Application\Competition\DTOs\RoundResultsData;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Cache service for round results data.
 *
 * This service manages caching of round results which can be accessed
 * from various subdomains. Uses Redis (or configured cache driver) for
 * cross-subdomain access since all subdomains share the same backend.
 */
final class RoundResultsCacheService
{
    private const CACHE_PREFIX = 'round_results:';

    /**
     * Cache TTL in seconds (24 hours).
     * Round results rarely change - only on completion/uncompleteness.
     */
    private const CACHE_TTL = 86400;

    /**
     * Get cached round results or null if not cached.
     */
    public function get(int $roundId): ?RoundResultsData
    {
        $key = $this->getCacheKey($roundId);

        try {
            /** @var array<string, mixed>|null $cached */
            $cached = Cache::store('redis')->get($key);

            if ($cached === null) {
                return null;
            }

            return RoundResultsData::from($cached);
        } catch (\Throwable $e) {
            // Log error but don't fail - cache miss is acceptable
            Log::warning('Failed to retrieve round results from cache', [
                'round_id' => $roundId,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Store round results in cache.
     */
    public function put(int $roundId, RoundResultsData $data): void
    {
        $key = $this->getCacheKey($roundId);

        try {
            Cache::store('redis')->put($key, $data->toArray(), self::CACHE_TTL);
        } catch (\Throwable $e) {
            // Log error but don't fail - caching is optional
            Log::warning('Failed to cache round results', [
                'round_id' => $roundId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Invalidate (forget) cached round results.
     */
    public function forget(int $roundId): void
    {
        $key = $this->getCacheKey($roundId);

        try {
            Cache::store('redis')->forget($key);
        } catch (\Throwable $e) {
            // Log error but don't fail
            Log::warning('Failed to invalidate round results cache', [
                'round_id' => $roundId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Check if round results are cached.
     */
    public function has(int $roundId): bool
    {
        $key = $this->getCacheKey($roundId);

        try {
            return Cache::store('redis')->has($key);
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Generate cache key for round results.
     */
    private function getCacheKey(int $roundId): string
    {
        return self::CACHE_PREFIX . $roundId;
    }
}
