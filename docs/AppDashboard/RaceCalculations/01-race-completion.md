# Race Completion Calculations

This document describes what happens when a race is marked as "completed" in the system.

## Entry Point

**Route**: `PUT /races/{id}`
**Controller**: `RaceController::update()`
**Service**: `RaceApplicationService::updateRace()`
**File**: `/app/Application/Competition/Services/RaceApplicationService.php`

## Trigger Condition

When the `status` field changes to `'completed'`:

```php
if ($newStatus === RaceStatus::COMPLETED) {
    $race->markAsCompleted();
}
```

## Calculation Flow

### Step 1: Mark Race as Completed

The race entity's status is updated to `COMPLETED`:

```php
$race->markAsCompleted();
$this->raceRepository->save($race);
```

### Step 2: Update Race Result Statuses

All race results are changed from `PENDING` to `CONFIRMED`:

```php
$this->updateRaceResultStatuses($raceId, $newStatus);
```

This confirms all driver results, preventing further modifications.

### Step 3: Calculate Race Points

If `race.race_points = true`, points are calculated:

```php
$this->calculateRacePoints($raceId);
```

This is the main calculation method that handles:
- Position assignment
- Points calculation
- Bonus point awards

## Points Calculation Algorithm

**Method**: `calculatePointsForResultSet()`
**Lines**: 631-772 in `RaceApplicationService.php`

### 3.1 Division Handling

```php
if ($season->raceDivisionsEnabled()) {
    // Group results by division
    // Calculate points separately for each division
} else {
    // Calculate all results together
}
```

### 3.2 Separate Drivers by Finish Status

Drivers are categorized into three groups:

| Category | Criteria | Point Eligibility |
|----------|----------|-------------------|
| **Finishers** | Have `race_time` | Full points |
| **DNF** | `dnf = true` | DNF points (usually 0) |
| **DNS** | No `race_time`, not DNF | DNS points (usually 0) |

### 3.3 Sort Finishers

Finishers are sorted by `final_race_time` (ascending):

```php
usort($finishers, function($a, $b) {
    return $a->finalRaceTime() <=> $b->finalRaceTime();
});
```

**Note**: `finalRaceTime()` includes any penalties applied.

### 3.4 Assign Positions and Points

```
Position 1: Points from points_system[1] (e.g., 25)
Position 2: Points from points_system[2] (e.g., 18)
Position 3: Points from points_system[3] (e.g., 15)
...
DNF drivers: DNF points (default 0)
DNS drivers: DNS points (default 0)
```

Example points system:
```json
{
  "1": 25,
  "2": 18,
  "3": 15,
  "4": 12,
  "5": 10,
  "6": 8,
  "7": 6,
  "8": 4,
  "9": 2,
  "10": 1
}
```

### 3.5 Fastest Lap Bonus

**Conditions for fastest lap bonus**:
1. `race.fastest_lap` points must be configured (> 0)
2. `race.race_points` must be enabled
3. Driver must have the fastest `fastest_lap` time

**Top 10 restriction** (if `fastest_lap_top_10 = true`):
- Only drivers finishing in positions 1-10 are eligible
- If the fastest lap driver finished outside top 10, no bonus awarded

**Award**:
```php
$result->setHasFastestLap(true);
$result->addBonusPoints($race->fastestLap());
```

### 3.6 Positions Gained Calculation

Uses the **grid source** (previous race/qualifier) to determine starting positions:

```php
$positionsGained = $startingPosition - $finishPosition;
```

| Result | Meaning |
|--------|---------|
| Positive | Driver gained positions |
| Negative | Driver lost positions |
| Zero | Driver finished where they started |

**Grid Source Options**:
- `previous_race` - Use finish position from previous race
- `qualifying` - Use position from qualifying session
- `manual` - No automatic calculation

## Database Updates

### `races` Table
```sql
UPDATE races SET
    status = 'completed',
    updated_at = NOW()
WHERE id = ?
```

### `race_results` Table (for each result)
```sql
UPDATE race_results SET
    status = 'confirmed',
    position = ?,          -- Calculated position
    race_points = ?,       -- Points from position + bonuses
    has_fastest_lap = ?,   -- true/false
    positions_gained = ?,  -- Calculated difference
    updated_at = NOW()
WHERE id = ?
```

## Cache Invalidation

After successful transaction:

```php
$this->raceResultsCache->forget($raceId);
```

## What Does NOT Happen

When an individual race is completed:

- Round standings are NOT recalculated
- Season standings are NOT recalculated
- No background jobs are dispatched
- No event listeners are triggered (events are dispatched but not handled)

**Important**: Round and season standings are only calculated when the **round** is marked as completed.

## Domain Events

The following event is dispatched (but not currently handled):

```php
$race->recordEvent(new RaceUpdated($raceId, $roundId));
```

## Example Scenario

**Race Configuration**:
- Points system: {1: 25, 2: 18, 3: 15, 4: 12, 5: 10}
- Fastest lap bonus: 1 point
- Top 10 restriction: enabled

**Race Results**:
| Driver | Race Time | Fastest Lap | DNF |
|--------|-----------|-------------|-----|
| A | 1:23:45.123 | 1:32.456 | No |
| B | 1:23:48.456 | 1:31.234 | No |
| C | 1:24:01.789 | 1:33.789 | No |
| D | - | - | Yes |

**Calculation**:
1. Sort finishers by time: B (1st), A (2nd), C (3rd)
   - Wait, that's wrong! Let me re-sort by race time...
   - A: 1:23:45.123 (fastest)
   - B: 1:23:48.456
   - C: 1:24:01.789

2. Final positions: A=1st, B=2nd, C=3rd, D=DNF(4th)

3. Points: A=25, B=18, C=15, D=0

4. Fastest lap: B has 1:31.234 (fastest)
   - B is in top 10: eligible
   - B gets +1 bonus point

5. Final points: A=25, B=19, C=15, D=0

## Code Reference

**Main calculation method**:
```
/app/Application/Competition/Services/RaceApplicationService.php:592-624 (calculateRacePoints)
/app/Application/Competition/Services/RaceApplicationService.php:631-772 (calculatePointsForResultSet)
```

**Status update method**:
```
/app/Application/Competition/Services/RaceApplicationService.php:566-585 (updateRaceResultStatuses)
```

**Fastest lap bonus**:
```
/app/Application/Competition/Services/RaceApplicationService.php:779-827 (assignFastestLapBonus)
```
