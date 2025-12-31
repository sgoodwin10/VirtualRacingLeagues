# RaceEventResultsSection.vue Accordion Migration Plan

## Current State Analysis

**File:** `resources/app/js/components/round/modals/RaceEventResultsSection.vue`

### Current Implementation

Single-panel accordion displaying race or qualifying results in a data table:

- **Structure**: One AccordionPanel per race event
- **Header**: Custom with icon (medal/checkered flag) + title
- **Content**: Complex TechDataTable with conditional columns
- **Mode**: Uncontrolled (no v-model), default expanded

### Current Styling
- Light theme: `bg-white`, `border-slate-200`, `bg-gray-50`
- Custom header with flexbox layout
- Phosphor icons for race type indication

---

## Target State

Transform to Technical Blueprint design with:
- Dark theme matching design system
- Status-aware header based on race completion
- Icon containers with colored backgrounds
- Enhanced table presentation

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
  AccordionIcon,
  AccordionBadge,
} from '@app/components/common/accordions';
```

### Step 2: Transform Accordion Structure

**Current (lines 2-12):**
```vue
<Accordion class="bg-white border border-slate-200 rounded">
  <AccordionPanel value="0">
    <AccordionHeader class="bg-gray-50 px-4 py-3 border-b border-gray-200">
      <div class="flex items-center gap-2 w-full">
        <PhMedal v-if="raceEvent.is_qualifier" class="text-purple-500" :size="20" weight="fill" />
        <PhFlagCheckered v-else class="text-slate-600" :size="20" weight="fill" />
        <h3 class="font-semibold text-gray-900">{{ raceEventTitle }}</h3>
      </div>
    </AccordionHeader>
    <AccordionContent>
```

**Target:**
```vue
<TechnicalAccordion :model-value="['results']">
  <TechnicalAccordionPanel value="results">
    <TechnicalAccordionHeader
      :title="raceEventTitle"
      :subtitle="getResultsSummary()"
      :icon="raceEvent.is_qualifier ? PhMedal : PhFlagCheckered"
      :icon-variant="raceEvent.is_qualifier ? 'purple' : 'cyan'"
      :badge="getResultsCount()"
      badge-severity="info"
    />
    <TechnicalAccordionContent>
```

### Step 3: Add Summary Helpers

**Add computed properties for enhanced header:**

```typescript
// Add to script setup
function getResultsSummary(): string {
  const count = filteredResults.value.length;
  if (raceEvent.is_qualifier) {
    return `${count} drivers qualified`;
  }
  return `${count} finishers`;
}

function getResultsCount(): string {
  return `${filteredResults.value.length} RESULTS`;
}
```

### Step 4: Transform Content

**Current (lines 13-179):**
```vue
<AccordionContent>
  <div class="overflow-x-auto">
    <TechDataTable
      :value="resultsWithTimeDifference"
      :rows="50"
      podium-highlight
    >
      <!-- columns -->
    </TechDataTable>
  </div>
</AccordionContent>
```

**Target:**
```vue
<TechnicalAccordionContent padding="none">
  <div class="overflow-x-auto">
    <TechDataTable
      :value="resultsWithTimeDifference"
      :rows="50"
      podium-highlight
      class="tech-results-table"
    >
      <!-- columns with updated styling -->
    </TechDataTable>

    <!-- Empty state -->
    <div
      v-if="!filteredResults.length"
      class="text-center py-8 text-muted font-mono"
    >
      <PhWarningCircle :size="32" class="mx-auto mb-2 text-muted" />
      <p>{{ emptyStateMessage }}</p>
    </div>
  </div>
</TechnicalAccordionContent>
```

### Step 5: Update Table Styling

**Add dark theme styles to TechDataTable:**

```css
.tech-results-table {
  --table-bg: var(--accordion-bg);
  --table-header-bg: var(--accordion-bg-elevated);
  --table-row-hover: var(--accordion-bg-highlight);
  --table-border: var(--accordion-border);
  --table-text: var(--accordion-text-primary);
  --table-text-secondary: var(--accordion-text-secondary);
}

