# Results Modal v2 - Backend Plan

**Agent:** `dev-be`

---

## Current Implementation Analysis

The backend already implements most of what's needed:

### Already Correct

1. **Delete-and-replace pattern** in `RaceResultApplicationService::saveResults()`:
   ```php
   // Delete existing results
   $this->raceResultRepository->deleteByRaceId($raceId);
   // Create new results
   ```
   This means only drivers in the payload are saved - orphaned results are automatically removed.

2. **Fastest lap calculation** in `calculateFastestLaps()` and `markFastestLapInGroup()`:
   - Groups by division
   - Finds minimum fastest_lap time per group
   - Handles ties (multiple drivers can have FL)
   - Called on save, not relying on frontend value

3. **Position from payload**: Positions are taken directly from `$resultData->position` passed by frontend.

---

## Verification Tasks

### Task 1: Verify Division Handling in Position Logic

**File:** `app/Application/Competition/Services/RaceResultApplicationService.php`

**Verify:** Frontend sends position relative to division (1, 2, 3... per division), backend saves it directly.

```php
$entity = RaceResult::create(
    // ...
    position: $resultData->position,  // Frontend provides division-relative position
    // ...
);
```

**Status:** Works correctly - no changes needed.

---

### Task 2: Verify Fastest Lap Ignores Frontend Value

**File:** `app/Application/Competition/Services/RaceResultApplicationService.php`

**Current code:**
```php
$entity = RaceResult::create(
    // ...
    hasFastestLap: false, // Always false initially - we calculate this
    // ...
);
```

**Status:** Correct - backend ignores `has_fastest_lap` from frontend.

---

### Task 3: Verify DNF Drivers Can Have Fastest Lap

**File:** `app/Application/Competition/Services/RaceResultApplicationService.php`

**Check `markFastestLapInGroup()`:**
```php
foreach ($groupResults as $result) {
    $fastestLap = $result->fastestLap();
    if ($fastestLap->isNull()) {
        continue;
    }
    // No check for DNF - driver can have fastest lap even if DNF
}
```

**Status:** Correct - DNF status doesn't affect fastest lap calculation.

---

### Task 4: Verify Empty Results Handling

**Scenario:** User opens modal, adds no drivers, saves (should not happen with frontend validation, but verify backend)

**File:** `app/Application/Competition/Services/RaceResultApplicationService.php`

**Current:** No explicit check, but will delete existing and save empty array.

**Recommendation:** Add validation in request or service:

```php
// In BulkRaceResultsRequest.php
public function rules(): array
{
    return [
        'results' => ['required', 'array', 'min:1'],
        // ... existing rules
    ];
}
```

**Or keep frontend-only validation** via `canSave` computed property (current approach).

---

## Optional Enhancements

### Enhancement 1: Return Sorted Results from API

When fetching results for editing, return them sorted by position to ensure consistent loading:

**File:** `app/Application/Competition/Services/RaceResultApplicationService.php`

**Current `getResultsForRace()`:**
```php
public function getResultsForRace(int $raceId): array
{
    $results = $this->raceResultRepository->findByRaceId($raceId);
    return array_map(
        fn(RaceResult $result) => RaceResultData::fromEntity($result),
        $results
    );
}
```

**Recommendation:** Sort by position before returning:
```php
public function getResultsForRace(int $raceId): array
{
    $results = $this->raceResultRepository->findByRaceId($raceId);

    // Sort by position for consistent loading order
    usort($results, fn($a, $b) => ($a->position() ?? PHP_INT_MAX) <=> ($b->position() ?? PHP_INT_MAX));

    return array_map(
        fn(RaceResult $result) => RaceResultData::fromEntity($result),
        $results
    );
}
```

**Or handle in repository:**
```php
// EloquentRaceResultRepository.php
public function findByRaceId(int $raceId): array
{
    return RaceResultModel::where('race_id', $raceId)
        ->orderBy('position', 'asc')
        ->get()
        ->map(fn($model) => $this->toDomainEntity($model))
        ->all();
}
```

---

## Files Summary

| File | Change Type |
|------|-------------|
| `RaceResultApplicationService.php` | Verify only (possibly add position sorting) |
| `EloquentRaceResultRepository.php` | Optional: Add `orderBy('position')` |
| `BulkRaceResultsRequest.php` | Optional: Add `min:1` validation |

---

## No Changes Required For

- Controller (`RaceResultController.php`) - thin, delegates to service
- Domain entity (`RaceResult.php`) - no behavior changes
- DTOs - structure unchanged
- Other services

---

## Testing Checklist

1. **Save new results:** Verify all drivers in payload are saved with correct positions
2. **Update results:** Verify old results deleted, new ones created (no orphans)
3. **Division positions:** Verify position 1 in Division A and position 1 in Division B both save correctly
4. **Fastest lap:** Verify backend calculates FL per division, handles ties
5. **Empty fastest_lap:** Verify no error when no fastest_lap times exist
6. **DNF with fastest_lap:** Verify DNF driver can still have fastest lap marked
7. **Load for edit:** Verify results return sorted by position
