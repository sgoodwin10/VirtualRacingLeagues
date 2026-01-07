# Activity Logs for App Dashboard - Backend Plan

## Overview

This document details the backend implementation for adding activity logging to the User/App dashboard. The implementation follows the existing DDD architecture and leverages the already-installed `spatie/laravel-activitylog` package.

## Prerequisites

- `spatie/laravel-activitylog` is already installed and configured
- Existing `ActivityLogService` at `app/Services/ActivityLogService.php`
- Existing activity log database table with proper indexes

---

## Phase 1: Create League Activity Log Service

### 1.1 Create LeagueActivityData DTO

**File:** `app/Application/Activity/DTOs/LeagueActivityData.php`

```php
<?php

declare(strict_types=1);

namespace App\Application\Activity\DTOs;

use Spatie\LaravelData\Data;

class LeagueActivityData extends Data
{
    public function __construct(
        public int $id,
        public string $log_name,
        public string $description,
        public ?string $subject_type,
        public ?int $subject_id,
        public ?string $causer_type,
        public ?int $causer_id,
        public ?string $causer_name,
        public array $properties,
        public ?string $event,
        public string $created_at,
        // Computed fields
        public ?string $entity_type = null,
        public ?int $entity_id = null,
        public ?string $entity_name = null,
        public ?string $action = null,
    ) {}
}
```

### 1.2 Create LeagueActivityLogService

**File:** `app/Application/Activity/Services/LeagueActivityLogService.php`

This service will provide:
- `logLeagueActivity()` - Log league-specific activities
- `getActivitiesForLeague()` - Get activities filtered by league
- Helper methods for each entity type

**Key Methods:**

```php
// Logging methods
public function logLeagueCreated(User $user, League $league): Activity;
public function logLeagueUpdated(User $user, League $league, array $changes): Activity;

public function logDriverAdded(User $user, int $leagueId, LeagueDriver $driver): Activity;
public function logDriverUpdated(User $user, int $leagueId, LeagueDriver $driver, array $changes): Activity;
public function logDriverRemoved(User $user, int $leagueId, Driver $driver): Activity;
public function logDriversImported(User $user, int $leagueId, int $count): Activity;

public function logCompetitionCreated(User $user, Competition $competition): Activity;
public function logCompetitionUpdated(User $user, Competition $competition, array $changes): Activity;
public function logCompetitionDeleted(User $user, Competition $competition): Activity;

public function logSeasonCreated(User $user, Season $season): Activity;
public function logSeasonUpdated(User $user, Season $season, array $changes): Activity;
public function logSeasonCompleted(User $user, Season $season): Activity;
public function logSeasonArchived(User $user, Season $season): Activity;
public function logSeasonDeleted(User $user, Season $season): Activity;

public function logRoundCreated(User $user, Round $round): Activity;
public function logRoundUpdated(User $user, Round $round, array $changes): Activity;
public function logRoundCompleted(User $user, Round $round): Activity;
public function logRoundDeleted(User $user, Round $round): Activity;

public function logRaceCreated(User $user, Race $race): Activity;
public function logRaceUpdated(User $user, Race $race, array $changes): Activity;
public function logRaceCompleted(User $user, Race $race): Activity;
public function logRaceDeleted(User $user, Race $race): Activity;
public function logRaceResultsEntered(User $user, Race $race, int $resultCount): Activity;

public function logDivisionCreated(User $user, Division $division): Activity;
public function logDivisionUpdated(User $user, Division $division, array $changes): Activity;
public function logDivisionsReordered(User $user, Season $season): Activity;
public function logDivisionDeleted(User $user, Division $division): Activity;
public function logDriverAddedToDivision(User $user, SeasonDriver $sd, Division $division): Activity;
public function logDriverRemovedFromDivision(User $user, SeasonDriver $sd, Division $oldDivision): Activity;

public function logTeamCreated(User $user, Team $team): Activity;
public function logTeamUpdated(User $user, Team $team, array $changes): Activity;
public function logTeamDeleted(User $user, Team $team): Activity;
public function logDriverAddedToTeam(User $user, SeasonDriver $sd, Team $team): Activity;
public function logDriverRemovedFromTeam(User $user, SeasonDriver $sd, Team $oldTeam): Activity;

public function logSeasonDriverAdded(User $user, SeasonDriver $sd): Activity;
public function logSeasonDriverRemoved(User $user, SeasonDriver $sd): Activity;

// Query methods
public function getActivitiesForLeague(
    int $leagueId,
    ?int $limit = 50,
    ?string $entityType = null,
    ?string $action = null,
    ?Carbon $fromDate = null,
    ?Carbon $toDate = null
): Collection;
```

**Activity Properties Structure:**

