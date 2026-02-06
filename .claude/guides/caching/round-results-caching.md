# Round Results and Season Detail Caching

This document describes the caching strategy for round results and public season detail data.

## Overview

Round results and season detail data are cached using Redis to:
1. Improve performance for frequently accessed data
2. Enable cross-subdomain access (public, app, admin subdomains share the same cache)
3. Reduce database load during high-traffic periods

## Architecture

### Cache Services

Two cache services handle different types of data:

1. **RoundResultsCacheService** (`app/Infrastructure/Cache/RoundResultsCacheService.php`)
   - Caches individual round results
   - Key pattern: `round_results:{roundId}`
   - TTL: 24 hours

2. **SeasonDetailCacheService** (`app/Infrastructure/Cache/SeasonDetailCacheService.php`)
   - Caches public season detail page data (standings, rounds, team championship)
   - Key pattern: `public_season_detail:{seasonId}`
   - TTL: 24 hours

```
┌──────────────────────────────────────────────────────────────────┐
│                    RoundApplicationService                        │
│                                                                  │
│  ┌──────────────┐     ┌──────────────────────────────────┐      │
│  │ getRound-    │────▶│ RoundResultsCacheService         │      │
│  │ Results()    │     │                                  │      │
│  └──────────────┘     │  - get(roundId)                  │      │
│                       │  - put(roundId, data)            │      │
│  ┌──────────────┐     │  - forget(roundId)               │      │
│  │ complete-    │────▶│  - has(roundId)                  │      │
│  │ Round()      │     └──────────────────────────────────┘      │
│  └──────────────┘                 │                              │
│                                   ▼                              │
│  ┌──────────────┐     ┌──────────────────────────────────┐      │
│  │ uncomplete-  │────▶│ SeasonDetailCacheService         │      │
│  │ Round()      │     │                                  │      │
│  └──────────────┘     │  - get(seasonId)                 │      │
│                       │  - put(seasonId, data)           │      │
│                       │  - forget(seasonId)              │      │
│                       │  - has(seasonId)                 │      │
│                       └──────────────────────────────────┘      │
│                                   │                              │
│                                   ▼                              │
│                       ┌──────────────────────────────────┐      │
│                       │        Redis Cache               │      │
│                       └──────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    LeagueApplicationService                       │
│                                                                  │
│  ┌────────────────┐   ┌──────────────────────────────────┐      │
│  │ getPublic-     │──▶│ SeasonDetailCacheService         │      │
│  │ SeasonDetail() │   └──────────────────────────────────┘      │
│  └────────────────┘                                              │
└──────────────────────────────────────────────────────────────────┘
```

### Cache Key Structure

| Cache Type | Pattern | Example |
|------------|---------|---------|
| Round Results | `round_results:{roundId}` | `round_results:123` |
| Season Detail | `public_season_detail:{seasonId}` | `public_season_detail:456` |

### TTL (Time To Live)

- **Duration**: 24 hours (86400 seconds)
- **Rationale**: Data only changes when a round is completed or uncompleted, which triggers cache invalidation

## Data Cached

### Round Results (`RoundResultsData`)

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

### Public Season Detail (`PublicSeasonDetailData`)

```php
[
    'league' => [
        'name' => string,
        'slug' => string,
        'logo_url' => string|null,
        'header_image_url' => string|null,
    ],
    'competition' => [
        'name' => string,
        'slug' => string,
    ],
    'season' => [
        'id' => int,
        'name' => string,
        'slug' => string,
        'status' => string,
        'stats' => [...],  // Driver/round/race counts
    ],
    'rounds' => [...],           // All rounds with races
    'standings' => [...],        // Driver standings
    'team_championship_results' => [...],  // Team standings
    'qualifying_results' => [...],
    'fastest_lap_results' => [...],
    'race_time_results' => [...],
]
```

## Cache Invalidation

### Invalidation Triggers

Cache is automatically invalidated when a round is completed or uncompleted:

1. **Round Completed** (`RoundApplicationService::completeRound()`)
   - Invalidates `round_results:{roundId}` (the completed round)
   - Invalidates `public_season_detail:{seasonId}` (season standings are recalculated)

2. **Round Uncompleted** (`RoundApplicationService::uncompleteRound()`)
   - Invalidates `round_results:{roundId}` (the uncompleted round)
   - Invalidates `public_season_detail:{seasonId}` (season standings are recalculated)

### Why Post-Transaction Invalidation?

Cache is invalidated **AFTER** successful transaction commit to ensure:
- Data integrity is maintained
- If transaction fails, cache remains unchanged (next read will get correct data)
- No stale reads during the transaction window

### Flow Diagram

