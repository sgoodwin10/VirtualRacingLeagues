# Penalty System - Frontend Implementation Plan

**Agent**: `dev-fe-app`

## Overview

This plan implements frontend changes to support the penalty system:
- Update types to use `original_race_time` and `final_race_time`
- Track penalty changes with transient fields
- Display both original and final times in read-only mode
- Visual indicators for modified penalties

---

## 1. Type Changes

### File: `resources/app/js/types/raceResult.ts`

### 1.1 RaceResult Interface (API Response)

| Change | Details |
|--------|---------|
| Rename | `race_time` to `original_race_time` |
| Add | `final_race_time: string \| null` (calculated by backend) |
| Keep | `penalties: string \| null` |

### 1.2 RaceResultFormData Interface (Form State)

| Change | Details |
|--------|---------|
| Rename | `race_time` to `original_race_time` |
| Keep | `penalties: string` |
| Add | `_originalPenalties?: string` (transient, session-only) |
| Add | `_penaltyChanged?: boolean` (transient, session-only) |

### 1.3 CreateRaceResultPayload Interface (API Request)

| Change | Details |
|--------|---------|
| Rename | `race_time` to `original_race_time` |
| Keep | `penalties?: string \| null` |

### 1.4 CsvResultRow Interface

| Change | Details |
|--------|---------|
| Rename | `race_time` to `original_race_time` |
| Add | `penalties?: string` (optional penalty import) |

---

## 2. Component Changes

### 2.1 RaceResultModal.vue

**File**: `resources/app/js/components/result/RaceResultModal.vue`

#### Template Changes
- None required (delegates to child components)

#### Script Changes

