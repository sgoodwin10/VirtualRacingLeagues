# Race Time Results Calculation

## Overview

Race time results provide cross-division rankings comparing ALL drivers' race completion times across all races, regardless of division assignment. Results are stored in `rounds.race_time_results`.

## Database Storage

| Column | Type | Description |
|--------|------|-------------|
| `race_time_results` | longtext (JSON) | Cross-division race time rankings |

**Migration**: `/var/www/database/migrations/2025_11_30_015934_add_cross_division_results_to_rounds_table.php`

## Output Structure

```json
[
  {
    "position": 1,
    "race_result_id": 130,
    "time_ms": 5434567
  },
  {
    "position": 2,
    "race_result_id": 131,
    "time_ms": 5445678
  }
]
```

**Field Descriptions**:
- `position`: Overall ranking (1 = fastest time)
- `race_result_id`: Foreign key to `race_results.id`
- `time_ms`: Final race time in milliseconds (includes penalties)

## Database Schema (race_results table)

| Column | Type | Description |
|--------|------|-------------|
| `original_race_time` | varchar(15) | Driver's completion time "hh:mm:ss.ms" |
| `original_race_time_difference` | varchar(15) | Gap to leader "+hh:mm:ss.ms" |
| `final_race_time_difference` | varchar(15) | Gap including penalties |
| `fastest_lap` | varchar(15) | Fastest lap time |
| `penalties` | varchar(15) | Total penalties |
| `dnf` | boolean | Did Not Finish flag |

**Migration History**:
- 2025_10_25_022500: Initial creation
- 2025_12_06_013214: Renamed `race_time` → `original_race_time`
- 2025_12_06_020407: Renamed `race_time_difference` → `original_race_time_difference`
- 2025_12_06_023716: Added `final_race_time_difference`

## Calculation Process

**Method**: `calculateCrossDivisionResults()` (lines 1876-1992)

### Step 1: Filter Non-Qualifier Races
```php
if ($race->isQualifier()) {
    continue;  // Skip qualifiers
}
```

Only actual races (not qualifiers) count for race time results.

### Step 2: Exclude DNF Drivers
```php
if ($result->dnf()) {
    continue;  // Skip DNF
}
```

DNF drivers are excluded from race time rankings (no valid finish time).

### Step 3: Get Final Race Time
```php
$raceTime = $result->finalRaceTime();
if (!$raceTime->isNull()) {
    $raceTimeMs = $raceTime->toMilliseconds();

    if ($raceTimeMs !== null && $raceTimeMs > 0) {
        $driverId = $result->driverId();

        // Keep only the BEST (fastest) time per driver
        if (!isset($raceTimeByDriver[$driverId]) ||
            $raceTimeMs < $raceTimeByDriver[$driverId]['time_ms']) {

            $raceTimeByDriver[$driverId] = [
                'race_result_id' => $result->id(),
                'time_ms' => $raceTimeMs,
            ];
        }
    }
}
```

### Step 4: Sort by Time
```php
usort($raceTimeResults, fn($a, $b) => $a['time_ms'] <=> $b['time_ms']);
```

Fastest time = Position 1 (ascending order)

### Step 5: Assign Positions
```php
$position = 1;
foreach ($raceTimeResults as &$rtr) {
    $rtr['position'] = $position++;
}
```

## Time Calculation

### Final Race Time Formula
```
final_race_time = original_race_time + penalties
```

### RaceResult Entity Methods
**File**: `/var/www/app/Domain/Competition/Entities/RaceResult.php`

```php
public function finalRaceTime(): RaceTime
{
    if ($this->originalRaceTime->isNull()) {
        return $this->originalRaceTime;
    }

    if ($this->penalties->isNull()) {
        return $this->originalRaceTime;
    }

    return $this->originalRaceTime->add($this->penalties);
}
```

### RaceTime Value Object
**File**: `/var/www/app/Domain/Competition/ValueObjects/RaceTime.php`

```php
// Time format: "hh:mm:ss.ms" or "+hh:mm:ss.ms"
public static function fromString(?string $value): self
public function toMilliseconds(): ?int
public static function fromMilliseconds(int $ms): self
public function add(RaceTime $other): self
public function isNull(): bool
```

**Format Validation**:
- Pattern: `/^(\d{1,2}):(\d{2}):(\d{2})\.(\d{1,3})$/`
- Supports leading `+` sign (stripped)
- Milliseconds normalized to 3 digits

## Business Rules

1. **Non-Qualifier Races Only**: `is_qualifier = false`
2. **DNF Excluded**: No valid completion time
3. **Best Time Per Driver**: If multiple races, only fastest counts
4. **Penalties Included**: Uses `finalRaceTime()` not `originalRaceTime()`
5. **Cross-Division**: Ignores division boundaries
6. **Millisecond Precision**: All comparisons use milliseconds

## Lap-Based Time Calculation

**Documentation**: `/var/www/docs/AppDashboard/ResultsCreation/lap-based-time-calculation.md`

When driver finishes laps down:
```
race_time_difference = (fastest_lap_time + 500ms) × number_of_laps
```

**Example**:
- Driver's fastest lap: 1:30.000 (90,000ms)
- Laps down: 2 laps
- Calculation: (90,000 + 500) × 2 = 181,000ms = 3:01.000

## Frontend Composable

**File**: `/var/www/resources/app/js/composables/useRaceTimeCalculation.ts`

```typescript
// Normalize flexible time input
function normalizeTimeInput(value: string): string

// Validate time format
function isValidTimeFormat(value: string): boolean

// Parse time to milliseconds
function parseTimeToMs(value: string): number | null

// Calculate race_time from difference + leader time
function calculateRaceTimeFromDifference(
  leaderTimeMs: number,
  differenceMs: number
): string | null
```

## Key Files

### Backend
- `/var/www/app/Application/Competition/Services/RoundApplicationService.php`
  - `calculateCrossDivisionResults()` (line 1876)

- `/var/www/app/Domain/Competition/Entities/RaceResult.php`
  - `finalRaceTime()` method
  - `originalRaceTime()`, `penalties()` getters

- `/var/www/app/Domain/Competition/ValueObjects/RaceTime.php`
  - Time parsing, conversion, arithmetic

- `/var/www/app/Application/Competition/DTOs/RaceResultData.php`
  - `original_race_time`, `final_race_time`, etc.

### Frontend
- `/var/www/resources/app/js/composables/useRaceTimeCalculation.ts`
- `/var/www/resources/app/js/composables/__tests__/useRaceTimeCalculation.test.ts`
- `/var/www/resources/app/js/components/result/ResultCsvImport.vue`

### Migrations
- `/var/www/database/migrations/2025_10_25_022500_create_race_results_table.php`
- `/var/www/database/migrations/2025_12_06_013214_rename_race_time_to_original_race_time_in_race_results_table.php`
- `/var/www/database/migrations/2025_12_06_020407_rename_race_time_difference_to_original_race_time_difference_in_race_results_table.php`
- `/var/www/database/migrations/2025_12_06_023716_add_final_race_time_difference_to_race_results_table.php`

## Summary

Race time results calculation:

1. **Filters** non-qualifier races only
2. **Excludes** DNF drivers (no finish time)
3. **Calculates** final time (original + penalties)
4. **Keeps** best time per driver (multi-race rounds)
5. **Sorts** by time ascending (fastest first)
6. **Assigns** sequential positions
7. **Stores** in `rounds.race_time_results` JSON
8. **Used for** cross-division leaderboards
