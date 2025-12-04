# Race Results Without Times - Frontend Implementation Plan

## Overview

This document outlines the frontend changes required to support the `race_times_required` feature in the user dashboard (app.virtualracingleagues.localhost).

## Architecture Summary

- **Path Alias**: `@app/` → `resources/app/js/`
- **UI Framework**: PrimeVue 4, Tailwind CSS 4
- **State Management**: Pinia
- **Testing**: Vitest

---

## Phase 1: Type Updates

### 1.1 Update Season Types

**File:** `resources/app/js/types/season.ts`

```typescript
export interface Season {
  id: number;
  competition_id: number;
  name: string;
  slug: string;
  car_class: string | null;
  description: string | null;
  technical_specs: string | null;
  logo_path: string | null;
  banner_path: string | null;
  team_championship_enabled: boolean;
  race_divisions_enabled: boolean;
  race_times_required: boolean; // Add this field
  status: SeasonStatus;
  created_by_user_id: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSeasonPayload {
  // ... existing fields
  race_times_required?: boolean; // Add this field (optional, defaults to true)
}

export interface UpdateSeasonPayload {
  // ... existing fields
  race_times_required?: boolean; // Add this field
}
```

### 1.2 Update Race Result Types

**File:** `resources/app/js/types/raceResult.ts`

No changes needed to existing types. The `has_fastest_lap` and `has_pole` fields already exist.

---

## Phase 2: Drag-and-Drop Library Setup

### 2.1 Install VueDraggable

```bash
npm install vuedraggable@next
```

**Why VueDraggable:**
- Vue 3 compatible
- Based on SortableJS (widely used, well-tested)
- Simple API for Vue integration
- Good accessibility support
- Lightweight

### 2.2 Type Definitions

If needed, install types:
```bash
npm install -D @types/sortablejs
```

---

## Phase 3: ResultEntryTable Component Updates

### 3.1 Component Props Update

**File:** `resources/app/js/components/result/ResultEntryTable.vue`

```typescript
interface Props {
  results: RaceResultFormData[];
  drivers: DriverOption[];
  isQualifying: boolean;
  selectedDriverIds: Set<number>;
  readOnly?: boolean;
  raceTimesRequired?: boolean; // Add this prop (default: true)
  divisionId?: number | null; // Add for fastest lap exclusivity context
}

const props = withDefaults(defineProps<Props>(), {
  readOnly: false,
  raceTimesRequired: true,
  divisionId: null,
});
```

### 3.2 Conditional Column Display

```vue
<template>
  <table class="w-full">
    <thead>
      <tr>
        <th v-if="!readOnly && !raceTimesRequired" class="drag-handle-header">
          <!-- Drag handle column -->
        </th>
        <th>#</th>
        <th>Driver</th>

        <!-- Time columns: only show when times required -->
        <th v-if="raceTimesRequired">Race Time</th>
        <th v-if="raceTimesRequired">Diff</th>
        <th v-if="raceTimesRequired">
          {{ isQualifying ? 'Lap Time' : 'Fastest Lap' }}
        </th>
        <th v-if="raceTimesRequired">Penalties</th>

        <!-- No-times mode columns -->
        <th v-if="!raceTimesRequired && isQualifying">Pole</th>
        <th v-if="!raceTimesRequired && !isQualifying">Fastest Lap</th>

        <th>DNF</th>
        <th v-if="!readOnly">Actions</th>
      </tr>
    </thead>

    <tbody>
      <!-- Use draggable wrapper when times not required -->
      <component
        :is="!raceTimesRequired && !readOnly ? 'draggable' : 'template'"
        v-model="orderedResults"
        handle=".drag-handle"
        item-key="driver_id"
        :group="{ name: 'results', pull: false, put: false }"
        @end="handleDragEnd"
      >
        <template #item="{ element, index }">
          <ResultRow
            :result="element"
            :index="index"
            :drivers="drivers"
            :is-qualifying="isQualifying"
            :read-only="readOnly"
            :race-times-required="raceTimesRequired"
            :show-drag-handle="!raceTimesRequired && !readOnly"
            @update="handleRowUpdate"
            @remove="handleRemoveRow"
            @pole-change="handlePoleChange"
            @fastest-lap-change="handleFastestLapChange"
          />
        </template>
      </component>
    </tbody>
  </table>
</template>
```

