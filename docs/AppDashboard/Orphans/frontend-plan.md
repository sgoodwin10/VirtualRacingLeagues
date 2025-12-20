# Frontend Plan: Orphaned Results Warning

## Investigation Summary

### Problem Statement
When a season has `race_divisions_enabled: true`, race and qualifying results are displayed in division tabs. However, if a driver has results but is NOT assigned to any division (`division_id: null`), their results become "orphaned" - they don't appear in any division tab and are effectively hidden from the user.

### Current Architecture

#### Division System
- **Enable divisions**: `Season.race_divisions_enabled` boolean field (line 68 in `/var/www/resources/app/js/types/season.ts`)
- **Division entity**: Defined in `/var/www/resources/app/js/types/division.ts`
- **Driver assignment**: `SeasonDriver.division_id` (nullable, line 57 in `/var/www/resources/app/js/types/seasonDriver.ts`)
- **Division management**: Components in `/var/www/resources/app/js/components/season/divisions/`

#### Results Entry/Display System

**Results Entry Components:**
1. **RaceResultModal.vue** (`/var/www/resources/app/js/components/result/RaceResultModal.vue`)
   - Main modal for entering race/qualifying results
   - Uses `ResultDivisionTabs` when divisions are enabled
   - Uses `ResultEntryTable` directly when divisions are disabled
   - Computed property `driversByDivision` (line 220) organizes drivers by division
   - Key logic: Filters drivers into division groups, but drivers with `division_id: null` are grouped under key `0`

2. **ResultDivisionTabs.vue** (`/var/www/resources/app/js/components/result/ResultDivisionTabs.vue`)
   - Displays tabs for each division
   - Receives `driversByDivision: Record<number, DriverOption[]>` prop
   - Filters results by checking if driver belongs to division (lines 121-130)
   - **CRITICAL**: Only displays tabs for divisions in `divisions` array, orphaned drivers (division_id: null) are filtered out

**Results Display Components:**
1. **RoundResultsModal.vue** (`/var/www/resources/app/js/components/round/modals/RoundResultsModal.vue`)
   - Displays completed round results
   - Shows division tabs when `hasDivisions` is true (line 42)
   - Displays results by division
   - **CRITICAL**: Orphaned results won't appear in any division tab

2. **RaceListItem.vue** (`/var/www/resources/app/js/components/round/RaceListItem.vue`)
   - Displays individual race in round list
   - Shows "Completed" toggle (lines 61-68)
   - Has "View Results" / "Enter Results" button
   - Location: Line 60-69 shows the toggle area

3. **QualifierListItem.vue** (`/var/www/resources/app/js/components/round/QualifierListItem.vue`)
   - Displays qualifier in round list
   - Shows "Completed" toggle (lines 54-62)
   - Has "View Results" / "Enter Results" button
   - Location: Line 54-63 shows the toggle area

#### Where Orphaned Results Occur

**In RaceResultModal (driversByDivision computed property, line 220-230):**
```typescript
const driversByDivision = computed<Record<number, DriverOption[]>>(() => {
  const byDivision: Record<number, DriverOption[]> = {};
  for (const driver of allDrivers.value) {
    const divId = driver.division_id ?? 0; // Orphaned drivers get key 0
    if (!byDivision[divId]) {
      byDivision[divId] = [];
    }
    byDivision[divId].push(driver);
  }
  return byDivision;
});
```

**In ResultDivisionTabs (lines 121-130):**
```typescript
// Get the driver IDs that belong to this division
const divisionDriverIds = new Set(
  (props.driversByDivision[division.id] || []).map((d) => d.id),
);

// Filter results to only include drivers from this division
newDivisionResults[division.id] = results.filter((r) => {
  return r.driver_id !== null && divisionDriverIds.has(r.driver_id);
});
```

**Problem**: `ResultDivisionTabs` only creates tabs for divisions in the `divisions` prop. Drivers with `division_id: null` are in `driversByDivision[0]`, but there's no tab for division 0, so their results are invisible.

### API Data Flow

