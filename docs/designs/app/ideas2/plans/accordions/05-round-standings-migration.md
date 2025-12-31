# RoundStandingsSection.vue Accordion Migration Plan

## Current State Analysis

**File:** `resources/app/js/components/round/modals/RoundStandingsSection.vue`

### Current Implementation

Single-panel accordion displaying round standings in a data table:

- **Structure**: One AccordionPanel with value="0"
- **Header**: Trophy icon (amber) + "Round Standings" title
- **Content**: TechDataTable with position, driver, points columns
- **Mode**: Controlled with `value="0"` (default expanded)

### Current Styling
- Light theme: `bg-white`, `border-slate-200`, `bg-gray-50`
- Custom header with trophy icon
- Amber color for trophy icon

---

## Target State

Transform to Technical Blueprint design with:
- Dark theme matching design system
- Golden trophy icon with glow effect for standings
- Enhanced table presentation
- Podium styling for top 3

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
  AccordionBadge,
} from '@app/components/common/accordions';
```

### Step 2: Transform Accordion Structure

**Current (lines 2-9):**
```vue
<Accordion value="0" class="bg-white border border-slate-200 rounded">
  <AccordionPanel value="0">
    <AccordionHeader class="bg-gray-50 px-4 py-3 border-b border-gray-200">
      <div class="flex items-center gap-2">
        <PhTrophy class="text-amber-600" :size="20" />
        <h3 class="font-semibold text-gray-900">Round Standings</h3>
      </div>
    </AccordionHeader>
```

**Target:**
```vue
<TechnicalAccordion :model-value="['standings']">
  <TechnicalAccordionPanel value="standings">
    <TechnicalAccordionHeader
      title="Round Standings"
      :subtitle="standingsSummary"
      :icon="PhTrophy"
      icon-variant="orange"
    >
      <template #suffix>
        <AccordionBadge
          v-if="standingsData.length"
          :text="`${standingsData.length} DRIVERS`"
          severity="info"
        />
      </template>
    </TechnicalAccordionHeader>
```

### Step 3: Add Summary Helpers

```typescript
// Add to script setup
const standingsSummary = computed(() => {
  if (!standingsData.value.length) return 'No standings data';
  const leader = standingsData.value[0];
  return `Leader: ${leader.driver_name} (${leader.total_points} pts)`;
});
```

### Step 4: Transform Content

**Current (lines 10-82):**
```vue
<AccordionContent>
  <div class="overflow-x-auto">
    <TechDataTable
      :value="standingsData"
      :rows="50"
      podium-highlight
    >
```

**Target:**
```vue
<TechnicalAccordionContent padding="none">
  <div class="overflow-x-auto">
    <TechDataTable
      :value="standingsData"
      :rows="50"
      podium-highlight
      class="tech-standings-table"
    >
```

### Step 5: Update Column Styling

**Transform each column to use Technical Blueprint styling:**

```vue
<!-- Position Column -->
<Column header="#" style="width: 50px">
  <template #body="{ data }">
    <PositionCell :position="data.position" />
  </template>
</Column>

<!-- Driver Column -->
<Column header="Driver" style="min-width: 180px">
  <template #body="{ data }">
    <span class="font-semibold text-primary font-mono">
      {{ data.driver_name }}
    </span>
  </template>
</Column>

<!-- Total Race Points (conditional) -->
<Column
  v-if="hasRacePointsEnabled"
  header="Race Pts"
  style="width: 100px"
>
  <template #body="{ data }">
    <span class="text-secondary font-mono">
      {{ data.total_race_points || 0 }}
    </span>
  </template>
</Column>

<!-- Fastest Lap Points -->
<Column header="FL Pts" style="width: 80px">
  <template #body="{ data }">
    <div class="flex items-center gap-1">
      <PhLightning
        v-if="data.fastest_lap_points"
        :size="14"
        class="text-purple"
        weight="fill"
      />
      <span class="text-secondary font-mono">
        {{ data.fastest_lap_points || '-' }}
      </span>
    </div>
  </template>
</Column>

