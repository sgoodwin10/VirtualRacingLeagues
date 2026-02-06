# Race Results Caching

This document describes the caching strategy for individual race results data accessed via the public API endpoint `/api/public/races/{raceId}/results`.

## Overview

Race results are cached using Redis to:
1. Improve performance for frequently accessed public race results
2. Enable cross-subdomain access (public, app, admin subdomains share the same cache)
3. Reduce database load during high-traffic periods (e.g., when viewing results on public league pages)

## Architecture

### Cache Service

The caching is implemented in `app/Infrastructure/Cache/RaceResultsCacheService.php`.

```
┌──────────────────────────────────────────────────────────────┐
│                 LeagueApplicationService                      │
│                                                              │
│  ┌─────────────┐     ┌─────────────────────────────┐        │
│  │ getPublic-  │────▶│ RaceResultsCacheService     │        │
│  │ RaceResults │     │                             │        │
│  │   ()        │     │  - get(raceId)              │        │
│  └─────────────┘     │  - put(raceId, data)        │        │
│                      │  - forget(raceId)           │        │
│                      │  - has(raceId)              │        │
│                      └─────────────────────────────┘        │
│                                  │                          │
│                                  ▼                          │
│                      ┌─────────────────────────────┐        │
│                      │        Redis Cache          │        │
│                      └─────────────────────────────┘        │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│              RaceApplicationService                           │
│              (Cache Invalidation)                             │
│                                                              │
│  ┌─────────────┐     ┌─────────────────────────────┐        │
│  │ updateRace  │────▶│ RaceResultsCacheService     │        │
│  │   ()        │     │                             │        │
│  └─────────────┘     │  - forget(raceId)           │        │
│                      │  (invalidate when status    │        │
│  ┌─────────────┐     │   changes to/from           │        │
│  │ saveResults │────▶│   'completed')              │        │
│  │   ()        │     └─────────────────────────────┘        │
│  └─────────────┘                                            │
│                                                              │
│  ┌─────────────┐                                            │
│  │ deleteResults│──────────────────────────────────────────┤
│  │   ()        │                                            │
│  └─────────────┘                                            │
└──────────────────────────────────────────────────────────────┘
```

### Cache Key Structure

- **Pattern**: `race_results:{raceId}`
- **Example**: `race_results:456`

### TTL (Time To Live)

- **Duration**: 24 hours (86400 seconds)
- **Rationale**: Race results only change when:
  - Race status changes to/from 'completed'
  - Race results are added/updated/deleted
  - All of these trigger cache invalidation

## Data Cached

The `PublicRaceResultsData` DTO containing:

```php
[
    'race' => [
        'id' => int,
        'race_number' => int|null,
        'name' => string|null,
        'race_type' => string,
        'status' => string,
        'is_qualifier' => bool,
        'race_points' => bool,
    ],
    'results' => array,  // Either flat array or grouped by division
    'has_divisions' => bool,
]
```

**Results Structure (without divisions)**:
```php
[
    [
        'position' => int,
        'driver_id' => int,
        'driver_name' => string,
        'driver_number' => int|null,
        'race_time' => string|null,
        'race_time_difference' => string|null,
        'fastest_lap' => string|null,
        'penalties' => string|null,
        'race_points' => int|null,
        'has_fastest_lap' => bool,
        'has_pole' => bool,
        'dnf' => bool,
        'status' => string,
    ],
    // ...
]
```

**Results Structure (with divisions)**:
```php
[
    [
        'division_id' => int,
        'division_name' => string,
        'results' => [
            // Same structure as flat results above
        ],
    ],
    // ...
]
```

## Cache Invalidation

Cache is automatically invalidated when:

### 1. Race Status Changes (PUT `/api/races/{raceId}`)

**Frontend trigger**: `RaceListItem.vue` and `QualifierListItem.vue` toggle switch

```vue
<ToggleSwitch v-model="isCompleted" @update:model-value="handleToggleStatus">
```

**API Flow**:
1. Frontend calls `PUT /api/races/{raceId}` with `{ status: "completed" }` or `{ status: "scheduled" }`
2. `RaceController::update()` → `RaceApplicationService::updateRace()`
3. `updateRace()` detects status change
4. **Cache invalidation**: `RaceResultsCacheService::forget($raceId)`
5. Database transaction commits
6. Race status and all race results are updated

**Code Location**: `app/Application/Competition/Services/RaceApplicationService.php`

