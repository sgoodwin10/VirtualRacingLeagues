# Season Standings: Tied Positions Fix

## Issue

When multiple drivers or teams have the same points in season standings, they were not sharing the same position. Instead, positions were assigned sequentially (1, 2, 3, 4, 5...) even when drivers had identical scores.

**Expected behavior (Standard Competition Ranking):**
- If multiple competitors have the same points, they share the same position
- The next position after a tie skips positions equal to the number of tied competitors
- Example: If drivers 2 and 3 both have 26 points (tied for 5th), the next driver should be 7th (skipping 6th)

**Previous behavior:**
- Positions were assigned sequentially: 1, 2, 3, 4, 5...
- Tied competitors got different positions

## Solution

Implemented **standard competition ranking** (also known as "1224" ranking) for all standings calculations:

1. **Driver Standings (without divisions)** - `aggregateStandingsWithoutDivisions()`
2. **Driver Standings (with divisions)** - `aggregateStandingsWithDivisions()`
3. **Team Championship Standings** - `aggregateTeamChampionshipStandings()`

### Algorithm

```php
// Standard competition ranking logic
$position = 1;
$previousScore = null;
$driversAtCurrentPosition = 0;

foreach ($sortedDrivers as $driver) {
    // Determine which score to use for ranking
    $currentScore = $dropRoundEnabled
        ? $driver['drop_total']
        : $driver['total_points'];

    // If score changed from previous driver, update position
    if ($previousScore !== null && $currentScore !== $previousScore) {
        $position += $driversAtCurrentPosition;
        $driversAtCurrentPosition = 0;
    }

    $driver['position'] = $position;
    $previousScore = $currentScore;
    $driversAtCurrentPosition++;
}
```

### Example

**Scenario: 5 drivers with points**
- Driver 1: 28 pts
- Driver 2: 26 pts (tied)
- Driver 3: 26 pts (tied)
- Driver 4: 24 pts
- Driver 5: 23 pts

**Positions assigned:**
- Position 1: Driver 1 (28 pts)
- Position 2: Driver 2 (26 pts) ← tied
- Position 2: Driver 3 (26 pts) ← tied
- Position 4: Driver 4 (24 pts) ← skips position 3
- Position 5: Driver 5 (23 pts)

## Files Modified

### Backend

**`/var/www/app/Application/Competition/Services/SeasonApplicationService.php`**

1. **`aggregateStandingsWithoutDivisions()` (lines 914-955)**
   - Replaced sequential position assignment with standard competition ranking
   - Handles both `total_points` and `drop_total` for ranking

2. **`aggregateStandingsWithDivisions()` (lines 1128-1178)**
   - Implemented same logic within each division
   - Drivers in the same division compete for positions within that division

3. **`aggregateTeamChampionshipStandings()` (lines 1316-1340)**
   - Applied standard competition ranking for team standings
   - Handles both `total_points` and `drop_total` for teams

### Tests

**`/var/www/tests/Feature/Http/Controllers/User/SeasonStandingsTest.php`**

Added three comprehensive test cases:

1. **`test_handles_tied_positions_correctly_without_divisions()`**
   - Tests 5 drivers with 2 tied at position 2
   - Verifies next driver skips to position 4

2. **`test_handles_tied_positions_correctly_with_divisions()`**
   - Tests tied positions within divisions
   - 4 drivers in Division A, 2 tied at position 2

3. **`test_handles_tied_positions_with_drop_rounds()`**
   - Tests tied positions when drop rounds are enabled
   - 3 drivers all tied at position 1 with same `drop_total`

Also fixed existing test:
- **`test_calculates_drop_totals_correctly_without_divisions()`**
  - Updated Driver 2's expected `drop_total` from 16 to 26
  - Correctly reflects that missing rounds count as 0 points (per documentation)

## Test Results

All 9 season standings tests pass:
```
✓ returns empty standings when no completed rounds
✓ returns aggregated standings without divisions
✓ returns aggregated standings with divisions
✓ ignores scheduled rounds without results
✓ calculates drop totals correctly without divisions
✓ calculates drop totals correctly with divisions
✓ handles tied positions correctly without divisions
✓ handles tied positions correctly with divisions
✓ handles tied positions with drop rounds
```

## Code Quality

- ✅ **PSR-12 Compliant**: No code style violations in modified files
- ✅ **PHPStan Level 8**: No new static analysis errors introduced
- ✅ **All Tests Pass**: 9/9 season standings tests passing

## Impact

### Driver Standings (Both With and Without Divisions)
- Drivers with identical points now share the same position
- Positions correctly skip after ties
- Works correctly with drop rounds enabled

### Team Championship Standings
- Teams with identical points now share the same position
- Positions correctly skip after ties
- Works correctly with team drop rounds enabled

### Frontend Display
No frontend changes required. The API already returns the `position` field, which now correctly reflects tied positions using standard competition ranking.

## Notes

- This implementation follows the widely-used "1224" ranking system (also called standard competition ranking)
- The logic correctly handles:
  - Regular points
  - Drop round totals
  - Division-based standings
  - Team championship standings
- Missing rounds are correctly counted as 0 points (per existing documentation)
- Ties are broken by the natural sort order of the data (drivers with same points maintain database order)

## Related Documentation

- See `/var/www/docs/AppDashboard/RaceCalculations/04-standings-calculation.md` for standings calculation overview
- See `/var/www/docs/AppDashboard/RaceCalculations/06-team-championship.md` for team championship details
- See `/var/www/docs/AppDashboard/RaceCalculations/05-drop-rounds-missing-fix.md` for drop rounds logic
