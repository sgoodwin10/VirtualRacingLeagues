# Track Search Display Bug Fix

## Problem Description

When users searched for a track in the Round or Race form drawer, all track names displayed in the RoundsPanel component would incorrectly change to show "Track #44" format instead of displaying the actual track names.

## Root Cause

The bug was located in the `trackStore.ts` file. The `searchTracks()` method was inadvertently replacing the entire tracks array with search results, causing all non-searched tracks to be removed from the store.

### Code Flow
```
User searches for track in RoundFormDrawer
  ↓
useTrackSearch.search() called
  ↓
trackStore.searchTracks() called
  ↓
OLD: fetchTracks() replaces entire tracks array with search results
  ↓
RoundsPanel.getTrackById() returns null for non-searched tracks
  ↓
Fallback displays "Track #44" instead of track name
```

## Solution

Modified `searchTracks()` to preserve existing tracks while adding search results.

### Before (Buggy Code)
```typescript
async function searchTracks(platformId: number, search: string): Promise<TrackLocationGroup[]> {
  const params: TrackSearchParams = {
    platform_id: platformId,
    search,
    is_active: true,
  };
  return await fetchTracks(params); // ❌ This replaces all tracks!
}
```

### After (Fixed Code)
```typescript
async function searchTracks(platformId: number, search: string): Promise<TrackLocationGroup[]> {
  setLoading(true);
  setError(null);
  try {
    const params: TrackSearchParams = {
      platform_id: platformId,
      search,
      is_active: true,
    };

    // Fetch search results WITHOUT modifying the main tracks array
    const locationGroups = await trackService.getTracks(params);

    // Extract tracks from search results and add any missing tracks to the store
    const searchedTracks = locationGroups.flatMap((group) => group.tracks);
    searchedTracks.forEach((searchedTrack) => {
      const existingIndex = tracks.value.findIndex((t) => t.id === searchedTrack.id);
      if (existingIndex === -1) {
        // Track not in store yet, add it ✅
        tracks.value.push(searchedTrack);
      } else {
        // Track already exists, update it with latest data ✅
        tracks.value[existingIndex] = searchedTrack;
      }
    });

    // Return search results for display in autocomplete
    return locationGroups;
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to search tracks');
    throw err;
  } finally {
    setLoading(false);
  }
}
```

## Files Changed

1. `/var/www/resources/app/js/stores/trackStore.ts` (lines 80-125)
   - Rewrote `searchTracks()` to preserve existing tracks

2. `/var/www/resources/app/js/stores/__tests__/trackStore.test.ts` (lines 122-165)
   - Added test: "should add searched tracks to store without removing existing tracks"
   - Added test: "should update existing tracks when found in search results"

## Testing

All tests pass:
- ✅ 14 trackStore tests passed
- ✅ TypeScript type checking passed
- ✅ ESLint linting passed
- ✅ Prettier formatting passed

## Verification Steps

To verify the fix works:

1. Navigate to a competition with rounds
2. Open RoundsPanel - note the track names are displayed correctly
3. Click "Edit Round" or "Create Round"
4. Search for a different track in the track search field
5. Close the drawer
6. Verify that all track names in RoundsPanel still display correctly (not "Track #44")

## Impact

- **User Impact**: Track names now display consistently throughout the application
- **Developer Impact**: Track store now properly maintains state during search operations
- **Performance Impact**: Minimal - tracks are only added/updated, never unnecessarily removed

## Related Components

- `RoundsPanel.vue` - Displays round information including track names
- `RoundFormDrawer.vue` - Uses track search functionality
- `RaceFormDrawer.vue` - Also uses track search (not affected by this specific bug)
- `useTrackSearch.ts` - Composable for track searching
- `trackStore.ts` - Central track state management

## Lessons Learned

- Store mutations during search operations should be additive, not destructive
- Search results should not replace the main data array in shared stores
- Always preserve existing data when adding search results
- Test store state changes in isolation to catch these issues early
