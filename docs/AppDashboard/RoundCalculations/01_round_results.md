# Round Results Calculation (Driver Championship Standings)

## Overview

The round results calculation creates driver championship standings when a round is completed. It aggregates race points, applies bonuses, handles tie-breaking, and produces final standings.

## Database Storage

| Column | Type | Description |
|--------|------|-------------|
| `round_results` | longtext (JSON) | Driver standings with full points breakdown |

**Migration**: `/var/www/database/migrations/2025_11_29_125418_add_round_results_to_rounds_table.php`

## Output Structure

### Without Divisions
```json
{
  "standings": [
    {
      "position": 1,
      "driver_id": 123,
      "driver_name": "John Doe",
      "race_points": 50,
      "fastest_lap_points": 1,
      "pole_position_points": 1,
      "round_points": 25,
      "total_points": 27,
      "total_positions_gained": 5,
      "has_any_dnf": false,
      "total_penalties": "5.000"
    }
  ]
}
```

### With Divisions
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
          "total_points": 27
        }
      ]
    }
  ]
}
```

## Calculation Process

### Step 1: Aggregate Driver Points
**Method**: `aggregateDriverPoints()` (lines 846-963)

For each driver across all races:
- Sum `race_points` from all races and qualifiers
- Track `positions_gained` totals
- Track best times (qualifying, race, fastest lap)
- Track DNF/DNS status
- Track total penalties

**Output**:
```php
[
    'driverPoints' => [driver_id => total_race_points],
    'driverData' => [driver_id => ['driver_id', 'driver_name']],
    'driverPositionsGained' => [driver_id => total_positions_gained],
    'driverBestTimes' => [driver_id => ['race_time_ms', 'qualifier_time_ms', 'fastest_lap_ms']],
    'driverHasDnfOrDns' => [driver_id => bool],
    'driverTotalPenalties' => [driver_id => total_ms]
]
```

### Step 2: Sort Drivers with Tie-Breaking
**Method**: `sortDriversWithTieBreaking()` (lines 982-1131)

#### Without Tiebreaker
1. Sort by total race points (descending)
2. Drivers with ONLY DNF/DNS go to bottom
3. For ties: Use time-based sorting for stable order
4. Tied drivers **share the same position** (e.g., two at P2, next is P4)

#### With Tiebreaker Enabled
1. Sort by total race points (descending)
2. Apply tiebreaker rules via `RoundTiebreakerDomainService::resolveTies()`
3. Positions are always sequential (no shared positions)

**Time-Based Comparison** (when all points equal 0):
- Priority 1: Best race time (fastest)
- Priority 2: Best qualifier time
- Priority 3: Best fastest lap

### Step 3: Build Standings
**Method**: `buildStandingsFromSortedPoints()` (lines 1221-1299)

Creates standings array with:
- `position`: Ranking position
- `driver_id`, `driver_name`: Driver info
- `race_points`: Sum of all race/qualifier points
- `fastest_lap_points`: 0 (filled later by bonus logic)
- `pole_position_points`: 0 (filled later by bonus logic)
- `round_points`: 0 (filled later if enabled)
- `total_points`: Mode-dependent calculation
- `total_positions_gained`: Sum from all races
- `has_any_dnf`: Boolean flag
- `total_penalties`: String format "SS.mmm"

### Step 4: Apply Bonus Points
**Method**: `applyBonusPoints()` (lines 1520-1544)

#### When `round_points = true` (Round Points Mode)

##### Fastest Lap Bonus
**Method**: `applyFastestLapBonus()` (lines 1621-1684)
- Find fastest lap across ALL non-qualifier races
- Award bonus to single driver
- Top 10 restriction based on standings position
- Positions do NOT change after bonus

##### Pole Position Bonus
**Method**: `applyPolePositionBonus()` (lines 1704-1767)
- Find fastest qualifying time across ALL qualifiers
- Award bonus to single driver
- Top 10 restriction based on standings position
- Positions do NOT change after bonus

##### Round Points Assignment
**Method**: `applyRoundPoints()` (lines 1785-1811)
- Award points based on final standings position
- Uses `round.points_system` (e.g., `{1: 25, 2: 18, 3: 15}`)
- DNF-only drivers receive 0 round_points

**Total Points Formula**:
```
total_points = round_points + fastest_lap_points + pole_position_points
```
Note: `race_points` is NOT included!

#### When `round_points = false` (Race Points Mode)

**Method**: `tallyRaceLevelBonuses()` (lines 1825-1861)
- Tallies race-level bonuses (already in race_points)
- Extracts for display purposes
- `total_points = race_points`

## Points System Value Object

**File**: `/var/www/app/Domain/Competition/ValueObjects/PointsSystem.php`

```php
class PointsSystem {
    private array $positions; // [position => points]

    public static function from(array $positions): self
    public static function fromJson(string $json): self
    public static function f1Standard(): self // [1=>25, 2=>18, 3=>15...]

    public function getPointsForPosition(int $position): int
}
```

Stored in `rounds.points_system` as JSON: `{"1":25,"2":18,"3":15,...}`

## Division Support

When `season.race_divisions_enabled = true`:

**Method**: `calculateRoundResultsWithDivisions()` (lines 1557-1601)

1. Group race results by `division_id`
2. Calculate standings independently for each division
3. Each division has own P1, P2, P3, etc.
4. Divisions do NOT compete against each other

## Edge Cases

### DNF/DNS Handling
- Drivers with only DNF/DNS results go to bottom of standings
- In single-race rounds, DNF-only drivers get 0 round_points
- In multi-race rounds, finishing one race qualifies for round_points

### Zero Points Scenario
When `round_points = true` and all `race_points = 0`:
- Uses actual race finishing positions instead of points
- Method: `buildStandingsFromRacePositions()` (lines 1322-1509)
- Finds main race (non-qualifier with highest race_number)
- Sorts by race positions

## Key Files

- `/var/www/app/Application/Competition/Services/RoundApplicationService.php`
  - `calculateRoundResults()` (line 723)
  - `calculateRoundResultsWithoutDivisions()` (line 757)
  - `calculateRoundResultsWithDivisions()` (line 1557)
  - `aggregateDriverPoints()` (line 846)
  - `sortDriversWithTieBreaking()` (line 982)
  - `buildStandingsFromSortedPoints()` (line 1221)
  - `applyBonusPoints()` (line 1520)

- `/var/www/app/Domain/Competition/Entities/Round.php`
  - `setRoundResults()` (line 598)
  - `roundResults()` getter

- `/var/www/app/Domain/Competition/ValueObjects/PointsSystem.php`

- `/var/www/tests/Feature/RoundPointsCalculationTest.php`

## Summary

The round results calculation:

1. **Aggregates** race points from all races/qualifiers
2. **Sorts** drivers using configurable tie-breaking
3. **Awards bonuses** at race or round level
4. **Assigns round points** based on positions (when enabled)
5. **Supports divisions** with independent standings
6. **Stores results** as JSON in `rounds.round_results`
