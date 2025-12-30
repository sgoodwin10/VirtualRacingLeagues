# Phase 2: Custom Components - TechDataTable Wrapper

## Overview

This document details the creation of custom wrapper components for DataTable functionality. These components enforce Technical Blueprint styling and provide consistent patterns across all tables.

## Component Architecture

```
resources/app/js/components/common/tables/
├── TechDataTable.vue          # Main wrapper component
├── cells/
│   ├── PositionCell.vue       # Position with podium colors
│   ├── DriverCell.vue         # Avatar + driver info
│   ├── TeamCell.vue           # Team indicator with dot
│   ├── PointsCell.vue         # Monospace numerical data
│   ├── GapCell.vue            # Gap to leader (±)
│   └── StatusCell.vue         # Status badges
├── __tests__/
│   ├── TechDataTable.test.ts
│   └── cells/
│       ├── PositionCell.test.ts
│       ├── DriverCell.test.ts
│       ├── TeamCell.test.ts
│       ├── PointsCell.test.ts
│       ├── GapCell.test.ts
│       └── StatusCell.test.ts
└── index.ts                   # Export all components
```

## 1. TechDataTable.vue - Main Wrapper Component

**File**: `/var/www/resources/app/js/components/common/tables/TechDataTable.vue`

```vue
<script setup lang="ts" generic="T extends Record<string, unknown>">
import { computed } from 'vue';
import DataTable from 'primevue/datatable';
import type {
  DataTablePageEvent,
  DataTableSortEvent,
  DataTableFilterEvent,
} from 'primevue/datatable';

interface Props {
  /** Table data */
  value: T[];
  /** Show loading spinner */
  loading?: boolean;
  /** Enable pagination */
  paginator?: boolean;
  /** Rows per page */
  rows?: number;
  /** Total records (for lazy loading) */
  totalRecords?: number;
  /** First row index (for pagination control) */
  first?: number;
  /** Enable lazy loading */
  lazy?: boolean;
  /** Enable row hover */
  rowHover?: boolean;
  /** Empty message */
  emptyMessage?: string;
  /** Enable responsive layout */
  responsiveLayout?: 'scroll' | 'stack';
  /** DataTable class for custom styling */
  tableClass?: string;
  /** Apply podium highlighting to rows (requires position field) */
  podiumHighlight?: boolean;
  /** Position field name for podium highlighting */
  positionField?: keyof T;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  paginator: false,
  rows: 10,
  totalRecords: undefined,
  first: 0,
  lazy: false,
  rowHover: true,
  emptyMessage: 'No data available',
  responsiveLayout: 'scroll',
  tableClass: '',
  podiumHighlight: false,
  positionField: 'position' as keyof T,
});

interface Emits {
  page: [event: DataTablePageEvent];
  sort: [event: DataTableSortEvent];
  filter: [event: DataTableFilterEvent];
}

const emit = defineEmits<Emits>();

/**
 * Get podium class for row based on position
 */
const getRowClass = (data: T): string => {
  if (!props.podiumHighlight || !props.positionField) return '';

  const position = data[props.positionField] as number | undefined;
  if (!position) return '';

  switch (position) {
    case 1:
      return 'podium-1';
    case 2:
      return 'podium-2';
    case 3:
      return 'podium-3';
    default:
      return '';
  }
};

/**
 * Combined table classes
 */
const tableClasses = computed(() => {
  return ['tech-datatable', props.tableClass].filter(Boolean).join(' ');
});

/**
 * Handle page event
 */
function onPage(event: DataTablePageEvent): void {
  emit('page', event);
}

/**
 * Handle sort event
 */
function onSort(event: DataTableSortEvent): void {
  emit('sort', event);
}

/**
 * Handle filter event
 */
function onFilter(event: DataTableFilterEvent): void {
  emit('filter', event);
}
</script>

<template>
  <DataTable
    :value="value"
    :loading="loading"
    :paginator="paginator"
    :rows="rows"
    :total-records="totalRecords"
    :first="first"
    :lazy="lazy"
    :row-hover="rowHover"
    :responsive-layout="responsiveLayout"
    :row-class="podiumHighlight ? getRowClass : undefined"
    :class="tableClasses"
    @page="onPage"
    @sort="onSort"
    @filter="onFilter"
  >
    <!-- Pass through all slots -->
    <template #header>
      <slot name="header" />
    </template>

    <template #empty>
      <div class="text-center py-8">
        <i class="pi pi-inbox text-4xl text-gray-400 mb-3 opacity-30"></i>
        <p class="text-muted">{{ emptyMessage }}</p>
      </div>
    </template>

    <template #loading>
      <div class="text-center py-8">
        <i class="pi pi-spin pi-spinner text-4xl text-gray-400"></i>
        <p class="text-muted mt-3">Loading data...</p>
      </div>
    </template>

    <!-- Default slot for columns -->
    <slot />

    <!-- Paginator template -->
    <template v-if="paginator" #paginatorcontainer="slotProps">
      <slot name="paginatorcontainer" v-bind="slotProps" />
    </template>
  </DataTable>
</template>

<style scoped>
/* Component-specific overrides if needed */
.tech-datatable {
  /* Ensure no striped rows */
  --p-datatable-row-background: transparent;
}
</style>
```

