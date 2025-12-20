# Orphaned Results Warning Fix

## Issue
The backend correctly returns `has_orphaned_results: true` for Round 8, but the warning tag was NOT appearing on the qualifier (Race 14) in the UI.

## Root Cause
The backend returns `has_orphaned_results` at the **round level** (in `RoundResultsData`), but the frontend components (`QualifierListItem.vue` and `RaceListItem.vue`) expect it on the **race object** (`race.has_orphaned_results`).

There was no mechanism to:
1. Fetch the round-level orphaned results status from the API
2. Map this to individual race objects

## Solution

### 1. Added `has_orphaned_results` field to types

**File: `/var/www/resources/app/js/types/round.ts`**
- Added optional `has_orphaned_results?: boolean` field to `Round` interface
- Documents that this is only populated for completed rounds when divisions are enabled

**File: `/var/www/resources/app/js/types/roundResult.ts`**
- Added `has_orphaned_results?: boolean` field to `RoundResultsResponse` interface

**File: `/var/www/resources/app/js/types/race.ts`**
- Already had `has_orphaned_results?: boolean` field (no change needed)

### 2. Created `useOrphanedResults` composable

**File: `/var/www/resources/app/js/composables/useOrphanedResults.ts`**

This composable provides:

- **`fetchOrphanedResultsStatus(roundId)`**: Fetches orphaned results status for a single round (with caching)
- **`fetchBatchOrphanedResults(roundIds)`**: Fetches orphaned results status for multiple rounds in parallel
- **`hasOrphanedResults(race)`**: Checks if a race has orphaned results (checks race flag first, then round-level cache)
- **`setOrphanedResultsStatus(roundId, hasOrphaned)`**: Manually set status (useful when known from other API calls)
- **`clearOrphanedResultsCache(roundId?)`**: Clear cache for a specific round or entire cache
- **`useRaceOrphanedResults(race)`**: Get reactive ref for a specific race's orphaned results

**Key features:**
- Caches round-level status to avoid repeated API calls
- Fetches from `/api/rounds/{roundId}/results` endpoint
- Handles API errors gracefully (defaults to false)
- Loading state management

### 3. Integrated into RoundsPanel

**File: `/var/www/resources/app/js/components/round/RoundsPanel.vue`**

**Changes:**
1. Import and initialize the composable
2. **On mount**: Fetch orphaned results for all completed rounds
3. **Helper function `getRaceWithOrphanedFlag(race, round)`**: Enriches race objects with the orphaned results flag
4. **Pass enriched races** to `QualifierListItem` and `RaceListItem` components
5. **Clear cache** when:
   - Round is completed/uncompleted
   - Results are saved

**Data flow:**
```
1. RoundsPanel mounts
2. Fetches all rounds and races
3. Fetches orphaned results status for completed rounds (parallel)
4. Caches round-level status in composable
5. When rendering races:
   - Call getRaceWithOrphanedFlag(race, round)
   - This checks composable cache and adds has_orphaned_results to race
6. Pass enriched race to QualifierListItem/RaceListItem
7. Components display OrphanedResultsWarning based on race.has_orphaned_results
```

### 4. Tests

**File: `/var/www/resources/app/js/composables/__tests__/useOrphanedResults.test.ts`**

Comprehensive test suite covering:
- Fetching and caching orphaned results
- Batch fetching
- Error handling
- Cache management
- Reactive updates

**Existing tests already covered the warning display:**
- `resources/app/js/components/round/__tests__/QualifierListItem.test.ts`
- `resources/app/js/components/round/__tests__/RaceListItem.test.ts`

## How to Test

### Manual Testing

1. **Navigate to a season with divisions enabled**
   - Go to a competition with `race_divisions_enabled: true`
   - Navigate to a season

2. **Check a completed round with orphaned results**
   - Go to Round 8 (or any completed round)
   - Look for Race 14 (the qualifier)
   - **Expected**: Orange warning tag should appear: "⚠ Orphaned Results"

3. **Verify warning appears on completed races with orphaned results**
   - Check all races in the round
   - Only races in completed rounds should show the warning

4. **Verify warning does NOT appear when:**
   - Round is not completed
   - Round is completed but has no orphaned results
   - Season doesn't have divisions enabled

5. **Test dynamic updates:**
   - Complete a round → warning should appear (if orphaned results exist)
   - Uncomplete a round → warning should disappear
   - Edit race results → warning should update

### Backend Verification

Check that the API returns the correct data:

```bash
# Get round results for Round 8
curl -X GET http://app.virtualracingleagues.localhost/api/rounds/8/results \
  -H "Cookie: <your-session-cookie>"
```

Expected response should include:
```json
{
  "data": {
    "has_orphaned_results": true,
    "round": { ... },
    "race_events": [ ... ],
    "divisions": [ ... ]
  }
}
```

### Automated Testing

Run the test suite:

```bash
# Run all app tests
npm run test:app

# Run specific tests
npm run test:app -- useOrphanedResults
npm run test:app -- QualifierListItem
npm run test:app -- RaceListItem
```

All tests should pass.

## Files Changed

### Created
- `/var/www/resources/app/js/composables/useOrphanedResults.ts`
- `/var/www/resources/app/js/composables/__tests__/useOrphanedResults.test.ts`

### Modified
- `/var/www/resources/app/js/types/round.ts` - Added `has_orphaned_results` field
- `/var/www/resources/app/js/types/roundResult.ts` - Added `has_orphaned_results` field to response
- `/var/www/resources/app/js/components/round/RoundsPanel.vue` - Integrated orphaned results checking

### Unchanged (already supported)
- `/var/www/resources/app/js/types/race.ts` - Already had the field
- `/var/www/resources/app/js/components/round/QualifierListItem.vue` - Already displays warning
- `/var/www/resources/app/js/components/round/RaceListItem.vue` - Already displays warning
- `/var/www/resources/app/js/components/round/OrphanedResultsWarning.vue` - Already implemented

## Performance Considerations

1. **Caching**: Round-level status is cached to avoid repeated API calls
2. **Batch fetching**: All completed rounds are fetched in parallel on mount
3. **Lazy loading**: Only fetches for completed rounds (not scheduled ones)
4. **Non-blocking**: Orphaned results fetch is non-blocking (errors don't break the UI)

## Future Enhancements

Potential improvements:
1. Add orphaned results count to the warning (e.g., "⚠ 3 Orphaned Results")
2. Link from warning directly to division assignment UI
3. Add orphaned results summary to round-level results modal
4. Notification when completing a round with orphaned results
