# Race Completion and Point Calculation

This document describes what happens when a race (or qualifier) is marked as completed, including position assignment, point calculation, and bonus point awards.

## Overview

Race completion triggers automatic calculation of:
1. Position assignment based on race times
2. Race points based on position
3. Fastest lap bonus (if configured)
4. Pole position bonus (qualifiers only)
5. Positions gained calculation (if grid source configured)

## Entry Points

### Manual Race Completion
**Rarely used** - Usually races are completed automatically when the round is completed.

- **Route**: `PATCH /api/seasons/{seasonId}/rounds/{roundId}/races/{raceId}/complete`
- **Controller**: `app/Http/Controllers/User/RaceController.php`
- **Triggers**: User explicitly clicks "Complete Race" button

### Automatic (via Round Completion)
**Most common** - When a round is marked complete, all races are automatically completed.

- **Triggered by**: Round completion process
- **File**: `app/Application/Competition/Services/RoundApplicationService.php:336-358`

```php
// Cascade completion to all races
foreach ($races as $race) {
    $race->markAsCompleted();
    $this->raceRepository->save($race);

    if ($raceId !== null && $race->racePoints()) {
        $this->raceApplicationService->calculateRacePoints($raceId);
    }

    // Mark all race results as confirmed
    foreach ($raceResults as $result) {
        $result->updateStatus(RaceResultStatus::CONFIRMED);
    }
}
```

## Prerequisites

Before race completion:
- Race results must exist (`race_results` table)
- Race must have `race_points = true` (if not, point calculation is skipped)

## Process Flow

### Step 1: Mark Race as Completed
**File**: `app/Domain/Competition/Entities/Race.php:794-800`

```php
public function markAsCompleted(): void
{
    if ($this->status !== RaceStatus::COMPLETED) {
        $this->status = RaceStatus::COMPLETED;
        $this->updatedAt = new DateTimeImmutable();
    }
}
```

**Database Update**:
- `races.status` changes from `scheduled` → `completed`
- `races.updated_at` is updated

### Step 2: Update RaceResult Statuses
**File**: `app/Application/Competition/Services/RaceApplicationService.php:441-460`

```php
private function updateRaceResultStatuses(int $raceId, RaceStatus $newRaceStatus): void
{
    $raceResults = $this->raceResultRepository->findByRaceId($raceId);

    $targetStatus = $newRaceStatus === RaceStatus::COMPLETED
        ? RaceResultStatus::CONFIRMED
        : RaceResultStatus::PENDING;

    foreach ($raceResults as $result) {
        if ($result->status() !== $targetStatus) {
            $result->updateStatus($targetStatus);
            $this->raceResultRepository->save($result);
        }
    }

    // Calculate race points when race is marked as completed
    if ($newRaceStatus === RaceStatus::COMPLETED) {
        $this->calculateRacePoints($raceId);
    }
}
```

**Database Updates**:
- All `race_results.status` change from `pending` → `confirmed`

### Step 3: Calculate Race Points
**File**: `app/Application/Competition/Services/RaceApplicationService.php:466-502`

Main entry point that orchestrates the entire point calculation process.

```php
public function calculateRacePoints(int $raceId): void
{
    $race = $this->raceRepository->findById($raceId);

    // Only calculate points if race_points is enabled
    if (!$race->racePoints()) {
        return;
    }

    // Check if divisions are enabled
    $round = $this->roundRepository->findById($race->roundId());
    $season = $this->seasonRepository->findById($round->seasonId());
    $divisionsEnabled = $season->raceDivisionsEnabled();

    $raceResults = $this->raceResultRepository->findByRaceId($raceId);

    if ($divisionsEnabled) {
        // Group results by division
        $resultsByDivision = [];
        foreach ($raceResults as $result) {
            $divisionId = $result->divisionId() ?? 0;
            $resultsByDivision[$divisionId][] = $result;
        }

        // Calculate points for each division independently
        foreach ($resultsByDivision as $divisionResults) {
            $this->calculatePointsForResultSet($race, $divisionResults);
        }
    } else {
        // Calculate points for all results together
        $this->calculatePointsForResultSet($race, $raceResults);
    }
}
```

**Key Decision**: Divisions enabled?
- **Yes**: Each division is treated independently (separate P1, P2, P3 per division)
- **No**: All drivers compete in single standings