<!-- Pole Position Points -->
<Column header="Pole Pts" style="width: 80px">
  <template #body="{ data }">
    <div class="flex items-center gap-1">
      <PhMedal
        v-if="data.pole_position_points"
        :size="14"
        class="text-purple"
        weight="fill"
      />
      <span class="text-secondary font-mono">
        {{ data.pole_position_points || '-' }}
      </span>
    </div>
  </template>
</Column>

<!-- Position Change -->
<Column header="+/-" style="width: 60px">
  <template #body="{ data }">
    <span
      class="font-mono text-sm"
      :class="{
        'text-green': data.positions_gained > 0,
        'text-red': data.positions_gained < 0,
        'text-muted': data.positions_gained === 0,
      }"
    >
      {{ formatPositionChange(data.positions_gained) }}
    </span>
  </template>
</Column>

<!-- Final Points -->
<Column header="Points" style="width: 80px">
  <template #body="{ data }">
    <PointsCell :points="data.total_points" class="font-bold" />
  </template>
</Column>
```

---

## CSS Updates

```css
/* Standings table specific styles */
.tech-standings-table {
  --table-bg: var(--accordion-bg);
  --table-header-bg: var(--accordion-bg-elevated);
  --table-row-hover: var(--accordion-bg-highlight);
  --table-border: var(--accordion-border);
}

.tech-standings-table :deep(.p-datatable-thead > tr > th) {
  background: var(--table-header-bg);
  border-color: var(--table-border);
  color: var(--accordion-text-muted);
  font-family: var(--accordion-font-mono);
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tech-standings-table :deep(.p-datatable-tbody > tr) {
  background: var(--table-bg);
  border-color: var(--table-border);
}

.tech-standings-table :deep(.p-datatable-tbody > tr:hover) {
  background: var(--table-row-hover);
}

/* Podium row highlighting */
.tech-standings-table :deep(.p-datatable-tbody > tr:nth-child(1)) {
  background: rgba(255, 215, 0, 0.08);
  border-left: 3px solid #ffd700;
}

.tech-standings-table :deep(.p-datatable-tbody > tr:nth-child(2)) {
  background: rgba(192, 192, 192, 0.08);
  border-left: 3px solid #c0c0c0;
}

.tech-standings-table :deep(.p-datatable-tbody > tr:nth-child(3)) {
  background: rgba(205, 127, 50, 0.08);
  border-left: 3px solid #cd7f32;
}
```

---

## Full Component Transformation

```vue
<template>
  <TechnicalAccordion :model-value="['standings']" class="standings-accordion">
    <TechnicalAccordionPanel value="standings">
      <TechnicalAccordionHeader
        title="Round Standings"
        :subtitle="standingsSummary"
        :icon="PhTrophy"
        icon-variant="orange"
      >
        <template #suffix>
          <AccordionBadge
            v-if="standingsData.length"
            :text="`${standingsData.length} DRIVERS`"
            severity="info"
          />
        </template>
      </TechnicalAccordionHeader>

      <TechnicalAccordionContent padding="none">
        <div class="overflow-x-auto">
          <TechDataTable
            v-if="standingsData.length"
            :value="standingsData"
            :rows="50"
            podium-highlight
            class="tech-standings-table"
          >
            <!-- Position Column -->
            <Column header="#" style="width: 50px">
              <template #body="{ data }">
                <PositionCell :position="data.position" />
              </template>
            </Column>

            <!-- Driver Column -->
            <Column header="Driver" style="min-width: 180px">
              <template #body="{ data }">
                <span class="font-semibold text-primary">
                  {{ data.driver_name }}
                </span>
              </template>
            </Column>

            <!-- Total Race Points -->
            <Column
              v-if="hasRacePointsEnabled"
              header="Race Pts"
              style="width: 100px"
            >
              <template #body="{ data }">
                <span class="text-secondary font-mono">
                  {{ data.total_race_points || 0 }}
                </span>
              </template>
            </Column>

            <!-- Fastest Lap Points -->
            <Column header="FL" style="width: 70px">
              <template #body="{ data }">
                <div class="flex items-center gap-1">
                  <PhLightning
                    v-if="data.fastest_lap_points"
                    :size="14"
                    class="text-purple"
                    weight="fill"
                  />
                  <span class="text-secondary font-mono">
                    {{ data.fastest_lap_points || '-' }}
                  </span>
                </div>
              </template>
            </Column>

            <!-- Pole Points -->
            <Column header="Pole" style="width: 70px">
              <template #body="{ data }">
                <div class="flex items-center gap-1">
                  <PhMedal
                    v-if="data.pole_position_points"
                    :size="14"
                    class="text-purple"
                    weight="fill"
                  />
                  <span class="text-secondary font-mono">
                    {{ data.pole_position_points || '-' }}
                  </span>
                </div>
              </template>
            </Column>

            <!-- Position Change -->
            <Column header="+/-" style="width: 60px">
              <template #body="{ data }">
                <span
                  class="font-mono text-sm"
                  :class="getPositionChangeClass(data.positions_gained)"
                >
                  {{ formatPositionChange(data.positions_gained) }}
                </span>
              </template>
            </Column>

            <!-- Total Points -->
            <Column header="Total" style="width: 80px">
              <template #body="{ data }">
                <PointsCell :points="data.total_points" />
              </template>
            </Column>
          </TechDataTable>

          <!-- Empty State -->
          <div
            v-else
            class="flex flex-col items-center justify-center py-12 text-muted"
          >
            <PhChartBar :size="48" class="mb-4 opacity-50" />
            <p class="font-mono text-sm">No standings data available</p>
          </div>
        </div>
      </TechnicalAccordionContent>
    </TechnicalAccordionPanel>
  </TechnicalAccordion>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  TechnicalAccordion,
  TechnicalAccordionPanel,
  TechnicalAccordionHeader,
  TechnicalAccordionContent,
  AccordionBadge,
} from '@app/components/common/accordions';
import { PhTrophy, PhLightning, PhMedal, PhChartBar } from '@phosphor-icons/vue';
import TechDataTable from '@app/components/common/tables/TechDataTable.vue';
import Column from 'primevue/column';
import PositionCell from '@app/components/common/cells/PositionCell.vue';
import PointsCell from '@app/components/common/cells/PointsCell.vue';