```php
public function updateRace(int $raceId, UpdateRaceData $data): RaceData
{
    return DB::transaction(function () use ($raceId, $data) {
        $race = $this->raceRepository->findById($raceId);

        // Detect status change
        $statusChanged = false;
        $oldStatus = $race->status();
        $newStatus = null;

        if (!($data->status instanceof Optional) && $data->status !== null) {
            $newStatus = RaceStatus::from($data->status);
            if ($oldStatus !== $newStatus) {
                $statusChanged = true;

                // Invalidate cache BEFORE status change
                $this->raceResultsCache->forget($raceId);

                if ($newStatus === RaceStatus::COMPLETED) {
                    $race->markAsCompleted();
                } elseif ($newStatus === RaceStatus::SCHEDULED) {
                    $race->markAsScheduled();
                }
            }
        }

        // ... rest of update logic

        $this->raceRepository->save($race);

        // Update race result statuses if needed
        if ($statusChanged && $newStatus !== null) {
            $this->updateRaceResultStatuses($raceId, $newStatus);
        }

        return RaceData::fromEntity($race);
    });
}
```

### 2. Race Results Updated (POST `/api/races/{raceId}/results`)

**Frontend trigger**: `RaceResultModal.vue` save button

**API Flow**:
1. Frontend calls `POST /api/races/{raceId}/results` with bulk results data
2. `RaceResultController::store()` → `RaceResultApplicationService::saveResults()`
3. **Cache invalidation**: `RaceResultsCacheService::forget($raceId)`
4. Database transaction commits
5. All race results are saved/updated

**Code Location**: `app/Application/Competition/Services/RaceResultApplicationService.php`

```php
public function saveResults(int $raceId, BulkRaceResultsData $data): array
{
    return DB::transaction(function () use ($raceId, $data) {
        // Invalidate cache BEFORE making changes
        $this->raceResultsCache->forget($raceId);

        // ... save results logic

        return $results;
    });
}
```

### 3. Race Results Deleted (DELETE `/api/races/{raceId}/results`)

**Frontend trigger**: Delete results button in race management UI

**API Flow**:
1. Frontend calls `DELETE /api/races/{raceId}/results`
2. `RaceResultController::destroy()` → `RaceResultApplicationService::deleteResults()`
3. **Cache invalidation**: `RaceResultsCacheService::forget($raceId)`
4. Database transaction commits
5. All race results are deleted

**Code Location**: `app/Application/Competition/Services/RaceResultApplicationService.php`

```php
public function deleteResults(int $raceId): void
{
    DB::transaction(function () use ($raceId) {
        // Invalidate cache BEFORE deletion
        $this->raceResultsCache->forget($raceId);

        // ... delete results logic
    });
}
```

### Why Pre-Invalidation?

Cache is invalidated **before** the database transaction to ensure:
- No stale data is served during the transaction
- If transaction fails, cache remains empty (safe state)
- Next read will fetch fresh data from database
- Consistent with the existing round results caching pattern

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
    Log::warning('Failed to retrieve from cache', [
        'race_id' => $raceId,
        'error' => $e->getMessage(),
    ]);
    return null; // Fall back to database
}
```

## Usage Example

### Fetching Public Race Results (with caching)

```php
// In LeagueApplicationService
public function getPublicRaceResults(int $raceId): ?PublicRaceResultsData
{
    // Try cache first
    $cached = $this->raceResultsCache->get($raceId);
    if ($cached !== null) {
        return $cached;
    }

    // Fetch from database (includes validation, joins, etc.)
    $data = $this->fetchRaceResultsFromDatabase($raceId);

    if ($data === null) {
        return null; // Race not found or private
    }

    // Store in cache for next time
    $this->raceResultsCache->put($raceId, $data);

    return $data;
}
```

### Manual Cache Invalidation

If you need to manually invalidate cache (e.g., after data correction):

```php
$cacheService = app(RaceResultsCacheService::class);
$cacheService->forget($raceId);
```

## Testing

Unit tests are located at:
`tests/Unit/Infrastructure/Cache/RaceResultsCacheServiceTest.php`

Run tests:
```bash
./vendor/bin/phpunit tests/Unit/Infrastructure/Cache/RaceResultsCacheServiceTest.php
```

Feature tests are located at:
`tests/Feature/Public/PublicRaceResultsTest.php`

## Cross-Subdomain Access

Since all subdomains (public, app, admin) share the same Laravel backend and Redis instance, the cache is automatically accessible from all subdomains:

```
virtualracingleagues.localhost     ──┐
app.virtualracingleagues.localhost ──┼──▶ Same Redis ──▶ Same Cache
admin.virtualracingleagues.localhost┘
```

This means:
- User completes a race on `app.virtualracingleagues.localhost`
- Cache is invalidated
- Public visitor views results on `virtualracingleagues.localhost`
- Fresh data is fetched and cached
- Next visitor gets cached data

## Monitoring

### Redis CLI Commands

```bash
# Connect to Redis
docker-compose exec redis redis-cli

# List all race results cache keys
KEYS race_results:*

# Get TTL for a specific key
TTL race_results:456

# Delete specific cache
DEL race_results:456