## Point Calculation Algorithm

**File**: `app/Application/Competition/Services/RaceApplicationService.php:509-647`

### Step 3a: Fetch Grid Source (for positions_gained)

```php
$gridSource = $race->gridSource();
$gridSourceRaceId = $race->gridSourceRaceId();

$gridSourceResults = [];
if ($gridSource->value !== 'manual' && $gridSourceRaceId !== null) {
    $sourceResults = $this->raceResultRepository->findByRaceId($gridSourceRaceId);
    foreach ($sourceResults as $sourceResult) {
        if ($sourceResult->position() !== null) {
            $gridSourceResults[$sourceResult->driverId()] = $sourceResult->position();
        }
    }
}
```

**Grid Source Types**:
- `manual`: No grid source (positions_gained will be null)
- `qualifying`: Grid based on qualifying results
- `previous_race`: Grid based on previous race finish
- `reverse_grid`: Reverse of qualifying/previous race

### Step 3b: Categorize Drivers

```php
$finishers = [];
$dnfDrivers = [];
$dnsDrivers = [];

foreach ($results as $result) {
    if ($result->dnf()) {
        $dnfDrivers[] = $result;
    } elseif ($result->raceTime()->isNull()) {
        // DNS = no race_time AND not DNF
        $dnsDrivers[] = $result;
    } else {
        $finishers[] = $result;
    }
}
```

**Categories**:
1. **Finishers**: `dnf = false` AND `race_time` is set
2. **DNF**: `dnf = true`
3. **DNS**: `dnf = false` AND `race_time` is null

### Step 3c: Sort Finishers by Race Time

```php
usort($finishers, function ($a, $b) {
    $timeA = $a->raceTime()->toMilliseconds();
    $timeB = $b->raceTime()->toMilliseconds();

    if ($timeA === null && $timeB === null) return 0;
    if ($timeA === null) return 1;  // null times go to the end
    if ($timeB === null) return -1;

    return $timeA <=> $timeB;
});
```

**Result**: Finishers ordered from fastest to slowest

### Step 3d: Assign Positions and Points to Finishers

```php
$position = 1;
foreach ($finishers as $result) {
    $points = $race->pointsSystem()->getPointsForPosition($position);
    $result->update(
        position: $position,
        raceTime: $result->raceTime()->value(),
        raceTimeDifference: $result->raceTimeDifference()->value(),
        fastestLap: $result->fastestLap()->value(),
        penalties: $result->penalties()->value(),
        hasFastestLap: $result->hasFastestLap(),
        hasPole: $result->hasPole(),
        dnf: false,
    );
    $result->setRacePoints($points);
    $position++;
}
```

**Points System**:
- Default: `[25, 18, 15, 12, 10, 8, 6, 4, 2, 1]` (F1 style)
- Configurable per race via `race.points_system`
- P1 gets `points[1]`, P2 gets `points[2]`, etc.
- Positions beyond array length get 0 points

**Database Updates**:
- `race_results.position` set to 1, 2, 3, etc.
- `race_results.race_points` set based on position

### Step 3e: Assign Positions and Points to DNF

```php
foreach ($dnfDrivers as $result) {
    $points = $race->dnfPoints();
    $result->update(
        position: $position,
        // ... other fields preserved
        dnf: true,
    );
    $result->setRacePoints($points);
    $position++;
}
```

**DNF Points**:
- Configurable per race via `race.dnf_points`
- Default: `0`
- DNF drivers are ranked after all finishers
- Multiple DNF drivers get consecutive positions

### Step 3f: Assign Positions and Points to DNS

```php
foreach ($dnsDrivers as $result) {
    $points = $race->dnsPoints();
    $result->update(
        position: $position,
        // ... other fields preserved
        dnf: false,
    );
    $result->setRacePoints($points);
    $position++;
}
```

**DNS Points**:
- Configurable per race via `race.dns_points`
- Default: `0`
- DNS drivers are ranked after DNF drivers

### Step 3g: Assign Fastest Lap Bonus

**File**: `app/Application/Competition/Services/RaceApplicationService.php:613-616`

```php
if ($race->fastestLap() !== null && $race->fastestLap() > 0) {
    $this->assignFastestLapBonus($race, $finishers);
}
```

#### Fastest Lap Bonus Algorithm
**File**: `app/Application/Competition/Services/RaceApplicationService.php:654-702`