// ... existing props and logic

const standingsSummary = computed(() => {
  if (!standingsData.value.length) return 'No standings data';
  const leader = standingsData.value[0];
  return `Leader: ${leader.driver_name}`;
});

function getPositionChangeClass(change: number): string {
  if (change > 0) return 'text-green';
  if (change < 0) return 'text-red';
  return 'text-muted';
}
</script>
```

---

## Test Updates

```typescript
describe('RoundStandingsSection', () => {
  it('renders with trophy icon', () => {
    const wrapper = mount(RoundStandingsSection, {
      props: {
        roundStandings: mockStandings,
      },
    });

    const icon = wrapper.findComponent(PhTrophy);
    expect(icon.exists()).toBe(true);
  });

  it('displays standings summary in subtitle', () => {
    const wrapper = mount(RoundStandingsSection, {
      props: {
        roundStandings: mockStandings,
      },
    });

    expect(wrapper.text()).toContain('Leader:');
  });

  it('shows driver count badge', () => {
    const wrapper = mount(RoundStandingsSection, {
      props: {
        roundStandings: mockStandingsWithDrivers,
      },
    });

    const badge = wrapper.findComponent(AccordionBadge);
    expect(badge.text()).toContain('DRIVERS');
  });

  it('applies podium highlighting to top 3', () => {
    const wrapper = mount(RoundStandingsSection, {
      props: {
        roundStandings: mockStandings,
      },
    });

    const rows = wrapper.findAll('.p-datatable-tbody > tr');
    expect(rows[0].classes()).toContain('podium-gold');
    expect(rows[1].classes()).toContain('podium-silver');
    expect(rows[2].classes()).toContain('podium-bronze');
  });
});
```

---

## Migration Checklist

- [ ] Update imports
- [ ] Transform Accordion structure
- [ ] Add standings summary computed
- [ ] Transform table columns
- [ ] Apply dark theme styling
- [ ] Add podium highlighting
- [ ] Update empty state
- [ ] Update tests
- [ ] Visual review

---

## Estimated Effort

- Accordion transformation: 0.5 hours
- Table styling: 1 hour
- Testing: 0.5 hours
- **Total: 2 hours**
