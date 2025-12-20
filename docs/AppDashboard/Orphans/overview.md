# Orphaned Driver Results Feature - Overview

## Executive Summary

This feature addresses a data visibility issue in the App Dashboard where race/qualifying results become "orphaned" when a season has divisions enabled but drivers with results are not assigned to any division.

**The Problem**: When `race_divisions_enabled = true`, results are displayed in per-division tabs. Drivers with `division_id = NULL` have their results filtered out and become invisible to users.

**The Solution**: Detect orphaned results on the backend and display a warning tag next to the "Completed" toggle on race/qualifier list items, with an explanatory alert when clicked.

---

## Feature Scope

### What This Feature Does

1. **Backend**: Detects if any race/qualifier has results for drivers not assigned to a division
2. **Frontend**: Displays a warning tag ("Orphaned Results") when detected
3. **User Education**: Provides tooltip and toast explanations about the issue and how to fix it

### What This Feature Does NOT Do

- Does NOT auto-fix orphaned results
- Does NOT create an "Unassigned" division tab
- Does NOT prevent completing races with orphaned results
- Does NOT modify the results entry/display logic

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERFACE                                  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  RaceListItem.vue / QualifierListItem.vue                           │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │ [View Results] [⚠ Orphaned Results] [Toggle] Completed       │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  │                         ↑                                           │   │
│  │              OrphanedResultsWarning.vue (NEW)                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              ↑                                              │
│                   race.has_orphaned_results                                 │
│                              ↑                                              │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                      API Response
                               │
┌──────────────────────────────┴──────────────────────────────────────────────┐
│                              BACKEND                                        │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  RoundApplicationService::getRoundResults()                         │   │
│  │  ┌───────────────────────────────────────────────────────────────┐  │   │
│  │  │  if (season.race_divisions_enabled) {                         │  │   │
│  │  │    has_orphaned_results = checkForOrphanedResults(roundId);   │  │   │
│  │  │  }                                                            │  │   │
│  │  └───────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              ↑                                              │
│                              │                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  EloquentRaceResultRepository::hasOrphanedResultsForRound()        │   │
│  │  ┌───────────────────────────────────────────────────────────────┐  │   │
│  │  │  SELECT EXISTS(                                               │  │   │
│  │  │    FROM race_results                                          │  │   │
│  │  │    WHERE division_id IS NULL                                  │  │   │
│  │  │      AND race.round_id = :roundId                             │  │   │
│  │  │  )                                                            │  │   │
│  │  └───────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

```
1. User loads Round page
         ↓
2. Frontend calls: GET /api/rounds/{roundId}/results
         ↓
3. Backend: RoundApplicationService::getRoundResults()
   - Checks if season.race_divisions_enabled === true
   - If true, queries for results with division_id = NULL
   - Returns: { ...round_data, has_orphaned_results: true/false }
         ↓
4. Frontend: Stores race data with has_orphaned_results flag
         ↓
5. RaceListItem/QualifierListItem receives race prop
   - Passes race.has_orphaned_results to OrphanedResultsWarning
         ↓
6. OrphanedResultsWarning shows warning tag if:
   - race.status === 'completed'
   - race.has_orphaned_results === true
         ↓
7. User interaction:
   - Hover → Tooltip with brief explanation
   - Click → Toast with detailed explanation and fix suggestion
```

---

## Files Changed Summary

### Backend (6 files)

| File | Change Type | Description |
|------|-------------|-------------|
| `app/Domain/Competition/Repositories/RaceResultRepositoryInterface.php` | Modified | Add `hasOrphanedResultsForRound()` method |
| `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentRaceResultRepository.php` | Modified | Implement orphan detection query |
| `app/Application/Competition/DTOs/RoundResultsData.php` | Modified | Add `has_orphaned_results` field |
| `app/Application/Competition/Services/RoundApplicationService.php` | Modified | Call orphan detection and include in response |
| `tests/Feature/User/OrphanedResultsDetectionTest.php` | New | Feature tests for orphan detection |
| `tests/Unit/Domain/Competition/RaceResultRepositoryTest.php` | Modified | Unit tests for repository method |

### Frontend (7 files)

| File | Change Type | Description |
|------|-------------|-------------|
| `resources/app/js/types/race.ts` | Modified | Add `has_orphaned_results?: boolean` |
| `resources/app/js/components/round/OrphanedResultsWarning.vue` | New | Reusable warning tag component |
| `resources/app/js/components/round/RaceListItem.vue` | Modified | Add warning component |
| `resources/app/js/components/round/QualifierListItem.vue` | Modified | Add warning component |
| `resources/app/js/components/round/__tests__/OrphanedResultsWarning.test.ts` | New | Unit tests for warning component |
| `resources/app/js/components/round/__tests__/RaceListItem.test.ts` | Modified | Add warning-related tests |
| `resources/app/js/components/round/__tests__/QualifierListItem.test.ts` | Modified | Add warning-related tests |

