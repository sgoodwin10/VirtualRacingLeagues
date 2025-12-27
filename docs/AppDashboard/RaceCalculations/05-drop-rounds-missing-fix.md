# Drop Rounds: Missing Rounds Fix

## Issue

The drop rounds calculation was NOT properly handling missing rounds. According to the documentation in `04-standings-calculation.md`:

> Missing rounds count as 0 points
> May benefit more from drop rounds

However, the code was only considering rounds where drivers actually participated, which meant:
- Drivers who missed rounds did NOT have those rounds count as 0 points
- When dropping rounds, they could NOT drop those 0-point rounds
- This gave an unfair advantage to drivers who participated in more rounds

## Example Problem

**Scenario:** Season with 7 completed rounds, 1 drop round enabled

**Driver 16:**
- Participated in 2 rounds: [10, 16]
- WRONG calculation: Sorted [10, 16], dropped 10, drop_total = 16
- CORRECT calculation: Padded to [10, 16, 0, 0, 0, 0, 0], sorted [0, 0, 0, 0, 0, 10, 16], dropped 0, drop_total = **26**

**Driver 54:**
- Participated in 6 rounds: [20, 20, 16, 26, 26, 25]
- WRONG calculation: Sorted [16, 20, 20, 25, 26, 26], dropped 16, drop_total = 117
- CORRECT calculation: Padded to [20, 20, 16, 26, 26, 25, 0], sorted [0, 16, 20, 20, 25, 26, 26], dropped 0, drop_total = **133**

## Solution

Updated the drop rounds calculation logic in `SeasonApplicationService.php` to:

1. **Count total completed rounds** in the season
2. **Pad each driver's points array** with 0s for any rounds they didn't participate in
3. **Sort and drop** the lowest N rounds (which will be 0s if driver missed rounds)

### Code Changes

Updated three methods in `/var/www/app/Application/Competition/Services/SeasonApplicationService.php`:

1. `aggregateStandingsWithoutDivisions()` (lines 871-912)
2. `aggregateStandingsWithDivisions()` (lines 1053-1108)
3. `aggregateTeamChampionshipStandings()` (lines 1202-1243)

### Key Change Pattern

```php
// OLD CODE (WRONG):
$roundPoints = array_map(fn ($round) => $round['points'], $driverRoundData[$driverId]);
// Only drop from rounds the driver actually participated in
// Don't add zeros for rounds where driver didn't participate
$participatedRounds = count($roundPoints);
sort($roundPoints, SORT_NUMERIC);
$roundsToDrop = $participatedRounds > $totalDropRounds
    ? min($totalDropRounds, $participatedRounds)
    : 0;

// NEW CODE (CORRECT):
$roundPoints = array_map(fn ($round) => $round['points'], $driverRoundData[$driverId]);
// Pad with 0s for missing rounds (per documentation: "Missing rounds count as 0 points")
$participatedRounds = count($roundPoints);
$missingRounds = $totalCompletedRounds - $participatedRounds;
for ($i = 0; $i < $missingRounds; $i++) {
    $roundPoints[] = 0.0;
}
sort($roundPoints, SORT_NUMERIC);
$roundsToDrop = $totalCompletedRounds > $totalDropRounds
    ? min($totalDropRounds, $totalCompletedRounds)
    : 0;
```

## Verification

Tested with season ID 4 (7 completed rounds, 1 drop round):

**Driver 16:**
- Participated: 2 rounds [10, 16]
- Missing: 5 rounds
- Padded array: [10, 16, 0, 0, 0, 0, 0]
- Sorted: [0, 0, 0, 0, 0, 10, 16]
- Dropped: 0
- Drop total: **26** ✅

**Driver 54:**
- Participated: 6 rounds [20, 20, 16, 26, 26, 25]
- Missing: 1 round
- Padded array: [20, 20, 16, 26, 26, 25, 0]
- Sorted: [0, 16, 20, 20, 25, 26, 26]
- Dropped: 0
- Drop total: **133** ✅

## Code Quality

All code quality checks pass:
- ✅ PHPStan Level 8: No errors
- ✅ PHPCS PSR-12: No violations

## Impact

This fix ensures:
1. **Fair competition**: Missing rounds are properly penalized
2. **Correct drop calculations**: Drivers who miss rounds can drop those 0-point rounds
3. **Spec compliance**: Matches documentation in `04-standings-calculation.md`
4. **Consistent behavior**: Same logic applied to driver standings (with/without divisions) and team standings
