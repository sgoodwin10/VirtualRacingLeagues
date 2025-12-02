# Round Completion and Standings Calculation

This document describes what happens when a round is marked as completed, including race completion cascading, round standings calculation, and cross-division results.

## Overview

Round completion is the most complex calculation in the system. It triggers:
1. **Cascade**: Automatic completion of all races in the round
2. **Aggregation**: Summing race points across all races/qualifiers
3. **Bonus Assignment**: Round-level fastest lap and pole bonuses (if round_points mode)
4. **Round Points**: Points based on final standings position (if round_points mode)
5. **Cross-Division Results**: Overall qualifying, race time, and fastest lap rankings
6. **Storage**: Results saved to `rounds.round_results` JSON field

## Entry Points

### API Endpoint
- **Route**: `POST /api/seasons/{seasonId}/rounds/{roundId}/complete`
- **Controller**: `app/Http/Controllers/User/RoundController.php:93-104`
- **Method**: `complete()`

### Request Format
No body required - just a POST request to the endpoint.

## Process Flow

### Step 1: Fetch Round and Authorize
**File**: `app/Application/Competition/Services/RoundApplicationService.php:319-322`

```php
$round = $this->roundRepository->findById($roundId);
$this->authorizeLeagueOwner($round->seasonId(), $userId);
```

**Authorization**: Only league owner can complete rounds.

### Step 2: Check Division Configuration
**File**: `app/Application/Competition/Services/RoundApplicationService.php:324-326`

```php
$season = $this->seasonRepository->findById($round->seasonId());
$hasDivisions = $season->raceDivisionsEnabled();
```

**Division Support**:
- `season.race_divisions_enabled = true`: Multiple division standings
- `season.race_divisions_enabled = false`: Single standings table

### Step 3: CASCADE - Complete All Races
**File**: `app/Application/Competition/Services/RoundApplicationService.php:328-358`

**This is the most important step** - all races in the round are automatically completed.

```php
// Fetch all races (including qualifiers)
$races = $this->raceRepository->findAllByRoundId($roundId);

// Sort races by race_number to ensure qualifiers are processed first
usort($races, fn($a, $b) => $a->raceNumber() <=> $b->raceNumber());

foreach ($races as $race) {
    // Mark race as completed
    $race->markAsCompleted();
    $this->raceRepository->save($race);

    // Calculate race points (this also assigns positions and calculates positions_gained)
    $raceId = $race->id();
    if ($raceId !== null && $race->racePoints()) {
        $this->raceApplicationService->calculateRacePoints($raceId);
    }

    // Mark all race results as confirmed
    if ($raceId !== null) {
        $raceResults = $this->raceResultRepository->findByRaceId($raceId);
        foreach ($raceResults as $result) {
            if ($result->status() !== RaceResultStatus::CONFIRMED) {
                $result->updateStatus(RaceResultStatus::CONFIRMED);
                $this->raceResultRepository->save($result);
            }
        }
    }
}
```

**Why Sort by race_number?**
- Qualifiers have `race_number = 0`, so they're processed first
- Non-qualifier races may depend on qualifier positions for `grid_source`
- Ensures correct `positions_gained` calculation

**What Happens**:
- Each race status changes to `completed`
- Race points are calculated (see [Race Completion](./02_race_completion.md))
- All race results status changes to `confirmed`

### Step 4: Fetch All Race Results
**File**: `app/Application/Competition/Services/RoundApplicationService.php:360-373`

```php
$allRaceResults = [];
foreach ($races as $race) {
    $raceId = $race->id();
    if ($raceId !== null) {
        $raceResults = $this->raceResultRepository->findByRaceId($raceId);
        foreach ($raceResults as $result) {
            $allRaceResults[] = [
                'race' => $race,
                'result' => $result,
            ];
        }
    }
}
```

**Data Structure**:
```php
[
    [
        'race' => Race entity,
        'result' => RaceResult entity
    ],
    // ... for every driver in every race
]
```

### Step 5: Calculate Round Results
**File**: `app/Application/Competition/Services/RoundApplicationService.php:375-376`

