# Standings Calculation

This document describes how driver and team standings are calculated at both round-level and season-level.

## Architecture

### Two-Tier System

| Level | When Calculated | Storage |
|-------|-----------------|---------|
| **Round** | On round completion | Stored in `rounds.round_results` (JSON) |
| **Season** | On-demand (API request) | Aggregated from completed rounds |

### Key Insight

- Round standings are **pre-calculated** and stored
- Season standings are **aggregated on-demand** from stored round standings
- This provides fast access while ensuring consistency

## Round-Level Standings

### Calculation Trigger

Round standings are calculated when `completeRound()` is called.

### Process Overview

```
1. Collect all race results for the round
    ↓
2. Aggregate driver points
    - Sum race_points from all races
    - Track positions gained
    - Track penalties, DNFs
    ↓
3. Sort drivers by points
    - Apply tiebreaker if enabled
    ↓
4. Apply bonus points
    - Fastest lap (round level)
    - Pole position (round level)
    - Round points (if enabled)
    ↓
5. Store in round.round_results
```

### Points Aggregation

For each driver in the round:

```php
$driverData = [
    'race_points' => 0,           // Sum of race position points
    'fastest_lap_points' => 0,    // Sum of FL bonuses (race level)
    'pole_position_points' => 0,  // Sum of pole bonuses (race level)
    'total_positions_gained' => 0,
    'total_penalties' => 0,
    'has_any_dnf' => false,
    'race_count' => 0,
];

foreach ($raceResults as $result) {
    $driverData['race_points'] += $result->racePoints();
    $driverData['total_positions_gained'] += $result->positionsGained() ?? 0;
    $driverData['total_penalties'] += $result->penalty() ?? 0;
    if ($result->dnf()) {
        $driverData['has_any_dnf'] = true;
    }
    $driverData['race_count']++;
}
```

### Two Points Modes

#### Mode 1: Round Points DISABLED (`round_points = false`)

```php
$totalPoints = $racePoints; // Already includes race-level bonuses
$fastestLapPoints = $tallyOfRaceLevelFLBonuses;
$polePositionPoints = $tallyOfRaceLevelPoleBonuses;
```

- Race-level bonuses are awarded during individual race completion
- Round standings just aggregate what's already calculated

#### Mode 2: Round Points ENABLED (`round_points = true`)

```php
$roundPoints = $pointsSystem[$finalPosition]; // e.g., P1=25, P2=18
$fastestLapPoints = ($overallFastestLap) ? $flBonus : 0;
$polePositionPoints = ($overallPole) ? $poleBonus : 0;
$totalPoints = $roundPoints + $fastestLapPoints + $polePositionPoints;
```

- Bonuses awarded at round level (single FL bonus, single pole bonus)
- Round points awarded based on final standings position

### Sorting and Position Assignment

**Without Tiebreaker**:
- Sort by `race_points` descending
- Tied drivers share the same position
- Next position skips: 1, 2, 2, 4 (not 1, 2, 2, 3)

**With Tiebreaker**:
- Apply tiebreaker rules to resolve ties
- All positions are sequential: 1, 2, 3, 4

## Season-Level Standings

### Calculation Trigger

Season standings are calculated when `getSeasonStandings()` is called.

**File**: `/app/Application/Competition/Services/SeasonApplicationService.php`

### Process Overview

```
1. Fetch all completed rounds
    ↓
2. Extract round_results from each round
    ↓
3. Aggregate points per driver
    - Sum total_points across rounds
    - Apply drop rounds if enabled
    ↓
4. Sort by final total
    ↓
5. Return aggregated standings
```

### Drop Round Calculation

If `season.drop_round = true`:

```php
// For each driver:
$allRoundPoints = [25, 18, 15, 12, 10, 8]; // Points from each round

// Sort ascending (lowest first)
sort($allRoundPoints); // [8, 10, 12, 15, 18, 25]

// Drop lowest N rounds
$dropped = array_slice($allRoundPoints, 0, $totalDropRounds);
$remaining = array_slice($allRoundPoints, $totalDropRounds);

// Sum remaining
$dropTotal = array_sum($remaining);
```

**Example** (drop 2 rounds):
- All rounds: [25, 18, 15, 12, 10, 8]
- Dropped: [8, 10]
- Remaining: [12, 15, 18, 25]
- Drop total: 70