1. **Race/Qualifier Status Toggle**:
   - Event: `@toggle-status` in RaceListItem/QualifierListItem
   - Handler: `handleToggleRaceStatus` in RoundsPanel.vue (line 782)
   - API Call: `raceStore.updateExistingRace(race.id, { status: newStatus }, race.is_qualifier)`
   - Service: `updateRace()` or `updateQualifier()` in `/var/www/resources/app/js/services/raceService.ts`

2. **Backend will provide** (from backend plan):
   - `has_orphaned_results: boolean` field in Race entity
   - Computed on backend when race status changes to 'completed'
   - Only true when: `race_divisions_enabled === true` AND `status === 'completed'` AND results exist with `division_id === null`

## Affected Components

### Primary Components (Need Modification)
1. **RaceListItem.vue** - Add orphaned results warning tag
2. **QualifierListItem.vue** - Add orphaned results warning tag

### Type Definitions (Need Extension)
1. **`/var/www/resources/app/js/types/race.ts`**
   - Add `has_orphaned_results?: boolean` to `Race` interface (line 2-39)

### No Changes Required (Reference Only)
- ResultDivisionTabs.vue - Works correctly, filtering is expected behavior
- RaceResultModal.vue - Works correctly
- RoundResultsModal.vue - Works correctly
- RoundsPanel.vue - Handler works correctly

## Implementation Plan

### Step 1: Update Race Type Definition

**File**: `/var/www/resources/app/js/types/race.ts`

**Change**: Add new optional field to Race interface (after line 38, before line 39):

```typescript
export interface Race {
  id: number;
  // ... existing fields ...
  status: 'scheduled' | 'completed';

  // NEW: Orphaned results indicator (only populated for completed races with divisions enabled)
  has_orphaned_results?: boolean;

  created_at: string;
  updated_at: string;
}
```

**Reasoning**: Backend will provide this field when returning Race entities. Making it optional ensures backward compatibility and indicates it's only relevant when divisions are enabled.

### Step 2: Create Orphaned Results Warning Component

**File**: `/var/www/resources/app/js/components/round/OrphanedResultsWarning.vue` (NEW)

**Purpose**: Reusable warning tag component that shows next to "Completed" toggle

**Component Code**:
```vue
<template>
  <Tag
    v-if="showWarning"
    v-tooltip.top="{
      value: tooltipMessage,
      escape: false,
    }"
    icon="pi pi-exclamation-triangle"
    severity="warn"
    value="Orphaned Results"
    class="cursor-pointer"
    @click="handleClick"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Tag from 'primevue/tag';
import { useToast } from 'primevue/usetoast';

interface Props {
  hasOrphanedResults?: boolean;
  isCompleted: boolean;
  isQualifying?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  hasOrphanedResults: false,
  isQualifying: false,
});

const toast = useToast();

const showWarning = computed(() => {
  return props.isCompleted && props.hasOrphanedResults;
});

const tooltipMessage = computed(() => {
  const eventType = props.isQualifying ? 'qualifying session' : 'race';
  return `This ${eventType} has results for drivers not assigned to any division. These results are not visible in the division tabs.`;
});

function handleClick(): void {
  const eventType = props.isQualifying ? 'Qualifying Session' : 'Race';
  toast.add({
    severity: 'warn',
    summary: 'Orphaned Results Detected',
    detail: `This ${eventType.toLowerCase()} has results for drivers who are not assigned to any division. These results exist in the database but are not visible in the division tabs. To fix this, assign all drivers to divisions before entering results.`,
    life: 8000,
  });
}
</script>
```

**Key Features**:
- Only shows when `isCompleted === true` AND `hasOrphanedResults === true`
- Provides tooltip on hover with brief explanation
- Clicking shows detailed toast notification
- Uses PrimeVue Tag component with `warn` severity (yellow/orange)
- Icon: `pi-exclamation-triangle` for warning
- Reusable for both races and qualifiers

### Step 3: Update RaceListItem Component

**File**: `/var/www/resources/app/js/components/round/RaceListItem.vue`

**Changes**:

1. **Import the warning component** (add after line 82):
```typescript
import OrphanedResultsWarning from './OrphanedResultsWarning.vue';
```

