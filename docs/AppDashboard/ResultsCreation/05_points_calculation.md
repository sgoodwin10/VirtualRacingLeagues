# Points Calculation Logic

This document provides a comprehensive reference for all point calculation logic in the Virtual Racing Leagues system, including formulas, decision trees, and examples.

## Table of Contents

1. [Point Calculation Modes](#point-calculation-modes)
2. [Race Point Calculation](#race-point-calculation)
3. [Round Point Calculation](#round-point-calculation)
4. [Season Point Calculation](#season-point-calculation)
5. [Bonus Point Logic](#bonus-point-logic)
6. [Examples](#examples)

## Point Calculation Modes

The system supports two distinct modes, configured via `round.round_points` boolean:

### Mode 1: Race Points Mode (`round.round_points = false`)

**Characteristics:**
- Bonuses awarded at individual race level
- Each race can have a fastest lap winner
- Each qualifier can have a pole position winner
- Bonuses are included in `race_results.race_points`
- Round standings = sum of all `race_points`
- Season standings = sum of round `total_points` (which equals `race_points`)

**Use Case**: Traditional championship where each event awards bonuses independently.

**Example - F1 Weekend**:
- Qualifying: P1 gets +3 pole bonus
- Sprint Race: P1 gets +1 fastest lap bonus
- Feature Race: P1 gets +1 fastest lap bonus

### Mode 2: Round Points Mode (`round.round_points = true`)

**Characteristics:**
- Bonuses awarded at round level (single winner across ALL events)
- Single fastest lap bonus across all races
- Single pole position bonus across all qualifiers
- Bonuses NOT included in `race_results.race_points`
- Round standings calculated by `race_points`, then bonuses added
- Additional points awarded based on standings position (`round_points`)
- Season standings = sum of round `total_points` (which equals `round_points + bonuses`)

**Use Case**: Weekend format where overall performance matters, not individual race results.

**Example - Weekend Championships**:
- Qualifying: Fastest qualifier gets pole bonus
- Race 1 + Race 2: Fastest lap across both races gets bonus
- Final standings: P1 gets 25 round points, P2 gets 18, etc.

## Race Point Calculation

**Triggered**: When race is marked as completed
**File**: `app/Application/Competition/Services/RaceApplicationService.php:466-502`

### Decision Tree

```
Is race_points enabled?
├─ No → SKIP (race_points remains 0)
└─ Yes
   └─ Are divisions enabled?
      ├─ Yes → Group results by division, calculate each division independently
      └─ No → Calculate all results together
```

### Algorithm for Each Result Set

#### Step 1: Categorize Drivers

```
For each result:
├─ dnf = true? → DNF category
├─ dnf = false AND race_time = null? → DNS category
└─ Otherwise → Finisher category
```

#### Step 2: Sort Finishers by Race Time

```
Sort finishers by race_time (milliseconds, ascending)
```

#### Step 3: Assign Positions and Position-Based Points

```
position = 1
For each finisher (in sorted order):
    result.position = position
    result.race_points = pointsSystem.getPointsForPosition(position)
    position++
```

**Points System Default**: `[1 => 25, 2 => 18, 3 => 15, 4 => 12, 5 => 10, 6 => 8, 7 => 6, 8 => 4, 9 => 2, 10 => 1]`

#### Step 4: Assign Positions and DNF Points

```
For each DNF driver:
    result.position = position
    result.race_points = race.dnf_points (default: 0)
    position++
```

#### Step 5: Assign Positions and DNS Points

```
For each DNS driver:
    result.position = position
    result.race_points = race.dns_points (default: 0)
    position++
```

#### Step 6: Award Fastest Lap Bonus (Non-Qualifiers Only)

```
IF race.fastest_lap > 0:
    eligible = finishers
    IF race.fastest_lap_top_10:
        eligible = finishers[0:10]  // Only top 10

    fastestDriver = driver with minimum fastest_lap time in eligible
    IF fastestDriver exists:
        fastestDriver.race_points += race.fastest_lap
        fastestDriver.has_fastest_lap = true
```

#### Step 7: Award Pole Position (Qualifiers Only)

```
IF race.is_qualifier AND race.qualifying_pole > 0:
    eligible = finishers
    IF race.qualifying_pole_top_10:
        eligible = finishers[0:10]

    poleDriver = driver with minimum fastest_lap time in eligible
    IF poleDriver exists:
        poleDriver.race_points += race.qualifying_pole
        poleDriver.has_pole = true
```

#### Step 8: Calculate Positions Gained

```
IF race.grid_source != 'manual' AND race.grid_source_race_id exists:
    gridSourceResults = fetch positions from grid_source_race_id

    For each result:
        startingPosition = gridSourceResults[driver_id]
        finishPosition = result.position
        IF both exist:
            result.positions_gained = startingPosition - finishPosition
```

**Formula**: `positions_gained = starting_position - finish_position`
- Positive = gained positions
- Negative = lost positions
- Zero = no change

## Round Point Calculation

**Triggered**: When round is marked as completed
**File**: `app/Application/Competition/Services/RoundApplicationService.php:534-707`

### Decision Tree (Without Divisions)

```
Fetch all race results for round
└─ For each driver:
   ├─ Is DNF? → SKIP
   ├─ Is DNS (no race_time)? → SKIP
   └─ Otherwise:
      └─ Sum race_points from all races/qualifiers

Sort drivers by total race_points (descending)
└─ Tie-breaker: Best single race result

Assign positions (1, 2, 3, ...)

Is round_points mode enabled?
├─ Yes:
│  ├─ Apply round-level fastest lap bonus (single winner across all races)
│  ├─ Apply round-level pole bonus (single winner across all qualifiers)
│  ├─ Apply round points based on position
│  └─ total_points = round_points + fastest_lap_points + pole_position_points
└─ No:
   ├─ Tally race-level bonuses (already in race_points)
   └─ total_points = race_points
```

### Round-Level Bonus Logic (Round Points Mode Only)

#### Fastest Lap Bonus

```
IF round.fastest_lap > 0:
    // Find fastest lap across ALL races (exclude qualifiers)
    fastestDriver = null
    fastestTime = null

    For each race result where race.is_qualifier = false:
        IF result.fastest_lap < fastestTime:
            fastestTime = result.fastest_lap
            fastestDriver = result.driver_id

    IF fastestDriver exists:
        // Check top 10 restriction based on STANDINGS position
        IF round.fastest_lap_top_10:
            IF fastestDriver.standings_position > 10:
                SKIP  // No bonus awarded

        standings[fastestDriver].fastest_lap_points = round.fastest_lap
```

**Key Point**: Top 10 restriction based on standings position, NOT race finish position.

#### Pole Position Bonus

```
IF round.qualifying_pole > 0:
    // Find fastest qualifying time across ALL qualifiers
    poleDriver = null
    fastestTime = null

    For each race result where race.is_qualifier = true:
        IF result.fastest_lap < fastestTime:
            fastestTime = result.fastest_lap
            poleDriver = result.driver_id

    IF poleDriver exists:
        // Check top 10 restriction based on STANDINGS position
        IF round.qualifying_pole_top_10:
            IF poleDriver.standings_position > 10:
                SKIP

        standings[poleDriver].pole_position_points = round.qualifying_pole
```

#### Round Points

```
IF round.points_system exists:
    For each standing:
        position = standing.position
        IF position exists in points_system:
            standing.round_points = points_system[position]
        ELSE:
            standing.round_points = 0
```

**Example Points System**: `[1 => 25, 2 => 18, 3 => 15, ...]`

### Division-Specific Calculation

When `season.race_divisions_enabled = true`:

```
Group all race results by division_id
For each division:
    Calculate standings independently (using same logic as above)

Result structure:
[
    {division_id: 1, division_name: "Pro", results: [...]},
    {division_id: 2, division_name: "Am", results: [...]}
]
```

**Key Point**: Each division has its own P1, P2, P3, etc. Divisions do NOT compete against each other in standings.

## Season Point Calculation

**Triggered**: On-demand via API request
**File**: `app/Application/Competition/Services/SeasonApplicationService.php:564-676`

### Algorithm (Without Divisions)

```
Fetch all completed rounds for season
For each round:
    For each standing in round.round_results.standings:
        driverTotals[driver_id].total_points += standing.total_points

Sort drivers by total_points (descending)
Assign positions (1, 2, 3, ...)
```

**Key Point**: Season standings use `total_points` from round results, which differs by mode:
- Race points mode: `total_points = race_points`
- Round points mode: `total_points = round_points + bonuses`

### Algorithm (With Divisions)

```
Fetch all completed rounds for season
For each round:
    For each division in round.round_results.standings:
        For each standing in division.results:
            divisionTotals[division_id][driver_id].total_points += standing.total_points

For each division:
    Sort drivers by total_points (descending)
    Assign positions (1, 2, 3, ...)
```

## Bonus Point Logic

### Fastest Lap Bonus

**Awarded at**: Race level (race points mode) OR Round level (round points mode)

**Eligibility Criteria**:
1. Must have a fastest lap time recorded
2. Must not DNF (for race-level awards)
3. If top 10 restriction: Must be in top 10 positions/standings

**Winner Determination**:
- Minimum `fastest_lap` time in milliseconds
- Ties: Both drivers can win (rare with millisecond precision)

**Points Awarded**:
- Configured via `race.fastest_lap` or `round.fastest_lap`
- Typical value: 1 point

**Race-Level Award**:
```php
// File: RaceApplicationService.php:654
$bonusPoints = $race->fastestLap();
$currentPoints = $fastestLapDriver->racePoints();
$fastestLapDriver->setRacePoints($currentPoints + $bonusPoints);
```

**Round-Level Award**:
```php
// File: RoundApplicationService.php:836
$standing['fastest_lap_points'] = $fastestLapPoints;
// total_points = round_points + fastest_lap_points + pole_position_points
```

### Pole Position Bonus

**Awarded at**: Race level (qualifiers in race points mode) OR Round level (round points mode)

**Eligibility Criteria**:
1. Must be a qualifier race
2. Must have a fastest lap time recorded (qualifying lap)
3. If top 10 restriction: Must be in top 10

**Winner Determination**:
- Minimum `fastest_lap` time in qualifying
- Fastest qualifier = pole position

**Points Awarded**:
- Configured via `race.qualifying_pole` or `round.qualifying_pole`
- Typical value: 1-3 points

## Examples

### Example 1: Race Points Mode (Traditional F1 Weekend)

**Configuration**:
- `round.round_points = false`
- `race[0].is_qualifier = true`, `qualifying_pole = 3`
- `race[1].fastest_lap = 1`
- Points: `[25, 18, 15, 12, 10, 8, 6, 4, 2, 1]`

**Results**:

| Driver | Qualifying | Race | Total |
|--------|-----------|------|-------|
| Alice  | P1 (3 pole) | P1 (25 + 1 FL) | 29 |
| Bob    | P2 (0) | P2 (18) | 18 |
| Charlie | P3 (0) | P3 (15) | 15 |

**Calculation**:
- Alice: 3 (pole) + 25 (P1) + 1 (fastest lap) = 29
- Bob: 0 + 18 (P2) = 18
- Charlie: 0 + 15 (P3) = 15

**Round Result**:
```json
{
  "standings": [
    {
      "position": 1,
      "driver_name": "Alice",
      "race_points": 29,
      "fastest_lap_points": 1,
      "pole_position_points": 3,
      "round_points": 0,
      "total_points": 29
    }
  ]
}
```

### Example 2: Round Points Mode (Weekend Championship)

**Configuration**:
- `round.round_points = true`
- `round.fastest_lap = 1`, `round.qualifying_pole = 1`
- `round.points_system = [25, 18, 15, ...]`
- `race[0].is_qualifier = true`, `race[1].race_points = true`, `race[2].race_points = true`

**Race Results**:

| Driver | Qualifying | Race 1 | Race 2 | Sum Race Points |
|--------|-----------|--------|--------|-----------------|
| Alice  | P1 (1:20.5) | P1 (25) | P2 (18) | 43 |
| Bob    | P2 (1:21.0) | P2 (18) | P1 (25) | 43 |
| Charlie | P3 (1:21.5) | P3 (15) | P3 (15) | 30 |

**Tie-breaker**: Alice vs Bob both have 43 race points
- Alice's best: 25
- Bob's best: 25
- Result: Tie persists (stable sort determines final order)

**Round Standings** (before bonuses):
1. Alice (43 race points) or Bob (43 race points) - let's say Alice wins tie-break
2. Bob (43 race points)
3. Charlie (30 race points)

**Bonuses**:
- Fastest lap: Alice had 1:20.1 in Race 1 → 1 point
- Pole: Alice had 1:20.5 in qualifying → 1 point

**Round Points**:
- P1: 25 points
- P2: 18 points
- P3: 15 points

**Final Calculation**:

| Driver | Race Points | FL Bonus | Pole Bonus | Round Points | Total Points |
|--------|-------------|----------|------------|--------------|--------------|
| Alice  | 43 | 1 | 1 | 25 | 27 |
| Bob    | 43 | 0 | 0 | 18 | 18 |
| Charlie | 30 | 0 | 0 | 15 | 15 |

**Round Result**:
```json
{
  "standings": [
    {
      "position": 1,
      "driver_name": "Alice",
      "race_points": 43,
      "fastest_lap_points": 1,
      "pole_position_points": 1,
      "round_points": 25,
      "total_points": 27
    },
    {
      "position": 2,
      "driver_name": "Bob",
      "race_points": 43,
      "fastest_lap_points": 0,
      "pole_position_points": 0,
      "round_points": 18,
      "total_points": 18
    }
  ]
}
```

**Key Observation**: Alice gets more total_points (27) despite having same race_points (43) as Bob, due to bonuses and round points.

### Example 3: Positions Gained

**Grid Source**: Qualifying results

| Driver | Qualifying Position | Race Finish | Positions Gained |
|--------|-------------------|-------------|------------------|
| Alice  | 5 | 2 | +3 |
| Bob    | 2 | 5 | -3 |
| Charlie | 1 | 1 | 0 |

**Calculation**:
- Alice: `5 - 2 = +3` (gained 3 positions)
- Bob: `2 - 5 = -3` (lost 3 positions)
- Charlie: `1 - 1 = 0` (no change)

## Related Files

### Race Points
- `app/Application/Competition/Services/RaceApplicationService.php:466-778`

### Round Points
- `app/Application/Competition/Services/RoundApplicationService.php:534-1007`

### Season Points
- `app/Application/Competition/Services/SeasonApplicationService.php:564-792`

### Value Objects
- `app/Domain/Competition/ValueObjects/PointsSystem.php`
- `app/Domain/Competition/ValueObjects/RaceTime.php`
