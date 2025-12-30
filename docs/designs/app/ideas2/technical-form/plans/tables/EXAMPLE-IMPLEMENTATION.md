# Example Implementation - Before & After

## Overview

This document provides concrete before/after examples of migrating a DataTable to the Technical Blueprint design system.

---

## Example 1: Simple Standings Table

### BEFORE (Light Mode, Current Implementation)

```vue
<script setup lang="ts">
import { ref } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { getPodiumRowClass } from '@app/constants/podiumColors';

interface Driver {
  position: number;
  name: string;
  team: string;
  points: number;
  gap: number | null;
}

const drivers = ref<Driver[]>([
  { position: 1, name: 'Max Verstappen', team: 'Red Bull', points: 331, gap: null },
  { position: 2, name: 'Lando Norris', team: 'McLaren', points: 279, gap: -52 },
  { position: 3, name: 'Charles Leclerc', team: 'Ferrari', points: 245, gap: -86 },
  { position: 4, name: 'Carlos Sainz', team: 'Ferrari', points: 190, gap: -141 },
]);
</script>

<template>
  <DataTable
    :value="drivers"
    striped-rows
    responsive-layout="scroll"
    :row-class="(data) => getPodiumRowClass(data.position)"
  >
    <Column field="position" header="Pos">
      <template #body="{ data }">
        <span class="font-mono font-semibold">
          {{ String(data.position).padStart(2, '0') }}
        </span>
      </template>
    </Column>

    <Column field="name" header="Driver">
      <template #body="{ data }">
        <span class="font-semibold">{{ data.name }}</span>
      </template>
    </Column>

    <Column field="team" header="Team">
      <template #body="{ data }">
        <span class="text-sm text-gray-600">{{ data.team }}</span>
      </template>
    </Column>

    <Column field="points" header="Points">
      <template #body="{ data }">
        <span class="font-mono font-semibold">{{ data.points }}</span>
      </template>
    </Column>

    <Column field="gap" header="Gap">
      <template #body="{ data }">
        <span class="font-mono text-sm text-gray-600">
          {{ data.gap === null ? '—' : data.gap }}
        </span>
      </template>
    </Column>
  </DataTable>
</template>
```

### AFTER (Dark Mode, Technical Blueprint)

```vue
<script setup lang="ts">
import { ref } from 'vue';
import Column from 'primevue/column';
import {
  TechDataTable,
  PositionCell,
  DriverCell,
  TeamCell,
  PointsCell,
  GapCell,
} from '@app/components/common/tables';

interface Driver {
  position: number;
  name: string;
  team: string;
  teamColor?: string;
  points: number;
  gap: number | null;
}

const drivers = ref<Driver[]>([
  { position: 1, name: 'Max Verstappen', team: 'Red Bull', teamColor: '#3671c6', points: 331, gap: null },
  { position: 2, name: 'Lando Norris', team: 'McLaren', teamColor: '#ff8000', points: 279, gap: -52 },
  { position: 3, name: 'Charles Leclerc', team: 'Ferrari', teamColor: '#e8002d', points: 245, gap: -86 },
  { position: 4, name: 'Carlos Sainz', team: 'Ferrari', teamColor: '#e8002d', points: 190, gap: -141 },
]);
</script>

<template>
  <TechDataTable
    :value="drivers"
    :podium-highlight="true"
    position-field="position"
    responsive-layout="scroll"
  >
    <Column field="position" header="Pos" style="width: 60px">
      <template #body="{ data }">
        <PositionCell :position="data.position" />
      </template>
    </Column>

    <Column field="name" header="Driver">
      <template #body="{ data }">
        <DriverCell :name="data.name" />
      </template>
    </Column>

    <Column field="team" header="Team">
      <template #body="{ data }">
        <TeamCell :name="data.team" :color="data.teamColor" />
      </template>
    </Column>

    <Column field="points" header="Points">
      <template #body="{ data }">
        <PointsCell :value="data.points" />
      </template>
    </Column>

    <Column field="gap" header="Gap">
      <template #body="{ data }">
        <GapCell :value="data.gap" />
      </template>
    </Column>
  </TechDataTable>
</template>
```

### Key Changes

1. **Imports**: Replaced PrimeVue DataTable with TechDataTable + cell components
2. **Table Component**: `<DataTable>` → `<TechDataTable>`
3. **Removed**: `striped-rows` prop (no longer needed)
4. **Added**: `:podium-highlight="true"` and `position-field="position"` for automatic podium styling
5. **Removed**: `:row-class` prop (handled automatically by wrapper)
6. **Cell Components**: Replaced manual cell formatting with dedicated components:
   - `<PositionCell>` - Handles position formatting and podium colors
   - `<DriverCell>` - Handles driver display
   - `<TeamCell>` - Handles team indicator with colored dot
   - `<PointsCell>` - Handles numerical data formatting
   - `<GapCell>` - Handles gap calculation and coloring

---

## Example 2: Complex Paginated Table

### BEFORE

