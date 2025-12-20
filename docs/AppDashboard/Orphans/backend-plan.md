# Backend Plan: Orphaned Driver Results Detection

## Problem Statement

When a season has `divisions` enabled (`race_divisions_enabled = true`), race and qualifying results are displayed in tabs per division. However, if a driver has results but is NOT assigned to any division (`season_drivers.division_id IS NULL`), their results become "orphaned" - they don't appear in any division tab.

## Database Structure Findings

### Key Tables and Relationships

```
seasons
├─ id (PK)
├─ race_divisions_enabled (BOOLEAN) -- Controls if divisions are used
└─ ...

divisions
├─ id (PK)
├─ season_id (FK -> seasons.id)
├─ name
├─ description
├─ order
└─ ...

season_drivers (Pivot table: assigns drivers to seasons)
├─ id (PK)
├─ season_id (FK -> seasons.id)
├─ league_driver_id (FK -> league_drivers.id)
├─ division_id (FK -> divisions.id, NULLABLE, ON DELETE SET NULL)
├─ team_id (FK -> teams.id, NULLABLE)
├─ status (ENUM: active, reserve, withdrawn)
└─ ...

race_results
├─ id (PK)
├─ race_id (FK -> races.id)
├─ driver_id (FK -> season_drivers.id) -- References season_drivers.id, NOT drivers.id
├─ division_id (FK -> divisions.id, NULLABLE, ON DELETE SET NULL)
├─ position
├─ race_points
├─ dnf
├─ ...

races
├─ id (PK)
├─ round_id (FK -> rounds.id)
├─ is_qualifier (BOOLEAN)
├─ race_number
└─ ...

rounds
├─ id (PK)
├─ season_id (FK -> seasons.id)
└─ ...
```

### Critical Relationships

1. **Season -> Divisions**: A season can have multiple divisions (only if `race_divisions_enabled = true`)
2. **SeasonDriver -> Division**: Optional assignment (`season_drivers.division_id` can be NULL)
3. **RaceResult -> Division**: Optional field (`race_results.division_id` can be NULL)
4. **RaceResult -> Driver**: `race_results.driver_id` references `season_drivers.id`

### Orphan Scenario

A driver becomes "orphaned" when:
- Season has `race_divisions_enabled = true`
- Driver exists in `season_drivers` with `division_id = NULL`
- Driver has results in `race_results` with `division_id = NULL`

## Current API Implementation

### Endpoint: Get Round Results

**Route**: `GET /api/rounds/{roundId}/results`

**Controller**: `App\Http\Controllers\User\RoundController@getRoundResults`

**Service Method**: `App\Application\Competition\Services\RoundApplicationService::getRoundResults()`

**Current Response Structure**:
```json
{
  "round": {
    "id": 1,
    "round_number": 1,
    "name": "Round 1",
    "status": "completed",
    "round_results": [...],
    "qualifying_results": [...],
    "race_time_results": [...],
    "fastest_lap_results": [...]
  },
  "divisions": [
    {"id": 1, "name": "Pro", "description": "Professional division"},
    {"id": 2, "name": "Am", "description": "Amateur division"}
  ],
  "race_events": [
    {
      "id": 10,
      "race_number": 1,
      "name": "Feature Race",
      "is_qualifier": false,
      "status": "completed",
      "race_points": true,
      "results": [
        {
          "id": 101,
          "driver_id": 50,
          "driver": {"id": 50, "name": "John Doe"},
          "division_id": 1,  // <-- Can be NULL for orphans
          "position": 1,
          "race_points": 25,
          "dnf": false,
          ...
        }
      ]
    }
  ]
}
```

### Current Logic (Line 558-690)

1. Fetches round + season data
2. Checks if `season.race_divisions_enabled` is true
3. If true, fetches divisions for the season
4. Fetches all races for the round
5. Batch fetches all race results for the round
6. Groups results by `race_id`
7. Returns structured data with divisions and race events

**Gap**: No detection of orphaned results (drivers with NULL division_id when divisions are enabled)

## Query Logic to Detect Orphaned Results

### SQL Query for Orphan Detection

