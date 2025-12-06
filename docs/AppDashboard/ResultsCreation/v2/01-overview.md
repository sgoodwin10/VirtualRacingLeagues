# Results Modal v2 - Overview

## Summary

Rewrite of `RaceResultModal.vue` and related components to simplify logic, remove automatic reordering, and add drag-and-drop for manual positioning.

## Key Changes from Current Implementation

### What to Remove
1. **Automatic time-based sorting** - Currently `sortLocalResultsByTime()` and `sortResultsByTime()` auto-reorder on every time change
2. **Frontend fastest lap calculation** - Currently `calculateFastestLaps()` in RaceResultModal.vue determines FL
3. **Pre-populated driver rows** - Currently `initializeForm()` creates rows for ALL drivers on open
4. **Automatic DNF repositioning** - Currently `sortDnfToBottom()` auto-moves DNF drivers

### What to Add
1. **Empty initial state** - No drivers visible when opening for first entry
2. **Add Driver button** - Adds row and auto-selects first available driver
3. **Drag and drop for ALL modes** - Always enabled (times-required and no-times modes)
4. **Manual position control** - User determines order through drag/drop, no auto-reordering

### What to Keep/Enhance
1. **CSV parsing** - Keep existing logic but:
   - If times exist: calculate race_time from differences, order by time (one-time sort on parse)
   - If no times: use CSV order as-is
   - For qualifying: order by fastest lap (one-time sort on parse)
2. **Time difference recalculation** - Only when difference field is edited (not on every change)
3. **Penalty addition to race time** - Add penalty to displayed race time (no reordering)
4. **DNF behavior** - Clear race_time/difference fields only (no repositioning)
5. **Division support** - Separate drivers by division, position within division
6. **Backend fastest lap calculation** - Already implemented in `RaceResultApplicationService.php`

## Implementation Order

1. **Frontend Phase 1: Core Modal Rewrite** (Agent: `dev-fe-app`)
   - Empty initial state
   - Add Driver functionality
   - Edit mode: load only saved results in position order

2. **Frontend Phase 2: Drag & Drop** (Agent: `dev-fe-app`)
   - Enable drag/drop for both times-required and no-times modes
   - Remove all automatic sorting triggers

3. **Frontend Phase 3: CSV & Calculations** (Agent: `dev-fe-app`)
   - Update CSV parse to do one-time sort on import
   - Time difference recalc only on field change
   - DNF clears times without repositioning

4. **Backend Updates** (Agent: `dev-be`)
   - Verify delete-and-replace logic handles orphaned results
   - Position saved from table order (respecting divisions)
   - Fastest lap calculation already correct (no changes needed)

## Files Affected

### Frontend (Primary)
- `resources/app/js/components/result/RaceResultModal.vue` - Main rewrite
- `resources/app/js/components/result/ResultEntryTable.vue` - Drag/drop always enabled
- `resources/app/js/components/result/ResultDivisionTabs.vue` - Division-aware drag/drop
- `resources/app/js/composables/useRaceTimeCalculation.ts` - Remove sorting utilities used by auto-sort

### Frontend (Minor/No Changes)
- `resources/app/js/components/result/ResultCsvImport.vue` - No changes needed
- `resources/app/js/stores/raceResultStore.ts` - No changes needed

### Backend (Verify Only)
- `app/Application/Competition/Services/RaceResultApplicationService.php` - Already handles delete-replace pattern
- `app/Http/Controllers/User/RaceResultController.php` - No changes needed
