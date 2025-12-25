# Bug Report: DNF Drivers Incorrectly Receiving Round Points

## Issue Summary
Drivers who DNF (Did Not Finish) in the only race of a round are incorrectly receiving round_points based on their finishing position, even though they didn't complete the race.

## Affected Data
**Round:** Round 7 (Season 4, Division 4)
**Drivers:**
- Luppo (season_driver_id 45): Position 12, DNF → Incorrectly receiving 4 round_points
- ITZ_JZH17 (season_driver_id 33): Position 13, DNF → Incorrectly receiving 3 round_points

## Expected Behavior
Drivers who DNF in a race should:
1. Receive 0 race_points (✓ Working correctly)
2. NOT receive round_points if they DNF'd in the only race of the round (✗ BUG)
3. Still appear in standings but with 0 total points

## Actual Behavior
Drivers who DNF are being awarded round_points based on their finishing position in the race, resulting in:
- Luppo: 4 points (position 12)
- ITZ_JZH17: 3 points (position 13)

## Root Cause

**File:** `/var/www/app/Application/Competition/Services/RoundApplicationService.php`

**Method:** `buildStandingsFromRacePositions()` (lines 1295-1367)

**Issue:** When `round_points` is enabled and all `race_points` are 0, the system uses race finishing positions to determine round standings. The method includes ALL drivers from the race results, including DNF drivers, and assigns them sequential positions. Then `applyRoundPoints()` awards points to everyone based on their position without checking DNF status.

**Problematic Code Flow:**

1. **Line 769-770:** Detects `$useRacePositions = true` (all race_points are 0)
2. **Line 772:** Calls `buildStandingsFromRacePositions()`
3. **Lines 1323-1330:** Collects race results including DNF drivers
   ```php
   if ($raceNumber === $mainRaceNumber) {
       $mainRaceResults[] = [
           'driver_id' => $result->driverId(),
           'position' => $result->position(),
           'dnf' => $result->dnf(), // Flag captured but not used!
       ];
   }
   ```
4. **Lines 1345-1365:** Builds standings for ALL drivers (including DNF)
   ```php
   foreach ($mainRaceResults as $result) { // No DNF check!
       $standings[] = [
           'position' => $position++,
           'driver_id' => $driverId,
           // ...
       ];
   }
   ```
5. **Lines 1649-1656:** Awards round_points to everyone
   ```php
   foreach ($standings as &$standing) {
       $position = $standing['position'];
       if (isset($pointsArray[$position])) {
           $standing['round_points'] = $pointsArray[$position]; // No DNF check!
       }
   }
   ```

## Business Logic Context

The code comment at lines 1631-1634 states:
> "Drivers with DNF in one or more races still receive round_points based on their final position."

This makes sense for **multi-race rounds** (e.g., Sprint + Feature). A driver who DNFs in one race but finishes another should still get points.

However, when there is **only ONE race** and a driver DNFs in that race, they should NOT receive round_points because they didn't complete the only race in the round.

## Recommended Fix

### Option 1: Exclude DNF drivers when only one race exists (Recommended)

Modify `buildStandingsFromRacePositions()` to check if this is a single-race round, and if so, exclude DNF drivers:

```php
// After line 1343, before building standings:
// Filter out DNF drivers if this is a single-race round
$hasMultipleRaces = count(array_unique(array_column($allRaceResults, 'race'))) > 1;

foreach ($mainRaceResults as $result) {
    // Skip DNF drivers in single-race rounds
    if (!$hasMultipleRaces && $result['dnf']) {
        continue;
    }

    $driverId = $result['driver_id'];
    // ... rest of the code
}

// Add DNF drivers at the bottom with 0 points
if (!$hasMultipleRaces) {
    foreach ($mainRaceResults as $result) {
        if ($result['dnf']) {
            $driverId = $result['driver_id'];
            $standings[] = [
                'position' => $position++,
                'driver_id' => $driverId,
                'driver_name' => $driverData[$driverId]['driver_name'] ?? 'Unknown Driver',
                'race_points' => 0,
                'fastest_lap_points' => 0,
                'pole_position_points' => 0,
                'round_points' => 0, // No points for DNF
                'total_points' => 0,
                'total_positions_gained' => $driverPositionsGained[$driverId] ?? 0,
                'has_any_dnf' => true,
            ];
        }
    }
}
```

### Option 2: Smart completion check

Check if driver has ANY non-DNF finishes across all races in the round:

```php
// Build a map of drivers with at least one valid finish
$driversWithFinish = [];
foreach ($allRaceResults as $item) {
    $result = $item['result'];
    if (!$result->dnf()) {
        $driversWithFinish[$result->driverId()] = true;
    }
}

// In applyRoundPoints, check completion status:
foreach ($standings as &$standing) {
    $driverId = $standing['driver_id'];
    $position = $standing['position'];

    // Only award round points if driver completed at least one race
    if (isset($driversWithFinish[$driverId]) && isset($pointsArray[$position])) {
        $standing['round_points'] = $pointsArray[$position];
    } else {
        $standing['round_points'] = 0;
    }
}
```

### Option 3: Add DNF check in applyRoundPoints

Simplest fix - check `has_any_dnf` in `applyRoundPoints()`:

```php
foreach ($standings as &$standing) {
    $position = $standing['position'];

    // Don't award round points to drivers who only have DNFs
    if ($standing['has_any_dnf'] && $standing['race_points'] === 0) {
        $standing['round_points'] = 0;
        continue;
    }

    if (isset($pointsArray[$position])) {
        $standing['round_points'] = $pointsArray[$position];
    } else {
        $standing['round_points'] = 0;
    }
}
```

## Testing Requirements

1. **Single-race round with DNF:** Driver DNFs in the only race → 0 points ✓
2. **Multi-race round with partial DNF:** Driver DNFs in race 1, finishes race 2 → Gets round_points based on overall position ✓
3. **Multi-race round with all DNF:** Driver DNFs in all races → 0 points ✓
4. **Mixed field:** Some drivers finish, some DNF → Only finishers get round_points ✓

## Impact Assessment

**Severity:** Medium
- Affects competitive integrity (drivers getting points they shouldn't)
- Only affects rounds where `round_points` is enabled and all `race_points` are 0
- Currently affects at least Round 7, possibly other rounds

**Affected Rounds:** Any round with:
- `round_points` enabled (round_points = 1)
- All races have `race_points` disabled (race_points = 0)
- One or more drivers DNF

## Related Files
- `/var/www/app/Application/Competition/Services/RoundApplicationService.php`
  - Method: `buildStandingsFromRacePositions()` (lines 1295-1367)
  - Method: `applyRoundPoints()` (lines 1640-1660)
  - Method: `calculateRoundResultsWithoutDivisions()` (lines 757-819)