### 3.3 Drag-and-Drop State Management

```typescript
import draggable from 'vuedraggable';
import { ref, computed, watch } from 'vue';

// Separate computed for ordered results
const orderedResults = computed({
  get: () => {
    if (raceTimesRequired.value) {
      return sortedResults.value; // Existing sorting logic
    }

    // No-times mode: separate finishers and DNFs
    const finishers = props.results.filter(r => !r.dnf);
    const dnfs = props.results.filter(r => r.dnf);
    return [...finishers, ...dnfs];
  },
  set: (newOrder: RaceResultFormData[]) => {
    // Update positions based on new order
    const updated = newOrder.map((result, index) => ({
      ...result,
      position: result.dnf ? null : index + 1,
    }));
    emit('update:results', updated);
  }
});

const handleDragEnd = () => {
  // Recompute positions after drag
  const finishers = orderedResults.value.filter(r => !r.dnf);
  const dnfs = orderedResults.value.filter(r => r.dnf);

  const updated = [
    ...finishers.map((r, i) => ({ ...r, position: i + 1 })),
    ...dnfs.map(r => ({ ...r, position: null })),
  ];

  emit('update:results', updated);
};
```

### 3.4 DNF Auto-Positioning

```typescript
const handleDnfChange = (driverId: number, isDnf: boolean) => {
  const updated = props.results.map(r => {
    if (r.driver_id !== driverId) return r;

    return {
      ...r,
      dnf: isDnf,
      // Clear times if marking as DNF (existing logic)
      race_time: isDnf ? '' : r.race_time,
      race_time_difference: isDnf ? '' : r.race_time_difference,
      penalties: isDnf ? '' : r.penalties,
      // Clear position if DNF
      position: isDnf ? null : r.position,
    };
  });

  if (!props.raceTimesRequired) {
    // Reorder: finishers first, then DNFs
    const finishers = updated.filter(r => !r.dnf);
    const dnfs = updated.filter(r => r.dnf);

    const reordered = [
      ...finishers.map((r, i) => ({ ...r, position: i + 1 })),
      ...dnfs,
    ];

    emit('update:results', reordered);
  } else {
    emit('update:results', updated);
  }
};
```

### 3.5 Pole Position Auto-Move (Qualifying)

```typescript
const handlePoleChange = (driverId: number, hasPole: boolean) => {
  if (!hasPole) {
    // Just update the flag
    const updated = props.results.map(r => ({
      ...r,
      has_pole: r.driver_id === driverId ? false : r.has_pole,
    }));
    emit('update:results', updated);
    return;
  }

  // Auto-move to P1 when pole is checked
  const poleDriver = props.results.find(r => r.driver_id === driverId);
  if (!poleDriver) return;

  const others = props.results.filter(r => r.driver_id !== driverId);
  const finishers = others.filter(r => !r.dnf);
  const dnfs = others.filter(r => r.dnf);

  const reordered = [
    { ...poleDriver, has_pole: true, position: 1 },
    ...finishers.map((r, i) => ({ ...r, has_pole: false, position: i + 2 })),
    ...dnfs.map(r => ({ ...r, has_pole: false, position: null })),
  ];

  emit('update:results', reordered);
};
```

### 3.6 Fastest Lap Mutual Exclusivity

```typescript
const handleFastestLapChange = (driverId: number, hasFastestLap: boolean) => {
  const updated = props.results.map(r => {
    if (r.driver_id === driverId) {
      return { ...r, has_fastest_lap: hasFastestLap };
    }

    // Uncheck others in same division (mutual exclusivity)
    if (hasFastestLap && r.division_id === props.divisionId) {
      return { ...r, has_fastest_lap: false };
    }

    return r;
  });

  emit('update:results', updated);
};
```