```php
$roundResults = $this->calculateRoundResults($round, $allRaceResults, $hasDivisions);
```

This is where the magic happens. Let's break it down:

## Round Results Calculation (Without Divisions)

**File**: `app/Application/Competition/Services/RoundApplicationService.php:567-707`

### Step 5a: Determine Point Calculation Mode

```php
$roundPointsEnabled = $round->roundPoints();
```

**Two Modes**:
1. **Race Points Mode** (`round_points = false`):
   - Bonuses awarded at race level (already in `race_points`)
   - Round standings = sum of all `race_points`
   - `total_points = race_points`

2. **Round Points Mode** (`round_points = true`):
   - Bonuses awarded at round level (single winner across all races)
   - Round standings based on sum of race points, then bonuses added
   - `total_points = round_points + bonuses` (NOT including race_points)

### Step 5b: Batch Fetch Driver Names
**File**: `app/Application/Competition/Services/RoundApplicationService.php:571-580`

```php
$driverIds = [];
foreach ($allRaceResults as $item) {
    $result = $item['result'];
    $driverIds[$result->driverId()] = true;
}
$driverIds = array_keys($driverIds);

// Batch fetch driver names to avoid N+1 queries
$driverNames = $this->batchFetchDriverNames($driverIds);
```

**Optimization**: Single database query fetches all driver names at once.

### Step 5c: Aggregate Points Per Driver
**File**: `app/Application/Competition/Services/RoundApplicationService.php:670-785`

```php
$driverPoints = [];
$driverData = [];
$raceResultsByDriver = [];
$driverPositionsGained = [];
$driverBestTimes = [];
$driverHasDnfOrDns = [];

foreach ($allRaceResults as $item) {
    $race = $item['race'];
    $result = $item['result'];
    $driverId = $result->driverId();

    // Check if this result has ANY participation data (race time, fastest lap, or DNF flag)
    // Skip results with no participation data - driver may still have valid
    // participation in other races within this round
    $hasParticipation = !$result->raceTime()->isNull()
        || !$result->fastestLap()->isNull()
        || $result->dnf();

    if (!$hasParticipation) {
        continue; // Skip - driver has no participation data for this race
    }

    // Initialize driver data if not already set (only for drivers with participation)
    if (!isset($driverPoints[$driverId])) {
        $driverPoints[$driverId] = 0;
        $driverData[$driverId] = [
            'driver_id' => $driverId,
            'driver_name' => $driverNames[$driverId] ?? 'Unknown Driver',
        ];
        $raceResultsByDriver[$driverId] = [];
        $driverPositionsGained[$driverId] = 0;
        $driverBestTimes[$driverId] = [/*...*/];
        $driverHasDnfOrDns[$driverId] = false;
    }

    // Check for DNF - driver gets 0 points for this race but IS included in standings
    if ($result->dnf()) {
        $driverHasDnfOrDns[$driverId] = true;
        $raceResultsByDriver[$driverId][] = [/*0 points entry*/];
        continue;
    }

    // Check for DNS (has fastest lap but no race time) - included with 0 points
    if (!$this->hasValidRaceTime($race, $result)) {
        $driverHasDnfOrDns[$driverId] = true;
        $raceResultsByDriver[$driverId][] = [/*0 points entry*/];
        continue;
    }

    // Valid finish - accumulate points
    $driverPoints[$driverId] += $result->racePoints();
    // ... track best times, positions gained, etc.
}
```

**Driver Inclusion Rules**:
- **Excluded**: Drivers with NO participation data (no race time, no fastest lap, AND no DNF flag)
- **Included with 0 points**: Drivers with DNF flag set
- **Included with 0 points**: Drivers with fastest lap but no race time (DNS)
- **Included with points**: Drivers with valid race time

**DNF/DNS Handling**:
- Drivers with DNF receive 0 points for that race but ARE included in standings
- Drivers with fastest lap but no race time (DNS) receive 0 points but ARE included
- DNF/DNS drivers are placed at the bottom of standings
- Drivers with at least one valid finish are ranked above pure DNF/DNS drivers

