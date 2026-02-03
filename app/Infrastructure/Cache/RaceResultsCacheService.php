<?php

declare(strict_types=1);

namespace App\Infrastructure\Cache;

use App\Application\League\DTOs\PublicRaceResultsData;
use Illuminate\Contracts\Cache\Lock;
use Illuminate\Contracts\Cache\LockProvider;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Cache service for race results data.
 *
 * This service manages caching of race results which can be accessed
 * from various subdomains. Uses Redis (or configured cache driver) for
 * cross-subdomain access since all subdomains share the same backend.
 *
 * Features:
 * - Configurable cache store (via constructor or config)
 * - Atomic locking to prevent race conditions
 * - Size validation to prevent oversized cache entries
 * - Input validation for race IDs
 * - Batch invalidation support
 * - Boolean return values for success/failure indication
 */
final class RaceResultsCacheService
{
    private const CACHE_PREFIX = 'race_results:';

    private const LOCK_PREFIX = 'race_results_lock:';

    /**
     * Cache TTL in seconds (24 hours).
     * Race results only change when race status changes or results are updated/deleted.
     */
    private const CACHE_TTL = 86400;

    /**
     * Lock timeout in seconds (10 seconds should be enough for cache operations).
     */
    private const LOCK_TIMEOUT = 10;

    /**
     * Maximum cache entry size in bytes (1MB).
     * Prevents storing oversized entries that could impact Redis performance.
     */
    private const MAX_CACHE_SIZE = 1048576; // 1MB

    private readonly CacheRepository $cache;

    private readonly int $cacheTtl;

    private readonly int $lockTimeout;

    private readonly int $maxCacheSize;

    /**
     * @param  string|null  $store  Cache store name (e.g., 'redis', 'database').
     *                              Defaults to config('league.cache.store') or config('cache.default').
     */
    public function __construct(?string $store = null)
    {
        $storeName = $store ?? config('league.cache.store', config('cache.default'));
        $this->cache = Cache::store($storeName);
        $this->cacheTtl = config('league.cache.ttl', self::CACHE_TTL);
        $this->lockTimeout = config('league.cache.lock_timeout', self::LOCK_TIMEOUT);
        $this->maxCacheSize = config('league.cache.max_size', self::MAX_CACHE_SIZE);
    }

    /**
     * Get cached race results or null if not cached.
     *
     * @param  int  $raceId  The race ID (must be positive)
     * @return PublicRaceResultsData|null The cached data or null if not found
     *
     * @throws \InvalidArgumentException If race ID is not positive
     */
    public function get(int $raceId): ?PublicRaceResultsData
    {
        $this->validateRaceId($raceId);
        $key = $this->getCacheKey($raceId);

        try {
            /** @var array<string, mixed>|null $cached */
            $cached = $this->cache->get($key);

            if ($cached === null) {
                return null;
            }

            return PublicRaceResultsData::from($cached);
        } catch (\Throwable $e) {
            // Log error but don't fail - cache miss is acceptable
            Log::warning('Failed to retrieve race results from cache', [
                'race_id' => $raceId,
                'key' => $key,
                'error' => $e->getMessage(),
                'exception' => get_class($e),
            ]);

            return null;
        }
    }

    /**
     * Store race results in cache with atomic locking and size validation.
     *
     * @param  int  $raceId  The race ID (must be positive)
     * @param  PublicRaceResultsData  $data  The race results data to cache
     * @return bool True if successfully cached, false otherwise
     *
     * @throws \InvalidArgumentException If race ID is not positive
     */
    public function put(int $raceId, PublicRaceResultsData $data): bool
    {
        $this->validateRaceId($raceId);
        $key = $this->getCacheKey($raceId);
        $lockKey = $this->getLockKey($raceId);

        try {
            // Validate size before attempting to cache
            $serialized = serialize($data->toArray());
            $size = strlen($serialized);

            if ($size > $this->maxCacheSize) {
                Log::warning('Race results data exceeds maximum cache size', [
                    'race_id' => $raceId,
                    'size' => $size,
                    'max_size' => $this->maxCacheSize,
                    'size_mb' => round($size / 1048576, 2),
                ]);

                return false;
            }

            // Attempt to acquire lock to prevent concurrent writes
            // If locking is not supported, proceed without lock
            if ($this->cache instanceof LockProvider) {
                $lock = $this->cache->lock($lockKey, $this->lockTimeout);

                return $lock->get(function () use ($key, $data, $raceId, $size) {
                    return $this->putToCache($key, $data, $raceId, $size);
                });
            }

            // No locking available, proceed directly
            return $this->putToCache($key, $data, $raceId, $size);
        } catch (LockTimeoutException $e) {
            // Could not acquire lock within timeout
            Log::warning('Failed to acquire lock for caching race results', [
                'race_id' => $raceId,
                'key' => $key,
                'lock_key' => $lockKey,
                'timeout' => $this->lockTimeout,
                'error' => $e->getMessage(),
            ]);

            return false;
        } catch (\Throwable $e) {
            // Log error but don't fail - caching is optional
            Log::error('Failed to cache race results', [
                'race_id' => $raceId,
                'key' => $key,
                'error' => $e->getMessage(),
                'exception' => get_class($e),
                'trace' => $e->getTraceAsString(),
            ]);

            return false;
        }
    }