```sql
-- Check if a race has orphaned results
SELECT COUNT(*) as orphan_count
FROM race_results rr
INNER JOIN races r ON rr.race_id = r.id
INNER JOIN rounds rd ON r.round_id = rd.id
INNER JOIN seasons s ON rd.season_id = s.id
WHERE r.id = :race_id
  AND s.race_divisions_enabled = 1
  AND rr.division_id IS NULL;

-- Get orphaned results for a race
SELECT
    rr.id as result_id,
    rr.driver_id,
    rr.position,
    sd.league_driver_id,
    sd.status as driver_status
FROM race_results rr
INNER JOIN season_drivers sd ON rr.driver_id = sd.id
INNER JOIN races r ON rr.race_id = r.id
INNER JOIN rounds rd ON r.round_id = rd.id
INNER JOIN seasons s ON rd.season_id = s.id
WHERE r.id = :race_id
  AND s.race_divisions_enabled = 1
  AND rr.division_id IS NULL
  AND sd.division_id IS NULL;

-- Get all orphaned drivers for a season
SELECT
    sd.id as season_driver_id,
    sd.league_driver_id,
    COUNT(rr.id) as result_count
FROM season_drivers sd
INNER JOIN seasons s ON sd.season_id = s.id
LEFT JOIN race_results rr ON rr.driver_id = sd.id
WHERE s.id = :season_id
  AND s.race_divisions_enabled = 1
  AND sd.division_id IS NULL
  AND rr.id IS NOT NULL
GROUP BY sd.id, sd.league_driver_id;
```

### Eloquent Query Examples

```php
// Check if race has orphaned results
$hasOrphans = RaceResult::query()
    ->join('races', 'race_results.race_id', '=', 'races.id')
    ->join('rounds', 'races.round_id', '=', 'rounds.id')
    ->join('seasons', 'rounds.season_id', '=', 'seasons.id')
    ->where('races.id', $raceId)
    ->where('seasons.race_divisions_enabled', true)
    ->whereNull('race_results.division_id')
    ->exists();

// Get orphan count for a round
$orphanCount = RaceResult::query()
    ->join('races', 'race_results.race_id', '=', 'races.id')
    ->where('races.round_id', $roundId)
    ->join('rounds', 'races.round_id', '=', 'rounds.id')
    ->join('seasons', 'rounds.season_id', '=', 'seasons.id')
    ->where('seasons.race_divisions_enabled', true)
    ->whereNull('race_results.division_id')
    ->count();
```

## Proposed Backend Solution

### 1. Add Detection to RoundResultsData DTO

**File**: `app/Application/Competition/DTOs/RoundResultsData.php`

**Change**: Add `has_orphaned_results` boolean field

```php
final class RoundResultsData extends Data
{
    public function __construct(
        public readonly array $round,
        public readonly array $divisions,
        public readonly array $race_events,
        public readonly bool $has_orphaned_results, // <-- NEW FIELD
    ) {
    }
}
```

### 2. Add Detection to RaceEventResultData DTO (Optional)

**File**: `app/Application/Competition/DTOs/RaceEventResultData.php`

**Change**: Add per-race orphan flag (optional, for granular detection)

```php
final class RaceEventResultData extends Data
{
    public function __construct(
        public readonly int $id,
        public readonly int $race_number,
        public readonly ?string $name,
        public readonly bool $is_qualifier,
        public readonly string $status,
        public readonly bool $race_points,
        public readonly array $results,
        public readonly bool $has_orphaned_results, // <-- NEW FIELD (optional)
    ) {
    }
}
```

### 3. Update RoundApplicationService::getRoundResults()

**File**: `app/Application/Competition/Services/RoundApplicationService.php`

**Method**: `getRoundResults(int $roundId): RoundResultsData`

**Changes**:

```php
public function getRoundResults(int $roundId): RoundResultsData
{
    // ... existing code to fetch round, season, races, results ...

    // NEW: Check for orphaned results (only if divisions enabled)
    $hasOrphanedResults = false;
    if ($season['race_divisions_enabled']) {
        $hasOrphanedResults = $this->checkForOrphanedResults($roundId);
    }

    // ... existing code to build race events ...

    $resultData = new RoundResultsData(
        round: $roundSummaryTyped,
        divisions: $divisions,
        race_events: $raceEvents,
        has_orphaned_results: $hasOrphanedResults, // <-- NEW PARAMETER
    );

    // ... cache and return ...
}

/**
 * Check if any race in the round has orphaned results.
 * Orphaned results = results with NULL division_id when season has divisions enabled.
 */
private function checkForOrphanedResults(int $roundId): bool
{
    $orphanCount = RaceResult::query()
        ->join('races', 'race_results.race_id', '=', 'races.id')
        ->where('races.round_id', $roundId)
        ->whereNull('race_results.division_id')
        ->count();

    return $orphanCount > 0;
}
```

