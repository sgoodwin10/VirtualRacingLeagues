# RoundsPanel.vue Accordion Migration Plan

## Current State Analysis

**File:** `resources/app/js/components/round/RoundsPanel.vue`

### Current Implementation

The RoundsPanel uses a multi-panel accordion to display racing rounds with:
- Multiple panels open simultaneously (`:multiple="true"`)
- Controlled state via `v-model:active-index`
- Complex custom headers with:
  - Round number badge (colored square)
  - Track name and location
  - Scheduled date
  - Points configuration tag
  - Results button
  - Completion toggle switch
  - Edit/Delete action buttons
- Content containing:
  - Technical notes panel
  - Stream URL panel
  - Internal notes panel
  - Race events list (qualifiers + races)

### Current Styling
- Light theme with `bg-slate-50`, `bg-slate-100`, `border-slate-300`
- PassThrough (PT) styling for active/inactive states
- Hover effects: `hover:bg-blue-50`

---

## Target State

Transform to Technical Blueprint design with:
- Dark theme matching design system
- Status indicators based on round status
- Cyan accent borders when active
- Hover translation effect
- Monospace typography for labels
- Icon containers for visual interest

---

## Migration Steps

### Step 1: Update Imports

**Current:**
```typescript
import Accordion from 'primevue/accordion';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import AccordionContent from 'primevue/accordioncontent';
```

**Target:**
```typescript
import {
  TechnicalAccordion,
  TechnicalAccordionPanel,
  TechnicalAccordionHeader,
  TechnicalAccordionContent,
  AccordionStatusIndicator,
  AccordionBadge,
} from '@app/components/common/accordions';
```

### Step 2: Transform Accordion Container

**Current (line 27):**
```vue
<Accordion v-else v-model:active-index="activeIndexes" :multiple="true">
```

**Target:**
```vue
<TechnicalAccordion
  v-else
  v-model="activeIndexes"
  :multiple="true"
  gap="md"
>
```

### Step 3: Transform AccordionPanel

**Current (lines 28-40):**
```vue
<AccordionPanel
  v-for="(round, index) in rounds"
  :key="round.id"
  :value="round.id"
  class="mb-1"
  :pt="{
    root: ({ context }) => ({
      class: context.active
        ? 'border border-slate-300 rounded-md bg-slate-50'
        : 'border-1 border-gray-200 rounded-md',
    }),
  }"
>
```

**Target:**
```vue
<TechnicalAccordionPanel
  v-for="(round, index) in rounds"
  :key="round.id"
  :value="round.id"
>
```
*Note: Styling moves to component internals, PT no longer needed*

### Step 4: Transform Header - Round Badge

**Current (lines 52-60):**
```vue
<div
  class="h-16 w-16 flex flex-col items-center justify-center rounded-l-md"
  :style="{ backgroundColor: getRoundBackgroundColor(index) }"
>
  <span class="text-xs uppercase text-white">Round</span>
  <span class="text-2xl font-bold text-shadow-sm text-white">
    {{ round.round_number }}
  </span>
</div>
```

**Target:**
```vue
<template #prefix>
  <div
    class="h-16 w-16 flex flex-col items-center justify-center rounded-l-md"
    :style="{ backgroundColor: getRoundBackgroundColor(index) }"
  >
    <span class="text-[10px] uppercase font-mono tracking-wider text-white/80">
      Round
    </span>
    <span class="text-2xl font-bold font-mono text-white">
      {{ round.round_number }}
    </span>
  </div>
</template>
```

### Step 5: Add Status Indicator

**New element based on round status:**
```vue
<TechnicalAccordionHeader
  :title="round.name || 'Untitled Round'"
  :subtitle="getTrackAndLocation(round.platform_track_id)"
  :status="getRoundStatus(round)"
>
```

**Add computed status mapping:**
```typescript
function getRoundStatus(round: Round): AccordionStatus {
  if (round.status === 'completed') return 'completed';
  if (round.status === 'in_progress') return 'active';
  if (isRoundScheduledSoon(round)) return 'upcoming';
  if (round.status === 'scheduled') return 'pending';
  return 'inactive';
}
```

### Step 6: Transform Header Content