# Clear all race results cache
KEYS race_results:* | xargs redis-cli DEL
```

### Logs

Cache operations are logged at `warning` level when failures occur:

```
[warning] Failed to retrieve race results from cache {"race_id": 456, "error": "..."}
[warning] Failed to cache race results {"race_id": 456, "error": "..."}
[warning] Failed to invalidate race results cache {"race_id": 456, "error": "..."}
```

## Integration Points

### Frontend Components

**Race Status Toggle** (triggers cache invalidation when status changes):
- `resources/app/js/components/round/RaceListItem.vue`
- `resources/app/js/components/round/QualifierListItem.vue`

**Results Entry** (triggers cache invalidation when results are saved):
- `resources/app/js/components/result/RaceResultModal.vue`

### Backend Services

**Reading (with caching)**:
- `LeagueApplicationService::getPublicRaceResults()`

**Writing (with cache invalidation)**:
- `RaceApplicationService::updateRace()` - when status changes
- `RaceResultApplicationService::saveResults()` - when results are saved
- `RaceResultApplicationService::deleteResults()` - when results are deleted

### API Endpoints

**Public (read-only, cached)**:
- `GET /api/public/races/{raceId}/results` - Public race results endpoint

**Authenticated (write, invalidates cache)**:
- `PUT /api/races/{raceId}` - Update race (status change triggers invalidation)
- `POST /api/races/{raceId}/results` - Save/update results
- `DELETE /api/races/{raceId}/results` - Delete results

## Implementation Checklist

### 1. Create Cache Service

- [ ] Create `app/Infrastructure/Cache/RaceResultsCacheService.php`
- [ ] Implement `get($raceId)` method
- [ ] Implement `put($raceId, $data)` method
- [ ] Implement `forget($raceId)` method
- [ ] Implement `has($raceId)` method
- [ ] Add error handling and logging
- [ ] Follow existing `RoundResultsCacheService` pattern

### 2. Integrate Cache Service

**LeagueApplicationService** (reading):
- [ ] Inject `RaceResultsCacheService` in constructor
- [ ] Update `getPublicRaceResults()` to check cache first
- [ ] Cache the result after fetching from database
- [ ] Handle `null` returns appropriately

**RaceApplicationService** (cache invalidation):
- [ ] Inject `RaceResultsCacheService` in constructor
- [ ] Add cache invalidation in `updateRace()` when status changes
- [ ] Place invalidation before database transaction

**RaceResultApplicationService** (cache invalidation):
- [ ] Inject `RaceResultsCacheService` in constructor
- [ ] Add cache invalidation in `saveResults()` before saving
- [ ] Add cache invalidation in `deleteResults()` before deleting

### 3. Testing

- [ ] Create unit tests for `RaceResultsCacheService`
- [ ] Test cache hit/miss scenarios
- [ ] Test cache invalidation on status change
- [ ] Test cache invalidation on results save/delete
- [ ] Create feature tests for public race results endpoint
- [ ] Test caching with divisions enabled/disabled
- [ ] Test cache behavior when Redis is unavailable

### 4. Configuration

- [ ] Verify Redis configuration in `.env`
- [ ] Add cache configuration to `config/league.php` if needed
- [ ] Document environment variables

### 5. Monitoring & Documentation

- [ ] Add logging for cache operations
- [ ] Add cache metrics (optional)
- [ ] Update this documentation with actual implementation details
- [ ] Add cache monitoring dashboard (optional)

## Future Considerations

1. **Cache Warming**: Could pre-populate cache for recently completed races
2. **Cache Tags**: Could use Laravel cache tags for bulk invalidation (e.g., invalidate all races in a round)
3. **Distributed Locking**: For high-concurrency scenarios, consider cache locks
4. **Metrics**: Add cache hit/miss metrics for monitoring
5. **Conditional Caching**: Only cache completed races (scheduled races change frequently)
6. **Automatic Cleanup**: Set up scheduled task to clean up cache for deleted races

## Performance Impact

### Expected Improvements

**Before caching**:
- Database query time: ~50-150ms (with joins)
- Total response time: ~100-200ms

**After caching**:
- Cache hit response time: ~5-15ms
- Cache miss response time: ~100-200ms (same as before)
- Cache hit ratio (expected): ~80-90% for popular leagues

### Database Load Reduction

For a popular league with 10,000 page views per day:
- **Before**: 10,000 database queries
- **After**: ~1,000-2,000 database queries (80-90% cache hit rate)
- **Reduction**: ~80-90% fewer queries

## Security Considerations

1. **Public Access**: Race results are public, so no authorization check needed for public endpoint
2. **Private Leagues**: Visibility check is performed before caching (private leagues return `null`)
3. **Cache Poisoning**: Not a concern since data comes from database (trusted source)
4. **Cache Keys**: Simple integer IDs, no risk of injection
5. **TTL**: 24 hours prevents indefinite stale data

## Related Documentation

- [Round Results Caching](./round-results-caching.md) - Similar caching pattern for round results
- [Redis Configuration](../docker/docker_reference_guide.md#redis) - Redis setup and configuration
- [DDD Backend Guide](../.claude/guides/backend/ddd-development-guide.md) - Application service patterns