### 4. Add Repository Method (Alternative Approach)

If we want to follow DDD strictly, add method to `RaceResultRepositoryInterface`:

**File**: `app/Domain/Competition/Repositories/RaceResultRepositoryInterface.php`

```php
interface RaceResultRepositoryInterface
{
    // ... existing methods ...

    /**
     * Check if round has any orphaned results (results with NULL division_id).
     * Only relevant when season has divisions enabled.
     */
    public function hasOrphanedResultsForRound(int $roundId): bool;

    /**
     * Get count of orphaned results for a round.
     */
    public function countOrphanedResultsForRound(int $roundId): int;

    /**
     * Get all orphaned results for a round with driver info.
     * Useful for debugging/admin view.
     *
     * @return array<array{result_id: int, driver_id: int, driver_name: string, race_id: int, race_name: string}>
     */
    public function getOrphanedResultsForRound(int $roundId): array;
}
```

**Implementation**: `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentRaceResultRepository.php`

```php
public function hasOrphanedResultsForRound(int $roundId): bool
{
    return RaceResult::query()
        ->join('races', 'race_results.race_id', '=', 'races.id')
        ->where('races.round_id', $roundId)
        ->whereNull('race_results.division_id')
        ->exists();
}

public function countOrphanedResultsForRound(int $roundId): int
{
    return RaceResult::query()
        ->join('races', 'race_results.race_id', '=', 'races.id')
        ->where('races.round_id', $roundId)
        ->whereNull('race_results.division_id')
        ->count();
}

public function getOrphanedResultsForRound(int $roundId): array
{
    $results = RaceResult::query()
        ->select([
            'race_results.id as result_id',
            'race_results.driver_id',
            'race_results.race_id',
            'race_results.position',
            'races.name as race_name',
            'races.race_number',
            'races.is_qualifier',
        ])
        ->join('races', 'race_results.race_id', '=', 'races.id')
        ->join('season_drivers', 'race_results.driver_id', '=', 'season_drivers.id')
        ->join('league_drivers', 'season_drivers.league_driver_id', '=', 'league_drivers.id')
        ->join('drivers', 'league_drivers.driver_id', '=', 'drivers.id')
        ->where('races.round_id', $roundId)
        ->whereNull('race_results.division_id')
        ->orderBy('races.race_number')
        ->orderBy('race_results.position')
        ->get();

    return $results->map(fn($r) => [
        'result_id' => $r->result_id,
        'driver_id' => $r->driver_id,
        'driver_name' => $r->drivers->name ?? 'Unknown',
        'race_id' => $r->race_id,
        'race_name' => $r->race_name ?? "Race {$r->race_number}",
        'position' => $r->position,
        'is_qualifier' => $r->is_qualifier,
    ])->toArray();
}
```

### 5. Cache Invalidation

**Important**: The `RoundResultsCacheService` must be invalidated when:
- Driver division assignments change
- Results are added/updated/deleted
- Divisions are created/deleted

**Current cache invalidation locations**:
- `RaceResultApplicationService::saveResults()` - Already invalidates race results cache
- Need to also invalidate round results cache when divisions/driver assignments change

## API Changes Summary

### Modified Endpoint Response

**Endpoint**: `GET /api/rounds/{roundId}/results`

**New Response Structure**:
```json
{
  "round": { ... },
  "divisions": [ ... ],
  "race_events": [ ... ],
  "has_orphaned_results": true  // <-- NEW FIELD
}
```

**Frontend can use this to**:
1. Display a warning banner: "Some drivers are not assigned to any division"
2. Add an "Unassigned" tab to show orphaned results
3. Highlight affected drivers with a warning icon
4. Link to driver management to fix assignments

## Additional Endpoints (Optional)

### Get Orphaned Drivers for Season

**Endpoint**: `GET /api/seasons/{seasonId}/orphaned-drivers`

**Controller**: New method in `SeasonDriverController`

**Response**:
```json
{
  "season_id": 1,
  "has_divisions": true,
  "orphaned_drivers": [
    {
      "season_driver_id": 50,
      "driver_name": "John Doe",
      "result_count": 3,
      "races": ["Round 1 - Feature", "Round 2 - Sprint"]
    }
  ]
}
```

**Purpose**: Admin/debugging endpoint to list all drivers who need division assignment

## Testing Strategy

### Unit Tests