```
User Dashboard (app subdomain)          Public Site (public subdomain)
        │                                         │
        │  PUT /rounds/{id}/complete              │
        ▼                                         │
┌───────────────────┐                             │
│ RoundsPanel.vue   │                             │
│ toggleCompletion()│                             │
└───────────────────┘                             │
        │                                         │
        ▼                                         │
┌───────────────────┐                             │
│ roundStore.       │                             │
│ completeRound()   │                             │
└───────────────────┘                             │
        │                                         │
        ▼                                         │
┌───────────────────┐                             │
│ RoundApplication  │                             │
│ Service           │                             │
│ .completeRound()  │                             │
│   1. DB Transaction                             │
│   2. Calculate results                          │
│   3. Commit                                     │
│   4. Invalidate round cache                     │
│   5. Invalidate season cache  ─────────────────▶ Cache cleared
└───────────────────┘                             │
                                                  │
                                    GET /public/leagues/{slug}/seasons/{slug}
                                                  │
                                                  ▼
                                    ┌───────────────────┐
                                    │ LeagueApplication │
                                    │ Service           │
                                    │ .getPublicSeason  │
                                    │  Detail()         │
                                    │   1. Check cache  │ ← Cache miss!
                                    │   2. Fetch from DB│
                                    │   3. Store in cache
                                    │   4. Return data  │
                                    └───────────────────┘
```

## Configuration

### Environment Variables

Ensure Redis is configured in `.env`:

```env
CACHE_STORE=redis
REDIS_HOST=redis
REDIS_PORT=6379
```

### Redis Connection

Both cache services explicitly use the `redis` store for cross-subdomain access:

```php
Cache::store('redis')->get($key);
Cache::store('redis')->put($key, $data, $ttl);
Cache::store('redis')->forget($key);
```

## Error Handling

Cache services are designed to be fault-tolerant:

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

## Usage Examples

### Fetching Season Detail (Cached)

```php
// In LeagueApplicationService::getPublicSeasonDetail()

// 1. Lightweight query to get season ID
$seasonId = $this->findSeasonIdBySlug($leagueSlug, $seasonSlug);

// 2. Try cache first
$cached = $this->seasonDetailCache->get($seasonId);
if ($cached !== null) {
    return $cached;  // Cache hit!
}

// 3. Cache miss - fetch from database
$data = $this->fetchSeasonDetailFromDatabase($leagueSlug, $seasonSlug);

// 4. Store in cache for next request
$this->seasonDetailCache->put($seasonId, $data);

return $data;
```

### Manual Cache Invalidation

If you need to manually invalidate cache (e.g., after data correction):

```php
// Invalidate round results
$roundCacheService = app(RoundResultsCacheService::class);
$roundCacheService->forget($roundId);

// Invalidate season detail
$seasonCacheService = app(SeasonDetailCacheService::class);
$seasonCacheService->forget($seasonId);
```

## Testing

### Unit Tests

Round Results Cache:
`tests/Unit/Infrastructure/Cache/RoundResultsCacheServiceTest.php`

Season Detail Cache:
`tests/Unit/Infrastructure/Cache/SeasonDetailCacheServiceTest.php` (to be created)

Run tests:
```bash
./vendor/bin/phpunit tests/Unit/Infrastructure/Cache/
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

# List all cache keys
KEYS round_results:*
KEYS public_season_detail:*

# Get TTL for a specific key
TTL round_results:123
TTL public_season_detail:456

# Delete specific cache
DEL round_results:123
DEL public_season_detail:456

# Clear all round results cache
KEYS round_results:* | xargs redis-cli DEL

# Clear all season detail cache
KEYS public_season_detail:* | xargs redis-cli DEL
```

### Logs

Cache operations are logged at `warning` level when failures occur:

```
[warning] Failed to retrieve round results from cache {"round_id": 123, "error": "..."}
[warning] Failed to cache round results {"round_id": 123, "error": "..."}
[warning] Failed to invalidate round results cache {"round_id": 123, "error": "..."}
[warning] Failed to retrieve season detail from cache {"season_id": 456, "error": "..."}
[warning] Failed to cache season detail {"season_id": 456, "error": "..."}
[warning] Failed to invalidate season detail cache {"season_id": 456, "error": "..."}
```

## Performance Impact

### Before Caching

- Public season detail page: 15-25 database queries per request
- Round results: 10-15 database queries per request
- High CPU usage for standings calculations

### After Caching

- First request: Same query count (populates cache)
- Subsequent requests: 1 lightweight query (season ID lookup) + cache read
- Estimated 90-95% reduction in database load for cached content

## Future Considerations

1. **Cache Warming**: Could pre-populate cache for recently completed rounds
2. **Cache Tags**: Could use Laravel cache tags for bulk invalidation
3. **Distributed Locking**: For high-concurrency scenarios, consider cache locks
4. **Metrics**: Add cache hit/miss metrics for monitoring
5. **Broader Invalidation**: Consider invalidating on driver/team changes that affect standings