**Aggregation**:
- `race_points`: Sum of race points from ALL valid finishes (races and qualifiers)
- `positions_gained`: Sum of positions gained across all valid races
- DNF/DNS races contribute 0 to both totals

### Step 5d: Sort Drivers by Points with Tie-Breaking
**File**: `app/Application/Competition/Services/RoundApplicationService.php:775-850`

The sorting logic has two modes depending on whether any drivers have points:

#### When Drivers Have Points (Normal Mode)

```php
uasort($sortableDrivers, function ($driverA, $driverB) use ($raceResultsByDriver) {
    // Primary sort: Total points descending
    if ($driverA['points'] !== $driverB['points']) {
        return $driverB['points'] <=> $driverA['points'];
    }

    // Tie-breaking: driver with better single best race result wins
    $bestA = max(array_column($raceResultsByDriver[$driverA['driver_id']], 'race_points'));
    $bestB = max(array_column($raceResultsByDriver[$driverB['driver_id']], 'race_points'));

    return $bestB <=> $bestA;
});
```

**Sorting Logic**:
1. **Primary**: Total points (descending)
2. **Tie-breaker**: Best single race result (descending)
3. **Final tie-breaker**: Time-based comparison (see below)

**Example Tie-Break**:
- Driver A: 25 + 10 = 35 points (best single = 25)
- Driver B: 18 + 17 = 35 points (best single = 18)
- Result: Driver A wins (better best result)

#### When No Drivers Have Points (Time-Based Mode)

When races have no `round_points` configured (all drivers have 0 race points), sorting falls back to time-based ordering:

```php
// When all drivers have 0 points, sort by time
return $this->compareDriversByTime($driverA['driver_id'], $driverB['driver_id'], $driverBestTimes);
```

**Time-Based Sorting Priority** (ascending - lower is better):
1. **Race time**: Best race finish time across all races
2. **Qualifier time**: Best qualifying lap time (if no race time)
3. **Fastest lap**: Best fastest lap from races (if no race or qualifier time)

**Example Time-Based Sorting**:
- Driver A: Race time 1:23.456 → Position 1
- Driver B: Race time 1:24.789 → Position 2
- Driver C: No race time, Qualifier 1:22.000 → Position 3
- Driver D: No race time, No qualifier, Fastest lap 1:21.500 → Position 4
- Driver E: DNF (no valid times) → Position 5 (bottom)

**Key Points**:
- Drivers with race times always rank higher than drivers with only qualifier times
- Drivers with qualifier times rank higher than drivers with only fastest laps
- Drivers with only DNF/DNS results (no valid times) are placed at the bottom
- This ensures fair ordering even when no points system is configured

### Step 5e: Build Standings with Positions
**File**: `app/Application/Competition/Services/RoundApplicationService.php:666-681`

```php
$standings = [];
$position = 1;
foreach ($driverPoints as $driverId => $racePoints) {
    $standings[] = [
        'position' => $position++,
        'driver_id' => $driverId,
        'driver_name' => $driverData[$driverId]['driver_name'],
        'race_points' => $racePoints,
        'fastest_lap_points' => 0,
        'pole_position_points' => 0,
        'round_points' => 0,
        'total_points' => $roundPointsEnabled ? 0 : $racePoints,
        'total_positions_gained' => $driverPositionsGained[$driverId],
    ];
}
```

**Initial Values**:
- `position`: 1, 2, 3, ... based on sorted order
- `race_points`: Sum from all races
- `fastest_lap_points`: 0 (calculated next)
- `pole_position_points`: 0 (calculated next)
- `round_points`: 0 (calculated next if round_points mode)
- `total_points`: Depends on mode
- `total_positions_gained`: Sum of positions gained

### Step 5f: Apply Round-Level Bonuses (Round Points Mode Only)
**File**: `app/Application/Competition/Services/RoundApplicationService.php:683-704`

This only happens if `round.round_points = true`.

#### Apply Fastest Lap Bonus
**File**: `app/Application/Competition/Services/RoundApplicationService.php:781-844`