```vue
<script setup lang="ts">
import { ref } from 'vue';
import DataTable from 'primevue/datatable';
import type { DataTablePageEvent, DataTableSortEvent } from 'primevue/datatable';
import Column from 'primevue/column';

const drivers = ref([...]);
const loading = ref(false);
const totalRecords = ref(100);
const currentPage = ref(1);
const perPage = ref(10);

async function onPage(event: DataTablePageEvent): Promise<void> {
  // Handle pagination
}

async function onSort(event: DataTableSortEvent): Promise<void> {
  // Handle sorting
}
</script>

<template>
  <DataTable
    :value="drivers"
    :loading="loading"
    lazy
    paginator
    :rows="perPage"
    :total-records="totalRecords"
    :first="(currentPage - 1) * perPage"
    striped-rows
    responsive-layout="scroll"
    @page="onPage"
    @sort="onSort"
  >
    <template #empty>
      <div class="text-center py-8">
        <p class="text-gray-600">No drivers found</p>
      </div>
    </template>

    <Column field="name" header="Driver" sortable>
      <template #body="{ data }">
        <span class="font-semibold">{{ data.name }}</span>
      </template>
    </Column>

    <Column field="points" header="Points" sortable>
      <template #body="{ data }">
        <span class="font-mono font-semibold">{{ data.points }}</span>
      </template>
    </Column>
  </DataTable>
</template>
```

### AFTER

```vue
<script setup lang="ts">
import { ref } from 'vue';
import type { DataTablePageEvent, DataTableSortEvent } from 'primevue/datatable';
import Column from 'primevue/column';
import { TechDataTable, DriverCell, PointsCell } from '@app/components/common/tables';

const drivers = ref([...]);
const loading = ref(false);
const totalRecords = ref(100);
const currentPage = ref(1);
const perPage = ref(10);

async function onPage(event: DataTablePageEvent): Promise<void> {
  // Handle pagination
}

async function onSort(event: DataTableSortEvent): Promise<void> {
  // Handle sorting
}
</script>

<template>
  <TechDataTable
    :value="drivers"
    :loading="loading"
    :lazy="true"
    :paginator="true"
    :rows="perPage"
    :total-records="totalRecords"
    :first="(currentPage - 1) * perPage"
    empty-message="No drivers found"
    responsive-layout="scroll"
    @page="onPage"
    @sort="onSort"
  >
    <Column field="name" header="Driver" sortable>
      <template #body="{ data }">
        <DriverCell :name="data.name" />
      </template>
    </Column>

    <Column field="points" header="Points" sortable>
      <template #body="{ data }">
        <PointsCell :value="data.points" />
      </template>
    </Column>
  </TechDataTable>
</template>
```

### Key Changes

1. **Import**: Added TechDataTable and cell components
2. **Removed**: `striped-rows` prop
3. **Simplified**: Empty state now uses `empty-message` prop instead of template
4. **Cell Components**: Used DriverCell and PointsCell for consistent styling

---

## Example 3: Driver Cell with Avatar

### BEFORE

```vue
<Column field="driver" header="Driver">
  <template #body="{ data }">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 bg-gray-200 rounded flex items-center justify-center font-semibold text-sm">
        {{ getInitials(data.name) }}
      </div>
      <div class="flex flex-col">
        <span class="font-semibold">{{ data.name }}</span>
        <span class="text-xs text-gray-500">{{ data.discord_id }}</span>
      </div>
    </div>
  </template>
</Column>
```

### AFTER

```vue
<Column field="driver" header="Driver">
  <template #body="{ data }">
    <DriverCell
      :name="data.name"
      :subtitle="data.discord_id"
      :avatar="getInitials(data.name)"
      :team-color="data.team_color"
    />
  </template>
</Column>
```

### Key Changes

1. **One Line**: Replaced entire custom layout with single DriverCell component
2. **Props**: All styling handled via component props
3. **Consistent**: Matches Technical Blueprint design automatically
4. **Team Color**: Optional border color based on team

---

## Example 4: Team Indicator

### BEFORE

```vue
<Column field="team" header="Team">
  <template #body="{ data }">
    <div class="flex items-center gap-2">
      <span
        class="w-2 h-2 rounded-full"
        :style="{ backgroundColor: data.team_color }"
      ></span>
      <span class="text-sm">{{ data.team_name }}</span>
    </div>
  </template>
</Column>
```

### AFTER

```vue
<Column field="team" header="Team">
  <template #body="{ data }">
    <TeamCell
      :name="data.team_name"
      :color="data.team_color"
    />
  </template>
</Column>
```

### Key Changes

1. **Simplified**: One-line component instead of custom layout
2. **Consistent**: Matches Technical Blueprint design (8px dot, bg-elevated background)
3. **Logo Support**: Can pass `:logo` prop instead of `:color` if team has logo

---

## Example 5: Status Badges

### BEFORE

```vue
<Column field="status" header="Status">
  <template #body="{ data }">
    <span
      class="inline-flex items-center gap-2 px-3 py-1 rounded text-xs font-medium"
      :class="{
        'bg-green-100 text-green-700': data.status === 'active',
        'bg-orange-100 text-orange-700': data.status === 'pending',
        'bg-gray-100 text-gray-700': data.status === 'inactive',
      }"
    >
      <span
        class="w-1.5 h-1.5 rounded-full"
        :class="{
          'bg-green-500': data.status === 'active',
          'bg-orange-500': data.status === 'pending',
          'bg-gray-500': data.status === 'inactive',
        }"
      ></span>
      {{ data.status }}
    </span>
  </template>
</Column>
```

