# Fastest Lap Results Calculation

## Overview

Fastest lap results provide cross-division rankings comparing ALL drivers' fastest laps across all races, regardless of division assignment. Results are stored in `rounds.fastest_lap_results`.

## Database Storage

### Rounds Table
| Column | Type | Description |
|--------|------|-------------|
| `fastest_lap` | int | Points for fastest lap bonus |
| `fastest_lap_top_10` | boolean | Restrict bonus to top 10 finishers |
| `fastest_lap_results` | longtext (JSON) | Cross-division fastest lap rankings |

### Race Results Table
| Column | Type | Description |
|--------|------|-------------|
| `fastest_lap` | varchar(15) | Fastest lap time "hh:mm:ss.ms" |
| `has_fastest_lap` | boolean | Flag for race-level bonus recipient |

## Output Structure

```json
[
  {
    "position": 1,
    "race_result_id": 456,
    "time_ms": 68500
  },
  {
    "position": 2,
    "race_result_id": 789,
    "time_ms": 69200
  }
]
```

**Field Descriptions**:
- `position`: Rank (1 = fastest lap overall)
- `race_result_id`: Foreign key to `race_results.id`
- `time_ms`: Fastest lap time in milliseconds

## Calculation Process

**Method**: `calculateCrossDivisionResults()` (lines 1876-1992)

### Step 1: Filter Non-Qualifier Races
```php
if ($race->isQualifier()) {
    continue;  // Skip qualifiers
}
```

Only actual races (not qualifiers) count for fastest lap results.

### Step 2: Extract Fastest Lap Times
```php
$lapTime = $result->fastestLap();
if (!$lapTime->isNull()) {
    $lapTimeMs = $lapTime->toMilliseconds();

    if ($lapTimeMs !== null && $lapTimeMs > 0) {
        $driverId = $result->driverId();

        // Keep only the BEST (fastest) lap per driver
        if (!isset($fastestLapByDriver[$driverId]) ||
            $lapTimeMs < $fastestLapByDriver[$driverId]['time_ms']) {

            $fastestLapByDriver[$driverId] = [
                'race_result_id' => $resultId,
                'time_ms' => $lapTimeMs,
            ];
        }
    }
}
```

### Step 3: Sort by Time
```php
usort($fastestLapResults, fn($a, $b) => $a['time_ms'] <=> $b['time_ms']);
```

### Step 4: Assign Positions
```php
$position = 1;
foreach ($fastestLapResults as &$flr) {
    $flr['position'] = $position++;
}
```

## Bonus Points System

There are **TWO different systems** for awarding fastest lap points:

### A) Round-Level Bonus (when `round_points = true`)

**Method**: `applyFastestLapBonus()` (lines 1621-1684)

**Configuration**:
- `rounds.fastest_lap`: Integer points value
- `rounds.fastest_lap_top_10`: Boolean restriction

**Process**:
1. Find fastest lap time across ALL non-qualifier races
2. Identify driver with that time
3. If `fastest_lap_top_10 = true`, verify driver is in top 10 standings
4. Award `fastest_lap` points
5. Add to `fastest_lap_points` in standings
6. Positions do NOT change after bonus

**Example**:
```php
'fastest_lap' => 5,       // 5 bonus points
'fastest_lap_top_10' => true  // Only if in top 10
```

### B) Race-Level Bonus (when `round_points = false`)

**Method**: `tallyRaceLevelBonuses()` (lines 1825-1861)

**Configuration**:
- `races.fastest_lap`: Integer points per race
- `races.fastest_lap_top_10`: Boolean per race

**Process**:
1. Each race awards its own fastest lap bonus independently
2. Bonus added to `race_points` in race completion
3. `has_fastest_lap = true` set on race result
4. Round completion tallies all bonuses for display

## Top 10 Restriction Logic

When `fastest_lap_top_10 = true`:
- Bonus only awarded if driver finishes in position 1-10
- Position based on `race_points` standings (not total with bonuses)
- Driver outside top 10 gets NO bonus even with fastest lap
- Constant: `TOP_POSITIONS_LIMIT = 10` (line 55)

## Business Rules

1. **Non-Qualifier Races Only**: Qualifying sessions excluded
2. **Best Lap Per Driver**: If multiple races, only fastest lap counts
3. **DNF May Count**: DNF drivers CAN have fastest lap if valid time recorded
4. **Cross-Division**: Ignores division boundaries
5. **Two Bonus Modes**: Round-level or race-level depending on configuration

## Data Source

Uses `race_results.fastest_lap` field:
- Time format: String "hh:mm:ss.ms"
- Converted via RaceTime value object
- Must be valid (not null, > 0)

## Key Files

- `/var/www/app/Application/Competition/Services/RoundApplicationService.php`
  - `calculateCrossDivisionResults()` (line 1876)
  - `applyFastestLapBonus()` (line 1621)
  - `tallyRaceLevelBonuses()` (line 1825)

- `/var/www/app/Domain/Competition/Entities/RaceResult.php`
  - `fastestLap()` getter

- `/var/www/app/Domain/Competition/ValueObjects/RaceTime.php`
  - Time parsing and conversion

- `/var/www/tests/Feature/RoundPointsCalculationTest.php`
  - `test_fastest_lap_bonus_awards_points_to_fastest_race_lap()` (line 543)

## Example: Round-Level Fastest Lap

```php
// Configuration
$round->fastest_lap = 1;        // 1 bonus point
$round->fastest_lap_top_10 = true;

// Results
Driver A: Race 1 fastest lap 1:30.000, Race 2 fastest lap 1:29.500
Driver B: Race 1 fastest lap 1:29.800, Race 2 fastest lap 1:30.200

// Cross-Division Ranking
1. Driver A (1:29.500) - 89,500ms
2. Driver B (1:29.800) - 89,800ms

// Bonus awarded to Driver A if they're in top 10 standings
```

## Edge Cases

1. **No Valid Fastest Laps**: Empty array returned
2. **All DNF**: If all have fastest laps recorded, they're included
3. **Null Times**: Skipped during processing
4. **Multiple Races**: Only fastest lap across all races counts
5. **Frontend Override**: System accepts pre-calculated results via `CompleteRoundData`

## Summary

Fastest lap results calculation:

1. **Filters** non-qualifier races only
2. **Extracts** fastest lap times per driver
3. **Keeps** only best lap if multiple races
4. **Sorts** by time ascending (fastest first)
5. **Assigns** sequential positions
6. **Stores** in `rounds.fastest_lap_results` JSON
7. **Awards bonus** at round or race level based on configuration
8. **Respects** top 10 restriction when configured