## 2. PositionCell.vue - Position with Podium Colors

**File**: `/var/www/resources/app/js/components/common/tables/cells/PositionCell.vue`

```vue
<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  /** Position number (1, 2, 3, etc.) */
  position: number | null | undefined;
  /** Zero-pad position (e.g., 01, 02, 03) */
  padded?: boolean;
  /** Custom width */
  width?: string;
}

const props = withDefaults(defineProps<Props>(), {
  position: null,
  padded: true,
  width: '40px',
});

/**
 * Format position with optional padding
 */
const formattedPosition = computed(() => {
  if (props.position === null || props.position === undefined) return '—';
  return props.padded ? String(props.position).padStart(2, '0') : String(props.position);
});

/**
 * Get podium class based on position
 */
const positionClass = computed(() => {
  switch (props.position) {
    case 1:
      return 'pos p1';
    case 2:
      return 'pos p2';
    case 3:
      return 'pos p3';
    default:
      return 'pos';
  }
});
</script>

<template>
  <div :class="positionClass" :style="{ width }">
    {{ formattedPosition }}
  </div>
</template>

<style scoped>
.pos {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 600;
  text-align: center;
}

.pos.p1 {
  color: var(--yellow); /* Gold */
}

.pos.p2 {
  color: var(--text-muted); /* Silver */
}

.pos.p3 {
  color: var(--orange); /* Bronze */
}
</style>
```

## 3. DriverCell.vue - Avatar + Driver Info

**File**: `/var/www/resources/app/js/components/common/tables/cells/DriverCell.vue`

```vue
<script setup lang="ts">
interface Props {
  /** Driver name */
  name: string;
  /** Driver subtitle (e.g., "#1 | NED" or team name) */
  subtitle?: string;
  /** Avatar URL or initials */
  avatar?: string;
  /** Team color for avatar border */
  teamColor?: string;
  /** Show avatar */
  showAvatar?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: undefined,
  avatar: undefined,
  teamColor: undefined,
  showAvatar: true,
});

/**
 * Get initials from name
 */
function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
</script>

<template>
  <div class="driver-cell">
    <!-- Avatar -->
    <div
      v-if="showAvatar"
      class="driver-avatar"
      :style="teamColor ? { borderColor: teamColor } : undefined"
    >
      <img v-if="avatar && avatar.startsWith('http')" :src="avatar" :alt="name" />
      <span v-else>{{ avatar || getInitials(name) }}</span>
    </div>

    <!-- Info -->
    <div class="driver-info">
      <span class="driver-name">{{ name }}</span>
      <span v-if="subtitle" class="driver-subtitle">{{ subtitle }}</span>
    </div>
  </div>
</template>

<style scoped>
/* Styles already in global CSS, but can be scoped if needed */
.driver-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.driver-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius);
  background-color: var(--bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  flex-shrink: 0;
  overflow: hidden;
}

.driver-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.driver-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.driver-name {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 13px;
  font-family: var(--font-sans);
}

.driver-subtitle {
  font-size: 11px;
  color: var(--text-muted);
  font-family: var(--font-sans);
}
</style>
```

## 4. TeamCell.vue - Team Indicator with Dot

**File**: `/var/www/resources/app/js/components/common/tables/cells/TeamCell.vue`

```vue
<script setup lang="ts">
interface Props {
  /** Team name */
  name: string;
  /** Team color for dot */
  color?: string;
  /** Team logo URL */
  logo?: string;
}

const props = withDefaults(defineProps<Props>(), {
  color: undefined,
  logo: undefined,
});
</script>

<template>
  <span class="team-indicator">
    <img v-if="logo" :src="logo" :alt="name" class="team-logo" />
    <span v-else-if="color" class="dot" :style="{ backgroundColor: color }"></span>
    <span>{{ name }}</span>
  </span>
</template>

<style scoped>
.team-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background-color: var(--bg-elevated);
  border-radius: 3px;
  font-size: 12px;
  color: var(--text-secondary);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.team-logo {
  width: 16px;
  height: 16px;
  border-radius: 2px;
  object-fit: cover;
  flex-shrink: 0;
}
</style>
```

## 5. PointsCell.vue - Monospace Numerical Data

**File**: `/var/www/resources/app/js/components/common/tables/cells/PointsCell.vue`

```vue
<script setup lang="ts">
interface Props {
  /** Points value */
  value: number | null | undefined;
  /** Number of decimal places */
  decimals?: number;
  /** Placeholder for null/undefined */
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  value: null,
  decimals: 0,
  placeholder: '—',
});

/**
 * Format points value
 */
function formatValue(value: number | null | undefined): string {
  if (value === null || value === undefined) return props.placeholder;
  return value.toFixed(props.decimals);
}
</script>

<template>
  <div class="points-cell">
    {{ formatValue(value) }}
  </div>
</template>

<style scoped>
.points-cell {
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
}
</style>
```