```php
private function assignFastestLapBonus(Race $race, array $finishers): void
{
    if (empty($finishers)) return;

    // Filter eligible drivers
    $eligible = $finishers;
    if ($race->fastestLapTop10()) {
        $eligible = array_slice($finishers, 0, 10); // Only top 10
    }

    // Find driver with fastest lap time
    $fastestLapDriver = null;
    $fastestLapTime = null;

    foreach ($eligible as $result) {
        $lapTime = $result->fastestLap()->toMilliseconds();
        if ($lapTime === null) continue;

        if ($fastestLapTime === null || $lapTime < $fastestLapTime) {
            $fastestLapTime = $lapTime;
            $fastestLapDriver = $result;
        }
    }

    // Award bonus points
    if ($fastestLapDriver !== null) {
        $bonusPoints = $race->fastestLap() ?? 0;
        $currentPoints = $fastestLapDriver->racePoints();
        $fastestLapDriver->setRacePoints($currentPoints + $bonusPoints);

        // Update hasFastestLap flag
        $fastestLapDriver->update(
            // ... preserve all other fields
            hasFastestLap: true,
            // ...
        );
    }
}
```

**Rules**:
- Configured via `race.fastest_lap` (bonus points, e.g., 1)
- Configured via `race.fastest_lap_top_10` (boolean, restrict to top 10)
- If top 10 restriction enabled, only positions 1-10 are eligible
- Winner is determined by fastest lap time (milliseconds comparison)
- Bonus points are ADDED to race_points
- `has_fastest_lap` flag is set to true for winner

### Step 3h: Assign Pole Position (Qualifiers Only)

**File**: `app/Application/Competition/Services/RaceApplicationService.php:618-621`

```php
if ($race->isQualifier()) {
    $this->assignPolePosition($race, $finishers);
}
```

#### Pole Position Algorithm
**File**: `app/Application/Competition/Services/RaceApplicationService.php:710-778`

Very similar to fastest lap bonus, but for qualifiers:

```php
private function assignPolePosition(Race $race, array $finishers): void
{
    // Reset hasPole for all finishers (in case of recalculation)
    foreach ($finishers as $result) {
        if ($result->hasPole()) {
            $result->update(/* ... hasPole: false ... */);
        }
    }

    // Filter eligible drivers
    $eligible = $finishers;
    if ($race->qualifyingPoleTop10()) {
        $eligible = array_slice($finishers, 0, 10);
    }

    // Find driver with fastest lap time (pole position)
    $poleDriver = /* ... fastest lap logic ... */;

    // Award pole position bonus
    if ($poleDriver !== null) {
        $bonusPoints = $race->qualifyingPole() ?? 0;
        if ($bonusPoints > 0) {
            $currentPoints = $poleDriver->racePoints();
            $poleDriver->setRacePoints($currentPoints + $bonusPoints);
        }

        $poleDriver->update(/* ... hasPole: true ... */);
    }
}
```

**Rules**:
- Only for qualifiers (`race.is_qualifier = true`)
- Configured via `race.qualifying_pole` (bonus points)
- Configured via `race.qualifying_pole_top_10` (boolean)
- Pole winner = driver with fastest lap time in qualifying
- Bonus points added to race_points
- `has_pole` flag set to true

### Step 3i: Calculate Positions Gained

**File**: `app/Application/Competition/Services/RaceApplicationService.php:623-641`

```php
foreach ($allResults as $result) {
    $positionsGained = null;

    // Only calculate if we have a grid source
    if (!empty($gridSourceResults)) {
        $driverId = $result->driverId();
        $finishPosition = $result->position();
        $startingPosition = $gridSourceResults[$driverId] ?? null;

        if ($startingPosition !== null && $finishPosition !== null) {
            // Formula: positions_gained = starting_position - finish_position
            // Positive = gained positions, Negative = lost positions
            $positionsGained = $startingPosition - $finishPosition;
        }
    }

    $result->setPositionsGained($positionsGained);
}
```

**Formula**: `positions_gained = starting_position - finish_position`

**Examples**:
- Started P5, finished P2: `5 - 2 = +3` (gained 3 positions)
- Started P2, finished P5: `2 - 5 = -3` (lost 3 positions)
- Started P1, finished P1: `1 - 1 = 0` (no change)