| Function | Change |
|----------|--------|
| `formResults` initialization | Initialize `_originalPenalties: ''`, `_penaltyChanged: false` |
| `handleCsvParse()` | Update field mapping: `race_time` to `original_race_time` |
| `handleResetAll()` | Update field name, reset transient fields |
| `recalculateTimesFromDifferences()` | Update field references |
| `handleSave()` | Update payload mapping (don't send transient fields) |
| `populateFormWithResults()` | Set `_originalPenalties` from loaded data, set `_penaltyChanged: false` |

#### New Functions
| Function | Purpose |
|----------|---------|
| `handlePenaltyChange(row)` | Compare penalty to original, set `_penaltyChanged` flag |

---

### 2.2 ResultEntryTable.vue

**File**: `resources/app/js/components/result/ResultEntryTable.vue`

#### Template Changes - Edit Mode

| Location | Change |
|----------|--------|
| Race Time column header | Rename label: "Race Time" to "Original Time" |
| Race Time input | Update v-model: `row.race_time` to `row.original_race_time` |
| Penalties input | Add: `@update:model-value="handlePenaltyChange(row)"` |
| Penalties column | Add visual indicator when `row._penaltyChanged === true` |

#### Template Changes - Read-Only Mode

| Location | Change |
|----------|--------|
| Race Time column | Show `final_race_time` as primary (bold) |
| Race Time column | If penalties exist, show `original_race_time` below (smaller, strikethrough) |
| Penalties column | Visual emphasis when penalty exists (e.g., red text) |

**Read-Only Display Example**:
```
Position | Driver      | Race Time           | Penalties     | FL
---------|-------------|---------------------|---------------|----
1        | John Smith  | 01:23:45.678        |               | *
2        | Jane Doe    | 01:23:50.123        | +00:00:05.000 |
                         01:23:45.123 (strikethrough, smaller)
```

#### Script Changes

| Function | Change |
|----------|--------|
| `handleTimeChange()` | Update to handle `original_race_time` field |
| `handleDnfChange()` | Update field: `row.race_time` to `row.original_race_time`, reset `_penaltyChanged` |
| `handleAddDriver()` | Initialize with `original_race_time: ''`, `_originalPenalties: ''`, `_penaltyChanged: false` |
| `displayResults` computed | Update field references |
| `hasResultData()` | Update field reference |

#### New Functions
| Function | Purpose |
|----------|---------|
| `handlePenaltyChange(row)` | Compare penalty to `_originalPenalties`, toggle `_penaltyChanged` |

---

### 2.3 ResultDivisionTabs.vue

**File**: `resources/app/js/components/result/ResultDivisionTabs.vue`

**Changes**: NONE
- Component passes through to `ResultEntryTable`
- No direct field references

---

## 3. Store Changes

### File: `resources/app/js/stores/raceResultStore.ts`

**Changes**: NONE expected
- Store receives/sends full objects
- Type changes flow through automatically
- Backend handles `final_race_time` calculation

---

## 4. Service Changes

### File: `resources/app/js/services/raceResultService.ts`

**Changes**: NONE expected
- Service sends/receives full objects
- Field name changes handled by types

---

## 5. Display Logic

### Edit Mode
| Column | Display |
|--------|---------|
| Original Time | Editable input for `original_race_time` |
| Penalties | Editable input with change indicator |

**User Flow**:
1. User enters/imports original race times
2. User can add/modify penalties in separate column
3. Visual indicator shows which penalties were modified this session
4. No automatic calculation on frontend (backend handles it)

### Read-Only Mode
| Column | Display |
|--------|---------|
| Race Time | `final_race_time` (bold, primary) |
| | `original_race_time` (smaller, strikethrough) if penalties exist |
| Penalties | Penalty value with visual emphasis |

**Rationale**: Show final time prominently since that's what matters for standings, but preserve transparency about original time.

---

## 6. Change Detection Logic

### Purpose
Track if a penalty was modified during the current editing session to:
- Show visual indicator of changed penalties
- Help users identify which rows had penalty adjustments
- Prevent accidental confusion about what was modified

### Implementation

| Event | Action |
|-------|--------|
| Load existing results | `_originalPenalties = penalties`, `_penaltyChanged = false` |
| CSV import | `_originalPenalties = penalties`, `_penaltyChanged = false` |
| Penalty input change | Compare to `_originalPenalties`, set `_penaltyChanged` accordingly |
| Reset all | `_originalPenalties = ''`, `_penaltyChanged = false` |
| DNF toggle ON | Reset `_penaltyChanged = false` |
| Save | Don't send `_originalPenalties` or `_penaltyChanged` to backend |

### Edge Cases

| Scenario | Result |
|----------|--------|
| User changes penalty, then reverts to original | `_penaltyChanged = false` |
| User clears penalty (was not empty) | `_penaltyChanged = true` |
| User adds penalty (was empty) | `_penaltyChanged = true` |

### Visual Indicator
- Location: Right side of penalty input field
- Style options: Orange dot, asterisk, or "edited" label
- Visibility: Only when `_penaltyChanged === true`

---

## 7. Sorting Logic

### Edit Mode
- No automatic sorting (user controls order via drag-drop)

### Read-Only Mode
- Sort by `final_race_time` (not `original_race_time`)
- Update `useRaceTimeCalculation` composable if it references `race_time`

---

## 8. CSV Import

### Supported Columns
| Column | Maps To |
|--------|---------|
| `race_time` or `original_race_time` | `original_race_time` |
| `penalties` | `penalties` |
| Other existing columns | Unchanged |

### Behavior
- If CSV includes penalties, import them
- Set `_originalPenalties` equal to imported penalty value
- Set `_penaltyChanged = false` after import

---

## 9. Implementation Checklist

### Phase 1: Type Updates
- [ ] Update `RaceResult` interface (rename + add `final_race_time`)
- [ ] Update `RaceResultFormData` interface (rename + add transient fields)
- [ ] Update `CreateRaceResultPayload` interface (rename)
- [ ] Update `CsvResultRow` interface (rename + add `penalties`)

### Phase 2: Component Updates - Data Flow
- [ ] Update `RaceResultModal.vue` - field initialization
- [ ] Update `RaceResultModal.vue` - CSV import logic
- [ ] Update `RaceResultModal.vue` - save payload mapping
- [ ] Update `RaceResultModal.vue` - populate form logic
- [ ] Add `handlePenaltyChange` function to `RaceResultModal.vue`

### Phase 3: Component Updates - UI Display
- [ ] Update `ResultEntryTable.vue` - edit mode template (column label, v-model)
- [ ] Update `ResultEntryTable.vue` - add penalty change handler to input
- [ ] Update `ResultEntryTable.vue` - add visual change indicator
- [ ] Update `ResultEntryTable.vue` - read-only mode dual time display
- [ ] Update `ResultEntryTable.vue` - read-only penalties visual emphasis
- [ ] Update `ResultEntryTable.vue` - script functions (field references)
- [ ] Add `handlePenaltyChange` function to `ResultEntryTable.vue`

### Phase 4: Testing
- [ ] Update unit tests with new field names
- [ ] Add tests for penalty change detection
- [ ] Add tests for visual indicators
- [ ] Add tests for read-only dual time display
- [ ] Run: `npm run test:app`

### Phase 5: Code Quality
- [ ] Run TypeScript type check: `npm run type-check`
- [ ] Run linter: `npm run lint:app`
- [ ] Run formatter: `npm run format:app`

### Phase 6: Manual Testing
- [ ] Create results with penalties
- [ ] Edit existing results with penalties
- [ ] Import CSV with penalties
- [ ] Verify read-only display
- [ ] Verify change indicators work
- [ ] Test DNF toggle clears penalty state

---

## 10. Files Summary

### Modified Files
| File | Impact |
|------|--------|
| `resources/app/js/types/raceResult.ts` | HIGH |
| `resources/app/js/components/result/ResultEntryTable.vue` | HIGH |
| `resources/app/js/components/result/RaceResultModal.vue` | MEDIUM |
| `resources/app/js/stores/raceResultStore.ts` | LOW (type changes only) |
| `resources/app/js/services/raceResultService.ts` | LOW (type changes only) |

### Test Files
| File | Action |
|------|--------|
| `resources/app/js/components/result/__tests__/RaceResultModal.test.ts` | UPDATE + ADD |
| `resources/app/js/components/result/__tests__/ResultEntryTable.test.ts` | UPDATE + ADD |
| `resources/app/js/components/result/__tests__/ResultDivisionTabs.test.ts` | UPDATE |

---

## 11. Accessibility Considerations

| Requirement | Implementation |
|-------------|----------------|
| Change indicator | Add `aria-label` describing modification state |
| Screen readers | Announce when penalty is modified |
| Color contrast | Ensure penalty emphasis meets WCAG standards |
| Strikethrough text | Provide alternative text for screen readers |

---

## 12. Dependencies

### Backend Requirements
This plan assumes the backend changes are complete and the API returns:
- `original_race_time`: The driver's actual race time
- `final_race_time`: Calculated (original + penalties)
- `penalties`: The penalty time applied

### Coordination
- Deploy backend first
- Frontend deployment follows immediately after
- Both deployments should happen in same release window