### 3.7 Visual Styling for Drag-and-Drop

```vue
<style scoped>
.drag-handle {
  cursor: grab;
  padding: 0.5rem;
  color: var(--p-text-muted-color);
}

.drag-handle:active {
  cursor: grabbing;
}

.sortable-ghost {
  opacity: 0.4;
  background: var(--p-primary-100);
}

.sortable-chosen {
  background: var(--p-primary-50);
}

.dnf-section {
  border-top: 2px dashed var(--p-surface-300);
  margin-top: 0.5rem;
  padding-top: 0.5rem;
}

.dnf-section::before {
  content: 'Did Not Finish';
  display: block;
  font-size: 0.75rem;
  color: var(--p-text-muted-color);
  margin-bottom: 0.25rem;
}
</style>
```

---

## Phase 4: ResultRow Component (New)

### 4.1 Create ResultRow Component

**File:** `resources/app/js/components/result/ResultRow.vue`

```vue
<script setup lang="ts">
import { computed } from 'vue';
import Checkbox from 'primevue/checkbox';
import Select from 'primevue/select';
import Button from 'primevue/button';
import ResultTimeInput from './ResultTimeInput.vue';
import type { RaceResultFormData, DriverOption } from '@app/types/raceResult';

interface Props {
  result: RaceResultFormData;
  index: number;
  drivers: DriverOption[];
  isQualifying: boolean;
  readOnly: boolean;
  raceTimesRequired: boolean;
  showDragHandle: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update', field: keyof RaceResultFormData, value: unknown): void;
  (e: 'remove'): void;
  (e: 'pole-change', hasPole: boolean): void;
  (e: 'fastest-lap-change', hasFastestLap: boolean): void;
}>();

const displayPosition = computed(() => {
  if (props.result.dnf) return 'DNF';
  return props.result.position ?? props.index + 1;
});
</script>

<template>
  <tr :class="{ 'opacity-60': result.dnf }">
    <!-- Drag Handle -->
    <td v-if="showDragHandle" class="drag-handle w-8">
      <i class="pi pi-bars" />
    </td>

    <!-- Position -->
    <td class="w-12 text-center font-mono">
      {{ displayPosition }}
    </td>

    <!-- Driver -->
    <td>
      <Select
        v-if="!readOnly"
        :model-value="result.driver_id"
        :options="drivers"
        option-label="name"
        option-value="id"
        placeholder="Select Driver"
        class="w-full"
        @update:model-value="emit('update', 'driver_id', $event)"
      />
      <span v-else>{{ drivers.find(d => d.id === result.driver_id)?.name }}</span>
    </td>

    <!-- Time Columns (only when times required) -->
    <template v-if="raceTimesRequired">
      <td>
        <ResultTimeInput
          v-if="!readOnly"
          :model-value="result.race_time"
          :disabled="result.dnf"
          @update:model-value="emit('update', 'race_time', $event)"
        />
        <span v-else>{{ result.race_time || '-' }}</span>
      </td>
      <td>
        <ResultTimeInput
          v-if="!readOnly"
          :model-value="result.race_time_difference"
          :disabled="result.dnf"
          @update:model-value="emit('update', 'race_time_difference', $event)"
        />
        <span v-else>{{ result.race_time_difference || '-' }}</span>
      </td>
      <td>
        <ResultTimeInput
          v-if="!readOnly"
          :model-value="result.fastest_lap"
          @update:model-value="emit('update', 'fastest_lap', $event)"
        />
        <span v-else>{{ result.fastest_lap || '-' }}</span>
      </td>
      <td>
        <ResultTimeInput
          v-if="!readOnly"
          :model-value="result.penalties"
          @update:model-value="emit('update', 'penalties', $event)"
        />
        <span v-else>{{ result.penalties || '-' }}</span>
      </td>
    </template>

    <!-- No-Times Mode: Pole Checkbox (Qualifying) -->
    <td v-if="!raceTimesRequired && isQualifying" class="text-center">
      <Checkbox
        v-if="!readOnly"
        :model-value="result.has_pole"
        :binary="true"
        :disabled="result.dnf"
        @update:model-value="emit('pole-change', $event)"
      />
      <span v-else>{{ result.has_pole ? 'P' : '-' }}</span>
    </td>

    <!-- No-Times Mode: Fastest Lap Checkbox (Race) -->
    <td v-if="!raceTimesRequired && !isQualifying" class="text-center">
      <Checkbox
        v-if="!readOnly"
        :model-value="result.has_fastest_lap"
        :binary="true"
        :disabled="result.dnf"
        @update:model-value="emit('fastest-lap-change', $event)"
      />
      <span v-else>{{ result.has_fastest_lap ? 'FL' : '-' }}</span>
    </td>

    <!-- DNF -->
    <td class="text-center">
      <Checkbox
        v-if="!readOnly"
        :model-value="result.dnf"
        :binary="true"
        @update:model-value="emit('update', 'dnf', $event)"
      />
      <span v-else>{{ result.dnf ? 'DNF' : '-' }}</span>
    </td>

    <!-- Actions -->
    <td v-if="!readOnly" class="text-center">
      <Button
        icon="pi pi-trash"
        severity="danger"
        text
        rounded
        @click="emit('remove')"
      />
    </td>
  </tr>
</template>
```