**Target header structure:**
```vue
<TechnicalAccordionHeader
  :title="round.name || 'Untitled Round'"
  :subtitle="getTrackAndLocation(round.platform_track_id)"
  :status="getRoundStatus(round)"
>
  <!-- Round badge -->
  <template #prefix>
    <div class="round-number-badge" :style="{ backgroundColor: getRoundBackgroundColor(index) }">
      <span class="round-label">Round</span>
      <span class="round-number">{{ round.round_number }}</span>
    </div>
  </template>

  <!-- Date display -->
  <template #suffix>
    <div v-if="round.scheduled_at" class="flex flex-col w-36">
      <span class="text-[10px] uppercase font-mono text-muted tracking-wide">
        Scheduled
      </span>
      <span class="text-sm font-mono text-primary">
        {{ formatDate(round.scheduled_at) }}
      </span>
    </div>
  </template>

  <!-- Actions -->
  <template #actions>
    <!-- Points tag with tooltip -->
    <AccordionBadge
      v-if="hasCustomPoints(round)"
      v-tooltip.top="{ value: formatRoundPointsTooltip(round), escape: false }"
      text="Round Points"
      severity="info"
    />

    <!-- Results button -->
    <Button
      v-if="round.status === 'completed'"
      label="Results"
      icon="pi pi-trophy"
      text
      size="small"
      @click.stop="openRoundResults(round)"
    />

    <!-- Completion toggle -->
    <div class="flex items-center gap-2">
      <ToggleSwitch
        v-model="round.isCompleted"
        @click.stop
        @update:model-value="toggleRoundCompletion(round)"
      />
      <span :class="round.status === 'completed' ? 'text-green' : 'text-muted'" class="text-xs font-mono">
        {{ round.status === 'completed' ? 'Completed' : 'Incomplete' }}
      </span>
    </div>

    <!-- Edit/Delete (only if not completed) -->
    <template v-if="round.status !== 'completed'">
      <EditButton @click.stop="openEditRound(round)" />
      <DeleteButton @click.stop="confirmDeleteRound(round)" />
    </template>
  </template>
</TechnicalAccordionHeader>
```

### Step 7: Transform Content Section

**Current content structure maintained, wrapped in TechnicalAccordionContent:**
```vue
<TechnicalAccordionContent padding="md">
  <div class="space-y-4">
    <!-- Round details grid -->
    <div
      v-if="round.technical_notes || round.stream_url || round.internal_notes"
      class="grid grid-cols-3 gap-4 border-b border-default pb-4"
    >
      <!-- Technical notes -->
      <BasePanel
        v-if="round.technical_notes"
        label="Technical Notes"
        content-class="p-4 border border-default rounded-md bg-elevated"
      >
        {{ round.technical_notes }}
      </BasePanel>

      <!-- Stream URL -->
      <BasePanel
        v-if="round.stream_url"
        label="Stream URL"
        content-class="p-4 border border-default rounded-md bg-elevated"
      >
        <a :href="round.stream_url" target="_blank" class="text-cyan hover:underline">
          {{ round.stream_url }}
        </a>
      </BasePanel>

      <!-- Internal notes -->
      <BasePanel
        v-if="round.internal_notes"
        label="Internal Notes"
        content-class="p-4 border border-default rounded-md bg-elevated"
      >
        {{ round.internal_notes }}
      </BasePanel>
    </div>

    <!-- Race events section -->
    <div class="space-y-2">
      <!-- Add event button -->
      <div v-if="round.status !== 'completed'" class="flex justify-end">
        <AddButton label="Add Event" @click="openAddRaceEvent(round)" />
      </div>

      <!-- Loading state -->
      <template v-if="isLoadingRaces">
        <Skeleton height="60px" class="mb-2" />
        <Skeleton height="60px" />
      </template>

      <!-- Empty state -->
      <div
        v-else-if="!getRoundRaces(round.id).length"
        class="text-sm text-muted text-center py-4 font-mono"
      >
        No race events added yet
      </div>

      <!-- Race events list -->
      <div v-else class="space-y-2">
        <template v-for="race in getSortedRaces(round.id)" :key="race.id">
          <QualifierListItem
            v-if="race.is_qualifier"
            :race="getRaceWithOrphanedFlag(race, round)"
            :is-round-completed="round.status === 'completed'"
            @edit="openEditRace"
            @delete="confirmDeleteRace"
            @enter-results="openRaceResults"
            @toggle-status="toggleRaceStatus"
            @refresh="refreshData"
          />
          <RaceListItem
            v-else
            :race="getRaceWithOrphanedFlag(race, round)"
            :is-round-completed="round.status === 'completed'"
            @edit="openEditRace"
            @delete="confirmDeleteRace"
            @enter-results="openRaceResults"
            @toggle-status="toggleRaceStatus"
            @refresh="refreshData"
          />
        </template>
      </div>
    </div>
  </div>
</TechnicalAccordionContent>
```