### AFTER

```vue
<Column field="status" header="Status">
  <template #body="{ data }">
    <StatusCell :status="data.status" />
  </template>
</Column>
```

### Key Changes

1. **One Line**: Replaced entire custom badge with StatusCell component
2. **Dark Mode**: Automatically uses Technical Blueprint colors
3. **Consistent**: Matches design system exactly
4. **Type-Safe**: TypeScript ensures valid status values

---

## Visual Comparison

### Header Styling

**Before (Light Mode)**:
- Font: Mixed sans-serif
- Size: 11px (0.6875rem)
- Color: Gray-600
- Letter-spacing: 0.5px
- Background: Light gray striped

**After (Dark Mode - Technical Blueprint)**:
- Font: IBM Plex Mono
- Size: 10px
- Color: #6e7681 (--text-muted)
- Letter-spacing: 1px (increased)
- Background: #1c2128 (--bg-card)
- Border: 1px solid #30363d (--border)

### Cell Styling

**Before (Light Mode)**:
- Padding: Variable
- Font: Mixed
- Color: Gray-900/Gray-600
- Background: White/Gray-50 (striped)

**After (Dark Mode - Technical Blueprint)**:
- Padding: 14px 16px (consistent)
- Font: IBM Plex Mono for data, Inter for names
- Color: #e6edf3 (--text-primary) / #8b949e (--text-secondary)
- Background: Transparent (no stripes)
- Border-bottom: 1px solid #21262d (--border-muted)
- Last row: No border

### Podium Colors

**Before (Light Mode)**:
- 1st: bg-amber-100 (light gold background)
- 2nd: bg-gray-200 (light gray background)
- 3rd: bg-orange-100 (light orange background)

**After (Dark Mode - Technical Blueprint)**:
- 1st: #d29922 (gold text) + rgba(210, 153, 34, 0.08) (subtle tint)
- 2nd: #6e7681 (silver text) + rgba(110, 118, 129, 0.08) (subtle tint)
- 3rd: #f0883e (bronze text) + rgba(240, 136, 62, 0.08) (subtle tint)

### Row Hover

**Before (Light Mode)**:
- Background: Gray-100

**After (Dark Mode - Technical Blueprint)**:
- Background: #21262d (--bg-elevated)

---

## Code Reduction

Using the custom components significantly reduces code:

### Without Custom Components
```vue
<!-- 15 lines of code for driver cell -->
<div class="flex items-center gap-3">
  <div class="w-8 h-8 bg-gray-200 rounded flex items-center justify-center font-semibold text-sm">
    {{ getInitials(data.name) }}
  </div>
  <div class="flex flex-col">
    <span class="font-semibold">{{ data.name }}</span>
    <span class="text-xs text-gray-500">{{ data.discord_id }}</span>
  </div>
</div>
```

### With Custom Components
```vue
<!-- 1 line of code for driver cell -->
<DriverCell :name="data.name" :subtitle="data.discord_id" />
```

**Result**: 93% code reduction + guaranteed consistency

---

## Migration Effort Estimate

| Component | Complexity | Lines Changed | Time Estimate |
|-----------|-----------|---------------|---------------|
| AvailableDriversTable.vue | Low | ~20 | 30 min |
| TeamsPanel.vue | Low-Medium | ~25 | 45 min |
| DivisionsPanel.vue | Medium | ~30 | 1 hour |
| SeasonDriversTable.vue | Very High | ~100 | 3 hours |
| DriverTable.vue | High | ~60 | 2 hours |
| RoundStandingsSection.vue | Medium-High | ~50 | 1.5 hours |
| RaceEventResultsSection.vue | Medium-High | ~50 | 1.5 hours |
| CrossDivisionResultsSection.vue | Medium | ~40 | 1 hour |
| SeasonStandingsPanel.vue | High | ~80 | 2 hours |
| **Total** | | **~455** | **13-14 hours** |

---

## Benefits Summary

1. **Visual Consistency**: All tables match Technical Blueprint design system
2. **Dark Mode**: Proper dark mode colors throughout
3. **Code Reduction**: 60-90% less code per table cell
4. **Maintainability**: Single source of truth for styling
5. **Type Safety**: TypeScript ensures correct usage
6. **Accessibility**: Built-in ARIA labels and keyboard navigation
7. **Performance**: Reduced re-renders with optimized components
8. **Developer Experience**: Easier to build new tables
9. **Future-Proof**: Easy to update all tables by changing wrapper component

---

## Next Steps

1. Review this example to understand the migration pattern
2. Start with Phase 1: CSS Foundation (1-css-foundation.md)
3. Build custom components in Phase 2 (2-custom-components.md)
4. Follow migration checklist in Phase 3 (3-migration-checklist.md)
5. Update podium colors in Phase 4 (4-podium-colors.md)
6. Test thoroughly after each phase