```php
private function applyFastestLapBonus(Round $round, array $allRaceResults, array $standings, bool $roundPointsEnabled): array
{
    $fastestLapPoints = $round->fastestLap();
    if ($fastestLapPoints === null || $fastestLapPoints === 0) {
        return $standings;
    }

    // Find the fastest lap across ALL races (exclude qualifiers)
    $fastestLapDriverId = null;
    $fastestLapTime = null;

    foreach ($allRaceResults as $item) {
        $race = $item['race'];
        $result = $item['result'];

        // Skip qualifiers
        if ($race->isQualifier()) {
            continue;
        }

        $lapTime = $result->fastestLap();
        if (!$lapTime->isNull()) {
            $lapTimeMs = $lapTime->toMilliseconds();
            if ($lapTimeMs !== null && ($fastestLapTime === null || $lapTimeMs < $fastestLapTime)) {
                $fastestLapTime = $lapTimeMs;
                $fastestLapDriverId = $result->driverId();
            }
        }
    }

    if ($fastestLapDriverId === null) {
        return $standings;
    }

    // Check top 10 restriction BEFORE awarding (based on race_points position)
    if ($round->fastestLapTop10()) {
        $driverPosition = null;
        foreach ($standings as $standing) {
            if ($standing['driver_id'] === $fastestLapDriverId) {
                $driverPosition = $standing['position'];
                break;
            }
        }
        if ($driverPosition !== null && $driverPosition > 10) {
            // Driver is outside top 10, no bonus awarded
            return $standings;
        }
    }

    // Award fastest lap bonus (positions do NOT change)
    foreach ($standings as &$standing) {
        if ($standing['driver_id'] === $fastestLapDriverId) {
            $standing['fastest_lap_points'] = $fastestLapPoints;
            break;
        }
    }

    return $standings;
}
```

**Key Points**:
- **Single winner** across ALL races in the round (not per race)
- Excludes qualifiers (only non-qualifier races)
- Top 10 restriction based on STANDINGS position (not race finish)
- Bonus does NOT change positions (positions already fixed by race_points)

#### Apply Pole Position Bonus
**File**: `app/Application/Competition/Services/RoundApplicationService.php:864-927`

Very similar logic to fastest lap, but for qualifying:

```php
private function applyPolePositionBonus(Round $round, array $allRaceResults, array $standings, bool $roundPointsEnabled): array
{
    $polePoints = $round->qualifyingPole();
    if ($polePoints === null || $polePoints === 0) {
        return $standings;
    }

    // Find the fastest qualifying time across ALL qualifying sessions
    $poleDriverId = null;
    $fastestQualifyingTime = null;

    foreach ($allRaceResults as $item) {
        $race = $item['race'];
        $result = $item['result'];

        // Only consider qualifiers
        if (!$race->isQualifier()) {
            continue;
        }

        $lapTime = $result->fastestLap();
        if (!$lapTime->isNull()) {
            $lapTimeMs = $lapTime->toMilliseconds();
            if ($lapTimeMs !== null && ($fastestQualifyingTime === null || $lapTimeMs < $fastestQualifyingTime)) {
                $fastestQualifyingTime = $lapTimeMs;
                $poleDriverId = $result->driverId();
            }
        }
    }

    // ... similar top 10 check and bonus award
}
```

**Key Points**:
- **Single winner** across ALL qualifiers in the round
- Only considers qualifiers (`race.is_qualifier = true`)
- Uses `fastest_lap` field (which stores qualifying lap time for qualifiers)

#### Apply Round Points
**File**: `app/Application/Competition/Services/RoundApplicationService.php:937-957`

```php
private function applyRoundPoints(Round $round, array $standings): array
{
    $pointsSystem = $round->pointsSystem();
    if ($pointsSystem === null) {
        return $standings;
    }

    $pointsArray = $pointsSystem->toArray();

    foreach ($standings as &$standing) {
        $position = $standing['position'];
        if (isset($pointsArray[$position])) {
            $roundPoints = $pointsArray[$position];
            $standing['round_points'] = $roundPoints;
        } else {
            $standing['round_points'] = 0;
        }
    }

    return $standings;
}
```