---

## CSS Updates

Add Technical Blueprint classes to `resources/app/css/components/accordion.css`:

```css
/* Round number badge */
.round-number-badge {
  height: 4rem;
  width: 4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: var(--accordion-radius) 0 0 var(--accordion-radius);
}

.round-label {
  font-family: var(--accordion-font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.8);
}

.round-number {
  font-family: var(--accordion-font-mono);
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
}

/* Text utilities for accordion */
.text-primary { color: var(--accordion-text-primary); }
.text-secondary { color: var(--accordion-text-secondary); }
.text-muted { color: var(--accordion-text-muted); }
.text-cyan { color: var(--accordion-accent-cyan); }
.text-green { color: var(--accordion-accent-green); }
.text-orange { color: var(--accordion-accent-orange); }
.text-red { color: var(--accordion-accent-red); }

/* Background utilities */
.bg-card { background-color: var(--accordion-bg); }
.bg-elevated { background-color: var(--accordion-bg-elevated); }
.bg-highlight { background-color: var(--accordion-bg-highlight); }

/* Border utilities */
.border-default { border-color: var(--accordion-border); }
.border-active { border-color: var(--accordion-border-active); }
```

---

## Test Updates

### Update existing tests

**File:** `resources/app/js/components/round/__tests__/RoundsPanel.test.ts`

Key test updates needed:
1. Update component imports
2. Update element selectors for new class names
3. Add tests for status indicator display
4. Verify hover animations work correctly
5. Test dark theme styling

**Example test update:**

```typescript
import { mount } from '@vue/test-utils';
import RoundsPanel from '../RoundsPanel.vue';
import { TechnicalAccordion, TechnicalAccordionPanel } from '@app/components/common/accordions';

describe('RoundsPanel', () => {
  it('renders rounds with correct status indicators', async () => {
    const wrapper = mount(RoundsPanel, {
      props: {
        seasonId: 1,
        competitionColorScheme: 'blue',
      },
      global: {
        stubs: {
          TechnicalAccordion: false,
          TechnicalAccordionPanel: false,
        },
      },
    });

    // Wait for data to load
    await wrapper.vm.$nextTick();

    // Verify status indicators are rendered
    const statusIndicators = wrapper.findAll('[data-testid="status-indicator"]');
    expect(statusIndicators.length).toBe(mockRounds.length);
  });

  it('applies active styling when panel is expanded', async () => {
    // ...
  });

  it('shows hover translation effect', async () => {
    // ...
  });
});
```

---

## Migration Checklist

- [ ] Create TechnicalAccordion components (prerequisite)
- [ ] Update imports in RoundsPanel.vue
- [ ] Transform Accordion container
- [ ] Transform AccordionPanel elements
- [ ] Transform AccordionHeader with slots
- [ ] Add status indicator logic
- [ ] Transform AccordionContent
- [ ] Update CSS classes for dark theme
- [ ] Update tests
- [ ] Verify all existing functionality works
- [ ] Visual review against design spec
- [ ] Accessibility testing

---

## Risk Mitigation

1. **Functionality Regression**: Run all existing tests before and after migration
2. **Styling Conflicts**: Scope CSS with BEM or CSS modules
3. **Performance**: Profile accordion render performance with many rounds
4. **Accessibility**: Test with screen readers and keyboard navigation

---

## Estimated Effort

- Component creation: 4 hours
- RoundsPanel migration: 3 hours
- Testing & refinement: 2 hours
- **Total: 9 hours**