2. **Update template** (modify lines 60-69):
```vue
<div class="flex-none flex items-center gap-2 mx-4">
  <Button
    :label="isCompleted ? 'View Results' : 'Enter Results'"
    icon="pi pi-list-check"
    text
    size="small"
    :severity="isCompleted ? 'success' : 'info'"
    @click="handleEnterResults"
  />
  <div v-if="!isRoundCompleted" class="flex items-center gap-2">
    <!-- NEW: Orphaned Results Warning -->
    <OrphanedResultsWarning
      :has-orphaned-results="race.has_orphaned_results"
      :is-completed="isCompleted"
      :is-qualifying="false"
    />

    <ToggleSwitch v-model="isCompleted" @update:model-value="handleToggleStatus">
      <template #handle="{ checked }">
        <i :class="['!text-xs pi', { 'pi-check': checked, 'pi-times': !checked }]" />
      </template>
    </ToggleSwitch>
    <span :class="['text-sm font-medium', isCompleted ? 'text-green-600' : 'text-slate-400']">
      Completed
    </span>
  </div>
  <EditButton v-if="!isRoundCompleted && !isCompleted" @click="handleEdit" />
  <DeleteButton v-if="!isRoundCompleted && !isCompleted" @click="handleDelete" />
</div>
```

**Visual Layout**:
```
[View Results Button] [⚠ Orphaned Results] [Toggle] [Completed] [Edit] [Delete]
```

### Step 4: Update QualifierListItem Component

**File**: `/var/www/resources/app/js/components/round/QualifierListItem.vue`

**Changes**:

1. **Import the warning component** (add after line 76):
```typescript
import OrphanedResultsWarning from './OrphanedResultsWarning.vue';
```

2. **Update template** (modify lines 54-63):
```vue
<div class="flex-none flex items-center gap-2 mx-4">
  <Button
    :label="isCompleted ? 'View Results' : 'Enter Results'"
    icon="pi pi-list-check"
    text
    size="small"
    :severity="isCompleted ? 'success' : 'info'"
    @click="handleEnterResults"
  />
  <div v-if="!isRoundCompleted" class="flex items-center gap-2">
    <!-- NEW: Orphaned Results Warning -->
    <OrphanedResultsWarning
      :has-orphaned-results="race.has_orphaned_results"
      :is-completed="isCompleted"
      :is-qualifying="true"
    />

    <ToggleSwitch v-model="isCompleted" @update:model-value="handleToggleStatus">
      <template #handle="{ checked }">
        <i :class="['!text-xs pi', { 'pi-check': checked, 'pi-times': !checked }]" />
      </template>
    </ToggleSwitch>
    <span :class="['text-sm font-medium', isCompleted ? 'text-green-600' : 'text-slate-400']">
      Completed
    </span>
  </div>
  <EditButton v-if="!isRoundCompleted && !isCompleted" @click="handleEdit" />
  <DeleteButton v-if="!isRoundCompleted && !isCompleted" @click="handleDelete" />
</div>
```

### Step 5: Create Unit Tests

#### Test File 1: `/var/www/resources/app/js/components/round/__tests__/OrphanedResultsWarning.test.ts`

**Tests to include**:
1. Does not render when `hasOrphanedResults` is false
2. Does not render when `isCompleted` is false
3. Renders warning tag when both `hasOrphanedResults` and `isCompleted` are true
4. Shows correct tooltip message for race vs qualifying
5. Clicking tag triggers toast notification with correct message
6. Toast message differs for race vs qualifying

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import OrphanedResultsWarning from '../OrphanedResultsWarning.vue';
import Tag from 'primevue/tag';
import { useToast } from 'primevue/usetoast';

// Mock PrimeVue toast
vi.mock('primevue/usetoast');

