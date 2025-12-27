# Round Completion Calculations

This document describes what happens when a round is marked as "completed" in the system. This is the most comprehensive calculation, as it cascades to all child races and calculates standings.

## Entry Point

**Route**: `PUT /rounds/{id}/complete`
**Controller**: `RoundController::complete()`
**Service**: `RoundApplicationService::completeRound()`
**File**: `/app/Application/Competition/Services/RoundApplicationService.php`

## Overview

Round completion triggers a cascade of calculations:

```
Round Completion
    ├── 1. Cascade to all races/qualifiers
    │   ├── Mark each as completed
    │   ├── Calculate race points
    │   └── Confirm all results
    │
    ├── 2. Calculate driver standings
    │   ├── Aggregate race points
    │   ├── Apply tiebreaker rules
    │   └── Award round-level bonuses
    │
    ├── 3. Calculate team championship
    │
    ├── 4. Store results in round entity
    │
    └── 5. Invalidate cache
```

## Calculation Flow

### Step 1: Cascade Completion to Races

**Method**: `cascadeRaceCompletion()`
**Lines**: 431-474

Races are processed in order (by `race_number`), with qualifiers first.

For each race:

```php
// Mark as completed
$race->markAsCompleted();
$this->raceRepository->save($race);

// Calculate points (if enabled)
if ($race->racePoints()) {
    $this->raceService->calculateRacePoints($raceId);
}

// Confirm all results
foreach ($raceResults as $result) {
    $result->confirm();
    $this->raceResultRepository->save($result);
}
```

### Step 2: Calculate Round Results

**Method**: `calculateAndStoreRoundResults()`
**Lines**: 484-531

This calculates the overall driver standings for the round.

#### With Divisions
- Results grouped by division
- Standings calculated per division
- Cross-division results also calculated

#### Without Divisions
- Single flat standings list
- All drivers compete together

### Step 3: Calculate Driver Standings

**Method**: `calculateRoundResultsWithoutDivisions()`
**Lines**: 757-821

#### 3.1 Aggregate Driver Points

For each driver, sum up:
- `race_points` from all races
- `positions_gained` from all races
- Penalty totals
- DNF counts

#### 3.2 Sort Drivers

Two sorting modes:

**Tiebreaker DISABLED**:
- Sort by `race_points` descending
- Tied drivers share the same position
- Example: P1, P2, P2, P4 (position 3 skipped)

**Tiebreaker ENABLED**:
- Apply tiebreaker rules to resolve ties
- Positions are always sequential
- Example: P1, P2, P3, P4

#### 3.3 Apply Bonus Points

**Round Points Mode** (`round_points = true`):
- `round_points`: Awarded based on final position
- `fastest_lap_points`: Single bonus for overall fastest lap
- `pole_position_points`: Single bonus for overall pole
- `total_points = round_points + bonuses`

**Non-Round Points Mode** (`round_points = false`):
- `fastest_lap_points`: Tally from individual races
- `pole_position_points`: Tally from individual races
- `total_points = race_points` (bonuses already included)

### Step 4: Calculate Team Championship

**Method**: `calculateTeamChampionshipResults()`
**Lines**: 2019-2157

If `team_championship_enabled = true`:

1. Get final driver standings
2. Group drivers by team
3. Sum points per team (with optional driver limit)
4. Sort teams by total points

See [Team Championship](./06-team-championship.md) for details.

### Step 5: Store Results

Results are stored in the round entity as JSON:

```php
$round->setRoundResults($roundResults);
$round->setCrossDivisionResults($qualifying, $raceTime, $fastestLap);
$round->setTeamChampionshipResults($teamResults);
$round->setTiebreakerInformation($tiebreakerInfo);
```

### Step 6: Mark Round Complete

```php
$round->complete();
$this->roundRepository->save($round);
$this->dispatchEvents($round);
```

### Step 7: Invalidate Cache

```php
$this->roundResultsCache->forget($roundId);
```

## Round Results Data Structure

### Driver Standings (without divisions)

```json
{
  "standings": [
    {
      "position": 1,
      "driver_id": 123,
      "driver_name": "John Doe",
      "race_points": 25,
      "fastest_lap_points": 1,
      "pole_position_points": 1,
      "round_points": 25,
      "total_points": 27,
      "total_positions_gained": 5,
      "has_any_dnf": false,
      "total_penalties": "0.000"
    }
  ]
}
```

### Driver Standings (with divisions)

```json
{
  "standings": [
    {
      "division_id": 1,
      "division_name": "Pro",
      "order": 1,
      "drivers": [
        {
          "position": 1,
          "driver_id": 123,
          "driver_name": "John Doe",
          "race_points": 25,
          "total_points": 27
        }
      ]
    }
  ]
}
```

