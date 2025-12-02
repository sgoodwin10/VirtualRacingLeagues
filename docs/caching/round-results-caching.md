# Round Results Caching

This document describes the caching strategy for round results data.

## Overview

Round results are cached using Redis to:
1. Improve performance for frequently accessed data
2. Enable cross-subdomain access (public, app, admin subdomains share the same cache)
3. Reduce database load during high-traffic periods

## Architecture

### Cache Service

The caching is implemented in `app/Infrastructure/Cache/RoundResultsCacheService.php`.

```
┌──────────────────────────────────────────────────────────────┐
│                    RoundApplicationService                    │
│                                                              │
│  ┌─────────────┐     ┌─────────────────────────────┐        │
│  │ getRound-   │────▶│ RoundResultsCacheService    │        │
│  │ Results()   │     │                             │        │
│  └─────────────┘     │  - get(roundId)             │        │
│                      │  - put(roundId, data)       │        │
│  ┌─────────────┐     │  - forget(roundId)          │        │
│  │ complete-   │────▶│  - has(roundId)             │        │
│  │ Round()     │     └─────────────────────────────┘        │
│  └─────────────┘                 │                          │
│                                  ▼                          │
│  ┌─────────────┐     ┌─────────────────────────────┐        │
│  │ uncomplete- │────▶│        Redis Cache          │        │
│  │ Round()     │     └─────────────────────────────┘        │
│  └─────────────┘                                            │
└──────────────────────────────────────────────────────────────┘
```

### Cache Key Structure

- **Pattern**: `round_results:{roundId}`
- **Example**: `round_results:123`

### TTL (Time To Live)

- **Duration**: 24 hours (86400 seconds)
- **Rationale**: Round results only change when a round is completed or uncompleted, which triggers cache invalidation

## Data Cached

The `RoundResultsData` DTO containing:

```php
[
    'round' => [
        'id' => int,
        'round_number' => int,
        'name' => string|null,
        'status' => string,
        'round_results' => array|null,      // Standings data
        'qualifying_results' => array|null,
        'race_time_results' => array|null,
        'fastest_lap_results' => array|null,
    ],
    'divisions' => DivisionData[],
    'race_events' => RaceEventResultData[],
]
```

## Cache Invalidation

Cache is automatically invalidated when:

1. **Round is completed** (`completeRound()`)
   - Cache is cleared before transaction starts
   - Fresh data is fetched next time `getRoundResults()` is called

2. **Round is uncompleted** (`uncompleteRound()`)
   - Cache is cleared before transaction starts
   - Fresh data is fetched next time `getRoundResults()` is called

### Why Pre-Invalidation?

Cache is invalidated **before** the database transaction to ensure:
- No stale data is served during the transaction
- If transaction fails, cache remains empty (safe state)
- Next read will fetch fresh data from database

## Configuration

### Environment Variables

Ensure Redis is configured in `.env`:

```env
CACHE_STORE=redis
REDIS_HOST=redis
REDIS_PORT=6379
```

### Redis Connection

The cache service explicitly uses the `redis` store:

```php
Cache::store('redis')->get($key);
Cache::store('redis')->put($key, $data, $ttl);
Cache::store('redis')->forget($key);
```

## Error Handling

The cache service is designed to be fault-tolerant:

- **Cache miss**: Returns `null`, application falls back to database
- **Cache write failure**: Logs warning, continues without caching
- **Cache delete failure**: Logs warning, continues
- **Redis unavailable**: Gracefully degrades to database-only operation

```php
try {
    $cached = Cache::store('redis')->get($key);
} catch (\Throwable $e) {
    Log::warning('Failed to retrieve from cache', [...]);
    return null; // Fall back to database
}
```

## Usage Example

### Fetching Round Results

```php
// In RoundApplicationService
public function getRoundResults(int $roundId): RoundResultsData
{
    // Try cache first
    $cached = $this->roundResultsCache->get($roundId);
    if ($cached !== null) {
        return $cached;
    }

    // Fetch from database
    $results = $this->fetchFromDatabase($roundId);

    // Store in cache for next time
    $this->roundResultsCache->put($roundId, $results);

    return $results;
}
```

### Manual Cache Invalidation

If you need to manually invalidate cache (e.g., after data correction):

```php
$cacheService = app(RoundResultsCacheService::class);
$cacheService->forget($roundId);
```

## Testing

Unit tests are located at:
`tests/Unit/Infrastructure/Cache/RoundResultsCacheServiceTest.php`

Run tests:
```bash
./vendor/bin/phpunit tests/Unit/Infrastructure/Cache/RoundResultsCacheServiceTest.php
```

## Cross-Subdomain Access

Since all subdomains (public, app, admin) share the same Laravel backend and Redis instance, the cache is automatically accessible from all subdomains:

```
virtualracingleagues.localhost     ──┐
app.virtualracingleagues.localhost ──┼──▶ Same Redis ──▶ Same Cache
admin.virtualracingleagues.localhost┘
```

## Monitoring

### Redis CLI Commands

```bash
# Connect to Redis
docker-compose exec redis redis-cli

# List all round results cache keys
KEYS round_results:*

# Get TTL for a specific key
TTL round_results:123

# Delete specific cache
DEL round_results:123

# Clear all round results cache
KEYS round_results:* | xargs redis-cli DEL
```

### Logs

Cache operations are logged at `warning` level when failures occur:

```
[warning] Failed to retrieve round results from cache {"round_id": 123, "error": "..."}
[warning] Failed to cache round results {"round_id": 123, "error": "..."}
[warning] Failed to invalidate round results cache {"round_id": 123, "error": "..."}
```

## Future Considerations

1. **Cache Warming**: Could pre-populate cache for recently completed rounds
2. **Cache Tags**: Could use Laravel cache tags for bulk invalidation
3. **Distributed Locking**: For high-concurrency scenarios, consider cache locks
4. **Metrics**: Add cache hit/miss metrics for monitoring