**Round Points**:
- Separate from race points
- Based on final standings position
- Uses `round.points_system` (e.g., `[25, 18, 15, ...]`)

#### Calculate Total Points (Round Points Mode)
**File**: `app/Application/Competition/Services/RoundApplicationService.php:695-699`

```php
foreach ($standings as &$standing) {
    $standing['total_points'] = $standing['round_points']
        + $standing['fastest_lap_points']
        + $standing['pole_position_points'];
}
```

**Important**: `total_points` does NOT include `race_points` in round points mode!

### Step 5g: Tally Race-Level Bonuses (Race Points Mode)
**File**: `app/Application/Competition/Services/RoundApplicationService.php:700-704`

If `round.round_points = false`, bonuses are tallied from individual races:

```php
$standings = $this->tallyRaceLevelBonuses($allRaceResults, $standings);
```

**File**: `app/Application/Competition/Services/RoundApplicationService.php:971-1007`

```php
private function tallyRaceLevelBonuses(array $allRaceResults, array $standings): array
{
    $driverFastestLapPoints = [];
    $driverPolePoints = [];

    foreach ($allRaceResults as $item) {
        $race = $item['race'];
        $result = $item['result'];
        $driverId = $result->driverId();

        // Tally fastest lap bonuses (from non-qualifier races)
        if (!$race->isQualifier() && $result->hasFastestLap()) {
            if (!isset($driverFastestLapPoints[$driverId])) {
                $driverFastestLapPoints[$driverId] = 0;
            }
            $driverFastestLapPoints[$driverId] += ($race->fastestLap() ?? 0);
        }

        // Tally pole bonuses (from qualifier races)
        if ($race->isQualifier() && $result->hasPole()) {
            if (!isset($driverPolePoints[$driverId])) {
                $driverPolePoints[$driverId] = 0;
            }
            $driverPolePoints[$driverId] += ($race->qualifyingPole() ?? 0);
        }
    }

    // Update standings with tallied bonuses
    foreach ($standings as &$standing) {
        $driverId = $standing['driver_id'];
        $standing['fastest_lap_points'] = $driverFastestLapPoints[$driverId] ?? 0;
        $standing['pole_position_points'] = $driverPolePoints[$driverId] ?? 0;
    }

    return $standings;
}
```

**Purpose**: Display breakdown of where points came from, even though bonuses are already in `race_points`.

## Round Results Calculation (With Divisions)

**File**: `app/Application/Competition/Services/RoundApplicationService.php:719-761`

When `season.race_divisions_enabled = true`:

```php
private function calculateRoundResultsWithDivisions(Round $round, array $allRaceResults): array
{
    // Batch fetch division names
    $divisionNames = $this->batchFetchDivisionNames($divisionIds);

    // Group results by division
    $resultsByDivision = [];
    foreach ($allRaceResults as $item) {
        $result = $item['result'];
        $divisionId = $result->divisionId() ?? 0;

        if (!isset($resultsByDivision[$divisionId])) {
            $resultsByDivision[$divisionId] = [];
        }

        $resultsByDivision[$divisionId][] = $item;
    }

    // Calculate standings for each division
    $divisionStandings = [];
    foreach ($resultsByDivision as $divisionId => $divisionResults) {
        // Recursively call calculateRoundResultsWithoutDivisions for each division
        $divisionData = $this->calculateRoundResultsWithoutDivisions($round, $divisionResults);

        $divisionStandings[] = [
            'division_id' => $divisionId === 0 ? null : $divisionId,
            'division_name' => $divisionId === 0 ? 'No Division' : ($divisionNames[$divisionId] ?? 'Unknown Division'),
            'results' => $divisionData['standings'],
        ];
    }

    return ['standings' => $divisionStandings];
}
```

**Result Structure**:
```php
[
    'standings' => [
        [
            'division_id' => 1,
            'division_name' => 'Pro',
            'results' => [ /* standings as above */ ]
        ],
        [
            'division_id' => 2,
            'division_name' => 'Am',
            'results' => [ /* standings as above */ ]
        ]
    ]
]
```

