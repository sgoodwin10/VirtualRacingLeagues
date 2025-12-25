# Bug Fix: Round Standings Calculation with Round Points Enabled

## Problem Summary

When `round_points` was enabled and all drivers had 0 `race_points`, the round standings were incorrectly calculated using the tiebreaker logic, which placed the driver with the best qualifying position first, even if they finished last in the main race.

**Example from Round 7, Division 3:**
- Driver 66 (Steve_73_GOOF) qualified P1 (pole position)
- Driver 66 finished P11 (last place) in the main race
- Driver 66 was incorrectly placed P1 in the round standings
- Expected: Driver 66 should be P11 in the round standings

## Root Cause

The tiebreaker logic (`RoundTiebreakerDomainService`) is designed to resolve ties between a few drivers with the same points, not to order an entire field of drivers who all have 0 points.

When `round_points` is enabled:
1. No race-level points are awarded (all drivers have `race_points = 0`)
2. All drivers are treated as one tied group at 0 points
3. The tiebreaker identifies ONE "winner" from this group (driver with best qualifying position)
4. That winner is placed first in the standings
5. All other drivers are ordered arbitrarily
6. Round points are then awarded based on these incorrect positions

## Solution

When `round_points` is enabled and all `race_points` are 0, the standings are now determined by actual race finishing positions from the main race (non-qualifier), rather than using the tiebreaker logic.

### Implementation

**Modified File:** `app/Application/Competition/Services/RoundApplicationService.php`

1. **Detection Logic** (lines 767-770):
   - Check if `round_points` is enabled AND all `race_points` sum to 0
   - If true, use the new `buildStandingsFromRacePositions` method

2. **New Method** `buildStandingsFromRacePositions` (lines 1276-1367):
   - Finds the main race (non-qualifier with highest race_number)
   - Extracts race finishing positions
   - Sorts drivers by their actual race position
   - Builds standings with sequential positions (1, 2, 3, etc.)
   - Round points are then awarded based on these correct positions

### Business Rules

- Main race is identified as the non-qualifier race with the highest `race_number`
- If multiple non-qualifier races exist, the last one is used
- DNF drivers are placed based on their position in the race results
- All drivers start with `race_points = 0` (filled later by `applyRoundPoints`)
- Qualifying results are still used for pole position bonus points
- Fastest lap results are still used for fastest lap bonus points

## Testing

### New Test Case

Added comprehensive test case: `test_round_points_enabled_with_zero_race_points_uses_actual_race_positions`

**Test Scenario:**
- 3 drivers participate in qualifying and main race
- Driver 1 gets pole position (P1 in qualifying)
- Driver 2 wins the main race (P1) and gets fastest lap
- Driver 3 finishes P2 in the main race
- Driver 1 finishes P3 (last) in the main race despite having pole

**Expected Results:**
- P1: Driver 2 (25 round points + 1 fastest lap = 26 total)
- P2: Driver 3 (20 round points)
- P3: Driver 1 (16 round points + 1 pole = 17 total)

### Test Results

All existing tests pass:
- ✓ 12/12 RoundPointsCalculationTest tests
- ✓ 5/5 TeamChampionshipCalculationTest tests

Verified with actual Round 7 data:
- Driver 66 now correctly placed in P11 (last place)
- Total positions gained: -10 (started P1, finished P11)
- Pole position bonus: 1 point (still awarded)
- Round points: 5 (for P11)

## Code Quality

- ✓ PHPStan: No new errors introduced
- ✓ PHPCS: No new violations
- ✓ All relevant tests passing
- ✓ Backward compatibility maintained (existing logic unchanged for non-zero race points)

## Migration Notes

**No database migration required.** This is purely a calculation logic fix.

**To apply the fix to existing rounds:**
1. Set the round status back to 'scheduled'
2. Re-complete the round using the complete round API endpoint
3. The round standings will be recalculated with the correct logic

**Example for Round 7:**
```sql
UPDATE rounds SET status = 'scheduled', round_results = NULL WHERE id = 7;
```
Then call the complete round API endpoint or use the round completion service.

## Impact

This fix ensures that when `round_points` is enabled:
- Standings are based on actual race performance (race positions)
- Not based on qualifying positions or arbitrary tiebreaker rules
- Drivers are correctly rewarded based on their race finish
- Bonus points (pole, fastest lap) are still correctly awarded

## Files Modified

1. `app/Application/Competition/Services/RoundApplicationService.php`
   - Modified `calculateRoundResultsWithoutDivisions` method
   - Added `buildStandingsFromRacePositions` method

2. `tests/Feature/RoundPointsCalculationTest.php`
   - Added comprehensive test case for the fix

## Verification Commands

```bash
# Run the specific test for this fix
php artisan test --filter=test_round_points_enabled_with_zero_race_points_uses_actual_race_positions

# Run all round points calculation tests
php artisan test tests/Feature/RoundPointsCalculationTest.php

# Run code quality checks
composer phpstan
composer phpcs
```