---

## Phase 5: RaceResultModal Updates

### 5.1 Pass raceTimesRequired to Child Components

**File:** `resources/app/js/components/result/RaceResultModal.vue`

```typescript
// Props should include or fetch season data
interface Props {
  race: Race;
  round: Round;
  season: Season; // Need season for race_times_required
  // ... other props
}

// Or fetch season from round/race relationship
const raceTimesRequired = computed(() => {
  return props.season?.race_times_required ?? true;
});
```

```vue
<template>
  <!-- Pass to ResultEntryTable -->
  <ResultEntryTable
    v-model:results="formResults"
    :drivers="drivers"
    :is-qualifying="race.is_qualifier"
    :selected-driver-ids="selectedDriverIds"
    :read-only="isReadOnly"
    :race-times-required="raceTimesRequired"
    :division-id="currentDivisionId"
  />
</template>
```

### 5.2 Update Save Logic

```typescript
const handleSave = async () => {
  const payload: BulkRaceResultsPayload = {
    results: formResults.value.map((result, index) => ({
      driver_id: result.driver_id!,
      division_id: result.division_id,
      // Position from order when times not required
      position: raceTimesRequired.value
        ? result.position
        : (result.dnf ? null : index + 1),
      race_time: raceTimesRequired.value ? result.race_time || null : null,
      race_time_difference: raceTimesRequired.value ? result.race_time_difference || null : null,
      fastest_lap: raceTimesRequired.value ? result.fastest_lap || null : null,
      penalties: raceTimesRequired.value ? result.penalties || null : null,
      has_fastest_lap: result.has_fastest_lap,
      has_pole: result.has_pole,
      dnf: result.dnf,
    })),
  };

  await raceResultService.saveResults(race.id, payload);
};
```

---

## Phase 6: Season Form Updates

### 6.1 Add race_times_required Toggle

**File:** `resources/app/js/views/SeasonForm.vue` (or equivalent)

```vue
<template>
  <!-- In the Features section alongside other toggles -->
  <div class="field">
    <label for="race_times_required" class="font-medium">
      Require Race Times
    </label>
    <InputSwitch
      id="race_times_required"
      v-model="form.race_times_required"
    />
    <small class="text-muted-color block mt-1">
      When disabled, results are entered by position order without times
    </small>
  </div>
</template>

<script setup lang="ts">
import InputSwitch from 'primevue/inputswitch';

const form = reactive({
  // ... existing fields
  race_times_required: true, // Default to true
});
</script>
```