**Grid Source**:
- If `race.grid_source = manual` or `race.grid_source_race_id = null`:
  - `positions_gained` remains null
- Otherwise, uses positions from the specified race

### Step 3j: Save All Results

```php
foreach ($allResults as $result) {
    $this->raceResultRepository->save($result);
}
```

**Database Updates**:
- `race_results.position` (assigned)
- `race_results.race_points` (calculated with bonuses)
- `race_results.positions_gained` (calculated or null)
- `race_results.has_fastest_lap` (true for winner, false for others)
- `race_results.has_pole` (true for pole winner in qualifiers)
- `race_results.updated_at` (timestamp)

## Final State After Race Completion

### Race Entity
- `races.status` = `completed`
- `races.updated_at` = current timestamp

### RaceResult Entities

For each finisher:
```
position: 1, 2, 3, ... (based on race_time)
race_time: "1:32:45.678"
race_points: 25 (position points + bonuses)
positions_gained: +3 (if grid source available)
has_fastest_lap: true (for fastest lap winner only)
has_pole: false (regular races don't have pole)
status: "confirmed"
```

For each DNF:
```
position: (after finishers)
race_points: 0 (dnf_points)
status: "confirmed"
```

For each DNS:
```
position: (after DNF)
race_points: 0 (dns_points)
status: "confirmed"
```

## Special Cases

### Qualifiers

For qualifiers:
1. **Position based on fastest lap** (not race time)
2. **Pole position bonus** awarded to P1
3. **Fastest lap bonus** NOT awarded (qualifiers don't have race-level fastest lap)
4. Points typically minimal or zero (qualifiers don't usually award championship points)

### Race Points Disabled

If `race.race_points = false`:
- Point calculation is SKIPPED entirely
- `race_results.race_points` remains 0
- `race_results.position` is NOT assigned
- Race completion just changes status, nothing else

This is useful for:
- Practice sessions
- Fun races that don't count toward championship
- Exhibition events

### Multiple Drivers with Same Time

If multiple drivers have identical race times:
- PHP's `<=>` spaceship operator determines order (stable sort)
- First driver in database order gets better position
- In practice, race times are usually unique to millisecond precision

### Top 10 Restrictions

**Fastest Lap Top 10** (`race.fastest_lap_top_10 = true`):
- Driver must finish in top 10 to be eligible for fastest lap bonus
- Example: Driver finishes P12 with fastest lap → no bonus

**Pole Top 10** (`race.qualifying_pole_top_10 = true`):
- Driver must finish qualifying in top 10 to get pole bonus
- Rarely used (pole usually goes to P1 regardless)

## Error Handling

### No Results Found
If race has no results when completion is triggered:
- Point calculation is skipped gracefully
- No error thrown

### Invalid Grid Source
If `grid_source_race_id` points to non-existent race:
- `positions_gained` will be null for all drivers
- No error thrown

## Related Files

### Application Layer
- **Service**: `app/Application/Competition/Services/RaceApplicationService.php`
  - Method: `calculateRacePoints()` (line 466)
  - Method: `calculatePointsForResultSet()` (line 509)
  - Method: `assignFastestLapBonus()` (line 654)
  - Method: `assignPolePosition()` (line 710)

### Domain Layer
- **Entity**: `app/Domain/Competition/Entities/Race.php`
  - Method: `markAsCompleted()` (line 794)
- **Entity**: `app/Domain/Competition/Entities/RaceResult.php`
  - Method: `setRacePoints()` (line 296)
  - Method: `setPositionsGained()` (line 302)
- **Value Object**: `app/Domain/Competition/ValueObjects/PointsSystem.php`
  - Method: `getPointsForPosition()`
- **Value Object**: `app/Domain/Competition/ValueObjects/RaceTime.php`
  - Method: `toMilliseconds()`

### Infrastructure Layer
- **Repository**: `app/Infrastructure/Persistence/Eloquent/Repositories/RaceResultRepository.php`
- **Model**: `app/Infrastructure/Persistence/Eloquent/Models/Race.php`
- **Model**: `app/Infrastructure/Persistence/Eloquent/Models/RaceResult.php`

## Next Steps

After race completion:
1. Race results have points calculated
2. User can view race results with points
3. User completes round → triggers [Round Completion](./03_round_completion.md)
