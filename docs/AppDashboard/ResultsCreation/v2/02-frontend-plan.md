# Results Modal v2 - Frontend Plan

**Agent:** `dev-fe-app`

---

## Phase 1: Core Modal State Management

### File: `RaceResultModal.vue`

#### 1.1 Remove Initial Pre-population

**Current (REMOVE):**
```typescript
function initializeForm(): void {
  const drivers = allDrivers.value;
  formResults.value = drivers.map((driver) => ({
    driver_id: driver.id,
    // ... creates row for every driver
  }));
}
```

**New:**
```typescript
function initializeForm(): void {
  // Empty array - no drivers shown initially
  formResults.value = [];
}
```

#### 1.2 Update `populateFormWithResults()` for Edit Mode

**Current behavior:** Merges saved results into pre-populated driver rows

**New behavior:**
- Load ONLY drivers that have saved results
- Order by `race_results.position`
- No rows for drivers without results

```typescript
function populateFormWithResults(): void {
  if (!raceResultStore.hasResults) {
    return;
  }

  // Sort by position before creating form rows
  const sortedResults = [...raceResultStore.results].sort((a, b) => {
    const posA = a.position ?? Infinity;
    const posB = b.position ?? Infinity;
    return posA - posB;
  });

  // Create form rows only for saved results
  formResults.value = sortedResults.map((result) => ({
    driver_id: result.driver_id,
    division_id: result.division_id ?? null,
    position: result.position,
    race_time: result.race_time || '',
    race_time_difference: result.race_time_difference || '',
    fastest_lap: result.fastest_lap || '',
    penalties: result.penalties || '',
    has_fastest_lap: result.has_fastest_lap,
    has_pole: result.has_pole,
    dnf: result.dnf,
  }));
}
```

#### 1.3 Remove Frontend Fastest Lap Calculation

**DELETE entirely:**
```typescript
function calculateFastestLaps(results: RaceResultFormData[]): void { ... }
```

**Update `handleSave()`:** Remove call to `calculateFastestLaps(sortedResults)` - backend handles this.

---

## Phase 2: ResultEntryTable Drag & Drop

### File: `ResultEntryTable.vue`

#### 2.1 Enable Drag & Drop for ALL Modes

**Current:** Drag only enabled when `!readOnly && !raceTimesRequired`

**New:** Drag enabled when `!readOnly` (regardless of raceTimesRequired)

```vue
<!-- Show drag handle for all edit modes -->
<th
  v-if="!readOnly"
  class="px-2 py-2 text-center font-medium text-gray-700 w-8"
></th>
```

```vue
<!-- Use draggable for all edit modes, not just no-times -->
<draggable
  v-if="!readOnly"
  v-model="localResults"
  tag="tbody"
  item-key="driver_id"
  handle=".drag-handle"
  @end="onDragEnd"
>
```

#### 2.2 Remove Automatic Sorting

**DELETE:**
```typescript
function sortLocalResultsByTime(): void { ... }
```

**UPDATE watch:** Remove call to `sortLocalResultsByTime()`
```typescript
watch(
  () => props.results,
  (newResults) => {
    if (!isInternalUpdate) {
      localResults.value = [...newResults];
      // REMOVED: sortLocalResultsByTime();
    }
  },
  { deep: true },
);
```

**UPDATE `handleTimeChange()`:**
```typescript
function handleTimeChange(): void {
  // REMOVED: sortLocalResultsByTime();
  emitUpdate();
}
```

#### 2.3 Simplify DNF Handling

**UPDATE `handleDnfChange()`:** Only clear times, no repositioning
```typescript
function handleDnfChange(row: RaceResultFormData): void {
  if (row.dnf) {
    row.race_time = '';
    row.race_time_difference = '';
    row.penalties = '';
  }
  // REMOVED: sortLocalResultsByTime();
  emitUpdate();
}
```

**UPDATE `handleDnfChangeNoTimes()`:** Remove repositioning logic
```typescript
function handleDnfChangeNoTimes(row: RaceResultFormData): void {
  // Just emit update, no repositioning
  emitUpdate();
}
```

#### 2.4 Update `onDragEnd()`

**REMOVE:** DNF repositioning logic
```typescript
function onDragEnd(): void {
  // Simply emit - user controls order
  emitUpdate();
}
```

---

## Phase 3: CSV Import & Time Calculations

### File: `RaceResultModal.vue`

#### 3.1 Update CSV Parse Handler