---

## Phase 7: Round Results View Updates

### 7.1 Conditional Time Display

**File:** `resources/app/js/views/RoundResults.vue` (or equivalent)

```vue
<template>
  <DataTable :value="results">
    <Column field="position" header="Pos" />
    <Column field="driver.name" header="Driver" />

    <!-- Time columns: only when times required -->
    <Column
      v-if="season.race_times_required"
      field="race_time"
      header="Time"
    >
      <template #body="{ data }">
        {{ formatRaceTime(data.race_time) }}
      </template>
    </Column>

    <Column
      v-if="season.race_times_required"
      field="fastest_lap"
      header="Fastest Lap"
    >
      <template #body="{ data }">
        {{ formatRaceTime(data.fastest_lap) }}
      </template>
    </Column>

    <!-- Points: always show -->
    <Column field="race_points" header="Points" />
  </DataTable>
</template>
```

---

## Phase 8: Composables

### 8.1 Create useDragAndDropResults Composable

**File:** `resources/app/js/composables/useDragAndDropResults.ts`

```typescript
import { computed, type Ref } from 'vue';
import type { RaceResultFormData } from '@app/types/raceResult';

export function useDragAndDropResults(
  results: Ref<RaceResultFormData[]>,
  raceTimesRequired: Ref<boolean>
) {
  // Separate finishers and DNFs
  const finishers = computed(() =>
    results.value.filter(r => !r.dnf)
  );

  const dnfs = computed(() =>
    results.value.filter(r => r.dnf)
  );

  // Ordered list for display
  const orderedResults = computed(() => [
    ...finishers.value,
    ...dnfs.value,
  ]);

  // Assign positions based on order
  const assignPositions = (newOrder: RaceResultFormData[]): RaceResultFormData[] => {
    const updatedFinishers = newOrder
      .filter(r => !r.dnf)
      .map((r, i) => ({ ...r, position: i + 1 }));

    const updatedDnfs = newOrder
      .filter(r => r.dnf)
      .map(r => ({ ...r, position: null }));

    return [...updatedFinishers, ...updatedDnfs];
  };

  // Move driver to specific position
  const moveToPosition = (
    driverId: number,
    targetPosition: number
  ): RaceResultFormData[] => {
    const driver = results.value.find(r => r.driver_id === driverId);
    if (!driver) return results.value;

    const others = results.value.filter(r => r.driver_id !== driverId);
    const finishersWithoutDriver = others.filter(r => !r.dnf);
    const dnfsWithoutDriver = others.filter(r => r.dnf);

    // Insert at target position (0-indexed internally)
    const insertIndex = targetPosition - 1;
    finishersWithoutDriver.splice(insertIndex, 0, driver);

    return assignPositions([...finishersWithoutDriver, ...dnfsWithoutDriver]);
  };

  // Handle DNF toggle
  const toggleDnf = (driverId: number, isDnf: boolean): RaceResultFormData[] => {
    const updated = results.value.map(r => {
      if (r.driver_id !== driverId) return r;
      return {
        ...r,
        dnf: isDnf,
        position: isDnf ? null : r.position,
        race_time: isDnf ? '' : r.race_time,
        race_time_difference: isDnf ? '' : r.race_time_difference,
        penalties: isDnf ? '' : r.penalties,
      };
    });

    return assignPositions(updated);
  };

  return {
    finishers,
    dnfs,
    orderedResults,
    assignPositions,
    moveToPosition,
    toggleDnf,
  };
}
```

### 8.2 Create useFastestLapExclusivity Composable

**File:** `resources/app/js/composables/useFastestLapExclusivity.ts`

