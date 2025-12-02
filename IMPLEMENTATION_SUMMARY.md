# Cross-Division Results Per-Driver Implementation Summary

## Overview
Modified the round completion logic to ensure that cross-division results (`qualifying_results`, `race_time_results`, `fastest_lap_results`) contain **only one entry per driver** - their best performance across all races in the round.

## Problem Statement
Previously, the `fastest_lap_results` field would contain multiple entries per driver (one for each race where they had a fastest lap). This was inconsistent with how `race_time_results` worked (which already tracked best time per driver) and with the intended design where each driver should appear only once with their best performance.

## Changes Made

### Backend Changes

**File**: `/var/www/app/Application/Competition/Services/RoundApplicationService.php`

**Method**: `calculateCrossDivisionResults()` (lines 1147-1263)

#### Key Modifications:

1. **Changed data structure tracking**:
   - **Before**: Arrays that accumulated all results (`$qualifyingResults[]`, `$fastestLapResults[]`)
   - **After**: Associative arrays tracking best result per driver (`$qualifyingByDriver[$driverId]`, `$fastestLapByDriver[$driverId]`)

2. **Qualifying Results** (lines 1162-1181):
   ```php
   // Now tracks best qualifying time per driver from qualifiers
   $qualifyingByDriver = [];

   if ($race->isQualifier()) {
       $driverId = $result->driverId();

       // Keep only the best (fastest) qualifying time per driver
       if (
           !isset($qualifyingByDriver[$driverId]) ||
           $lapTimeMs < $qualifyingByDriver[$driverId]['time_ms']
       ) {
           $qualifyingByDriver[$driverId] = [
               'race_result_id' => $resultId,
               'time_ms' => $lapTimeMs,
           ];
       }
   }
   ```

3. **Race Time Results** (lines 1183-1204):
   - Already worked correctly (tracking best race time per driver)
   - No changes needed

4. **Fastest Lap Results** (lines 1206-1225):
   ```php
   // Now tracks best fastest lap per driver from non-qualifiers
   $fastestLapByDriver = [];

   if (!$race->isQualifier()) {
       $driverId = $result->driverId();

       // Keep only the best (fastest) lap per driver
       if (
           !isset($fastestLapByDriver[$driverId]) ||
           $lapTimeMs < $fastestLapByDriver[$driverId]['time_ms']
       ) {
           $fastestLapByDriver[$driverId] = [
               'race_result_id' => $resultId,
               'time_ms' => $lapTimeMs,
           ];
       }
   }
   ```

5. **Array conversion and sorting** (lines 1228-1256):
   ```php
   // Convert qualifying by driver to array and sort by time (fastest first)
   $qualifyingResults = array_values($qualifyingByDriver);
   usort($qualifyingResults, fn($a, $b) => $a['time_ms'] <=> $b['time_ms']);

   // Convert fastest lap by driver to array and sort by time (fastest first)
   $fastestLapResults = array_values($fastestLapByDriver);
   usort($fastestLapResults, fn($a, $b) => $a['time_ms'] <=> $b['time_ms']);
   ```

### Frontend Changes
**No frontend changes required** - The frontend (`RoundsPanel.vue`) simply calls `roundStore.completeRound(round.id)` which triggers the backend API. The backend now correctly calculates and stores the cross-division results.

## Data Structure Impact

### Before Change
```json
{
  "fastest_lap_results": [
    {"position": 1, "race_result_id": 101, "time_ms": 85000},
    {"position": 2, "race_result_id": 102, "time_ms": 85100},
    {"position": 3, "race_result_id": 103, "time_ms": 85200},  // Driver 1 (race 1)
    {"position": 4, "race_result_id": 104, "time_ms": 85300}   // Driver 1 (race 2) - DUPLICATE
  ]
}
```

### After Change
```json
{
  "fastest_lap_results": [
    {"position": 1, "race_result_id": 101, "time_ms": 85000},
    {"position": 2, "race_result_id": 102, "time_ms": 85100},
    {"position": 3, "race_result_id": 103, "time_ms": 85200}  // Driver 1's best time only
  ]
}
```

## Consistency Achieved

All three cross-division result fields now work consistently:

| Field | Logic |
|-------|-------|
| `qualifying_results` | Best qualifying lap time per driver (from qualifiers only) |
| `race_time_results` | Best race time per driver (from races only, excluding DNFs) |
| `fastest_lap_results` | Best fastest lap time per driver (from races only) |

## Testing

### Tests Run
1. ✅ `RoundPointsCalculationTest` - 11 tests passed
2. ✅ `SeasonStandingsTest` - 4 tests passed
3. ✅ `RoundControllerTest` - 18 tests passed
4. ✅ `RaceResultControllerTest` - 11 tests passed

**Total**: 44 tests, 94 assertions - all passing

### Code Quality
- ✅ PHPStan Level 8: No errors
- ⚠️ PHP_CodeSniffer: 5 pre-existing line length warnings (not related to changes)

## Business Logic

### When a Round is Completed:
1. All races in the round are automatically completed
2. Race points are calculated for each race
3. Round standings are calculated by aggregating race points
4. Cross-division results are calculated with **one entry per driver**:
   - **Qualifying**: Fastest qualifying lap across all qualifying sessions
   - **Race Time**: Fastest race time across all races (best overall race performance)
   - **Fastest Lap**: Fastest single lap across all races

### Race Filtering:
- **Qualifiers** (`is_qualifier = true`): Contribute to `qualifying_results`
- **Races** (`is_qualifier = false`): Contribute to `race_time_results` and `fastest_lap_results`
- **DNF drivers**: Excluded from `race_time_results` but included in `fastest_lap_results` (if they have a valid lap time)

## Impact Assessment

### Database
- No schema changes required
- Existing JSON fields in `rounds` table are used
- Data structure within JSON fields is now consistent

### API
- No breaking changes
- Same API endpoints used
- Response format improved (fewer duplicate entries)

### Performance
- **Improved**: Less data stored (one entry per driver instead of multiple)
- **Improved**: Faster queries when reading cross-division results
- **Same**: Calculation complexity remains O(n) where n = total race results

## Documentation Updated
- Implementation follows patterns documented in:
  - `/var/www/docs/AppDashboard/ResultsCreation/03_round_completion.md`
  - `/var/www/docs/AppDashboard/ResultsCreation/06_data_structures.md`

## Deployment Notes
- **Safe to deploy**: Changes are backward compatible
- **Data migration**: Not required (existing completed rounds retain their structure; new completions use new logic)
- **Testing**: Recommended to test round completion in staging before production deployment

## Files Modified
1. `/var/www/app/Application/Competition/Services/RoundApplicationService.php`
   - Modified `calculateCrossDivisionResults()` method
   - Lines changed: 1147-1263

## Verification Steps
1. Complete a round with multiple races
2. Check that each driver appears only once in:
   - `rounds.qualifying_results`
   - `rounds.race_time_results`
   - `rounds.fastest_lap_results`
3. Verify that the `race_result_id` points to the race result with the best time
4. Confirm that `position` fields are correctly numbered 1, 2, 3, etc.
