# Qualifying Results Calculation

## Overview

Qualifying results provide cross-division rankings comparing ALL drivers across all qualifying sessions, regardless of division assignment. Results are stored in `rounds.qualifying_results`.

## Database Storage

| Column | Type | Description |
|--------|------|-------------|
| `qualifying_results` | longtext (JSON) | Cross-division qualifying lap rankings |

**Migration**: `/var/www/database/migrations/2025_11_30_015934_add_cross_division_results_to_rounds_table.php`

## Output Structure

```json
[
  {
    "position": 1,
    "race_result_id": 42,
    "time_ms": 102250
  },
  {
    "position": 2,
    "race_result_id": 43,
    "time_ms": 102475
  }
]
```

**Field Descriptions**:
- `position`: Sequential qualifying position (1 = fastest)
- `race_result_id`: Foreign key to `race_results.id`
- `time_ms`: Fastest lap time in milliseconds (e.g., 102250ms = 1:42.250)

## Calculation Process

**Method**: `calculateCrossDivisionResults()` (lines 1876-1992)

### Step 1: Collect Input Data
```php
foreach ($allRaceResults as $item) {
    $race = $item['race'];      // Race entity
    $result = $item['result'];  // RaceResult entity
}
```

### Step 2: Filter Qualifying Sessions Only
```php
if ($race->isQualifier()) {
    // Process qualifying results
}
```

Only races with `is_qualifier = true` contribute.

### Step 3: Extract Fastest Lap Times
```php
$lapTime = $result->fastestLap();  // RaceTime value object
if (!$lapTime->isNull()) {
    $lapTimeMs = $lapTime->toMilliseconds();
    if ($lapTimeMs !== null && $lapTimeMs > 0) {
        $driverId = $result->driverId();

        // Keep only the BEST (fastest) time per driver
        if (!isset($qualifyingByDriver[$driverId])
            || $lapTimeMs < $qualifyingByDriver[$driverId]['time_ms']) {
            $qualifyingByDriver[$driverId] = [
                'race_result_id' => $resultId,
                'time_ms' => $lapTimeMs,
            ];
        }
    }
}
```

**Key Points**:
- Uses `fastest_lap` field from `race_results` (NOT `race_time`)
- If driver has multiple qualifying sessions, only best time counts
- Times converted to milliseconds for accurate comparison

### Step 4: Sort by Time
```php
usort($qualifyingResults, fn($a, $b) => $a['time_ms'] <=> $b['time_ms']);
```

Fastest time = Position 1 (ascending order)

### Step 5: Assign Positions
```php
$position = 1;
foreach ($qualifyingResults as &$qr) {
    $qr['position'] = $position++;
}
```

Each driver gets unique sequential position.

### Step 6: Store in Round
```php
$round->setCrossDivisionResults(
    $qualifyingResults,
    $raceTimeResults,
    $fastestLapResults
);
```

## Pole Position Determination

### Configuration
- `rounds.qualifying_pole`: Integer points for pole bonus
- `rounds.qualifying_pole_top_10`: Restrict bonus to top 10 finishers

### Calculation
**Method**: `applyPolePositionBonus()` (lines 1704-1767)

1. Find fastest qualifying time across ALL qualifiers
2. Identify driver with that time
3. If `qualifying_pole_top_10 = true`, verify driver is in top 10 standings
4. Award `qualifying_pole` points
5. Add to `pole_position_points` in standings

**Note**: Pole bonus is only awarded when `round_points = true`.

## Points for Qualifying

### Mode 1: Race-Level Points (`round_points = false`)
- Qualifying points awarded per qualifying race
- Each qualifier can award points independently
- Configuration: `races.points_system` JSON field
- Points already included in `race_results.race_points`

### Mode 2: Round-Level Points (`round_points = true`)
- Only pole bonus awarded (no per-position points)
- Single bonus for fastest overall qualifying time
- Configuration: `rounds.qualifying_pole`

## Data Source

Uses `race_results.fastest_lap` field (NOT `race_time`):
- For qualifiers, `fastest_lap` represents the qualifying lap time
- Time format: String "hh:mm:ss.ms" converted via RaceTime value object

## Related Value Objects

### RaceTime
**File**: `/var/www/app/Domain/Competition/ValueObjects/RaceTime.php`

```php
public function toMilliseconds(): ?int
public static function fromMilliseconds(int $ms): self
public function isNull(): bool
public function value(): ?string
```

### QualifyingFormat
**File**: `/var/www/app/Domain/Competition/ValueObjects/QualifyingFormat.php`

```php
enum QualifyingFormat: string {
    case STANDARD = 'standard';
    case TIME_TRIAL = 'time_trial';
    case NONE = 'none';
    case PREVIOUS_RACE = 'previous_race';
}
```

## Business Rules

1. **Cross-Division**: Ignores division assignments, compares all drivers globally
2. **Best Time Only**: Each driver's best lap across all qualifying sessions
3. **Qualifier Races Only**: Only `is_qualifier = true` races count
4. **Valid Times Required**: Null or zero times are skipped

## Frontend Override

The frontend can optionally provide pre-calculated qualifying results via `CompleteRoundData`:

```php
final class CompleteRoundData extends Data
{
    public function __construct(
        public readonly ?array $qualifying_results = null,
        // ...
    ) {}
}
```

If provided, these override automatic calculation.

## Key Files

- `/var/www/app/Application/Competition/Services/RoundApplicationService.php`
  - `calculateCrossDivisionResults()` (line 1876)
  - `applyPolePositionBonus()` (line 1704)

- `/var/www/app/Domain/Competition/Entities/Round.php`
  - `setCrossDivisionResults()` (line 621)
  - `qualifyingResults()` getter (line 539)

- `/var/www/app/Domain/Competition/ValueObjects/RaceTime.php`
- `/var/www/app/Domain/Competition/ValueObjects/QualifyingFormat.php`
- `/var/www/app/Application/Competition/DTOs/CompleteRoundData.php`

## Example Query

```sql
SELECT
    r.id as round_id,
    r.round_number,
    JSON_PRETTY(r.qualifying_results) as qualifying_results
FROM rounds r
WHERE r.qualifying_results IS NOT NULL
LIMIT 1;
```

## Summary

Qualifying results calculation:

1. **Filters** only qualifier races
2. **Extracts** fastest lap times per driver
3. **Keeps** only best time if multiple qualifiers
4. **Sorts** by time ascending (fastest first)
5. **Assigns** sequential positions
6. **Stores** in `rounds.qualifying_results` JSON
7. **Used for** pole position bonus determination