describe('OrphanedResultsWarning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when hasOrphanedResults is false', () => {
    const wrapper = mount(OrphanedResultsWarning, {
      props: {
        hasOrphanedResults: false,
        isCompleted: true,
        isQualifying: false,
      },
    });

    expect(wrapper.findComponent(Tag).exists()).toBe(false);
  });

  it('does not render when isCompleted is false', () => {
    const wrapper = mount(OrphanedResultsWarning, {
      props: {
        hasOrphanedResults: true,
        isCompleted: false,
        isQualifying: false,
      },
    });

    expect(wrapper.findComponent(Tag).exists()).toBe(false);
  });

  it('renders warning tag when both hasOrphanedResults and isCompleted are true', () => {
    const wrapper = mount(OrphanedResultsWarning, {
      props: {
        hasOrphanedResults: true,
        isCompleted: true,
        isQualifying: false,
      },
    });

    const tag = wrapper.findComponent(Tag);
    expect(tag.exists()).toBe(true);
    expect(tag.props('severity')).toBe('warn');
    expect(tag.props('value')).toBe('Orphaned Results');
    expect(tag.props('icon')).toBe('pi pi-exclamation-triangle');
  });

  it('shows correct tooltip for race', () => {
    const wrapper = mount(OrphanedResultsWarning, {
      props: {
        hasOrphanedResults: true,
        isCompleted: true,
        isQualifying: false,
      },
    });

    const tag = wrapper.findComponent(Tag);
    const tooltip = tag.attributes('v-tooltip');
    expect(tooltip).toContain('race');
    expect(tooltip).toContain('not assigned to any division');
  });

  it('shows correct tooltip for qualifying', () => {
    const wrapper = mount(OrphanedResultsWarning, {
      props: {
        hasOrphanedResults: true,
        isCompleted: true,
        isQualifying: true,
      },
    });

    const tag = wrapper.findComponent(Tag);
    const tooltip = tag.attributes('v-tooltip');
    expect(tooltip).toContain('qualifying session');
    expect(tooltip).toContain('not assigned to any division');
  });

  it('triggers toast notification when clicked', async () => {
    const mockToast = {
      add: vi.fn(),
    };
    vi.mocked(useToast).mockReturnValue(mockToast);

    const wrapper = mount(OrphanedResultsWarning, {
      props: {
        hasOrphanedResults: true,
        isCompleted: true,
        isQualifying: false,
      },
    });

    await wrapper.findComponent(Tag).trigger('click');

    expect(mockToast.add).toHaveBeenCalledWith({
      severity: 'warn',
      summary: 'Orphaned Results Detected',
      detail: expect.stringContaining('race'),
      life: 8000,
    });
  });
});
```

#### Test File 2: Update `/var/www/resources/app/js/components/round/__tests__/RaceListItem.test.ts`

**New test to add**:
```typescript
it('shows orphaned results warning when race is completed and has orphaned results', () => {
  const mockRace: Race = {
    ...mockCompletedRace,
    has_orphaned_results: true,
  };

  const wrapper = mount(RaceListItem, {
    props: {
      race: mockRace,
      isRoundCompleted: false,
    },
  });

  const warning = wrapper.findComponent({ name: 'OrphanedResultsWarning' });
  expect(warning.exists()).toBe(true);
  expect(warning.props('hasOrphanedResults')).toBe(true);
  expect(warning.props('isCompleted')).toBe(true);
  expect(warning.props('isQualifying')).toBe(false);
});

it('does not show orphaned results warning when race is not completed', () => {
  const mockRace: Race = {
    ...mockScheduledRace,
    has_orphaned_results: true,
  };

  const wrapper = mount(RaceListItem, {
    props: {
      race: mockRace,
      isRoundCompleted: false,
    },
  });

  const warning = wrapper.findComponent({ name: 'OrphanedResultsWarning' });
  // Warning component won't render its Tag when isCompleted is false
  expect(warning.exists()).toBe(true);
  expect(warning.find('tag').exists()).toBe(false);
});
```

#### Test File 3: Update `/var/www/resources/app/js/components/round/__tests__/QualifierListItem.test.ts`

**New test to add**:
```typescript
it('shows orphaned results warning when qualifier is completed and has orphaned results', () => {
  const mockQualifier: Race = {
    ...mockCompletedQualifier,
    has_orphaned_results: true,
  };

  const wrapper = mount(QualifierListItem, {
    props: {
      race: mockQualifier,
      isRoundCompleted: false,
    },
  });

  const warning = wrapper.findComponent({ name: 'OrphanedResultsWarning' });
  expect(warning.exists()).toBe(true);
  expect(warning.props('hasOrphanedResults')).toBe(true);
  expect(warning.props('isCompleted')).toBe(true);
  expect(warning.props('isQualifying')).toBe(true);
});

