# Qualifying Support - Frontend Implementation Plan

**Version**: 1.0
**Date**: 2025-10-25
**Status**: Draft

## Table of Contents

1. [Overview](#overview)
2. [Type System Updates](#type-system-updates)
3. [Component Architecture](#component-architecture)
4. [QualifierListItem Component](#qualifierlistitem-component)
5. [RaceFormDrawer Modifications](#raceformdrawer-modifications)
6. [RoundsPanel Modifications](#roundspanel-modifications)
7. [Validation Updates](#validation-updates)
8. [Store Integration](#store-integration)
9. [Bonus Points Logic](#bonus-points-logic)
10. [Visual Design](#visual-design)
11. [User Flow](#user-flow)
12. [Testing Strategy](#testing-strategy)
13. [Implementation Checklist](#implementation-checklist)
14. [Code Examples](#code-examples)

---

## Overview

### Goal

Add support for creating and managing qualifying sessions for rounds in the user dashboard. Qualifiers should appear above races in the RoundsPanel component with distinct visual styling.

### Architectural Approach

**REUSE RaceFormDrawer.vue** with a `raceType` prop rather than creating a separate component. This approach:
- Reduces code duplication (90% of the form is identical)
- Simplifies maintenance
- Ensures consistency between race and qualifier forms
- Follows DRY principles

### Key Differences: Qualifier vs Race

| Aspect | Qualifier | Race |
|--------|-----------|------|
| **race_type** field | Always `'qualifying'` | Can be `'sprint'`, `'feature'`, `'endurance'`, `'custom'` |
| **Bonus Points** | Pole position ONLY | Pole position + Fastest lap |
| **race_number** auto-increment | Always `0` (qualifier is always first) | Starts from `1` |
| **Visual styling** | Blue/purple theme, qualifier icon | Green theme, race icon |
| **Position in list** | Above races | Below qualifier |

---

## Type System Updates

### File: `/var/www/resources/app/js/types/race.ts`

#### 1. Add `is_qualifier` Computed Helper

Since qualifiers are races with `race_type === 'qualifying'` and `race_number === 0`, we should add a helper function:

```typescript
/**
 * Check if a race is a qualifier
 */
export function isQualifier(race: Race): boolean {
  return race.race_type === 'qualifying' && race.race_number === 0;
}
```

**Location**: Add after the `F1_STANDARD_POINTS` constant (line 199)

#### 2. Update `RaceForm` Interface (Optional Enhancement)

Consider adding a computed `isQualifierForm` property to the form state:

```typescript
export interface RaceForm {
  // ... existing fields ...
  race_notes: string;

  // Optional: internal flag to track form mode
  _isQualifier?: boolean; // Underscore prefix indicates internal use
}
```

**Note**: This is optional. The `raceType` prop on RaceFormDrawer can manage this state.

---

## Component Architecture

### Modified Components

1. **RoundsPanel.vue** - Add qualifier section above races
2. **RaceFormDrawer.vue** - Add `raceType` prop for conditional rendering
3. **useRaceValidation.ts** - Update validation logic for qualifiers

### New Components

1. **QualifierListItem.vue** - Display component for qualifiers (similar to RaceListItem.vue)

### Component Hierarchy

```
RoundsPanel.vue
├── RoundFormDrawer.vue (existing)
├── RaceFormDrawer.vue (modified)
│   ├── Props: raceType: 'race' | 'qualifier'
│   └── Conditional sections based on raceType
├── QualifierListItem.vue (NEW)
│   ├── Props: race (qualifier)
│   └── Emits: edit, delete
└── RaceListItem.vue (existing)
    ├── Props: race
    └── Emits: edit, delete
```

---

## QualifierListItem Component

### File: `/var/www/resources/app/js/components/round/QualifierListItem.vue`

### Purpose

Display a qualifier session with distinct styling from regular races.

### Props

```typescript
interface Props {
  race: Race; // The qualifier (race with race_type === 'qualifying')
}
```

### Emits

```typescript
interface Emits {
  (e: 'edit', race: Race): void;
  (e: 'delete', race: Race): void;
}
```

### Visual Design

- **Background**: `bg-blue-50` or `bg-purple-50` (lighter than races)
- **Border**: `border-blue-200` or `border-purple-200`
- **Tag**: "Qualifying" with `severity="info"` (blue theme)
- **Icon**: `pi pi-stopwatch` or `pi pi-flag` to distinguish from races

### Key Information to Display

1. **Name**: "Qualifying" or custom name
2. **Format**: Qualifying format (Standard, Time Trial, etc.)
3. **Length**: Duration in minutes
4. **Tire**: Tire compound (if specified)
5. **Weather**: Weather conditions (if specified)
6. **Divisions**: Badge if divisions enabled
7. **Pole Bonus**: Show if pole position bonus is enabled

### Code Example

```vue
<template>
  <div
    class="p-4 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
  >
    <div class="flex items-center justify-between">
      <div class="flex-1">
        <div class="flex items-center gap-3 mb-2">
          <i class="pi pi-stopwatch text-blue-600"></i>
          <Tag value="Qualifying" severity="info" />
          <span class="font-medium text-blue-900">{{ race.name || 'Qualifying Session' }}</span>
        </div>

        <div class="grid grid-cols-2 gap-2 text-sm text-gray-600">
          <div>
            <span class="font-medium">Format:</span>
            {{ formatQualifying(race) }}
          </div>
          <div v-if="race.qualifying_length">
            <span class="font-medium">Duration:</span>
            {{ race.qualifying_length }} minutes
          </div>
          <div v-if="race.qualifying_tire">
            <span class="font-medium">Tire:</span>
            {{ race.qualifying_tire }}
          </div>
          <div v-if="race.weather">
            <span class="font-medium">Weather:</span>
            {{ race.weather }}
          </div>
        </div>

        <div class="flex gap-2 mt-2">
          <Tag v-if="race.race_divisions" value="Divisions Enabled" severity="info" />
          <Tag v-if="hasPoleBonus" value="Pole Bonus" severity="success" />
        </div>
      </div>

      <div class="flex items-center gap-2 ml-4">
        <Button
          v-tooltip.top="'Edit Qualifying'"
          icon="pi pi-pencil"
          text
          rounded
          size="small"
          severity="secondary"
          @click="handleEdit"
        />
        <Button
          v-tooltip.top="'Delete Qualifying'"
          icon="pi pi-trash"
          text
          rounded
          size="small"
          severity="danger"
          @click="handleDelete"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import type { Race } from '@app/types/race';
import { QUALIFYING_FORMAT_OPTIONS } from '@app/types/race';

interface Props {
  race: Race;
}

interface Emits {
  (e: 'edit', race: Race): void;
  (e: 'delete', race: Race): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const hasPoleBonus = computed(() => {
  return !!props.race.bonus_points?.pole;
});

function formatQualifying(race: Race): string {
  const option = QUALIFYING_FORMAT_OPTIONS.find((opt) => opt.value === race.qualifying_format);
  return option?.label || race.qualifying_format;
}

function handleEdit(): void {
  emit('edit', props.race);
}

function handleDelete(): void {
  emit('delete', props.race);
}
</script>
```

---

## RaceFormDrawer Modifications

### File: `/var/www/resources/app/js/components/round/modals/RaceFormDrawer.vue`

### 1. Add `raceType` Prop

**Location**: Props interface (around line 643)

```typescript
interface Props {
  visible: boolean;
  roundId: number;
  platformId: number;
  race?: Race | null;
  mode?: 'create' | 'edit';
  raceType?: 'race' | 'qualifier'; // NEW PROP
}

const props = withDefaults(defineProps<Props>(), {
  race: null,
  mode: 'create',
  raceType: 'race', // Default to 'race'
});
```

### 2. Computed Property for Conditional Rendering

**Location**: After `localVisible` computed (around line 711)

```typescript
const isQualifier = computed(() => props.raceType === 'qualifier');
```

### 3. Update Header Title

**Location**: Template header (line 4)

```vue
<template #header>
  <h2 class="font-semibold">
    {{ mode === 'edit'
      ? (isQualifier ? 'Edit Qualifying' : 'Edit Race')
      : (isQualifier ? 'Create Qualifying' : 'Create Race')
    }}
  </h2>
</template>
```

### 4. Conditional Section Visibility

#### Section 1: Basic Details - Modify Race Type Field

**Location**: Lines 43-56

```vue
<!-- Race Type (hide for qualifiers) -->
<div v-if="!isQualifier">
  <FormLabel for="race_type" text="Race Type" />
  <Dropdown
    id="race_type"
    v-model="form.race_type"
    :options="RACE_TYPE_OPTIONS"
    option-label="label"
    option-value="value"
    placeholder="Select race type"
    class="w-full"
  />
</div>
```

#### Section 3: Starting Grid - Conditional Display

**Location**: Lines 117-157

```vue
<!-- Section 3: Starting Grid (not needed for qualifiers) -->
<Accordion v-if="!isQualifier" :value="['grid']" :multiple="true">
  <!-- ... existing grid section ... -->
</Accordion>
```

#### Section 6: Penalties & Rules - Hide Mandatory Pit Stop for Qualifiers

**Location**: Lines 345-367

```vue
<!-- Mandatory Pit Stop (not applicable to qualifiers) -->
<div v-if="!isQualifier" class="flex items-center gap-2">
  <Checkbox
    id="mandatory_pit_stop"
    v-model="form.mandatory_pit_stop"
    :binary="true"
  />
  <label for="mandatory_pit_stop">Mandatory pit stop</label>
</div>

<!-- Minimum Pit Time (conditional) -->
<div v-if="!isQualifier && form.mandatory_pit_stop">
  <!-- ... existing minimum pit time field ... -->
</div>
```

#### Section 9: Bonus Points - Conditional Fields

**Location**: Lines 476-529

```vue
<AccordionContent>
  <div class="space-y-4">
    <!-- Pole Position Bonus (for all types) -->
    <div class="flex items-center gap-4">
      <Checkbox id="bonus_pole" v-model="form.bonus_pole" :binary="true" />
      <label for="bonus_pole">Pole position bonus</label>
      <InputNumber
        v-if="form.bonus_pole"
        v-model="form.bonus_pole_points"
        :min="1"
        :max="99"
        placeholder="Points"
        class="w-32"
      />
    </div>

    <!-- Fastest Lap Bonus (ONLY for races, NOT qualifiers) -->
    <div v-if="!isQualifier" class="space-y-2">
      <div class="flex items-center gap-4">
        <Checkbox
          id="bonus_fastest_lap"
          v-model="form.bonus_fastest_lap"
          :binary="true"
        />
        <label for="bonus_fastest_lap">Fastest lap bonus</label>
        <InputNumber
          v-if="form.bonus_fastest_lap"
          v-model="form.bonus_fastest_lap_points"
          :min="1"
          :max="99"
          placeholder="Points"
          class="w-32"
        />
      </div>
      <div v-if="form.bonus_fastest_lap" class="ml-8">
        <Checkbox
          id="bonus_fastest_lap_top_10"
          v-model="form.bonus_fastest_lap_top_10"
          :binary="true"
        />
        <label for="bonus_fastest_lap_top_10" class="ml-2"
          >Only award if driver finishes in top 10</label
        >
      </div>
    </div>

    <!-- Info message for qualifiers -->
    <Message v-if="isQualifier" severity="info" :closable="false">
      Only pole position bonus is available for qualifying sessions. Fastest lap bonus is only available for races.
    </Message>
  </div>
</AccordionContent>
```

### 5. Update Form Initialization

**Location**: `resetForm()` function (around line 816)

```typescript
function resetForm(): void {
  form.race_number = isQualifier.value ? 0 : 1; // Qualifiers always have race_number 0
  form.name = '';
  form.race_type = isQualifier.value ? 'qualifying' : null; // Set race_type for qualifiers
  form.qualifying_format = 'standard';
  form.qualifying_length = 15;
  form.qualifying_tire = '';
  form.grid_source = isQualifier.value ? 'qualifying' : 'qualifying'; // Qualifiers use 'qualifying'
  form.grid_source_race_id = null;
  form.length_type = 'laps';
  form.length_value = 20;
  // ... rest remains the same ...
}
```

### 6. Update Watch Effect

**Location**: `watch(() => props.visible, ...)` (around line 745)

```typescript
watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      clearErrors();
      await loadPlatformSettings();
      if (props.race) {
        loadRaceIntoForm(props.race);
      } else {
        resetForm();
        // Auto-calculate next race number (skip for qualifiers)
        if (!isQualifier.value) {
          const roundRaces = raceStore.racesByRoundId(props.roundId);
          // Filter out qualifiers (race_number !== 0)
          const actualRaces = roundRaces.filter(r => r.race_number !== 0);
          form.race_number = actualRaces.length + 1;
        }
      }
    }
  },
);
```

### 7. Update Save Handler

**Location**: `handleSave()` function (around line 869)

```typescript
async function handleSave(): Promise<void> {
  if (!validateAll()) {
    return;
  }

  saving.value = true;
  try {
    const bonusPoints: BonusPoints = {};
    if (form.bonus_pole) {
      bonusPoints.pole = form.bonus_pole_points;
    }
    // Only include fastest lap bonus for races (not qualifiers)
    if (!isQualifier.value && form.bonus_fastest_lap) {
      bonusPoints.fastest_lap = form.bonus_fastest_lap_points;
      bonusPoints.fastest_lap_top_10_only = form.bonus_fastest_lap_top_10;
    }

    const payload: CreateRaceRequest | UpdateRaceRequest = {
      race_number: isQualifier.value ? 0 : form.race_number,
      name: form.name || undefined,
      race_type: isQualifier.value ? 'qualifying' : (form.race_type || undefined),
      qualifying_format: form.qualifying_format,
      qualifying_length:
        form.qualifying_format !== 'none' && form.qualifying_format !== 'previous_race'
          ? form.qualifying_length
          : undefined,
      qualifying_tire: form.qualifying_tire || undefined,
      grid_source: isQualifier.value ? 'qualifying' : form.grid_source,
      grid_source_race_id: !isQualifier.value && requiresGridSourceRace.value
        ? form.grid_source_race_id || undefined
        : undefined,
      length_type: form.length_type,
      length_value: form.length_value,
      extra_lap_after_time: form.extra_lap_after_time,
      weather: form.weather || undefined,
      tire_restrictions: form.tire_restrictions || undefined,
      fuel_usage: form.fuel_usage || undefined,
      damage_model: form.damage_model || undefined,
      track_limits_enforced: form.track_limits_enforced,
      false_start_detection: form.false_start_detection,
      collision_penalties: form.collision_penalties,
      mandatory_pit_stop: !isQualifier.value && form.mandatory_pit_stop,
      minimum_pit_time: !isQualifier.value && form.mandatory_pit_stop ? form.minimum_pit_time : undefined,
      assists_restrictions: form.assists_restrictions || undefined,
      race_divisions: form.race_divisions,
      points_system: form.points_system,
      bonus_points: Object.keys(bonusPoints).length > 0 ? bonusPoints : undefined,
      dnf_points: form.dnf_points,
      dns_points: form.dns_points,
      race_notes: form.race_notes || undefined,
    };

    if (props.mode === 'edit' && props.race) {
      await raceStore.updateExistingRace(props.race.id, payload);
    } else {
      await raceStore.createNewRace(props.roundId, payload as CreateRaceRequest);
    }

    emit('saved');
    localVisible.value = false;
  } catch (error) {
    console.error('Failed to save:', error);
  } finally {
    saving.value = false;
  }
}
```

### 8. Update Footer Button Label

**Location**: Template footer (around line 595)

```vue
<template #footer>
  <div class="flex justify-end gap-2">
    <Button label="Cancel" severity="secondary" :disabled="saving" @click="handleCancel" />
    <Button
      :label="mode === 'edit'
        ? (isQualifier ? 'Update Qualifying' : 'Update Race')
        : (isQualifier ? 'Create Qualifying' : 'Create Race')
      "
      :loading="saving"
      @click="handleSave"
    />
  </div>
</template>
```

---

## RoundsPanel Modifications

### File: `/var/www/resources/app/js/components/round/RoundsPanel.vue`

### 1. Add QualifierListItem Import

**Location**: Script imports (around line 184)

```typescript
import QualifierListItem from './QualifierListItem.vue';
```

### 2. Add State for Qualifier Form

**Location**: After race form state (around line 220)

```typescript
// Race form state
const showRaceFormDrawer = ref(false);
const selectedRace = ref<Race | null>(null);
const selectedRoundId = ref<number | null>(null);
const raceFormMode = ref<'create' | 'edit'>('create');
const raceFormType = ref<'race' | 'qualifier'>('race'); // NEW STATE
const loadingRaces = ref(false);
```

### 3. Add Computed Helper Functions

**Location**: After `rounds` computed (around line 227)

```typescript
function getQualifier(roundId: number): Race | null {
  const races = raceStore.racesByRoundId(roundId);
  return races.find((race) => race.race_number === 0 && race.race_type === 'qualifying') || null;
}

function getRaces(roundId: number): Race[] {
  return raceStore
    .racesByRoundId(roundId)
    .filter((race) => race.race_number !== 0) // Exclude qualifiers
    .sort((a, b) => a.race_number - b.race_number);
}
```

### 4. Add Qualifier Section to Template

**Location**: Inside AccordionTab, BEFORE the Races section (before line 108)

```vue
<!-- Qualifier Section -->
<div>
  <div class="flex items-center justify-between mb-3">
    <h3 class="font-semibold flex items-center gap-2">
      <i class="pi pi-stopwatch text-blue-600"></i>
      Qualifying
    </h3>
    <Button
      v-if="!getQualifier(round.id)"
      label="Add Qualifying"
      icon="pi pi-plus"
      size="small"
      outlined
      severity="info"
      @click="handleCreateQualifier(round.id)"
    />
  </div>

  <div v-if="loadingRaces" class="mb-4">
    <Skeleton height="4rem" />
  </div>

  <div
    v-else-if="!getQualifier(round.id)"
    class="text-sm text-gray-500 text-center py-4 mb-4 bg-blue-50 rounded-lg border border-blue-200"
  >
    <i class="pi pi-info-circle mr-2"></i>
    No qualifying session configured
  </div>

  <div v-else class="mb-4">
    <QualifierListItem
      :race="getQualifier(round.id)!"
      @edit="handleEditQualifier"
      @delete="handleDeleteQualifier"
    />
  </div>
</div>

<Divider />

<!-- Races Section -->
<div>
  <!-- ... existing races section ... -->
</div>
```

### 5. Add Handler Functions

**Location**: After existing race handlers (around line 365)

```typescript
function handleCreateQualifier(roundId: number): void {
  selectedRoundId.value = roundId;
  selectedRace.value = null;
  raceFormMode.value = 'create';
  raceFormType.value = 'qualifier'; // Set type to qualifier
  showRaceFormDrawer.value = true;
}

function handleEditQualifier(qualifier: Race): void {
  selectedRoundId.value = qualifier.round_id;
  selectedRace.value = qualifier;
  raceFormMode.value = 'edit';
  raceFormType.value = 'qualifier'; // Set type to qualifier
  showRaceFormDrawer.value = true;
}

function handleDeleteQualifier(qualifier: Race): void {
  confirm.require({
    group: 'race-delete',
    message: `Are you sure you want to delete the qualifying session${qualifier.name ? ` - ${qualifier.name}` : ''}?`,
    header: 'Confirm Delete',
    icon: 'pi pi-exclamation-triangle',
    rejectClass: 'p-button-secondary p-button-outlined',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await raceStore.deleteExistingRace(qualifier.id);
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Qualifying session deleted successfully',
          life: 3000,
        });
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error instanceof Error ? error.message : 'Failed to delete qualifying session',
          life: 5000,
        });
      }
    },
  });
}

// Update existing handleCreateRace to set type
function handleCreateRace(roundId: number): void {
  selectedRoundId.value = roundId;
  selectedRace.value = null;
  raceFormMode.value = 'create';
  raceFormType.value = 'race'; // Set type to race
  showRaceFormDrawer.value = true;
}

// Update existing handleEditRace to set type
function handleEditRace(race: Race): void {
  selectedRoundId.value = race.round_id;
  selectedRace.value = race;
  raceFormMode.value = 'edit';
  raceFormType.value = 'race'; // Set type to race
  showRaceFormDrawer.value = true;
}
```

### 6. Update RaceFormDrawer Component Call

**Location**: Template (around line 161)

```vue
<!-- Race Form Drawer (now handles both races and qualifiers) -->
<RaceFormDrawer
  v-if="selectedRoundId"
  v-model:visible="showRaceFormDrawer"
  :round-id="selectedRoundId"
  :platform-id="platformId"
  :race="selectedRace"
  :mode="raceFormMode"
  :race-type="raceFormType"
  @saved="handleRaceSaved"
/>
```

### 7. Update `handleRaceSaved` Function

**Location**: Around line 366

```typescript
async function handleRaceSaved(): Promise<void> {
  showRaceFormDrawer.value = false;
  selectedRace.value = null;
  selectedRoundId.value = null;

  const entityType = raceFormType.value === 'qualifier' ? 'Qualifying session' : 'Race';
  const action = raceFormMode.value === 'edit' ? 'updated' : 'created';

  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: `${entityType} ${action} successfully`,
    life: 3000,
  });
}
```

---

## Validation Updates

### File: `/var/www/resources/app/js/composables/useRaceValidation.ts`

### 1. Add `isQualifier` Parameter

**Location**: Function signature (line 4)

```typescript
export function useRaceValidation(form: RaceForm, isQualifier = false) {
  const errors = reactive<RaceFormErrors>({});
  // ... rest of the code
}
```

### 2. Update `validateRaceNumber` Function

**Location**: Lines 7-15

```typescript
function validateRaceNumber(): string | undefined {
  // Skip validation for qualifiers (always 0)
  if (isQualifier) {
    return undefined;
  }

  if (!form.race_number) {
    return 'Race number is required';
  }
  if (form.race_number < 1 || form.race_number > 99) {
    return 'Race number must be between 1 and 99';
  }
  return undefined;
}
```

### 3. Update `validateMinimumPitTime` Function

**Location**: Lines 63-78

```typescript
function validateMinimumPitTime(): string | undefined {
  // Skip validation for qualifiers (no pit stops)
  if (isQualifier) {
    return undefined;
  }

  // Only validate if mandatory pit stop is enabled
  if (!form.mandatory_pit_stop) {
    return undefined;
  }

  if (!form.minimum_pit_time || form.minimum_pit_time <= 0) {
    return 'Minimum pit time must be a positive number when mandatory pit stop is enabled';
  }

  if (form.minimum_pit_time > 999) {
    return 'Minimum pit time cannot exceed 999 seconds';
  }

  return undefined;
}
```

---

## Store Integration

### File: `/var/www/resources/app/js/stores/raceStore.ts`

**No changes needed**. The existing raceStore handles both races and qualifiers since they use the same `Race` type and API endpoints. The only difference is:

- Qualifiers have `race_number === 0`
- Qualifiers have `race_type === 'qualifying'`

The store's `racesByRoundId` getter already returns all races for a round, which can be filtered in the component layer.

**Optional Enhancement**: Add computed getters for convenience:

```typescript
// Getters
const qualifierByRoundId = computed(() => {
  return (roundId: number) =>
    races.value.find((race) => race.round_id === roundId && race.race_number === 0);
});

const racesByRoundIdExcludingQualifier = computed(() => {
  return (roundId: number) =>
    races.value
      .filter((race) => race.round_id === roundId && race.race_number !== 0)
      .sort((a, b) => a.race_number - b.race_number);
});
```

**Location**: After `getRaceById` computed (around line 23)

---

## Bonus Points Logic

### Business Rules

1. **Pole Position Bonus**
   - **Races**: Available (optional)
   - **Qualifiers**: Available (optional)
   - **Reason**: Pole position is determined by qualifying results

2. **Fastest Lap Bonus**
   - **Races**: Available (optional)
   - **Qualifiers**: NOT available (hidden)
   - **Reason**: Fastest lap is a race-specific metric

### Implementation Details

#### In RaceFormDrawer.vue

**Section 9: Bonus Points** (lines 476-529)

```vue
<AccordionContent>
  <div class="space-y-4">
    <!-- Pole Position Bonus - ALWAYS VISIBLE -->
    <div class="flex items-center gap-4">
      <Checkbox id="bonus_pole" v-model="form.bonus_pole" :binary="true" />
      <label for="bonus_pole">Pole position bonus</label>
      <InputNumber
        v-if="form.bonus_pole"
        v-model="form.bonus_pole_points"
        :min="1"
        :max="99"
        placeholder="Points"
        class="w-32"
      />
    </div>

    <!-- Fastest Lap Bonus - ONLY FOR RACES (v-if="!isQualifier") -->
    <div v-if="!isQualifier" class="space-y-2">
      <div class="flex items-center gap-4">
        <Checkbox
          id="bonus_fastest_lap"
          v-model="form.bonus_fastest_lap"
          :binary="true"
        />
        <label for="bonus_fastest_lap">Fastest lap bonus</label>
        <InputNumber
          v-if="form.bonus_fastest_lap"
          v-model="form.bonus_fastest_lap_points"
          :min="1"
          :max="99"
          placeholder="Points"
          class="w-32"
        />
      </div>
      <!-- Top 10 restriction -->
      <div v-if="form.bonus_fastest_lap" class="ml-8">
        <Checkbox
          id="bonus_fastest_lap_top_10"
          v-model="form.bonus_fastest_lap_top_10"
          :binary="true"
        />
        <label for="bonus_fastest_lap_top_10" class="ml-2">
          Only award if driver finishes in top 10
        </label>
      </div>
    </div>

    <!-- Info Message for Qualifiers -->
    <Message v-if="isQualifier" severity="info" :closable="false">
      Only pole position bonus is available for qualifying sessions. Fastest lap bonus is only available for races.
    </Message>
  </div>
</AccordionContent>
```

#### In `handleSave()` Function

```typescript
const bonusPoints: BonusPoints = {};

// Pole position - available for both races and qualifiers
if (form.bonus_pole) {
  bonusPoints.pole = form.bonus_pole_points;
}

// Fastest lap - ONLY for races, NOT qualifiers
if (!isQualifier.value && form.bonus_fastest_lap) {
  bonusPoints.fastest_lap = form.bonus_fastest_lap_points;
  bonusPoints.fastest_lap_top_10_only = form.bonus_fastest_lap_top_10;
}
```

### Visual Indicators

In QualifierListItem.vue, show a badge when pole bonus is enabled:

```vue
<Tag v-if="hasPoleBonus" value="Pole Bonus" severity="success" />
```

---

## Visual Design

### Color Scheme

#### Qualifier (QualifierListItem.vue)

```css
Background: bg-blue-50 hover:bg-blue-100
Border: border-blue-200
Tag: severity="info" (blue theme)
Icon: text-blue-600
Text: text-blue-900
```

#### Race (RaceListItem.vue)

```css
Background: bg-gray-50 hover:bg-gray-100
Border: border-gray-200
Tag: severity="success" (green theme)
Icon: (none currently)
Text: (default)
```

### Icons

- **Qualifier**: `pi pi-stopwatch` (represents timing/qualifying)
- **Race**: `pi pi-flag-fill` (optional enhancement)

### Spacing

- **Qualifier section**: Display ABOVE races
- **Divider**: Between qualifier and races sections
- **Empty state**: Styled with blue theme to match qualifier styling

### Responsive Design

All components use the existing grid system:
- `grid grid-cols-2` for information display
- Responsive gap utilities (`gap-2`, `gap-3`, `gap-4`)
- Mobile-friendly button placement

---

## User Flow

### Creating a Qualifying Session

1. User navigates to Season Detail page
2. User expands a Round in the RoundsPanel
3. User sees "Qualifying" section (empty state)
4. User clicks "Add Qualifying" button
5. RaceFormDrawer opens with `raceType="qualifier"`
6. Form shows:
   - Basic details (name optional, race type hidden)
   - Qualifying configuration (format, length, tire)
   - Platform settings (weather, damage, etc.)
   - Penalties & Rules (track limits, etc., NO pit stops)
   - Division support
   - Points system
   - Bonus points (ONLY pole position)
   - DNF/DNS points
   - Notes
7. User fills form and clicks "Create Qualifying"
8. Qualifier saves with `race_number: 0`, `race_type: 'qualifying'`
9. QualifierListItem displays above races
10. Toast confirms success

### Editing a Qualifying Session

1. User clicks pencil icon on QualifierListItem
2. RaceFormDrawer opens with existing qualifier data
3. User modifies fields
4. User clicks "Update Qualifying"
5. Qualifier updates in database
6. QualifierListItem refreshes
7. Toast confirms success

### Deleting a Qualifying Session

1. User clicks trash icon on QualifierListItem
2. ConfirmDialog appears with custom message
3. User confirms deletion
4. Qualifier deleted from database
5. QualifierListItem removed from display
6. Empty state appears
7. Toast confirms success

### Creating a Race (After Qualifier Exists)

1. User sees qualifier at top of round
2. User scrolls down to "Races" section
3. User clicks "Add Race" button
4. RaceFormDrawer opens with `raceType="race"`
5. Form shows all sections (including grid source, pit stops, fastest lap bonus)
6. User creates race
7. Race appears BELOW qualifier

---

## Testing Strategy

### Unit Tests

#### 1. QualifierListItem Component Tests

**File**: `/var/www/resources/app/js/components/round/__tests__/QualifierListItem.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import QualifierListItem from '../QualifierListItem.vue';
import type { Race } from '@app/types/race';

const mockQualifier: Race = {
  id: 1,
  round_id: 1,
  race_number: 0,
  race_type: 'qualifying',
  name: 'Qualifying Session',
  qualifying_format: 'standard',
  qualifying_length: 15,
  qualifying_tire: 'Soft',
  grid_source: 'qualifying',
  grid_source_race_id: null,
  length_type: 'laps',
  length_value: 20,
  extra_lap_after_time: false,
  weather: 'Clear',
  tire_restrictions: null,
  fuel_usage: null,
  damage_model: null,
  track_limits_enforced: true,
  false_start_detection: true,
  collision_penalties: true,
  mandatory_pit_stop: false,
  minimum_pit_time: null,
  assists_restrictions: null,
  race_divisions: true,
  points_system: { 1: 25, 2: 18, 3: 15 },
  bonus_points: { pole: 1 },
  dnf_points: 0,
  dns_points: 0,
  race_notes: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

describe('QualifierListItem', () => {
  it('renders qualifier name correctly', () => {
    const wrapper = mount(QualifierListItem, {
      props: { race: mockQualifier },
    });
    expect(wrapper.text()).toContain('Qualifying Session');
  });

  it('displays qualifying format', () => {
    const wrapper = mount(QualifierListItem, {
      props: { race: mockQualifier },
    });
    expect(wrapper.text()).toContain('Standard Qualifying');
  });

  it('shows pole bonus tag when enabled', () => {
    const wrapper = mount(QualifierListItem, {
      props: { race: mockQualifier },
    });
    expect(wrapper.text()).toContain('Pole Bonus');
  });

  it('emits edit event when edit button clicked', async () => {
    const wrapper = mount(QualifierListItem, {
      props: { race: mockQualifier },
    });
    await wrapper.find('[data-pc-section="button"]').trigger('click');
    expect(wrapper.emitted('edit')).toBeTruthy();
    expect(wrapper.emitted('edit')?.[0]).toEqual([mockQualifier]);
  });

  it('emits delete event when delete button clicked', async () => {
    const wrapper = mount(QualifierListItem, {
      props: { race: mockQualifier },
    });
    const buttons = wrapper.findAll('[data-pc-section="button"]');
    await buttons[1].trigger('click');
    expect(wrapper.emitted('delete')).toBeTruthy();
  });
});
```

#### 2. RaceFormDrawer Tests (Qualifier Mode)

**File**: `/var/www/resources/app/js/components/round/modals/__tests__/RaceFormDrawer.test.ts`

Add new test cases:

```typescript
describe('RaceFormDrawer - Qualifier Mode', () => {
  it('hides race type field when raceType is qualifier', () => {
    const wrapper = mount(RaceFormDrawer, {
      props: {
        visible: true,
        roundId: 1,
        platformId: 1,
        raceType: 'qualifier',
      },
    });
    expect(wrapper.find('#race_type').exists()).toBe(false);
  });

  it('hides starting grid section for qualifiers', () => {
    const wrapper = mount(RaceFormDrawer, {
      props: {
        visible: true,
        roundId: 1,
        platformId: 1,
        raceType: 'qualifier',
      },
    });
    expect(wrapper.text()).not.toContain('Starting Grid');
  });

  it('hides fastest lap bonus for qualifiers', () => {
    const wrapper = mount(RaceFormDrawer, {
      props: {
        visible: true,
        roundId: 1,
        platformId: 1,
        raceType: 'qualifier',
      },
    });
    expect(wrapper.find('#bonus_fastest_lap').exists()).toBe(false);
  });

  it('shows pole position bonus for qualifiers', () => {
    const wrapper = mount(RaceFormDrawer, {
      props: {
        visible: true,
        roundId: 1,
        platformId: 1,
        raceType: 'qualifier',
      },
    });
    expect(wrapper.find('#bonus_pole').exists()).toBe(true);
  });

  it('sets race_number to 0 for qualifiers', async () => {
    const wrapper = mount(RaceFormDrawer, {
      props: {
        visible: true,
        roundId: 1,
        platformId: 1,
        raceType: 'qualifier',
      },
    });
    // Check internal form state (may need to expose via test utils)
    expect(wrapper.vm.form.race_number).toBe(0);
  });

  it('displays qualifier-specific header text', () => {
    const wrapper = mount(RaceFormDrawer, {
      props: {
        visible: true,
        roundId: 1,
        platformId: 1,
        mode: 'create',
        raceType: 'qualifier',
      },
    });
    expect(wrapper.text()).toContain('Create Qualifying');
  });
});
```

#### 3. RoundsPanel Tests (Qualifier Integration)

**File**: `/var/www/resources/app/js/components/round/__tests__/RoundsPanel.test.ts`

```typescript
describe('RoundsPanel - Qualifier Support', () => {
  it('displays Add Qualifying button when no qualifier exists', () => {
    const wrapper = mount(RoundsPanel, {
      props: { seasonId: 1, platformId: 1 },
    });
    expect(wrapper.text()).toContain('Add Qualifying');
  });

  it('displays QualifierListItem when qualifier exists', async () => {
    // Mock store with qualifier
    const wrapper = mount(RoundsPanel, {
      props: { seasonId: 1, platformId: 1 },
    });
    // Assert QualifierListItem is rendered
  });

  it('opens form with raceType=qualifier when Add Qualifying clicked', async () => {
    const wrapper = mount(RoundsPanel, {
      props: { seasonId: 1, platformId: 1 },
    });
    await wrapper.find('[data-testid="add-qualifying-btn"]').trigger('click');
    expect(wrapper.vm.raceFormType).toBe('qualifier');
    expect(wrapper.vm.showRaceFormDrawer).toBe(true);
  });

  it('separates qualifier from races visually', () => {
    const wrapper = mount(RoundsPanel, {
      props: { seasonId: 1, platformId: 1 },
    });
    // Assert qualifier section is above races section
    // Assert divider exists between sections
  });
});
```

#### 4. Validation Tests

**File**: `/var/www/resources/app/js/composables/__tests__/useRaceValidation.test.ts`

```typescript
describe('useRaceValidation - Qualifier Mode', () => {
  it('skips race_number validation for qualifiers', () => {
    const form = reactive<RaceForm>({
      race_number: 0,
      // ... other fields
    });
    const { validateRaceNumber } = useRaceValidation(form, true); // isQualifier = true
    expect(validateRaceNumber()).toBeUndefined();
  });

  it('validates race_number for races', () => {
    const form = reactive<RaceForm>({
      race_number: 0,
      // ... other fields
    });
    const { validateRaceNumber } = useRaceValidation(form, false); // isQualifier = false
    expect(validateRaceNumber()).toBe('Race number is required');
  });

  it('skips pit stop validation for qualifiers', () => {
    const form = reactive<RaceForm>({
      mandatory_pit_stop: true,
      minimum_pit_time: 0,
      // ... other fields
    });
    const { validateMinimumPitTime } = useRaceValidation(form, true);
    expect(validateMinimumPitTime()).toBeUndefined();
  });
});
```

### Integration Tests

#### End-to-End Flow Test

**File**: `/var/www/tests/e2e/qualifying-workflow.spec.ts` (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Qualifying Session Workflow', () => {
  test('create, edit, and delete qualifier', async ({ page }) => {
    // 1. Navigate to season detail
    await page.goto('/seasons/1');

    // 2. Expand a round
    await page.click('text=Round 1');

    // 3. Click Add Qualifying
    await page.click('text=Add Qualifying');

    // 4. Fill form
    await page.fill('#name', 'Qualifying Session 1');
    await page.selectOption('#qualifying_format', 'standard');
    await page.fill('#qualifying_length', '15');

    // 5. Submit form
    await page.click('text=Create Qualifying');

    // 6. Verify qualifier appears
    await expect(page.locator('text=Qualifying Session 1')).toBeVisible();

    // 7. Edit qualifier
    await page.click('[aria-label="Edit Qualifying"]');
    await page.fill('#name', 'Updated Qualifying');
    await page.click('text=Update Qualifying');

    // 8. Verify update
    await expect(page.locator('text=Updated Qualifying')).toBeVisible();

    // 9. Delete qualifier
    await page.click('[aria-label="Delete Qualifying"]');
    await page.click('text=Delete'); // Confirm dialog

    // 10. Verify deletion
    await expect(page.locator('text=No qualifying session configured')).toBeVisible();
  });
});
```

### Manual Testing Checklist

- [ ] Create qualifier with all fields populated
- [ ] Create qualifier with minimal fields (only required)
- [ ] Edit qualifier and verify changes persist
- [ ] Delete qualifier and verify removal
- [ ] Create race after qualifier exists
- [ ] Verify qualifier appears above races
- [ ] Verify pole bonus appears for qualifiers
- [ ] Verify fastest lap bonus does NOT appear for qualifiers
- [ ] Verify fastest lap bonus DOES appear for races
- [ ] Test with divisions enabled
- [ ] Test with divisions disabled
- [ ] Verify all validation rules
- [ ] Test form cancellation
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Verify toast notifications
- [ ] Test error handling (network errors, validation errors)

---

## Implementation Checklist

### Phase 1: Type System & Infrastructure

- [ ] Update `/var/www/resources/app/js/types/race.ts`
  - [ ] Add `isQualifier()` helper function
  - [ ] (Optional) Add `_isQualifier` to `RaceForm` interface

### Phase 2: Create QualifierListItem Component

- [ ] Create `/var/www/resources/app/js/components/round/QualifierListItem.vue`
  - [ ] Implement template with blue theme styling
  - [ ] Add props and emits
  - [ ] Add computed properties (`hasPoleBonus`, `formatQualifying`)
  - [ ] Add event handlers
- [ ] Create test file `/var/www/resources/app/js/components/round/__tests__/QualifierListItem.test.ts`
  - [ ] Test rendering
  - [ ] Test event emissions
  - [ ] Test computed properties

### Phase 3: Modify RaceFormDrawer

- [ ] Update `/var/www/resources/app/js/components/round/modals/RaceFormDrawer.vue`
  - [ ] Add `raceType` prop to Props interface
  - [ ] Add `isQualifier` computed property
  - [ ] Update header title (conditional text)
  - [ ] Hide race type dropdown for qualifiers
  - [ ] Hide starting grid section for qualifiers
  - [ ] Hide mandatory pit stop for qualifiers
  - [ ] Conditionally hide fastest lap bonus
  - [ ] Add info message for qualifiers
  - [ ] Update `resetForm()` function
  - [ ] Update `watch` effect for auto race number
  - [ ] Update `handleSave()` payload construction
  - [ ] Update footer button labels
- [ ] Add tests to existing test file
  - [ ] Test qualifier mode rendering
  - [ ] Test field visibility
  - [ ] Test form submission with qualifier data

### Phase 4: Modify RoundsPanel

- [ ] Update `/var/www/resources/app/js/components/round/RoundsPanel.vue`
  - [ ] Import QualifierListItem
  - [ ] Add `raceFormType` state
  - [ ] Add `getQualifier()` helper function
  - [ ] Update `getRaces()` to exclude qualifiers
  - [ ] Add qualifier section to template
  - [ ] Add handlers: `handleCreateQualifier`, `handleEditQualifier`, `handleDeleteQualifier`
  - [ ] Update `handleCreateRace` to set `raceFormType`
  - [ ] Update `handleEditRace` to set `raceFormType`
  - [ ] Update `handleRaceSaved` for dynamic messaging
  - [ ] Pass `raceType` prop to RaceFormDrawer
- [ ] Add tests
  - [ ] Test qualifier section rendering
  - [ ] Test button click handlers
  - [ ] Test form opening with correct type

### Phase 5: Update Validation

- [ ] Update `/var/www/resources/app/js/composables/useRaceValidation.ts`
  - [ ] Add `isQualifier` parameter
  - [ ] Update `validateRaceNumber()` to skip for qualifiers
  - [ ] Update `validateMinimumPitTime()` to skip for qualifiers
- [ ] Add tests
  - [ ] Test validation skipping for qualifiers
  - [ ] Test validation enforcement for races

### Phase 6: (Optional) Store Enhancements

- [ ] Update `/var/www/resources/app/js/stores/raceStore.ts`
  - [ ] Add `qualifierByRoundId` computed getter
  - [ ] Add `racesByRoundIdExcludingQualifier` computed getter
- [ ] Update store tests

### Phase 7: Testing & QA

- [ ] Run all unit tests: `npm run test:user`
- [ ] Run type checking: `npm run type-check`
- [ ] Run linting: `npm run lint:user`
- [ ] Run formatting: `npm run format:user`
- [ ] Manual testing (all scenarios from checklist)
- [ ] E2E testing with Playwright
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Responsive design testing (mobile, tablet, desktop)
- [ ] Accessibility testing (keyboard navigation, screen readers)

### Phase 8: Documentation

- [ ] Update component documentation
- [ ] Add JSDoc comments to new functions
- [ ] Update user guide (if applicable)
- [ ] Add inline code comments for complex logic

---

## Code Examples

### Complete QualifierListItem.vue

See [Section 4: QualifierListItem Component](#qualifierlistitem-component) for full implementation.

### RaceFormDrawer Conditional Rendering Example

```vue
<!-- Section 9: Bonus Points -->
<Accordion :value="['bonus']" :multiple="true">
  <AccordionPanel value="bonus">
    <AccordionHeader>
      <span class="font-medium">Bonus Points</span>
    </AccordionHeader>
    <AccordionContent>
      <div class="space-y-4">
        <!-- Pole Position - Always visible -->
        <div class="flex items-center gap-4">
          <Checkbox id="bonus_pole" v-model="form.bonus_pole" :binary="true" />
          <label for="bonus_pole">Pole position bonus</label>
          <InputNumber
            v-if="form.bonus_pole"
            v-model="form.bonus_pole_points"
            :min="1"
            :max="99"
            placeholder="Points"
            class="w-32"
          />
        </div>

        <!-- Fastest Lap - Only for races -->
        <div v-if="!isQualifier" class="space-y-2">
          <div class="flex items-center gap-4">
            <Checkbox
              id="bonus_fastest_lap"
              v-model="form.bonus_fastest_lap"
              :binary="true"
            />
            <label for="bonus_fastest_lap">Fastest lap bonus</label>
            <InputNumber
              v-if="form.bonus_fastest_lap"
              v-model="form.bonus_fastest_lap_points"
              :min="1"
              :max="99"
              placeholder="Points"
              class="w-32"
            />
          </div>
          <div v-if="form.bonus_fastest_lap" class="ml-8">
            <Checkbox
              id="bonus_fastest_lap_top_10"
              v-model="form.bonus_fastest_lap_top_10"
              :binary="true"
            />
            <label for="bonus_fastest_lap_top_10" class="ml-2">
              Only award if driver finishes in top 10
            </label>
          </div>
        </div>

        <!-- Info for qualifiers -->
        <Message v-if="isQualifier" severity="info" :closable="false">
          Only pole position bonus is available for qualifying sessions.
        </Message>
      </div>
    </AccordionContent>
  </AccordionPanel>
</Accordion>
```

### RoundsPanel Qualifier Section Example

```vue
<!-- Inside AccordionTab, before Races section -->
<div>
  <div class="flex items-center justify-between mb-3">
    <h3 class="font-semibold flex items-center gap-2">
      <i class="pi pi-stopwatch text-blue-600"></i>
      Qualifying
    </h3>
    <Button
      v-if="!getQualifier(round.id)"
      label="Add Qualifying"
      icon="pi pi-plus"
      size="small"
      outlined
      severity="info"
      @click="handleCreateQualifier(round.id)"
    />
  </div>

  <!-- Loading state -->
  <div v-if="loadingRaces" class="mb-4">
    <Skeleton height="4rem" />
  </div>

  <!-- Empty state -->
  <div
    v-else-if="!getQualifier(round.id)"
    class="text-sm text-gray-500 text-center py-4 mb-4 bg-blue-50 rounded-lg border border-blue-200"
  >
    <i class="pi pi-info-circle mr-2"></i>
    No qualifying session configured
  </div>

  <!-- Qualifier display -->
  <div v-else class="mb-4">
    <QualifierListItem
      :race="getQualifier(round.id)!"
      @edit="handleEditQualifier"
      @delete="handleDeleteQualifier"
    />
  </div>
</div>

<Divider />

<!-- Races Section -->
<div>
  <div class="flex items-center justify-between mb-3">
    <h3 class="font-semibold">Races</h3>
    <Button
      label="Add Race"
      icon="pi pi-plus"
      size="small"
      outlined
      @click="handleCreateRace(round.id)"
    />
  </div>
  <!-- ... rest of races section ... -->
</div>
```

### Handler Functions Example

```typescript
function handleCreateQualifier(roundId: number): void {
  selectedRoundId.value = roundId;
  selectedRace.value = null;
  raceFormMode.value = 'create';
  raceFormType.value = 'qualifier';
  showRaceFormDrawer.value = true;
}

function handleEditQualifier(qualifier: Race): void {
  selectedRoundId.value = qualifier.round_id;
  selectedRace.value = qualifier;
  raceFormMode.value = 'edit';
  raceFormType.value = 'qualifier';
  showRaceFormDrawer.value = true;
}

function handleDeleteQualifier(qualifier: Race): void {
  confirm.require({
    group: 'race-delete',
    message: `Are you sure you want to delete the qualifying session${qualifier.name ? ` - ${qualifier.name}` : ''}?`,
    header: 'Confirm Delete',
    icon: 'pi pi-exclamation-triangle',
    rejectClass: 'p-button-secondary p-button-outlined',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await raceStore.deleteExistingRace(qualifier.id);
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Qualifying session deleted successfully',
          life: 3000,
        });
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error instanceof Error ? error.message : 'Failed to delete qualifying',
          life: 5000,
        });
      }
    },
  });
}
```

---

## Summary

This implementation plan provides a complete blueprint for adding qualifier support to the user dashboard. By reusing the RaceFormDrawer component with conditional rendering, we maintain code quality while minimizing duplication.

**Key Takeaways**:

1. **Reuse over duplication**: RaceFormDrawer handles both races and qualifiers
2. **Type safety**: Use TypeScript interfaces and computed properties
3. **Visual distinction**: Blue theme for qualifiers vs. gray theme for races
4. **Business logic**: Pole bonus for both, fastest lap for races only
5. **User experience**: Clear visual hierarchy with qualifier above races
6. **Testing**: Comprehensive unit and integration tests
7. **Maintainability**: Follow existing patterns and conventions

**Estimated Implementation Time**: 6-8 hours for a frontend developer familiar with the codebase.

---

**Document Status**: Ready for implementation
**Review Required**: Yes (team review recommended before starting)
**Backend Dependencies**: None (assumes backend race API already supports qualifiers with `race_type: 'qualifying'`)