**Key Point**: Each division is calculated independently using the same logic as no-divisions mode.

## Cross-Division Results

**File**: `app/Application/Competition/Services/RoundApplicationService.php:378-387`

These rankings ignore divisions and compare ALL drivers across the entire round:

```php
$crossDivisionResults = $this->calculateCrossDivisionResults($allRaceResults);

$round->setCrossDivisionResults(
    $crossDivisionResults['qualifying_results'],
    $crossDivisionResults['race_time_results'],
    $crossDivisionResults['fastest_lap_results']
);
```

### Cross-Division Calculation
**File**: `app/Application/Competition/Services/RoundApplicationService.php:1022-1120`

```php
private function calculateCrossDivisionResults(array $allRaceResults): array
{
    $qualifyingResults = [];
    $raceTimeByDriver = [];
    $fastestLapResults = [];

    foreach ($allRaceResults as $item) {
        $race = $item['race'];
        $result = $item['result'];
        $resultId = $result->id();

        if ($resultId === null) continue;

        // 1. Qualifying results: fastest_lap from qualifiers
        if ($race->isQualifier()) {
            $lapTime = $result->fastestLap();
            if (!$lapTime->isNull()) {
                $lapTimeMs = $lapTime->toMilliseconds();
                if ($lapTimeMs !== null && $lapTimeMs > 0) {
                    $qualifyingResults[] = [
                        'race_result_id' => $resultId,
                        'time_ms' => $lapTimeMs,
                    ];
                }
            }
        } else {
            // 2. Race time results: best race_time per driver
            if (!$result->dnf()) {
                $raceTime = $result->raceTime();
                if (!$raceTime->isNull()) {
                    $raceTimeMs = $raceTime->toMilliseconds();
                    if ($raceTimeMs !== null && $raceTimeMs > 0) {
                        $driverId = $result->driverId();

                        // Keep only the best (fastest) time per driver
                        if (!isset($raceTimeByDriver[$driverId]) ||
                            $raceTimeMs < $raceTimeByDriver[$driverId]['time_ms']) {
                            $raceTimeByDriver[$driverId] = [
                                'race_result_id' => $resultId,
                                'time_ms' => $raceTimeMs,
                            ];
                        }
                    }
                }
            }

            // 3. Fastest lap results: fastest_lap from non-qualifiers
            $lapTime = $result->fastestLap();
            if (!$lapTime->isNull()) {
                $lapTimeMs = $lapTime->toMilliseconds();
                if ($lapTimeMs !== null && $lapTimeMs > 0) {
                    $fastestLapResults[] = [
                        'race_result_id' => $resultId,
                        'time_ms' => $lapTimeMs,
                    ];
                }
            }
        }
    }

    // Sort each category by time (fastest first) and assign positions
    usort($qualifyingResults, fn($a, $b) => $a['time_ms'] <=> $b['time_ms']);
    $position = 1;
    foreach ($qualifyingResults as &$qr) {
        $qr['position'] = $position++;
    }

    // ... similar for race time and fastest lap
}
```

**Three Rankings**:
1. **Qualifying Results** (`rounds.qualifying_results`):
   - All qualifying lap times across divisions
   - One entry per driver per qualifying session
   - Sorted by fastest lap time

2. **Race Time Results** (`rounds.race_time_results`):
   - Best race time per driver (if driver raced multiple times)
   - Excludes DNF
   - Sorted by race time

3. **Fastest Lap Results** (`rounds.fastest_lap_results`):
   - All fastest laps from non-qualifier races
   - One entry per race per driver
   - Sorted by lap time

**Storage Format**:
```json
{
  "position": 1,
  "race_result_id": 42,
  "time_ms": 85123
}
```

## Storage

### Step 6: Store Round Results
**File**: `app/Application/Competition/Services/RoundApplicationService.php:382-387`

```php
$round->setRoundResults($roundResults);
$round->setCrossDivisionResults(
    $crossDivisionResults['qualifying_results'],
    $crossDivisionResults['race_time_results'],
    $crossDivisionResults['fastest_lap_results']
);
```