## 6. GapCell.vue - Gap to Leader

**File**: `/var/www/resources/app/js/components/common/tables/cells/GapCell.vue`

```vue
<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  /** Gap value (positive or negative) */
  value: number | null | undefined;
  /** Number of decimal places */
  decimals?: number;
  /** Show + sign for positive values */
  showPlus?: boolean;
  /** Placeholder for leader (0 or null) */
  leaderPlaceholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  value: null,
  decimals: 0,
  showPlus: false,
  leaderPlaceholder: '—',
});

/**
 * Format gap value with sign
 */
const formattedValue = computed(() => {
  if (props.value === null || props.value === undefined || props.value === 0) {
    return props.leaderPlaceholder;
  }

  const formatted = Math.abs(props.value).toFixed(props.decimals);
  if (props.value > 0) {
    return props.showPlus ? `+${formatted}` : formatted;
  }
  return `-${formatted}`;
});

/**
 * Get CSS class based on value
 */
const gapClass = computed(() => {
  if (props.value === null || props.value === undefined || props.value === 0) {
    return 'gap-cell';
  }
  return props.value > 0 ? 'gap-cell positive' : 'gap-cell negative';
});
</script>

<template>
  <div :class="gapClass">
    {{ formattedValue }}
  </div>
</template>

<style scoped>
.gap-cell {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-secondary);
}

.gap-cell.negative {
  color: var(--red);
}

.gap-cell.positive {
  color: var(--green);
}
</style>
```

## 7. StatusCell.vue - Status Badges

**File**: `/var/www/resources/app/js/components/common/tables/cells/StatusCell.vue`

```vue
<script setup lang="ts">
import { computed } from 'vue';

type StatusType = 'active' | 'pending' | 'inactive' | 'scheduled' | 'error' | 'failed' | 'completed';

interface Props {
  /** Status type */
  status: StatusType;
  /** Custom label (defaults to capitalized status) */
  label?: string;
  /** Show status dot */
  showDot?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  label: undefined,
  showDot: true,
});

/**
 * Get display label
 */
const displayLabel = computed(() => {
  return props.label || props.status.charAt(0).toUpperCase() + props.status.slice(1);
});

/**
 * Get badge class
 */
const badgeClass = computed(() => {
  return `status-badge ${props.status}`;
});
</script>

<template>
  <span :class="badgeClass">
    <span v-if="showDot" class="dot"></span>
    {{ displayLabel }}
  </span>
</template>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
}

.status-badge .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
}

.status-badge.active,
.status-badge.completed {
  background-color: var(--green-dim);
  color: var(--green);
}

.status-badge.pending {
  background-color: var(--orange-dim);
  color: var(--orange);
}

.status-badge.inactive,
.status-badge.scheduled {
  background-color: var(--bg-elevated);
  color: var(--text-muted);
}

.status-badge.error,
.status-badge.failed {
  background-color: var(--red-dim);
  color: var(--red);
}
</style>
```

## 8. Index Export File

**File**: `/var/www/resources/app/js/components/common/tables/index.ts`

```typescript
// Main wrapper
export { default as TechDataTable } from './TechDataTable.vue';

// Cell components
export { default as PositionCell } from './cells/PositionCell.vue';
export { default as DriverCell } from './cells/DriverCell.vue';
export { default as TeamCell } from './cells/TeamCell.vue';
export { default as PointsCell } from './cells/PointsCell.vue';
export { default as GapCell } from './cells/GapCell.vue';
export { default as StatusCell } from './cells/StatusCell.vue';
```

## Implementation Steps

1. **Create directory structure**
   ```bash
   mkdir -p resources/app/js/components/common/tables/cells
   mkdir -p resources/app/js/components/common/tables/__tests__/cells
   ```

2. **Create components in order**:
   - TechDataTable.vue (main wrapper)
   - Cell components (PositionCell, DriverCell, TeamCell, PointsCell, GapCell, StatusCell)
   - index.ts (exports)

3. **Create tests** (see next section)

4. **Test components** in isolation before migration

## Testing Strategy

Each component should have comprehensive Vitest tests. See examples in the `__tests__` section of the migration checklist.

## Usage Example

```vue
<script setup lang="ts">
import { TechDataTable, PositionCell, DriverCell, PointsCell } from '@app/components/common/tables';

interface Driver {
  position: number;
  name: string;
  points: number;
}

const drivers: Driver[] = [...];
</script>

<template>
  <TechDataTable
    :value="drivers"
    :podium-highlight="true"
    position-field="position"
  >
    <Column field="position" header="Pos">
      <template #body="{ data }">
        <PositionCell :position="data.position" />
      </template>
    </Column>

    <Column field="name" header="Driver">
      <template #body="{ data }">
        <DriverCell :name="data.name" />
      </template>
    </Column>

    <Column field="points" header="Points">
      <template #body="{ data }">
        <PointsCell :value="data.points" />
      </template>
    </Column>
  </TechDataTable>
</template>
```

## Next Step

After completing custom components, proceed to:
- **[3-migration-checklist.md](./3-migration-checklist.md)** - File-by-file migration guide