```typescript
import type { Ref } from 'vue';
import type { RaceResultFormData } from '@app/types/raceResult';

export function useFastestLapExclusivity(
  results: Ref<RaceResultFormData[]>,
  divisionId: Ref<number | null>
) {
  const setFastestLap = (
    driverId: number,
    hasFastestLap: boolean
  ): RaceResultFormData[] => {
    return results.value.map(r => {
      // Target driver: set to new value
      if (r.driver_id === driverId) {
        return { ...r, has_fastest_lap: hasFastestLap };
      }

      // If setting fastest lap, uncheck others in same division
      if (hasFastestLap && r.division_id === divisionId.value) {
        return { ...r, has_fastest_lap: false };
      }

      return r;
    });
  };

  const currentFastestLapDriver = computed(() => {
    return results.value.find(r =>
      r.has_fastest_lap && r.division_id === divisionId.value
    )?.driver_id ?? null;
  });

  return {
    setFastestLap,
    currentFastestLapDriver,
  };
}
```

---

## Phase 9: Testing

### 9.1 ResultEntryTable Tests

**File:** `resources/app/js/components/result/__tests__/ResultEntryTable.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ResultEntryTable from '../ResultEntryTable.vue';

describe('ResultEntryTable', () => {
  describe('when raceTimesRequired is true', () => {
    it('shows time columns', () => {
      const wrapper = mount(ResultEntryTable, {
        props: {
          results: [],
          drivers: [],
          isQualifying: false,
          selectedDriverIds: new Set(),
          raceTimesRequired: true,
        },
      });

      expect(wrapper.text()).toContain('Race Time');
      expect(wrapper.text()).toContain('Fastest Lap');
    });

    it('does not show drag handles', () => {
      const wrapper = mount(ResultEntryTable, {
        props: {
          results: [],
          drivers: [],
          isQualifying: false,
          selectedDriverIds: new Set(),
          raceTimesRequired: true,
          readOnly: false,
        },
      });

      expect(wrapper.find('.drag-handle').exists()).toBe(false);
    });
  });

  describe('when raceTimesRequired is false', () => {
    it('hides time columns', () => {
      const wrapper = mount(ResultEntryTable, {
        props: {
          results: [],
          drivers: [],
          isQualifying: false,
          selectedDriverIds: new Set(),
          raceTimesRequired: false,
        },
      });

      expect(wrapper.text()).not.toContain('Race Time');
      expect(wrapper.text()).not.toContain('Diff');
    });

    it('shows drag handles in edit mode', () => {
      const wrapper = mount(ResultEntryTable, {
        props: {
          results: [
            { driver_id: 1, dnf: false, has_fastest_lap: false, has_pole: false },
          ],
          drivers: [{ id: 1, name: 'Driver 1' }],
          isQualifying: false,
          selectedDriverIds: new Set([1]),
          raceTimesRequired: false,
          readOnly: false,
        },
      });

      expect(wrapper.find('.drag-handle').exists()).toBe(true);
    });

    it('shows fastest lap checkbox for race', () => {
      const wrapper = mount(ResultEntryTable, {
        props: {
          results: [],
          drivers: [],
          isQualifying: false,
          selectedDriverIds: new Set(),
          raceTimesRequired: false,
        },
      });

      expect(wrapper.text()).toContain('Fastest Lap');
    });

    it('shows pole checkbox for qualifying', () => {
      const wrapper = mount(ResultEntryTable, {
        props: {
          results: [],
          drivers: [],
          isQualifying: true,
          selectedDriverIds: new Set(),
          raceTimesRequired: false,
        },
      });

      expect(wrapper.text()).toContain('Pole');
    });
  });

  describe('DNF handling', () => {
    it('moves DNF drivers to bottom when times not required', async () => {
      // Test implementation
    });
  });

  describe('pole position', () => {
    it('auto-moves driver to P1 when pole checked', async () => {
      // Test implementation
    });
  });

  describe('fastest lap exclusivity', () => {
    it('unchecks other drivers when fastest lap checked', async () => {
      // Test implementation
    });
  });
});
```

### 9.2 Composable Tests