Each logged activity will include these properties:

```php
[
    'league_id' => $leagueId,
    'league_name' => $leagueName,
    'action' => 'create|update|delete|complete|archive|...',
    'entity_type' => 'league|driver|competition|season|round|race|qualifier|division|team|season_driver',
    'entity_id' => $entityId,
    'entity_name' => $displayName,
    'context' => [
        'competition_id' => $competitionId,
        'competition_name' => $competitionName,
        'season_id' => $seasonId,
        'season_name' => $seasonName,
        'round_id' => $roundId,
        'round_name' => $roundName,
    ],
    'changes' => [
        'old' => [...],
        'new' => [...],
    ],
    'ip_address' => request()->ip(),
    'user_agent' => request()->userAgent(),
]
```

---

## Phase 2: Create API Controller

### 2.1 Create LeagueActivityLogController

**File:** `app/Http/Controllers/User/LeagueActivityLogController.php`

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leagues/{league}/activities` | Get activities for a league |
| GET | `/api/leagues/{league}/activities/{id}` | Get single activity |

**Controller Methods:**

```php
public function index(League $league, Request $request): JsonResponse
{
    // Validate user owns the league
    // Apply filters from query params
    // Return paginated activities
}

public function show(League $league, int $activityId): JsonResponse
{
    // Validate user owns the league
    // Validate activity belongs to league
    // Return activity details
}
```

**Query Parameters for `index`:**

- `limit` - Number of activities (default: 50, max: 100)
- `entity_type` - Filter by entity type
- `action` - Filter by action type
- `from_date` - Filter from date (ISO 8601)
- `to_date` - Filter to date (ISO 8601)
- `page` - Pagination page number

---

## Phase 3: Add Routes

### 3.1 Update subdomain.php

Add routes in the app subdomain section:

```php
Route::domain('app.virtualracingleagues.localhost')->group(function () {
    Route::prefix('api')->middleware(['auth:web', 'user.authenticate'])->group(function () {
        // ... existing routes ...

        // Activity Log routes
        Route::prefix('leagues/{league}')->group(function () {
            Route::get('/activities', [LeagueActivityLogController::class, 'index']);
            Route::get('/activities/{activityId}', [LeagueActivityLogController::class, 'show']);
        });
    });
});
```

---

## Phase 4: Modify Existing Controllers

Each controller needs to be modified to inject and use `LeagueActivityLogService`. Below are the specific modifications needed.

### 4.1 LeagueController

**File:** `app/Http/Controllers/User/LeagueController.php`

**Modifications:**
- Inject `LeagueActivityLogService` in constructor
- Add logging after `store()` - `logLeagueCreated()`
- Add logging after `update()` - `logLeagueUpdated()`

**Example Pattern:**

```php
public function store(CreateLeagueRequest $request): JsonResponse
{
    // ... existing create logic ...

    $this->activityLogService->logLeagueCreated(
        auth()->user(),
        $league
    );

    return ApiResponse::created($data);
}