## Cross-Division Results

Stored for comparison across divisions:

| Field | Description |
|-------|-------------|
| `qualifying_results` | Best qualifying times from each division |
| `race_time_results` | Best race times from each division |
| `fastest_lap_results` | Best fastest laps from each division |

## Database Updates

### `rounds` Table
```sql
UPDATE rounds SET
    status = 'completed',
    round_results = '{"standings": [...]}',
    team_championship_results = '{"standings": [...]}',
    qualifying_results = '{...}',
    race_time_results = '{...}',
    fastest_lap_results = '{...}',
    round_totals_tiebreaker_rules_information = '{...}',
    updated_at = NOW()
WHERE id = ?
```

### `races` Table (all races in round)
```sql
UPDATE races SET
    status = 'completed',
    updated_at = NOW()
WHERE round_id = ?
```

### `race_results` Table (all results)
```sql
UPDATE race_results SET
    status = 'confirmed',
    position = ?,
    race_points = ?,
    has_fastest_lap = ?,
    has_pole = ?,
    positions_gained = ?,
    updated_at = NOW()
WHERE race_id IN (SELECT id FROM races WHERE round_id = ?)
```

## Domain Events

Events dispatched during round completion:

| Event | Trigger |
|-------|---------|
| `RoundStatusChanged` | `$round->complete()` |
| `RoundResultsCalculated` | `setRoundResults()`, `setCrossDivisionResults()`, `setTeamChampionshipResults()` |
| `RoundTiebreakerApplied` | When tiebreaker rules resolve ties |

**Note**: No listeners are currently registered for these events.

## Uncomplete Flow

**Route**: `PUT /rounds/{id}/uncomplete`
**Method**: `uncompleteRound()`

When uncompleting a round:

1. Status changed back to `SCHEDULED`
2. Cache invalidated
3. **Races/results are NOT modified**
4. Stored results remain (but may be stale)

## Edge Cases

### All Zero Points

When `round_points = true` but all `race_points = 0`:
- Standings determined by actual race finishing positions
- Uses main race (highest `race_number`, non-qualifier)
- Method: `buildStandingsFromRacePositions()`

### DNF-Only Drivers

Drivers who only have DNF results:
- Placed at bottom of standings
- Receive 0 points
- Flagged with `should_receive_zero_points: true`

### Multi-Race Rounds

When a round has multiple races:
- Each race calculated individually
- Points summed across races
- Single fastest lap bonus (for round-level)
- Single pole bonus (for round-level)

## Example Scenario

**Round Configuration**:
- 1 Qualifying session
- 2 Races (Sprint + Feature)
- Round points: enabled
- Points system: {1: 25, 2: 18, 3: 15}
- Fastest lap bonus: 1 point (round level)
- Pole bonus: 1 point (round level)

**After Qualifying**:
| Driver | Grid Position |
|--------|---------------|
| A | P1 (Pole) |
| B | P2 |
| C | P3 |

**After Race 1 (Sprint)**:
| Driver | Finish | Points |
|--------|--------|--------|
| B | P1 | 25 |
| A | P2 | 18 |
| C | P3 | 15 |

**After Race 2 (Feature)**:
| Driver | Finish | Points | Fastest Lap |
|--------|--------|--------|-------------|
| A | P1 | 25 | Yes |
| C | P2 | 18 | No |
| B | P3 | 15 | No |

**Round Calculation**:
| Driver | Race Points | Pole | FL | Round Pos | Round Points | Total |
|--------|-------------|------|----|-----------|--------------| ------|
| A | 43 (18+25) | 1 | 1 | P1 | 25 | 27 |
| B | 40 (25+15) | 0 | 0 | P2 | 18 | 18 |
| C | 33 (15+18) | 0 | 0 | P3 | 15 | 15 |

## Code Reference

**Main methods**:
```
/app/Application/Competition/Services/RoundApplicationService.php:377-422 (completeRound)
/app/Application/Competition/Services/RoundApplicationService.php:431-474 (cascadeRaceCompletion)
/app/Application/Competition/Services/RoundApplicationService.php:484-531 (calculateAndStoreRoundResults)
/app/Application/Competition/Services/RoundApplicationService.php:757-821 (calculateRoundResultsWithoutDivisions)
```

**Team championship**:
```
/app/Application/Competition/Services/RoundApplicationService.php:2019-2157 (calculateTeamChampionshipResults)
```

**Uncomplete**:
```
/app/Application/Competition/Services/RoundApplicationService.php:539-562 (uncompleteRound)
```