### Step 7: Mark Round as Completed
**File**: `app/Application/Competition/Services/RoundApplicationService.php:390-392`

```php
$round->complete();
$this->roundRepository->save($round);
$this->dispatchEvents($round);
```

**Database Updates**:
- `rounds.status` = `completed`
- `rounds.round_results` = JSON (see below)
- `rounds.qualifying_results` = JSON array
- `rounds.race_time_results` = JSON array
- `rounds.fastest_lap_results` = JSON array
- `rounds.updated_at` = current timestamp

### Round Results JSON Structure

#### Without Divisions
**File**: `app/Application/Competition/Services/RoundApplicationService.php:706`

```json
{
  "standings": [
    {
      "position": 1,
      "driver_id": 42,
      "driver_name": "John Doe",
      "race_points": 50,
      "fastest_lap_points": 1,
      "pole_position_points": 1,
      "round_points": 25,
      "total_points": 27,
      "total_positions_gained": 5
    },
    {
      "position": 2,
      "driver_id": 43,
      "driver_name": "Jane Smith",
      "race_points": 36,
      "fastest_lap_points": 0,
      "pole_position_points": 0,
      "round_points": 18,
      "total_points": 18,
      "total_positions_gained": -2
    }
  ]
}
```

#### With Divisions
**File**: `app/Application/Competition/Services/RoundApplicationService.php:760`

```json
{
  "standings": [
    {
      "division_id": 1,
      "division_name": "Pro",
      "results": [
        {
          "position": 1,
          "driver_id": 42,
          "driver_name": "John Doe",
          "race_points": 50,
          "fastest_lap_points": 1,
          "pole_position_points": 1,
          "round_points": 25,
          "total_points": 27,
          "total_positions_gained": 5
        }
      ]
    },
    {
      "division_id": 2,
      "division_name": "Am",
      "results": [
        {
          "position": 1,
          "driver_id": 50,
          "driver_name": "Bob Wilson",
          "race_points": 43,
          "fastest_lap_points": 1,
          "pole_position_points": 0,
          "round_points": 25,
          "total_points": 26,
          "total_positions_gained": 3
        }
      ]
    }
  ]
}
```

## Response Format

### Success Response (200 OK)

```json
{
  "message": "Round marked as completed",
  "data": {
    "id": 5,
    "season_id": 3,
    "round_number": 2,
    "name": "Spa Weekend",
    "status": "completed",
    "round_results": { /* JSON as above */ },
    "qualifying_results": [ /* Cross-division qualifying */ ],
    "race_time_results": [ /* Cross-division race times */ ],
    "fastest_lap_results": [ /* Cross-division fastest laps */ ],
    "created_at": "2025-11-01 10:00:00",
    "updated_at": "2025-12-01 12:00:00"
  },
  "status": 200
}
```

## Related Files

### Application Layer
- **Service**: `app/Application/Competition/Services/RoundApplicationService.php`
  - Method: `completeRound()` (line 317)
  - Method: `calculateRoundResults()` (line 534)
  - Method: `calculateRoundResultsWithoutDivisions()` (line 567)
  - Method: `calculateRoundResultsWithDivisions()` (line 719)
  - Method: `applyFastestLapBonus()` (line 781)
  - Method: `applyPolePositionBonus()` (line 864)
  - Method: `applyRoundPoints()` (line 937)
  - Method: `tallyRaceLevelBonuses()` (line 971)
  - Method: `calculateCrossDivisionResults()` (line 1022)

### Domain Layer
- **Entity**: `app/Domain/Competition/Entities/Round.php`
  - Method: `complete()` (line 336)
  - Method: `setRoundResults()` (line 576)
  - Method: `setCrossDivisionResults()` (line 596)

### Controller
- **Controller**: `app/Http/Controllers/User/RoundController.php`
  - Method: `complete()` (line 93)

## Next Steps

After round completion:
1. Round results stored in JSON field
2. User can view round standings
3. Season standings calculated on-demand → see [Season Standings](./04_season_standings.md)
