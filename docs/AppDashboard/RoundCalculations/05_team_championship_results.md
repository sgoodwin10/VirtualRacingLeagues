# Team Championship Results Calculation

## Overview

Team championship results aggregate driver points per team when a round is completed. The calculation is optional and controlled by season configuration.

## Configuration

### Seasons Table
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `team_championship_enabled` | boolean | false | Master toggle |
| `teams_drivers_for_calculation` | int | NULL | Top N drivers count (null = all) |
| `teams_drop_rounds` | boolean | false | Can teams drop rounds |
| `teams_total_drop_rounds` | int | NULL | Number of rounds to drop |

### Rounds Table
| Column | Type | Description |
|--------|------|-------------|
| `team_championship_results` | longtext (JSON) | Team standings for this round |

**Migration**: `/var/www/database/migrations/2025_12_22_062138_add_team_championship_results_to_rounds_table.php`

## Output Structure

```json
{
  "standings": [
    {
      "team_id": 1,
      "total_points": 44,
      "driver_ids": [45, 67]
    },
    {
      "team_id": 2,
      "total_points": 27,
      "driver_ids": [54, 56]
    }
  ]
}
```

**Field Descriptions**:
- `team_id`: Reference to `teams.id`
- `total_points`: Sum of top N drivers' `total_points` from round_results
- `driver_ids`: Array of `season_drivers.id` that contributed to total

## Calculation Process

**Method**: `calculateTeamChampionshipResults()` (lines 2019-2157)

### Step 1: Check If Enabled
```php
if (!$season->teamChampionshipEnabled()) {
    return;  // Skip calculation
}
```

### Step 2: Get Round Results
```php
$roundResults = $round->roundResults();
if (empty($roundResults)) {
    return;  // No data to process
}
```

### Step 3: Build Driver-to-Team Mapping
```php
$seasonDrivers = $this->seasonDriverRepository->findBySeasonId($seasonId);
$driverTeamMap = [];
foreach ($seasonDrivers as $driver) {
    $driverTeamMap[$driver->id()] = $driver->teamId();
}
```

### Step 4: Extract Driver Standings
Handle both division-based and non-division results:
```php
if (isset($roundResults['standings'][0]['division_id'])) {
    // Flatten all division standings
    foreach ($roundResults['standings'] as $division) {
        $allDriverStandings = array_merge($allDriverStandings, $division['results']);
    }
} else {
    $allDriverStandings = $roundResults['standings'];
}
```

### Step 5: Build Team Driver Points
```php
foreach ($allDriverStandings as $standing) {
    $driverId = $standing['driver_id'];
    $points = $standing['total_points'];
    $teamId = $driverTeamMap[$driverId] ?? null;

    if ($teamId === null) {
        continue;  // Skip privateers
    }

    $teamDriverPoints[$teamId][] = [
        'driver_id' => $driverId,
        'points' => $points,
    ];
}
```

### Step 6: Calculate Team Totals
```php
foreach ($teamDriverPoints as $teamId => $drivers) {
    // Sort drivers by points (descending)
    usort($drivers, fn($a, $b) => $b['points'] <=> $a['points']);

    // Apply driver limit if set
    $limit = $season->getTeamsDriversForCalculation();
    if ($limit !== null && $limit > 0) {
        $drivers = array_slice($drivers, 0, $limit);
    }

    // Sum points and collect IDs
    $totalPoints = array_sum(array_column($drivers, 'points'));
    $driverIds = array_column($drivers, 'driver_id');

    $standings[] = [
        'team_id' => $teamId,
        'team_name' => $teams[$teamId]->name(),
        'total_points' => $totalPoints,
        'driver_ids' => $driverIds,
    ];
}
```

### Step 7: Sort Teams
```php
usort($standings, function ($a, $b) {
    if ($a['total_points'] !== $b['total_points']) {
        return $b['total_points'] <=> $a['total_points'];  // Higher first
    }
    return strcmp($a['team_name'], $b['team_name']);  // Alphabetical tie-break
});
```

### Step 8: Store Results
```php
$round->setTeamChampionshipResults(['standings' => $standings]);
$this->roundRepository->save($round);
```

## Business Rules

### 1. Data Source
- Uses `total_points` from `round_results` (NOT raw `race_points`)
- Includes all bonuses (fastest lap, pole position, round points)
- Ensures team standings reflect same scoring as driver standings

### 2. Driver Selection
- `NULL` or `0`: All drivers count
- `N` (e.g., 2): Only top N drivers by `total_points` count
- Drivers sorted by points before selection

### 3. Privateer Drivers
- Drivers with `season_drivers.team_id = NULL` are **excluded**
- Do not appear in any team's `driver_ids`
- Points do not contribute to any team

### 4. Teams with No Results
- Teams with no participating drivers are **excluded**
- Not shown even with 0 points

### 5. Tie-Breaking
When teams have equal `total_points`:
- Sort alphabetically by team name
- Example: Team A and Team B both at 30 points → Team A first

### 6. Division Handling
- Driver standings from ALL divisions are flattened
- Team points aggregate across divisions
- Division boundaries don't affect team calculation

## Season-Level Aggregation

**Method**: `SeasonApplicationService::aggregateTeamChampionshipStandings()` (line 1096)

Aggregates team championship results across all completed rounds:

```json
[
  {
    "position": 1,
    "team_id": 1,
    "team_name": "Alpha Racing",
    "total_points": 120,
    "rounds": [
      {"round_id": 1, "round_number": 1, "points": 44},
      {"round_id": 2, "round_number": 2, "points": 38}
    ]
  }
]
```

## Domain Entities

### Season Entity
**File**: `/var/www/app/Domain/Competition/Entities/Season.php`

```php
public function teamChampionshipEnabled(): bool
public function getTeamsDriversForCalculation(): ?int
public function enableTeamChampionship(): void
public function disableTeamChampionship(): void
```

### Round Entity
**File**: `/var/www/app/Domain/Competition/Entities/Round.php`

```php
private ?array $teamChampionshipResults;
public function teamChampionshipResults(): ?array
public function setTeamChampionshipResults(array $results): void
```

## Key Files

- `/var/www/app/Application/Competition/Services/RoundApplicationService.php`
  - `calculateTeamChampionshipResults()` (line 2019)

- `/var/www/app/Application/Competition/Services/SeasonApplicationService.php`
  - `aggregateTeamChampionshipStandings()` (line 1096)

- `/var/www/app/Domain/Competition/Entities/Round.php`
  - `setTeamChampionshipResults()` (line 644)

- `/var/www/app/Domain/Competition/Entities/Season.php`
  - Configuration methods (lines 264, 289, 459, 485)

- `/var/www/tests/Feature/TeamChampionshipCalculationTest.php`
  - Comprehensive test coverage

## Test Coverage

1. **test_team_championship_uses_total_points_from_round_results**
   - Verifies correct point aggregation

2. **test_team_championship_excludes_privateer_drivers**
   - Confirms privateers are excluded

3. **test_team_championship_respects_drivers_for_calculation_limit**
   - Tests driver limit enforcement

4. **test_team_championship_handles_divisions_correctly**
   - Verifies cross-division aggregation

5. **test_team_championship_not_calculated_when_disabled**
   - Confirms feature toggle works

## Summary

Team championship results calculation:

1. **Checks** if team championship is enabled
2. **Gets** round results (driver standings with bonuses)
3. **Maps** drivers to teams
4. **Excludes** privateer drivers (no team)
5. **Aggregates** points per team from top N drivers
6. **Sorts** by total_points, then alphabetically
7. **Stores** in `rounds.team_championship_results` JSON
8. **Aggregated** at season level for overall standings