1. Test `checkForOrphanedResults()` returns `true` when orphans exist
2. Test `checkForOrphanedResults()` returns `false` when no orphans
3. Test orphan detection is skipped when `race_divisions_enabled = false`
4. Test repository methods for orphan queries

### Feature Tests

1. Create a round with divisions enabled
2. Add results with NULL division_id
3. Call `GET /api/rounds/{roundId}/results`
4. Assert `has_orphaned_results` is `true`
5. Assign divisions to drivers
6. Assert `has_orphaned_results` becomes `false`

### Test File Location

- `tests/Feature/User/OrphanedResultsDetectionTest.php`

## Migration/Database Changes

**None required** - All necessary columns already exist:
- `seasons.race_divisions_enabled` (BOOLEAN)
- `season_drivers.division_id` (NULLABLE FK)
- `race_results.division_id` (NULLABLE FK)

## Performance Considerations

### Query Optimization

The orphan detection query is simple and well-indexed:
- `race_results.race_id` is indexed (FK)
- `race_results.division_id` is indexed (FK, nullable)
- Join on `races.round_id` is indexed
- `WHERE` clause on NULL is efficient

**Estimated cost**: ~5-10ms for typical round (10-20 races, 20-40 results per race)

### Caching Impact

- Result is cached in `RoundResultsData` (via `RoundResultsCacheService`)
- Only computed once per cache invalidation
- No significant performance impact

## Implementation Order

1. Add `has_orphaned_results` field to `RoundResultsData` DTO
2. Add repository method `hasOrphanedResultsForRound()` to interface and implementation
3. Update `RoundApplicationService::getRoundResults()` to check for orphans
4. Write unit tests for repository method
5. Write feature tests for API endpoint
6. Update cache invalidation if needed
7. (Optional) Add debugging endpoint for listing orphaned drivers

## Edge Cases

1. **Season has divisions disabled**: `has_orphaned_results` should always be `false`
2. **No results yet**: `has_orphaned_results` should be `false`
3. **All results have division_id**: `has_orphaned_results` should be `false`
4. **Division deleted**: `ON DELETE SET NULL` makes drivers orphaned - should trigger `true`
5. **Driver removed from division**: Should show as orphan if they have existing results

## Security Considerations

- No sensitive data exposed
- All queries use parameterized statements (Eloquent ORM)
- No additional authorization needed (same access level as existing results endpoint)

## Documentation Updates

1. Update API documentation to include `has_orphaned_results` field
2. Add note about orphan scenarios in season/division documentation
3. Document the relationship between `season_drivers.division_id` and `race_results.division_id`

## Questions for Frontend Team

1. **How should orphans be displayed?**
   - Separate "Unassigned" tab?
   - Warning banner with link to fix?
   - Inline warning icons?

2. **Should we provide orphan details in the API?**
   - Just a boolean flag?
   - Or include list of affected driver IDs?

3. **Admin-only fix, or user-level warning?**
   - Only admins can fix (assign divisions)
   - But users should see the warning/tab

## Related Files

### Domain Layer
- `app/Domain/Competition/Entities/Season.php` (lines 51, 257-259)
- `app/Domain/Competition/Entities/RaceResult.php` (lines 24, 173-176)
- `app/Domain/Competition/Repositories/RaceResultRepositoryInterface.php`

### Application Layer
- `app/Application/Competition/Services/RoundApplicationService.php` (lines 558-690)
- `app/Application/Competition/DTOs/RoundResultsData.php`
- `app/Application/Competition/DTOs/RaceEventResultData.php`

### Infrastructure Layer
- `app/Infrastructure/Persistence/Eloquent/Models/SeasonDriverEloquent.php` (lines 69, 121-124)
- `app/Infrastructure/Persistence/Eloquent/Models/RaceResult.php` (lines 14, 88-91)
- `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentRaceResultRepository.php`

### Migrations
- `database/migrations/2025_10_24_235200_create_season_drivers_table.php` (lines 29-33)
- `database/migrations/2025_10_25_022500_create_race_results_table.php` (lines 15-18)

### Cache
- `app/Infrastructure/Cache/RoundResultsCacheService.php`

## Conclusion

The solution is straightforward:
1. Add a boolean flag `has_orphaned_results` to the API response
2. Detect orphans by querying for results with NULL `division_id` when `race_divisions_enabled = true`
3. Frontend can use this flag to display appropriate UI (warnings, unassigned tab, etc.)

No schema changes are needed. The implementation is primarily a service layer change with DTO updates.