.tech-results-table :deep(.p-datatable-thead > tr > th) {
  background: var(--table-header-bg);
  border-color: var(--table-border);
  color: var(--table-text-secondary);
  font-family: var(--accordion-font-mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tech-results-table :deep(.p-datatable-tbody > tr) {
  background: var(--table-bg);
  border-color: var(--table-border);
  color: var(--table-text);
}

.tech-results-table :deep(.p-datatable-tbody > tr:hover) {
  background: var(--table-row-hover);
}
```

### Step 6: Update Badge Styling

**Update inline badge colors:**

```vue
<!-- Current -->
<Tag severity="info" value="P" class="mr-2 text-purple-600" />

<!-- Target -->
<AccordionBadge text="P" severity="info" class="mr-2" />

<!-- Or use Tag with updated classes -->
<Tag
  value="P"
  class="bg-purple-dim text-purple font-mono text-xs"
/>
```

### Step 7: Update Text Colors

**Replace current color classes:**

| Current | Target |
|---------|--------|
| `text-gray-900` | `text-primary` |
| `text-gray-600` | `text-secondary` |
| `text-gray-500` | `text-muted` |
| `text-purple-600` | `text-purple` |
| `text-red-600` | `text-red` |
| `text-green-600` | `text-green` |

---

## CSS Updates

```css
/* Race results section specific styles */
.race-results-accordion {
  border-radius: var(--accordion-radius);
  overflow: hidden;
}

/* Position cell styling */
.position-cell {
  font-family: var(--accordion-font-mono);
  font-weight: 600;
}

/* Time display */
.time-display {
  font-family: var(--accordion-font-mono);
  font-size: 13px;
}

.time-display.fastest {
  color: var(--accordion-accent-purple);
}

.time-display.penalty {
  color: var(--accordion-accent-red);
}

/* Position change */
.position-change {
  font-family: var(--accordion-font-mono);
  font-size: 12px;
  font-weight: 500;
}

.position-change.gained {
  color: var(--accordion-accent-green);
}

.position-change.lost {
  color: var(--accordion-accent-red);
}

.position-change.same {
  color: var(--accordion-text-muted);
}
```

---

## Full Component Transformation

```vue
<template>
  <TechnicalAccordion :model-value="['results']" class="race-results-accordion">
    <TechnicalAccordionPanel value="results">
      <TechnicalAccordionHeader
        :title="raceEventTitle"
        :subtitle="resultsSummary"
        :icon="raceEvent.is_qualifier ? PhMedal : PhFlagCheckered"
        :icon-variant="raceEvent.is_qualifier ? 'purple' : 'cyan'"
      >
        <template #suffix>
          <AccordionBadge
            v-if="filteredResults.length"
            :text="`${filteredResults.length} RESULTS`"
            severity="info"
          />
        </template>
      </TechnicalAccordionHeader>

      <TechnicalAccordionContent padding="none">
        <div class="overflow-x-auto">
          <TechDataTable
            v-if="filteredResults.length"
            :value="resultsWithTimeDifference"
            :rows="50"
            podium-highlight
            class="tech-results-table"
          >
            <!-- Position Column -->
            <Column header="#" style="width: 50px">
              <template #body="{ data }">
                <PositionCell :position="data.position" />
              </template>
            </Column>

            <!-- Driver Column -->
            <Column header="Driver" style="min-width: 200px">
              <template #body="{ data }">
                <div class="flex items-center gap-2">
                  <span class="font-semibold text-primary">
                    {{ data.driver_name }}
                  </span>
                  <AccordionBadge
                    v-if="raceEvent.is_qualifier && data.is_pole"
                    text="P"
                    severity="info"
                  />
                  <AccordionBadge
                    v-if="!raceEvent.is_qualifier && data.is_fastest_lap"
                    text="FL"
                    severity="info"
                  />
                  <AccordionBadge
                    v-if="data.is_dnf"
                    text="DNF"
                    severity="danger"
                  />
                </div>
              </template>
            </Column>

            <!-- Time Column (races only) -->
            <Column
              v-if="!raceEvent.is_qualifier && raceTimesRequired"
              header="Time"
              style="width: 120px"
            >
              <template #body="{ data }">
                <span class="time-display" :class="{ penalty: data.has_penalty }">
                  {{ formatTime(data.race_time) }}
                </span>
              </template>
            </Column>

            <!-- Gap Column (races only) -->
            <Column
              v-if="!raceEvent.is_qualifier && raceTimesRequired"
              header="Gap"
              style="width: 100px"
            >
              <template #body="{ data }">
                <span class="time-display text-secondary">
                  {{ data.gap_to_leader || '-' }}
                </span>
              </template>
            </Column>

            <!-- Fastest Lap Column -->
            <Column
              v-if="raceTimesRequired"
              header="Fastest Lap"
              style="width: 120px"
            >
              <template #body="{ data }">
                <span
                  class="time-display"
                  :class="{ fastest: data.is_fastest_lap }"
                >
                  {{ formatTime(data.fastest_lap) }}
                </span>
              </template>
            </Column>

            <!-- Penalties Column (races only) -->
            <Column
              v-if="!raceEvent.is_qualifier && raceTimesRequired"
              header="Penalties"
              style="width: 100px"
            >
              <template #body="{ data }">
                <span v-if="data.penalties" class="time-display penalty">
                  +{{ data.penalties }}s
                </span>
                <span v-else class="text-muted">-</span>
              </template>
            </Column>

            <!-- Position Change Column (races only) -->
            <Column
              v-if="!raceEvent.is_qualifier"
              header="+/-"
              style="width: 60px"
            >
              <template #body="{ data }">
                <span
                  class="position-change"
                  :class="{
                    gained: data.positions_gained > 0,
                    lost: data.positions_gained < 0,
                    same: data.positions_gained === 0,
                  }"
                >
                  {{ formatPositionChange(data.positions_gained) }}
                </span>
              </template>
            </Column>

            <!-- Points Column -->
            <Column
              v-if="raceEvent.race_points"
              header="Points"
              style="width: 80px"
            >
              <template #body="{ data }">
                <PointsCell :points="data.points" />
              </template>
            </Column>
          </TechDataTable>

          <!-- Empty State -->
          <div
            v-else
            class="flex flex-col items-center justify-center py-12 text-muted"
          >
            <PhClipboardText :size="48" class="mb-4 opacity-50" />
            <p class="font-mono text-sm">{{ emptyStateMessage }}</p>
          </div>
        </div>
      </TechnicalAccordionContent>
    </TechnicalAccordionPanel>
  </TechnicalAccordion>
</template>
```

---

## Test Updates

**File:** `resources/app/js/components/round/modals/__tests__/RaceEventResultsSection.test.ts`

```typescript
describe('RaceEventResultsSection', () => {
  it('renders qualifying results with medal icon', () => {
    const wrapper = mount(RaceEventResultsSection, {
      props: {
        raceEvent: { ...mockRaceEvent, is_qualifier: true },
      },
    });

    expect(wrapper.find('[data-testid="accordion-icon"]').classes()).toContain('purple');
  });

  it('renders race results with checkered flag icon', () => {
    const wrapper = mount(RaceEventResultsSection, {
      props: {
        raceEvent: { ...mockRaceEvent, is_qualifier: false },
      },
    });

    expect(wrapper.find('[data-testid="accordion-icon"]').classes()).toContain('cyan');
  });

  it('displays results count badge', () => {
    const wrapper = mount(RaceEventResultsSection, {
      props: {
        raceEvent: mockRaceEventWithResults,
      },
    });

    const badge = wrapper.find('[data-testid="results-badge"]');
    expect(badge.text()).toContain('RESULTS');
  });
});
```

---

## Migration Checklist

- [ ] Update imports
- [ ] Transform Accordion structure
- [ ] Add summary helper functions
- [ ] Transform content with TechDataTable
- [ ] Update badge components
- [ ] Apply dark theme colors
- [ ] Update empty state styling
- [ ] Update tests
- [ ] Visual review

---

## Estimated Effort

- Accordion transformation: 1 hour
- Table styling: 1.5 hours
- Testing: 0.5 hours
- **Total: 3 hours**