it('does not show orphaned results warning when qualifier is not completed', () => {
  const mockQualifier: Race = {
    ...mockScheduledQualifier,
    has_orphaned_results: true,
  };

  const wrapper = mount(QualifierListItem, {
    props: {
      race: mockQualifier,
      isRoundCompleted: false,
    },
  });

  const warning = wrapper.findComponent({ name: 'OrphanedResultsWarning' });
  expect(warning.exists()).toBe(true);
  expect(warning.find('tag').exists()).toBe(false);
});
```

## Visual Design Specification

### Warning Tag Appearance
- **Component**: PrimeVue Tag with `severity="warn"`
- **Color**: Yellow/Orange (warn severity)
- **Icon**: `pi pi-exclamation-triangle`
- **Text**: "Orphaned Results"
- **Cursor**: `cursor-pointer` to indicate clickable
- **Tooltip**: Brief explanation on hover
- **Toast**: Detailed explanation on click

### Placement
Located between the "View Results" button and the "Completed" toggle:

```
┌─────────────────┐  ┌─────────────────┐  ┌──┐  Completed  ┌────┐ ┌────┐
│ View Results    │  │ ⚠ Orphaned      │  │▶ │             │ ✎  │ │ 🗑  │
│                 │  │   Results       │  └──┘             └────┘ └────┘
└─────────────────┘  └─────────────────┘
     Button              Warning Tag      Toggle  Label     Edit  Delete
