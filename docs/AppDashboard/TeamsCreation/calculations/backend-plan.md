# Team Championship Calculations - Backend Implementation Plan

## Overview

This document outlines the backend implementation for calculating team championship standings when a round is marked as complete.

---

## Business Rules (Confirmed)

1. **Tie-breaking**: When two or more teams have the same total points, sort alphabetically by team name
2. **Teams with no results**: Teams that have no drivers participating in a round are **excluded entirely** from the standings
3. **Privateer drivers**: Drivers without a team assignment (`team_id = null`) are **excluded** from team championship calculations

---

## Phase 1: Database Migration

### Create Migration

**File**: `database/migrations/YYYY_MM_DD_HHMMSS_add_team_championship_results_to_rounds_table.php`

```php
Schema::table('rounds', function (Blueprint $table) {
    $table->json('team_championship_results')
        ->nullable()
        ->after('fastest_lap_results');
});
```

### Rollback

```php
Schema::table('rounds', function (Blueprint $table) {
    $table->dropColumn('team_championship_results');
});
```

---

## Phase 2: Domain Layer Updates

### 2.1 Update Round Entity

**File**: `app/Domain/Competition/Entities/Round.php`

Add new property and methods:

```php
private ?array $teamChampionshipResults;

// Constructor update to include new property

public function teamChampionshipResults(): ?array
{
    return $this->teamChampionshipResults;
}

public function setTeamChampionshipResults(?array $results): void
{
    // Validate structure before setting
    $this->validateTeamChampionshipResults($results);
    $this->teamChampionshipResults = $results;
}

private function validateTeamChampionshipResults(?array $results): void
{
    if ($results === null) {
        return;
    }

    if (!isset($results['standings']) || !is_array($results['standings'])) {
        throw new InvalidArgumentException('Invalid team championship results structure');
    }

    foreach ($results['standings'] as $standing) {
        if (!isset($standing['team_id'], $standing['total_points'], $standing['race_result_ids'])) {
            throw new InvalidArgumentException('Invalid team standing structure');
        }
    }
}
```

### 2.2 Create Value Object (Optional but Recommended)

**File**: `app/Domain/Competition/ValueObjects/TeamChampionshipStanding.php`

```php
final readonly class TeamChampionshipStanding
{
    public function __construct(
        public int $teamId,
        public int $totalPoints,
        public array $raceResultIds,
    ) {}

    public function toArray(): array
    {
        return [
            'team_id' => $this->teamId,
            'total_points' => $this->totalPoints,
            'race_result_ids' => $this->raceResultIds,
        ];
    }
}
```

**File**: `app/Domain/Competition/ValueObjects/TeamChampionshipResults.php`

```php
final readonly class TeamChampionshipResults
{
    /** @param TeamChampionshipStanding[] $standings */
    public function __construct(
        public array $standings,
    ) {}

    public function toArray(): array
    {
        return [
            'standings' => array_map(
                fn(TeamChampionshipStanding $s) => $s->toArray(),
                $this->standings
            ),
        ];
    }

    public static function fromArray(array $data): self
    {
        $standings = array_map(
            fn(array $s) => new TeamChampionshipStanding(
                $s['team_id'],
                $s['total_points'],
                $s['race_result_ids'],
            ),
            $data['standings'] ?? []
        );

        return new self($standings);
    }
}
```

---

## Phase 3: Infrastructure Layer Updates

### 3.1 Update Eloquent Model

**File**: `app/Infrastructure/Persistence/Eloquent/Models/RoundEloquent.php`

Add to `$casts`:

```php
protected $casts = [
    // existing casts...
    'team_championship_results' => 'array',
];
```

Add to `$fillable`:

```php
protected $fillable = [
    // existing fillable...
    'team_championship_results',
];
```

### 3.2 Update Repository

**File**: `app/Infrastructure/Persistence/Eloquent/Repositories/RoundRepositoryEloquent.php`

Update the `mapToEntity()` method to include the new field:

```php
private function mapToEntity(RoundEloquent $model): Round
{
    return Round::reconstitute(
        // existing parameters...
        $model->team_championship_results, // Add new parameter
    );
}
```

Update the `save()` method to persist the new field:

```php
public function save(Round $round): void
{
    $data = [
        // existing fields...
        'team_championship_results' => $round->teamChampionshipResults(),
    ];

    // existing save logic...
}
```

---

## Phase 4: Application Layer - Calculation Logic

### 4.1 Update RoundApplicationService

**File**: `app/Application/Competition/Services/RoundApplicationService.php`

Add new method for team championship calculation:

```php
/**
 * Calculate team championship standings for a completed round.
 *
 * @param Round $round The round to calculate for
 * @param Season $season The season configuration
 * @param array $allRaceResults All race results for the round
 * @return array|null The team championship results or null if not enabled
 */
private function calculateTeamChampionshipResults(
    Round $round,
    Season $season,
    array $allRaceResults
): ?array {
    // 1. Check if team championship is enabled
    if (!$season->teamChampionshipEnabled()) {
        return null;
    }

    // 2. Get all teams for this season
    $teams = $this->teamRepository->findBySeasonId($season->id());

    if (empty($teams)) {
        return null;
    }

    // 3. Get driver-to-team mapping
    $seasonDrivers = $this->seasonDriverRepository->findBySeasonId($season->id());
    $driverTeamMap = [];
    foreach ($seasonDrivers as $driver) {
        if ($driver->teamId() !== null) {
            $driverTeamMap[$driver->id()] = $driver->teamId();
        }
    }

    // 4. Group race results by team
    $teamResults = [];
    foreach ($teams as $team) {
        $teamResults[$team->id()] = [];
    }

    foreach ($allRaceResults as $result) {
        $driverId = $result->driverId();
        if (isset($driverTeamMap[$driverId])) {
            $teamId = $driverTeamMap[$driverId];
            if (isset($teamResults[$teamId])) {
                $teamResults[$teamId][] = [
                    'race_result_id' => $result->id(),
                    'race_points' => $result->racePoints(),
                ];
            }
        }
    }

    // 5. Calculate team standings
    $standings = [];
    $driversToCount = $season->getTeamsDriversForCalculation();

    // Build a team name lookup for tie-breaking
    $teamNames = [];
    foreach ($teams as $team) {
        $teamNames[$team->id()] = $team->name();
    }

    foreach ($teamResults as $teamId => $results) {
        // Skip teams with no results in this round
        if (empty($results)) {
            continue;
        }

        // Sort by points descending
        usort($results, fn($a, $b) => $b['race_points'] <=> $a['race_points']);

        // Apply driver limit if set
        if ($driversToCount !== null && count($results) > $driversToCount) {
            $results = array_slice($results, 0, $driversToCount);
        }

        // Sum points and collect IDs
        $totalPoints = array_sum(array_column($results, 'race_points'));
        $raceResultIds = array_column($results, 'race_result_id');

        $standings[] = [
            'team_id' => $teamId,
            'team_name' => $teamNames[$teamId], // For sorting only
            'total_points' => $totalPoints,
            'race_result_ids' => $raceResultIds,
        ];
    }

    // 6. Sort by total points descending, then by team name alphabetically for tie-breaking
    usort($standings, function ($a, $b) {
        if ($a['total_points'] !== $b['total_points']) {
            return $b['total_points'] <=> $a['total_points']; // Higher points first
        }
        return strcasecmp($a['team_name'], $b['team_name']); // Alphabetical by name
    });

    // Remove team_name from final output (only used for sorting)
    $standings = array_map(function ($standing) {
        unset($standing['team_name']);
        return $standing;
    }, $standings);

    return ['standings' => $standings];
}
```

### 4.2 Integrate into completeRound()

**File**: `app/Application/Competition/Services/RoundApplicationService.php`

Modify the `completeRound()` method to call the new calculation:

```php
public function completeRound(int $roundId): RoundData
{
    return DB::transaction(function () use ($roundId) {
        // ... existing code for marking races complete ...
        // ... existing code for calculating race points ...
        // ... existing code for calculating round results ...

        // NEW: Calculate team championship results
        $teamChampionshipResults = $this->calculateTeamChampionshipResults(
            $round,
            $season,
            $allRaceResults
        );

        if ($teamChampionshipResults !== null) {
            $round->setTeamChampionshipResults($teamChampionshipResults);
        }

        // ... existing code for marking round complete ...
        // ... existing code for saving and caching ...
    });
}
```

