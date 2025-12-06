# Penalty System - Overview

## Problem Statement

Race penalties are often added after initial race results are entered. The current system stores `race_time` and `penalties` as separate fields, but there's no mechanism to:

1. Preserve the **original race time** (before penalties)
2. Calculate the **final race time** (with penalties applied)
3. Distinguish between opening results (no recalculation) vs. modifying penalties (recalculation needed)

## Solution Overview

### Core Approach

Rename the database column `race_time` to `original_race_time` and calculate `final_race_time` in the application layer:

```
final_race_time = original_race_time + penalties
```

### Data Model

| Field | Description | Storage |
|-------|-------------|---------|
| `original_race_time` | Driver's actual race completion time | Database |
| `penalties` | Penalty time to be added | Database |
| `final_race_time` | Calculated: original + penalties | Application Layer |

### Key Benefits

- **Original time preserved**: Never lost, even after multiple penalty adjustments
- **Clear separation**: Original performance vs. penalized result
- **Flexible adjustments**: Can add/modify/remove penalties at any time
- **No accidental recalculation**: Frontend tracks penalty changes to prevent unnecessary recalculation

## Behavior Matrix

| Scenario | Backend Behavior | Frontend Behavior |
|----------|------------------|-------------------|
| First time entering results | Store `original_race_time`, no penalties | User enters times directly |
| Adding penalty later | Keep `original_race_time`, store `penalties`, calculate `final_race_time` | Penalty input triggers change flag |
| Adjusting existing penalty | Keep `original_race_time`, update `penalties`, recalculate `final_race_time` | Change detection compares to initial value |
| Opening without changes | Return all three values | No recalculation (penalty unchanged) |
| Removing penalty | Keep `original_race_time`, set `penalties` to null | `final_race_time = original_race_time` |

## Implementation Order

### Phase 1: Backend (Agent: `dev-be`)
1. Database migration (rename column)
2. Domain entity changes
3. Infrastructure layer updates
4. Application layer DTOs and services
5. Backend tests

### Phase 2: Frontend (Agent: `dev-fe-app`)
1. Type definition updates
2. Component updates (data flow)
3. Component updates (UI display)
4. Frontend tests

### Coordination Points

- **Breaking API Change**: Frontend must be updated to use new field names
- **Deployment Order**:
  1. Run database migration
  2. Deploy backend changes
  3. Deploy frontend changes
- **Cache Clear**: Clear application cache after deployment

## Files Affected

### Backend
- Database migration (new)
- `app/Domain/Competition/Entities/RaceResult.php`
- `app/Infrastructure/Persistence/Eloquent/Models/RaceResult.php`
- `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentRaceResultRepository.php`
- `app/Application/Competition/DTOs/RaceResultData.php`
- `app/Application/Competition/DTOs/CreateRaceResultData.php`
- `app/Application/Competition/Services/RaceResultApplicationService.php`
- `app/Application/Competition/Services/RoundApplicationService.php`

### Frontend
- `resources/app/js/types/raceResult.ts`
- `resources/app/js/components/result/RaceResultModal.vue`
- `resources/app/js/components/result/ResultEntryTable.vue`
- `resources/app/js/stores/raceResultStore.ts`

## Key Design Decisions

### Decision 1: Round Calculations Use Final Time
**Rationale**: Penalties should affect standings. Drivers are ranked by their `final_race_time` (post-penalty), not their `original_race_time`.

### Decision 2: Race Time Difference Uses Final Time
**Rationale**: Gap to leader should reflect actual standings after penalties are applied.

### Decision 3: Fastest Lap Is Independent
**Rationale**: Fastest lap uses a dedicated field and is unaffected by race time penalties.

### Decision 4: Frontend Change Detection
**Rationale**: Transient fields (`_originalPenalties`, `_penaltyChanged`) track if penalty was modified during session, preventing unnecessary recalculation on view-only opens.

## Related Documentation

- [Backend Implementation Plan](./backend-plan.md)
- [Frontend Implementation Plan](./frontend-plan.md)