```

### Interaction Flow

1. **Initial State**: Warning tag only visible when race/qualifier is completed AND has orphaned results
2. **Hover**: Tooltip appears with brief explanation
3. **Click**: Toast notification appears with detailed explanation and instructions
4. **Toast Message**:
   - Severity: warn
   - Duration: 8 seconds (longer than default for important message)
   - Content: Explains the issue and suggests solution

## Backend Integration Points

### Expected API Response

When fetching races (GET `/api/seasons/{seasonId}/rounds/{roundId}/races` or qualifier), the backend will include:

```json
{
  "data": [
    {
      "id": 123,
      "round_id": 45,
      "race_number": 1,
      "status": "completed",
      "is_qualifier": false,
      "has_orphaned_results": true,  // NEW FIELD
      // ... other race fields
    }
  ]
}
```

### When Backend Sets `has_orphaned_results`

The backend will compute this field when:
1. Race status is 'completed'
2. Season has `race_divisions_enabled === true`
3. Race has results where at least one result has `division_id === null`

**Backend calculation** (pseudocode):
```php
if ($race->status === 'completed' &&
    $season->race_divisions_enabled &&
    $race->results->where('division_id', null)->isNotEmpty()) {
    $has_orphaned_results = true;
}
```

## User Experience Flow

### Scenario: User Marks Race as Completed with Orphaned Results

1. User views RoundsPanel with list of races
2. User toggles race from "scheduled" to "completed"
3. Backend processes:
   - Updates race status to 'completed'
   - Detects orphaned results (drivers with no division)
   - Returns updated race with `has_orphaned_results: true`
4. Frontend updates:
   - Toggle switches to "Completed" (green)
   - Warning tag appears: "⚠ Orphaned Results"
5. User hovers over warning:
   - Tooltip shows: "This race has results for drivers not assigned to any division..."
6. User clicks warning:
   - Toast notification appears with detailed explanation
   - Toast suggests: "Assign all drivers to divisions before entering results"
7. User can then:
   - Click "View Results" to see what they can
   - Go to Season Drivers page to assign divisions
   - Toggle race back to scheduled and fix division assignments

## Edge Cases & Considerations

### 1. Race Completed Before Divisions Enabled
**Scenario**: Race completed, then divisions enabled on season
**Behavior**: All existing results will have `division_id: null`, so `has_orphaned_results` will be true
**Solution**: Warning appears, user must assign divisions and re-save results

### 2. Driver Removed from Division After Results Entered
**Scenario**: Results entered with driver in Division A, then driver's division set to null
**Behavior**: `has_orphaned_results` becomes true
**Solution**: Warning appears, user must reassign driver to division

### 3. Round Already Completed
**Scenario**: Round status is 'completed', cannot edit races
**Behavior**: Warning tag does NOT appear (line 60-69 in RaceListItem, `v-if="!isRoundCompleted"`)
**Reasoning**: Cannot edit completed rounds, so warning would be informational only

### 4. Divisions Disabled After Results Entered
**Scenario**: Season has divisions, results entered, then divisions disabled
**Behavior**: `has_orphaned_results` will be false (backend only computes when divisions enabled)
**Solution**: No warning needed, all results visible without division tabs

### 5. No Results Yet
**Scenario**: Race completed but no results entered
**Behavior**: `has_orphaned_results` will be false (no results to be orphaned)
**Solution**: No warning shown

## Files Summary

### New Files
1. `/var/www/resources/app/js/components/round/OrphanedResultsWarning.vue` - Warning tag component
2. `/var/www/resources/app/js/components/round/__tests__/OrphanedResultsWarning.test.ts` - Tests

### Modified Files
1. `/var/www/resources/app/js/types/race.ts` - Add `has_orphaned_results?` field
2. `/var/www/resources/app/js/components/round/RaceListItem.vue` - Add warning component
3. `/var/www/resources/app/js/components/round/QualifierListItem.vue` - Add warning component
4. `/var/www/resources/app/js/components/round/__tests__/RaceListItem.test.ts` - Add warning tests
5. `/var/www/resources/app/js/components/round/__tests__/QualifierListItem.test.ts` - Add warning tests

### No Changes Required
- ResultDivisionTabs.vue (filtering behavior is correct)
- RaceResultModal.vue (driver grouping is correct)
- RoundResultsModal.vue (display logic is correct)
- RoundsPanel.vue (handler logic is correct)

## Testing Checklist

### Unit Tests
- [ ] OrphanedResultsWarning renders correctly
- [ ] OrphanedResultsWarning shows/hides based on props
- [ ] OrphanedResultsWarning tooltip messages differ for race vs qualifying
- [ ] OrphanedResultsWarning click triggers toast
- [ ] RaceListItem shows warning when appropriate
- [ ] QualifierListItem shows warning when appropriate

### Integration Tests
- [ ] Warning appears when toggling race to completed with orphaned results
- [ ] Warning appears when toggling qualifier to completed with orphaned results
- [ ] Warning does not appear when no orphaned results
- [ ] Warning does not appear when round is completed
- [ ] Toast message is user-friendly and actionable

### Manual Testing
- [ ] Visual alignment with existing UI elements
- [ ] Tooltip appears on hover
- [ ] Toast appears on click with correct message
- [ ] Warning only shows for completed races with orphaned results
- [ ] Warning works for both races and qualifiers

## Implementation Notes

### Why This Approach?

1. **Non-intrusive**: Warning only appears when relevant (completed + orphaned results)
2. **Informative**: Tooltip provides brief context, click provides detailed explanation
3. **Reusable**: Single component used by both RaceListItem and QualifierListItem
4. **Type-safe**: Optional field in Race type ensures backward compatibility
5. **Minimal changes**: Only 5 files modified, maintains existing architecture
6. **Backend-driven**: Backend determines when warning should show, frontend just displays

### Why Not Alternative Approaches?

**Alternative 1: Show orphaned results in a special "Unassigned" tab**
- **Rejected**: Would require significant changes to ResultDivisionTabs logic
- **Reason**: Better to warn user and have them fix the root cause (missing division assignments)

**Alternative 2: Prevent completing race if orphaned results exist**
- **Rejected**: Too restrictive, may block legitimate use cases
- **Reason**: Warning allows user to complete race but alerts them to the issue

**Alternative 3: Auto-assign orphaned drivers to first division**
- **Rejected**: Modifying data automatically without user consent
- **Reason**: Better to let user explicitly assign divisions

**Alternative 4: Show warning in results modal instead**
- **Rejected**: Too late - user already entered results
- **Reason**: Better to warn when race is marked completed, before user views results

## Conclusion

This plan provides a **minimal, targeted solution** to the orphaned results problem:
- Adds a single reusable warning component
- Updates two list item components to display the warning
- Adds one optional field to the Race type
- Provides clear user feedback through tooltip and toast
- Does not modify existing results entry/display logic
- Maintains type safety and follows Vue 3 best practices

The solution is **backend-driven** (backend determines when warning shows) and **user-friendly** (clear explanations and suggestions for fixing the issue).