    /**
     * Invalidate (forget) cached race results.
     *
     * @param  int  $raceId  The race ID (must be positive)
     * @return bool True if successfully invalidated or key didn't exist, false on error
     *
     * @throws \InvalidArgumentException If race ID is not positive
     */
    public function forget(int $raceId): bool
    {
        $this->validateRaceId($raceId);
        $key = $this->getCacheKey($raceId);

        try {
            $result = $this->cache->forget($key);

            if ($result) {
                Log::debug('Successfully invalidated race results cache', [
                    'race_id' => $raceId,
                    'key' => $key,
                ]);
            }

            return $result;
        } catch (\Throwable $e) {
            // Log error but don't fail
            Log::error('Failed to invalidate race results cache', [
                'race_id' => $raceId,
                'key' => $key,
                'error' => $e->getMessage(),
                'exception' => get_class($e),
            ]);

            return false;
        }
    }

    /**
     * Batch invalidate cached race results for multiple races.
     *
     * @param  array<int>  $raceIds  Array of race IDs (all must be positive)
     * @return array<int, bool> Array mapping race ID to success/failure
     *
     * @throws \InvalidArgumentException If any race ID is not positive
     */
    public function forgetMany(array $raceIds): array
    {
        $results = [];

        foreach ($raceIds as $raceId) {
            $this->validateRaceId($raceId);
            $results[$raceId] = $this->forget($raceId);
        }

        $successCount = count(array_filter($results));
        $totalCount = count($raceIds);

        Log::info('Batch invalidated race results cache', [
            'total' => $totalCount,
            'successful' => $successCount,
            'failed' => $totalCount - $successCount,
            'race_ids' => $raceIds,
        ]);

        return $results;
    }

    /**
     * Check if race results are cached.
     *
     * @param  int  $raceId  The race ID (must be positive)
     * @return bool True if cached, false otherwise
     *
     * @throws \InvalidArgumentException If race ID is not positive
     */
    public function has(int $raceId): bool
    {
        $this->validateRaceId($raceId);
        $key = $this->getCacheKey($raceId);

        try {
            return $this->cache->has($key);
        } catch (\Throwable $e) {
            Log::warning('Failed to check race results cache existence', [
                'race_id' => $raceId,
                'key' => $key,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Generate cache key for race results.
     *
     * @param  int  $raceId  The race ID
     * @return string The cache key
     */
    private function getCacheKey(int $raceId): string
    {
        return self::CACHE_PREFIX.$raceId;
    }

    /**
     * Generate lock key for race results cache operations.
     *
     * @param  int  $raceId  The race ID
     * @return string The lock key
     */
    private function getLockKey(int $raceId): string
    {
        return self::LOCK_PREFIX.$raceId;
    }

    /**
     * Validate that race ID is positive.
     *
     * @param  int  $raceId  The race ID to validate
     *
     * @throws \InvalidArgumentException If race ID is not positive
     */
    private function validateRaceId(int $raceId): void
    {
        if ($raceId <= 0) {
            throw new \InvalidArgumentException(
                sprintf('Race ID must be positive, %d given', $raceId)
            );
        }
    }

    /**
     * Put data to cache and log the result.
     *
     * @param  string  $key  Cache key
     * @param  PublicRaceResultsData  $data  Data to cache
     * @param  int  $raceId  Race ID (for logging)
     * @param  int  $size  Data size in bytes (for logging)
     * @return bool True if successfully cached
     */
    private function putToCache(string $key, PublicRaceResultsData $data, int $raceId, int $size): bool
    {
        $result = $this->cache->put($key, $data->toArray(), $this->cacheTtl);

        if ($result) {
            Log::debug('Successfully cached race results', [
                'race_id' => $raceId,
                'key' => $key,
                'size' => $size,
                'ttl' => $this->cacheTtl,
            ]);
        }

        return $result;
    }
}