**File:** `resources/app/js/composables/__tests__/useDragAndDropResults.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { ref } from 'vue';
import { useDragAndDropResults } from '../useDragAndDropResults';

describe('useDragAndDropResults', () => {
  it('separates finishers and DNFs', () => {
    const results = ref([
      { driver_id: 1, dnf: false, position: 1 },
      { driver_id: 2, dnf: true, position: null },
      { driver_id: 3, dnf: false, position: 2 },
    ]);

    const { finishers, dnfs } = useDragAndDropResults(results, ref(false));

    expect(finishers.value).toHaveLength(2);
    expect(dnfs.value).toHaveLength(1);
  });

  it('assigns positions correctly', () => {
    const results = ref([
      { driver_id: 1, dnf: false },
      { driver_id: 2, dnf: false },
      { driver_id: 3, dnf: true },
    ]);

    const { assignPositions } = useDragAndDropResults(results, ref(false));

    const assigned = assignPositions(results.value);

    expect(assigned[0].position).toBe(1);
    expect(assigned[1].position).toBe(2);
    expect(assigned[2].position).toBeNull();
  });
});
```

---

## Phase 10: Accessibility

### 10.1 Keyboard Navigation for Drag-and-Drop

```vue
<script setup lang="ts">
// Add keyboard support for reordering
const handleKeyDown = (event: KeyboardEvent, index: number) => {
  if (event.key === 'ArrowUp' && index > 0) {
    event.preventDefault();
    moveItem(index, index - 1);
  } else if (event.key === 'ArrowDown' && index < orderedResults.value.length - 1) {
    event.preventDefault();
    moveItem(index, index + 1);
  }
};
</script>

<template>
  <tr
    tabindex="0"
    role="row"
    :aria-label="`Position ${index + 1}: ${driverName}`"
    @keydown="handleKeyDown($event, index)"
  >
    <!-- ... -->
  </tr>
</template>
```

### 10.2 Screen Reader Announcements

```typescript
// Announce position changes
const announcePositionChange = (driverName: string, newPosition: number) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.textContent = `${driverName} moved to position ${newPosition}`;
  document.body.appendChild(announcement);
  setTimeout(() => announcement.remove(), 1000);
};
```

---

## File Summary

### New Files
- `resources/app/js/components/result/ResultRow.vue`
- `resources/app/js/composables/useDragAndDropResults.ts`
- `resources/app/js/composables/useFastestLapExclusivity.ts`
- `resources/app/js/composables/__tests__/useDragAndDropResults.test.ts`

### Modified Files
- `resources/app/js/types/season.ts`
- `resources/app/js/components/result/ResultEntryTable.vue`
- `resources/app/js/components/result/RaceResultModal.vue`
- `resources/app/js/components/result/ResultDivisionTabs.vue`
- `resources/app/js/views/SeasonForm.vue` (or equivalent)
- `resources/app/js/views/RoundResults.vue` (or equivalent)
- `resources/app/js/components/result/__tests__/ResultEntryTable.test.ts`

### Dependencies to Install
```bash
npm install vuedraggable@next
```

---

## Implementation Checklist

- [ ] Install vuedraggable package
- [ ] Update Season types
- [ ] Create ResultRow component
- [ ] Update ResultEntryTable with drag-and-drop
- [ ] Implement DNF auto-positioning logic
- [ ] Implement pole auto-move logic
- [ ] Implement fastest lap mutual exclusivity
- [ ] Create useDragAndDropResults composable
- [ ] Create useFastestLapExclusivity composable
- [ ] Update RaceResultModal to pass props
- [ ] Update Season form with toggle
- [ ] Update Round results view
- [ ] Write unit tests
- [ ] Test accessibility features
- [ ] Run linting: `npm run lint:app`
- [ ] Run type check: `npm run type-check`
- [ ] Run tests: `npm run test:app`

---

## Commands to Run

```bash
# Install dependency
npm install vuedraggable@next

# Development
npm run dev

# Linting
npm run lint:app -- --fix

# Type checking
npm run type-check

# Testing
npm run test:app
npm run test:app -- --coverage
```
