# Drop Round Calculation Fix

**Date**: 2025-12-26
**Issue**: Drop round calculation was treating non-participation as 0 points, causing incorrect drop totals

## Problem

The `SeasonApplicationService::getSeasonStandings()` method was incorrectly calculating drop totals for drivers who didn't participate in all rounds.

### Original Behavior

1. Driver participates in 6 out of 7 completed rounds: `[20, 20, 16, 26, 26, 25]`
2. System pads with zeros for non-participation: `[20, 20, 16, 26, 26, 25, 0]`
3. Sorts ascending: `[0, 16, 20, 20, 25, 26, 26]`
4. Drops lowest score (0 instead of 16): `drop_total = 133 - 0 = 133` ❌ INCORRECT

### Expected Behavior

1. Driver participates in 6 out of 7 completed rounds: `[20, 20, 16, 26, 26, 25]`
2. No padding for non-participation
3. Sorts ascending: `[16, 20, 20, 25, 26, 26]`
4. Drops lowest actual score (16): `drop_total = 133 - 16 = 117` ✅ CORRECT

## Root Cause

The code was padding round points with zeros for rounds where drivers didn't participate (lines 880-887 and 1066-1073 in `SeasonApplicationService.php`):

```php
// INCORRECT: Padding with zeros
$participatedRounds = count($roundPoints);
if ($participatedRounds < $totalCompletedRounds) {
    $roundPoints = array_merge(
        $roundPoints,
        array_fill(0, $totalCompletedRounds - $participatedRounds, 0)
    );
}
```

This treated non-participation as "scoring 0 points", which meant:
- Drivers who didn't participate in some rounds would have their zeros dropped first
- This defeated the purpose of drop rounds (removing worst actual performances)

## Solution

### Fix 1: Remove Zero Padding

Only consider rounds the driver/team actually participated in:

```php
// CORRECT: Only drop from rounds actually participated in
$roundPoints = array_map(fn ($round) => $round['points'], $driverRoundData[$driverId]);
$participatedRounds = count($roundPoints);

// Sort points ascending to identify lowest scores
sort($roundPoints, SORT_NUMERIC);
```

### Fix 2: Prevent Dropping All Rounds

Ensure drivers/teams always have at least one round counting toward their total:

```php
// Can only drop if driver has more rounds than drop rounds configured
// This ensures at least one round always counts
$roundsToDrop = $participatedRounds > $totalDropRounds
    ? min($totalDropRounds, $participatedRounds)
    : 0;
```

## Files Modified

1. **`/var/www/app/Application/Competition/Services/SeasonApplicationService.php`**
   - `aggregateStandingsWithoutDivisions()` method (lines 876-892)
   - `aggregateStandingsWithDivisions()` method (lines 1059-1077)
   - `aggregateTeamChampionshipStandings()` method (lines 1201-1223)

## Tests Added

Added two comprehensive tests in `/var/www/tests/Feature/Http/Controllers/User/SeasonStandingsTest.php`:

1. **`test_calculates_drop_totals_correctly_without_divisions()`**
   - Tests driver with 6 rounds (drops lowest: 16)
   - Tests driver with 2 rounds (drops lowest: 10)
   - Verifies non-participation doesn't count as 0

2. **`test_calculates_drop_totals_correctly_with_divisions()`**
   - Tests driver with 3 rounds in division (drops lowest: 15)
   - Tests driver with 1 round in division (cannot drop, total = drop_total)

## Verification

Tested with Season ID 4:

- **Driver 54 (Rangeraus)**: 6 rounds `[20, 20, 16, 26, 26, 25]`
  - Total: 133
  - Drop Total: **117** (133 - 16) ✅

- **Driver 16 (CaptainRisky21)**: 2 rounds `[10, 16]`
  - Total: 26
  - Drop Total: **16** (26 - 10) ✅

## Impact

This fix affects:
- Driver standings when drop rounds are enabled
- Team championship standings when team drop rounds are enabled
- Both division and non-division seasons

The fix ensures that:
1. Only actual round performances are considered for dropping
2. Non-participation is not treated as a 0-point performance
3. Drivers/teams with limited participation don't end up with 0 or negative points
4. At least one round always counts toward the total

## Testing

All tests pass:
- `SeasonStandingsTest`: 6 passed (56 assertions)
- Code style: PSR-12 compliant
- No PHPStan errors introduced