public function update(UpdateLeagueRequest $request, League $league): JsonResponse
{
    $originalData = $league->only(['name', 'visibility', ...]);

    // ... existing update logic ...

    $this->activityLogService->logLeagueUpdated(
        auth()->user(),
        $league,
        [
            'old' => $originalData,
            'new' => $league->only(['name', 'visibility', ...])
        ]
    );

    return ApiResponse::success($data);
}
```

### 4.2 DriverController (League Drivers)

**File:** `app/Http/Controllers/User/DriverController.php`

**Modifications:**
- Add logging for `store()` - `logDriverAdded()`
- Add logging for `update()` - `logDriverUpdated()`
- Add logging for `destroy()` - `logDriverRemoved()`
- Add logging for `import()` - `logDriversImported()`

### 4.3 CompetitionController

**File:** `app/Http/Controllers/User/CompetitionController.php`

**Modifications:**
- Add logging for `store()` - `logCompetitionCreated()`
- Add logging for `update()` - `logCompetitionUpdated()`
- Add logging for `destroy()` - `logCompetitionDeleted()`

### 4.4 SeasonController

**File:** `app/Http/Controllers/User/SeasonController.php`

**Modifications:**
- Add logging for `store()` - `logSeasonCreated()`
- Add logging for `update()` - `logSeasonUpdated()`
- Add logging for `destroy()` - `logSeasonDeleted()`
- Add logging for `complete()` - `logSeasonCompleted()`
- Add logging for `archive()` - `logSeasonArchived()`

### 4.5 RoundController

**File:** `app/Http/Controllers/User/RoundController.php`

**Modifications:**
- Add logging for `store()` - `logRoundCreated()`
- Add logging for `update()` - `logRoundUpdated()`
- Add logging for `destroy()` - `logRoundDeleted()`
- Add logging for `complete()` - `logRoundCompleted()`

### 4.6 RaceController

**File:** `app/Http/Controllers/User/RaceController.php`

**Modifications:**
- Add logging for `store()` - `logRaceCreated()`
- Add logging for `update()` - `logRaceUpdated()`
- Add logging for `destroy()` - `logRaceDeleted()`
- Add logging for `complete()` - `logRaceCompleted()`

### 4.7 QualifierController

**File:** `app/Http/Controllers/User/QualifierController.php`

**Modifications:**
- Add logging for `store()` - `logRaceCreated()` (with isQualifier=true)
- Add logging for `update()` - `logRaceUpdated()`
- Add logging for result entry - `logRaceResultsEntered()`

### 4.8 RaceResultController

**File:** `app/Http/Controllers/User/RaceResultController.php`

**Modifications:**
- Add logging for result entry/update - `logRaceResultsEntered()`

### 4.9 DivisionController

**File:** `app/Http/Controllers/User/DivisionController.php`

**Modifications:**
- Add logging for `store()` - `logDivisionCreated()`
- Add logging for `update()` - `logDivisionUpdated()`
- Add logging for `destroy()` - `logDivisionDeleted()`
- Add logging for `reorder()` - `logDivisionsReordered()`

### 4.10 TeamController

**File:** `app/Http/Controllers/User/TeamController.php`

**Modifications:**
- Add logging for `store()` - `logTeamCreated()`
- Add logging for `update()` - `logTeamUpdated()`
- Add logging for `destroy()` - `logTeamDeleted()`

### 4.11 SeasonDriverController

**File:** `app/Http/Controllers/User/SeasonDriverController.php`

**Modifications:**
- Add logging for `store()` - `logSeasonDriverAdded()`
- Add logging for `destroy()` - `logSeasonDriverRemoved()`
- Add logging for division assignment - `logDriverAddedToDivision()` / `logDriverRemovedFromDivision()`
- Add logging for team assignment - `logDriverAddedToTeam()` / `logDriverRemovedFromTeam()`

---

## Phase 5: Tests

### 5.1 Unit Tests for LeagueActivityLogService

**File:** `tests/Unit/Application/Activity/LeagueActivityLogServiceTest.php`

Test cases:
- Log league created
- Log league updated with changes
- Log driver added/updated/removed
- Log competition CRUD
- Log season CRUD + status changes
- Log round CRUD + completion
- Log race/qualifier CRUD + results
- Log division CRUD + reorder
- Log team CRUD
- Log season driver add/remove + assignments
- Query activities by league
- Query activities with filters

### 5.2 Feature Tests for API Endpoints

**File:** `tests/Feature/Http/Controllers/User/LeagueActivityLogControllerTest.php`

Test cases:
- Get activities for owned league
- Cannot get activities for non-owned league
- Filter activities by entity type
- Filter activities by action
- Filter activities by date range
- Get single activity
- Pagination works correctly

### 5.3 Integration Tests

**File:** `tests/Feature/ActivityLoggingIntegrationTest.php`

Test cases:
- Creating a league logs activity
- Updating a league logs activity with changes
- Full workflow: create league -> add drivers -> create competition -> activities logged correctly

---

## Implementation Order

1. **Create DTOs** - `LeagueActivityData`
2. **Create Service** - `LeagueActivityLogService` with all logging methods
3. **Create Controller** - `LeagueActivityLogController`
4. **Add Routes** - Update `subdomain.php`
5. **Modify Controllers** - Update all 10 user controllers to add logging
6. **Write Tests** - Unit and feature tests
7. **Run Tests** - Ensure all pass

---

## Notes for Implementation

### Getting League ID from Context

Some entities don't have a direct `league_id`:
- **Competition** → has `league_id`
- **Season** → get via `competition.league_id`
- **Round** → get via `season.competition.league_id`
- **Race** → get via `round.season.competition.league_id`
- **Division/Team** → get via `season.competition.league_id`

Create helper methods to traverse these relationships.

### Change Tracking

For update operations, capture the original values before the update:
```php
$original = $model->only(['field1', 'field2']);
// ... perform update ...
$changes = [
    'old' => $original,
    'new' => $model->only(['field1', 'field2'])
];
```

### Error Handling

Activity logging should NOT cause the main operation to fail. Wrap logging in try-catch:
```php
try {
    $this->activityLogService->logSomething(...);
} catch (\Exception $e) {
    Log::error('Activity logging failed', ['error' => $e->getMessage()]);
}
```

### Performance

- Use `withoutEvents()` if Eloquent events are causing duplicate logs
- Consider queuing activity logging for high-volume operations (like driver imports)