### 4.3 Handle uncompleteRound()

When a round is uncompleted, the team championship results should be cleared:

```php
public function uncompleteRound(int $roundId): RoundData
{
    return DB::transaction(function () use ($roundId) {
        // ... existing uncomplete logic ...

        // Clear team championship results
        $round->setTeamChampionshipResults(null);

        // ... rest of existing logic ...
    });
}
```

---

## Phase 5: Repository Interface Update (If Needed)

### 5.1 TeamRepositoryInterface

**File**: `app/Domain/Team/Repositories/TeamRepositoryInterface.php`

Ensure `findBySeasonId()` method exists:

```php
/**
 * @return Team[]
 */
public function findBySeasonId(int $seasonId): array;
```

### 5.2 SeasonDriverRepositoryInterface

**File**: `app/Domain/Competition/Repositories/SeasonDriverRepositoryInterface.php`

Ensure method exists to fetch all drivers for a season:

```php
/**
 * @return SeasonDriver[]
 */
public function findBySeasonId(int $seasonId): array;
```

---

## Phase 6: Unit Tests

### 6.1 Domain Tests

**File**: `tests/Unit/Domain/Competition/Entities/RoundTest.php`

Add tests for:
- Setting valid team championship results
- Setting null team championship results
- Invalid structure throws exception

### 6.2 Value Object Tests (If Created)

**File**: `tests/Unit/Domain/Competition/ValueObjects/TeamChampionshipResultsTest.php`

Add tests for:
- Creating from array
- Converting to array
- Empty standings handling

### 6.3 Application Service Tests

**File**: `tests/Unit/Application/Competition/Services/TeamChampionshipCalculationTest.php`

Add tests for:
- Calculation when team championship disabled (returns null)
- Calculation with no teams (returns null)
- Calculation with all drivers counting
- Calculation with limited drivers (teams_drivers_for_calculation = 2)
- Calculation with fewer drivers than limit
- Proper sorting by total points
- Correct race_result_ids collection
- **Teams with no results are excluded from standings**
- **Privateer drivers (no team) are excluded from calculations**
- **Tie-breaking: teams with equal points sorted alphabetically by name**

### 6.4 Feature Tests

**File**: `tests/Feature/Competition/RoundCompletionTeamChampionshipTest.php`

Add integration tests for:
- Complete round with team championship enabled
- Complete round with team championship disabled
- Uncomplete round clears team results
- End-to-end calculation accuracy

---

## Implementation Order

1. **Migration** - Create and run database migration
2. **Domain Entity** - Add property and methods to Round entity
3. **Value Objects** (optional) - Create TeamChampionshipResults and TeamChampionshipStanding
4. **Eloquent Model** - Add casts and fillable
5. **Repository** - Update mapping and save methods
6. **Application Service** - Add calculation logic
7. **Integration** - Hook into completeRound() and uncompleteRound()
8. **Tests** - Write unit and feature tests
9. **Verification** - Manual testing with sample data

---

## Dependencies

### Required Repositories (must be injected)

- `RoundRepositoryInterface` (existing)
- `TeamRepositoryInterface` (existing)
- `SeasonDriverRepositoryInterface` (existing)
- `RaceResultRepositoryInterface` (existing)
- `SeasonRepositoryInterface` (existing)

### Existing Methods Used

- `Season::teamChampionshipEnabled(): bool`
- `Season::getTeamsDriversForCalculation(): ?int`
- `SeasonDriver::teamId(): ?int`
- `RaceResult::racePoints(): int`
- `RaceResult::driverId(): int`
- `Team::id(): int`

---

## Estimated Complexity

| Component | Effort | Notes |
|-----------|--------|-------|
| Migration | Low | Single column addition |
| Domain Entity | Low | Add property and methods |
| Value Objects | Low | Optional but recommended |
| Eloquent Model | Low | Add casts |
| Repository | Low | Update mapping |
| Calculation Logic | Medium | Core business logic |
| Integration | Low | Hook into existing method |
| Tests | Medium | Comprehensive coverage |

**Total Estimate**: Medium complexity, primarily backend work.