### Season Standings Data Structure

```json
{
  "standings": [
    {
      "position": 1,
      "driver_id": 123,
      "driver_name": "John Doe",
      "total_points": 150,        // Sum across all rounds
      "drop_total": 130,          // After dropping lowest rounds
      "podiums": 5,               // Count of P1-P3 finishes
      "poles": 3,                 // Count of pole positions
      "rounds_competed": 8
    }
  ],
  "has_divisions": false,
  "drop_round_enabled": true,
  "total_drop_rounds": 2,
  "team_championship_enabled": true,
  "team_championship_results": [...]
}
```

## Division Handling

### With Divisions Enabled

Each division has its own:
- Points system
- Standings
- Tiebreaker rules
- Drop round calculations

**Round structure with divisions**:
```json
{
  "standings": [
    {
      "division_id": 1,
      "division_name": "Pro",
      "order": 1,
      "drivers": [...]
    },
    {
      "division_id": 2,
      "division_name": "Am",
      "order": 2,
      "drivers": [...]
    }
  ]
}
```

### Cross-Division Results

Even with divisions, some results are tracked across all drivers:
- Best qualifying time overall
- Best race time overall
- Fastest lap overall

Stored in:
- `round.qualifying_results`
- `round.race_time_results`
- `round.fastest_lap_results`

## Bonus Points Configuration

### Race Level Bonuses

| Setting | Location | Effect |
|---------|----------|--------|
| `race.fastest_lap` | Race configuration | FL bonus for that specific race |
| `race.qualifying_pole` | Qualifier configuration | Pole bonus for that qualifier |
| `*_top_10` | Race/Qualifier config | Restrict to top 10 finishers |

### Round Level Bonuses

| Setting | Location | Effect |
|---------|----------|--------|
| `round.fastest_lap` | Round configuration | Single FL bonus for overall fastest |
| `round.qualifying_pole` | Round configuration | Single pole bonus for overall pole |
| `round.round_points` | Round configuration | Enable position-based round points |

### When Each Applies

**Race level** (round_points = false):
- Each race awards its own FL bonus
- Each qualifier awards its own pole bonus
- Round standings sum up all bonuses

**Round level** (round_points = true):
- Single FL bonus for whoever had overall fastest lap
- Single pole bonus for whoever had overall pole
- Round points awarded based on final standings position

## Performance Considerations

### Batch Fetching

To avoid N+1 queries, data is fetched in batches:

```php
// Fetch all race results for the round in one query
$allResults = $this->raceResultRepository->findByRoundId($roundId);

// Group by race_id for efficient lookup
$resultsByRace = [];
foreach ($allResults as $result) {
    $resultsByRace[$result->raceId()][] = $result;
}
```

### Caching

Round results are cached in Redis:
- Key: `round_results:{round_id}`
- TTL: 24 hours (invalidated on round update)

```php
// On round completion
$this->roundResultsCache->forget($roundId);

// On results fetch
return $this->roundResultsCache->remember($roundId, function() {
    return $this->calculateRoundResults();
});
```

## Edge Cases

### No Completed Rounds

Season standings return empty array if no rounds are completed.

### Single Race DNF

Driver DNFs in single-race round:
- Receives 0 points (or configured DNF points)
- Still included in standings at bottom
- Counts as a competed round for drop calculation

### Mid-Season Driver

Driver joins mid-season:
- Only appears in rounds they competed in
- Missing rounds count as 0 points
- May benefit more from drop rounds

### Ties After All Rules

If ties remain after all tiebreaker rules:
- Drivers share position
- Flagged as "unresolved tie"
- Admin may need to manually resolve

## Code Reference

**Round standings**:
```
/app/Application/Competition/Services/RoundApplicationService.php:757-821 (calculateRoundResultsWithoutDivisions)
/app/Application/Competition/Services/RoundApplicationService.php:966-1131 (sortDriversWithTieBreaking)
```

**Season standings**:
```
/app/Application/Competition/Services/SeasonApplicationService.php:709+ (getSeasonStandings)
```

**Drop round calculation**:
```
/app/Application/Competition/Services/SeasonApplicationService.php (aggregateStandingsWithoutDivisions)
```