---

## Implementation Order

### Phase 1: Backend (2-3 hours)

1. **Add repository interface method** - Define `hasOrphanedResultsForRound(int $roundId): bool`
2. **Implement repository method** - Eloquent query for orphan detection
3. **Update DTO** - Add `has_orphaned_results` to `RoundResultsData`
4. **Update service** - Call orphan detection in `getRoundResults()`
5. **Write tests** - Unit and feature tests

### Phase 2: Frontend (1-2 hours)

1. **Update type** - Add `has_orphaned_results` to `Race` interface
2. **Create warning component** - `OrphanedResultsWarning.vue`
3. **Update list items** - Add warning to `RaceListItem` and `QualifierListItem`
4. **Write tests** - Unit tests for warning component

### Phase 3: Testing (1 hour)

1. **Manual E2E testing** - Verify warning appears correctly
2. **Edge case testing** - Division changes, result updates, etc.

---

## User Experience

### Visual Design

```
Normal Race Item (no orphans):
┌───────────────────────────────────────────────────────────────────────────┐
│ 🏁 Race 1                                                                 │
│ Feature Race    Grid: Qualifying    30 laps    [View Results] [✓] Complete│
└───────────────────────────────────────────────────────────────────────────┘

Race Item with Orphaned Results:
┌───────────────────────────────────────────────────────────────────────────┐
│ 🏁 Race 1                                                                 │
│ Feature Race    Grid: Qualifying    30 laps                               │
│ [View Results] [⚠ Orphaned Results] [✓] Complete                          │
└───────────────────────────────────────────────────────────────────────────┘
                       ↑
           Yellow warning tag with icon
```

### User Interaction Flow

1. **Warning appears** - Yellow tag next to "Completed" toggle
2. **Hover** - Tooltip: "This race has results for drivers not assigned to any division..."
3. **Click** - Toast notification with full explanation:
   > "This race has results for drivers who are not assigned to any division. These results exist in the database but are not visible in the division tabs. To fix this, assign all drivers to divisions before entering results."
4. **Resolution** - User goes to Season Drivers page and assigns divisions

---

## Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| Divisions disabled | Warning never shows (`has_orphaned_results` always `false`) |
| No results entered | Warning doesn't show (nothing to be orphaned) |
| All drivers assigned | Warning doesn't show (no orphans) |
| Division deleted | Warning appears (deletion cascades to NULL) |
| Driver removed from division | Warning appears if they have results |
| Round completed | Warning area hidden (can't edit completed rounds) |

---

## Database Impact

**No schema changes required.** All necessary columns exist:

- `seasons.race_divisions_enabled` (BOOLEAN)
- `season_drivers.division_id` (NULLABLE FK with ON DELETE SET NULL)
- `race_results.division_id` (NULLABLE FK with ON DELETE SET NULL)

---

## Performance Considerations

- **Query cost**: ~5-10ms (simple indexed query)
- **Caching**: Result cached with `RoundResultsData` (no extra API calls)
- **Frontend impact**: Minimal (single boolean check for conditional render)

---

## Testing Strategy

### Backend Tests

```php
// Feature test: GET /api/rounds/{roundId}/results
test('returns has_orphaned_results true when orphans exist')
test('returns has_orphaned_results false when no orphans')
test('returns has_orphaned_results false when divisions disabled')

// Unit test: Repository
test('hasOrphanedResultsForRound returns true with NULL division_id')
test('hasOrphanedResultsForRound returns false with all divisions set')
```

### Frontend Tests

```typescript
// OrphanedResultsWarning.vue
test('does not render when hasOrphanedResults is false')
test('does not render when isCompleted is false')
test('renders warning tag when both conditions true')
test('shows correct tooltip for race vs qualifying')
test('triggers toast on click')

// RaceListItem.vue
test('shows orphaned results warning when appropriate')
test('does not show warning when no orphans')

// QualifierListItem.vue
test('shows orphaned results warning when appropriate')
test('does not show warning when no orphans')
```

---

## Related Documentation

- **[Backend Plan](./backend-plan.md)** - Detailed backend implementation
- **[Frontend Plan](./frontend-plan.md)** - Detailed frontend implementation

---

## Decisions Confirmed

1. **Placement**: Warning tag between "View Results" button and "Completed" toggle ✅
2. **Interaction**: Tooltip on hover, toast notification on click ✅
3. **Scope**: Warning only (no "Unassigned" division tab) ✅

---

## Approval Checklist

- [x] Overview approach approved
- [x] Backend plan approved
- [x] Frontend plan approved
- [x] Ready to implement

---

*Created: December 2024*
*Author: Claude Code*