```typescript
function handleCsvParse(parsedRows: CsvResultRow[]): void {
  // Build new rows from CSV
  const newRows: RaceResultFormData[] = [];

  for (const csvRow of parsedRows) {
    const matchedDriver = findDriverByName(csvRow.driver);
    if (!matchedDriver) continue;
    // Skip if driver already in results
    if (formResults.value.some(r => r.driver_id === matchedDriver.id)) continue;

    const formRow: RaceResultFormData = {
      driver_id: matchedDriver.id,
      division_id: matchedDriver.division_id ?? null,
      position: null,
      race_time: '',
      race_time_difference: '',
      fastest_lap: csvRow.fastest_lap_time ? normalizeTimeInput(csvRow.fastest_lap_time) : '',
      penalties: '',
      has_fastest_lap: false,
      has_pole: false,
      dnf: csvRow.dnf ?? false,
    };

    // Handle times (existing logic for normalization)
    if (csvRow.race_time) {
      formRow.race_time = normalizeTimeInput(csvRow.race_time);
    } else if (csvRow.race_time_difference) {
      formRow.race_time_difference = normalizeTimeInput(csvRow.race_time_difference);
    }

    newRows.push(formRow);
  }

  // Calculate race_time from differences if we have a leader time
  calculateRaceTimesFromDifferences(newRows);

  // ONE-TIME SORT based on context:
  if (isQualifying.value) {
    // Sort by fastest_lap
    sortRowsByFastestLap(newRows);
  } else if (hasRaceTimes(newRows)) {
    // Sort by race_time (after calculating from differences)
    sortRowsByRaceTime(newRows);
  }
  // If no times, keep CSV order as-is

  // Append to existing results
  formResults.value = [...formResults.value, ...newRows];
}

function hasRaceTimes(rows: RaceResultFormData[]): boolean {
  return rows.some(r => r.race_time || r.race_time_difference);
}

function sortRowsByFastestLap(rows: RaceResultFormData[]): void {
  rows.sort((a, b) => {
    const timeA = parseTimeToMs(a.fastest_lap);
    const timeB = parseTimeToMs(b.fastest_lap);
    if (timeA === null) return 1;
    if (timeB === null) return -1;
    return timeA - timeB;
  });
}

function sortRowsByRaceTime(rows: RaceResultFormData[]): void {
  rows.sort((a, b) => {
    const timeA = parseTimeToMs(a.race_time);
    const timeB = parseTimeToMs(b.race_time);
    if (a.dnf && !b.dnf) return 1;
    if (!a.dnf && b.dnf) return -1;
    if (timeA === null) return 1;
    if (timeB === null) return -1;
    return timeA - timeB;
  });
}
```

#### 3.2 Time Difference Recalculation

**Keep but trigger only on explicit difference edit:**

```typescript
function recalculateTimesFromDifferences(): void {
  // Existing logic - only called when difference field changes
  // Not called automatically on every update
}
```

**In ResultEntryTable.vue:** Add specific handler for difference field:
```typescript
function handleDifferenceChange(row: RaceResultFormData): void {
  // Emit event to parent to trigger recalculation
  emit('difference-changed');
}
```

#### 3.3 Penalty Handling

**Current:** No special handling
**Keep as-is:** Penalty input updates field, no recalculation triggered

---

## Phase 4: Save Logic Update

### File: `RaceResultModal.vue`

#### 4.1 Simplify Position Assignment

```typescript
async function handleSave(): Promise<void> {
  isSaving.value = true;

  try {
    const resultsWithDrivers = formResults.value.filter((r) => r.driver_id !== null);

    let finalResults: RaceResultFormData[];

    if (hasDivisions.value) {
      // Group by division and assign positions within each
      const byDivision = new Map<number | null, RaceResultFormData[]>();
      resultsWithDrivers.forEach((r) => {
        const divId = r.division_id ?? null;
        if (!byDivision.has(divId)) byDivision.set(divId, []);
        byDivision.get(divId)!.push(r);
      });

      finalResults = [];
      for (const divisionResults of byDivision.values()) {
        // Position based on table order within division
        divisionResults.forEach((result, idx) => {
          result.position = idx + 1;
          finalResults.push(result);
        });
      }
    } else {
      // No divisions: sequential positions from table order
      finalResults = resultsWithDrivers.map((result, idx) => ({
        ...result,
        position: idx + 1,
      }));
    }

    // Build payload
    const payload: BulkRaceResultsPayload = {
      results: finalResults.map((r) => ({
        driver_id: r.driver_id!,
        division_id: r.division_id ?? null,
        position: r.position!,
        race_time: r.race_time || null,
        race_time_difference: r.race_time_difference || null,
        fastest_lap: r.fastest_lap || null,
        penalties: r.penalties || null,
        has_fastest_lap: false, // Backend calculates
        has_pole: r.has_pole,
        dnf: r.dnf,
      })),
    };

    await raceResultStore.saveResults(props.race.id, payload);
    emit('saved');
    handleClose();
  } catch (error) {
    console.error('Failed to save results:', error);
  } finally {
    isSaving.value = false;
  }
}
```

---

## Phase 5: Division Tabs Update

### File: `ResultDivisionTabs.vue`

Apply same changes as ResultEntryTable:
- Enable drag/drop for all edit modes
- Remove automatic sorting
- Simplify DNF handling
- Position assignment within division

---

## Testing Checklist

1. **Empty state:** Open modal for new results - no drivers visible
2. **Add Driver:** Click adds row with first available driver selected
3. **Edit mode:** Open with existing results - only saved drivers shown, ordered by position
4. **Drag/drop:** Works in both times-required and no-times modes
5. **CSV import (times):** Sorts by race_time once on parse, no subsequent auto-sort
6. **CSV import (qualifying):** Sorts by fastest_lap once on parse
7. **CSV import (no times):** Keeps CSV order
8. **Time difference edit:** Recalculates race_time only for that trigger
9. **Penalty edit:** Updates field, no reordering
10. **DNF toggle:** Clears times, no repositioning
11. **Save:** Position based on table order, backend calculates fastest lap
12. **Divisions:** Separate ordering per division

---

## Files Summary

| File | Changes |
|------|---------|
| `RaceResultModal.vue` | Major rewrite - init, populate, save logic |
| `ResultEntryTable.vue` | Drag always on, remove auto-sort |
| `ResultDivisionTabs.vue` | Same as ResultEntryTable |
| `useRaceTimeCalculation.ts` | Remove sortResultsByTime (if unused elsewhere) |
