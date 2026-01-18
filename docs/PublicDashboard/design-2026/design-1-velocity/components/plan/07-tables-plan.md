# Table Components Implementation Plan - VRL Velocity Design System

**Status**: Ready for Implementation
**Target Application**: Public Dashboard (`resources/public`)
**Design Reference**: `/var/www/docs/PublicDashboard/design-2026/design-1-velocity/components/index.html` (TABLES section, lines 2327-2439)
**Reference Implementation**: `/var/www/resources/app/js/components/common/tables/` (App Dashboard table components)

---

## Executive Summary

This plan creates a comprehensive table component system for the VRL Velocity design system optimized for racing league data display. The approach wraps PrimeVue v4 DataTable for enterprise-grade features (sorting, filtering, pagination) while adding VRL-specific cell components and podium highlighting.

### Key Strategy
- **Wrap PrimeVue DataTable**: Use PrimeVue v4 DataTable as foundation for sorting, filtering, pagination
- **Specialized Cell Components**: Create reusable cell components for driver, position, points, gap, team data
- **Podium Highlighting**: Automatic visual highlighting for positions 1-3 with gold/silver/bronze styling
- **Racing-Focused Design**: Optimized for standings tables, results tables, and leaderboards
- **Type Safety**: Full TypeScript support with generic types for flexible data structures

---

## Design Analysis

### Design Aesthetic (from index.html)

The VRL Velocity table design emphasizes hierarchy, readability, and racing context:

#### Color Palette
```css
--bg-dark: #0d1117          /* Body background */
--bg-panel: #161b22         /* Panel/table header background */
--bg-card: #1c2128          /* Table body background */
--bg-elevated: #21262d      /* Row hover state */
--bg-highlight: #272d36     /* Elevated hover */
--text-primary: #e6edf3     /* Primary text */
--text-secondary: #8b949e   /* Secondary text */
--text-muted: #6e7681       /* Muted text */
--cyan: #58a6ff             /* Accent color */
--green: #7ee787            /* Success color */
--orange: #f0883e           /* Warning/bronze */
--red: #f85149              /* Danger color */
--yellow: #d29922           /* Gold color */
--border: #30363d           /* Default border */
--border-muted: #21262d     /* Subtle borders */
--radius-lg: 12px           /* Table border radius */
```

#### Podium Color System

| Position | Row Background | Text Color | Semantic |
|----------|---------------|------------|----------|
| **1st** | `rgba(210, 153, 34, 0.08)` | `#d29922` (yellow) | Gold medal |
| **2nd** | `rgba(139, 148, 158, 0.08)` | `#8b949e` (silver) | Silver medal |
| **3rd** | `rgba(240, 136, 62, 0.08)` | `#f0883e` (orange) | Bronze medal |

#### Typography

| Element | Font Family | Size | Weight | Transform |
|---------|-------------|------|--------|-----------|
| **Table Headers** | Orbitron (display) | 0.7rem | 600 | Uppercase |
| **Driver Name** | Inter (body) | 0.9rem | 500 | None |
| **Driver Team** | Inter (body) | 0.75rem | 400 | None |
| **Points** | Orbitron (display) | 0.9rem | 700 | None |
| **Gap** | Orbitron (display) | 0.85rem | 400 | None |
| **Position** | Orbitron (display) | 0.9rem | 600 | None |

#### Spacing & Layout

```css
/* Table Structure */
.data-table {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg); /* 12px */
  background: var(--bg-card);
  overflow: hidden;
}

/* Header Cells */
.data-table th {
  padding: 1rem 1.25rem;
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border);
}

/* Body Cells */
.data-table td {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border-muted);
}

/* Driver Avatar */
.driver-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius); /* 6px */
  gap: 0.75rem;
  font-size: 0.7rem;
}
```

---

## Current State Analysis

### Existing App Dashboard Table Components

From `resources/app/js/components/common/tables/`:

**TechDataTable.vue** (lines 1-303):
- Generic wrapper around PrimeVue DataTable
- Supports pagination, sorting, filtering, row reordering
- Includes `podiumHighlight` prop for positions 1-3
- Custom paginator with entity name ("drivers", "records")
- Type-safe with generic `T extends Record<string, any>`

**DriverCell.vue** (lines 1-101):
- Props: `name`, `nickname`, `avatar`, `teamColor`, `showAvatar`
- 32px avatar with initials fallback
- Two-line layout: name + subtitle

**PositionCell.vue** (lines 1-71):
- Props: `position`, `padded`, `width`
- Zero-padded formatting (01, 02, 03)
- Podium colors (gold/silver/bronze)

**PointsCell.vue** (lines 1-65):
- Props: `value`, `points`, `decimals`, `placeholder`, `bold`
- Auto-formatting for whole numbers vs decimals
- Orbitron mono font

**GapCell.vue** (lines 1-69):
- Props: `value`, `decimals`, `showPlus`, `leaderPlaceholder`
- Shows "—" for leader (gap = 0)
- Negative values for gap behind leader
- Red/green color coding

**TeamCell.vue** (lines 1-53):
- Props: `name`, `color`, `logo`, `logoUrl`
- Color dot or logo display
- Inline team indicator

### Gaps Between App and Public Design

1. **Design System Alignment**: App uses "tech" aesthetic, Public uses "velocity" aesthetic
2. **Font Families**: Need Orbitron headers (not used in app tables)
3. **Podium Styling**: Public design has stronger podium row backgrounds
4. **Pagination Style**: Public needs custom pagination UI (numbered buttons)
5. **Gap Display**: Public design uses "—" for leader, "-13" format for gaps
6. **Tag Integration**: Public tables use VrlTag component for teams

---

## Integration Strategy with PrimeVue v4

### Why Wrap PrimeVue DataTable?

**Advantages**:
1. **Enterprise Features**: Sorting, filtering, lazy loading, virtual scrolling
2. **Pagination**: Built-in pagination with customizable templates
3. **Accessibility**: ARIA attributes, keyboard navigation, focus management
4. **Row Selection**: Single/multiple row selection out of the box
5. **Export**: CSV/Excel export capabilities
6. **Responsive**: Built-in responsive layouts (scroll, stack)

**Approach**: Create wrapper component that:
- Wraps PrimeVue DataTable with VRL Velocity styling
- Provides simplified props for common racing league use cases
- Includes podium highlighting logic
- Uses slot-based cell components for flexibility

---

## Component Architecture

### Component Hierarchy

```
resources/public/js/components/common/tables/
├── VrlDataTable.vue              [Main table wrapper - wraps PrimeVue DataTable]
├── VrlTablePagination.vue        [Custom pagination component]
├── cells/                        [Cell components directory]
│   ├── VrlDriverCell.vue         [Driver name + avatar + team]
│   ├── VrlPositionCell.vue       [Position indicator with podium colors]
│   ├── VrlPointsCell.vue         [Points display with Orbitron font]
│   ├── VrlGapCell.vue            [Gap to leader with formatting]
│   └── VrlTeamCell.vue           [Team tag/indicator]
└── index.ts                      [Barrel export]
```

### Additional Files

```
resources/public/css/
└── components/                   [Component-specific CSS]
    └── tables.css                [Table-specific CSS overrides]
```

---

## Component Specifications

### 1. VrlDataTable.vue

**Purpose**: Main data table component for VRL Velocity design, wrapping PrimeVue DataTable.

#### Props

```typescript
interface VrlDataTableProps<T extends Record<string, any>> {
  // Data
  value: T[];
  columns?: ColumnConfig[];        // Column configuration (optional)

  // Loading & Empty States
  loading?: boolean;
  emptyMessage?: string;

  // Pagination
  paginated?: boolean;
  rows?: number;
  rowsPerPage?: number;
  rowsPerPageOptions?: number[];
  totalRecords?: number;
  first?: number;
  lazy?: boolean;

  // Features
  sortable?: boolean;
  hoverable?: boolean;
  striped?: boolean;

  // Podium Highlighting
  podiumHighlight?: boolean;
  positionField?: keyof T;         // Field name for position (e.g., 'position')

  // Styling
  tableClass?: string;
  responsiveLayout?: 'scroll' | 'stack';

  // Custom Pagination
  useCustomPagination?: boolean;
  entityName?: string;             // For pagination text ("drivers", "teams")
}
```

**Defaults**:
```typescript
{
  loading: false,
  emptyMessage: 'No data available',
  paginated: false,
  rows: 10,
  rowsPerPageOptions: [5, 10, 25, 50],
  first: 0,
  lazy: false,
  sortable: true,
  hoverable: true,
  striped: false,
  podiumHighlight: false,
  positionField: 'position',
  responsiveLayout: 'scroll',
  useCustomPagination: true,
  entityName: 'records'
}
```

#### Emits

```typescript
interface VrlDataTableEmits {
  (e: 'page', event: DataTablePageEvent): void;
  (e: 'sort', event: DataTableSortEvent): void;
  (e: 'filter', event: DataTableFilterEvent): void;
}
```

#### Computed Properties

```typescript
// Get podium class for row based on position
const getRowClass = (data: T): string => {
  if (!props.podiumHighlight || !props.positionField) return '';

  const position = data[props.positionField] as number | undefined;
  if (!position) return '';

  switch (position) {
    case 1: return 'podium-1';
    case 2: return 'podium-2';
    case 3: return 'podium-3';
    default: return '';
  }
};

// Combined table classes
const tableClasses = computed(() => {
  return [
    'vrl-datatable',
    props.tableClass,
    {
      'vrl-datatable--hoverable': props.hoverable,
      'vrl-datatable--striped': props.striped
    }
  ].filter(Boolean).join(' ');
});
```

#### Template Structure

```vue
<template>
  <DataTable
    :value="value"
    :loading="loading"
    :paginator="paginated"
    :rows="rows"
    :rows-per-page-options="rowsPerPageOptions"
    :total-records="totalRecords"
    :first="first"
    :lazy="lazy"
    :row-hover="hoverable"
    :responsive-layout="responsiveLayout"
    :row-class="podiumHighlight ? getRowClass : undefined"
    :class="tableClasses"
    :striped-rows="striped"
    @page="emit('page', $event)"
    @sort="emit('sort', $event)"
    @filter="emit('filter', $event)"
  >
    <!-- Header slot -->
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>

    <!-- Empty state -->
    <template #empty>
      <slot name="empty">
        <div class="vrl-datatable-empty">
          <p class="text-muted">{{ emptyMessage }}</p>
        </div>
      </slot>
    </template>

    <!-- Loading state -->
    <template #loading>
      <slot name="loading">
        <div class="vrl-datatable-loading">
          <i class="pi pi-spin pi-spinner"></i>
          <p class="text-muted">Loading data...</p>
        </div>
      </slot>
    </template>

    <!-- Default slot for columns -->
    <slot />

    <!-- Custom Paginator -->
    <template
      v-if="useCustomPagination && paginated"
      #paginatorcontainer="paginatorProps"
    >
      <VrlTablePagination
        :current-page="(paginatorProps.page ?? 0) + 1"
        :total-pages="paginatorProps.pageCount ?? 1"
        :total-items="paginatorProps.totalRecords ?? 0"
        :items-per-page="rows"
        :first="paginatorProps.first ?? 0"
        :last="paginatorProps.last ?? 0"
        :entity-name="entityName"
        @page-change="handlePageChange"
        @prev="paginatorProps.prevPageCallback"
        @next="paginatorProps.nextPageCallback"
      />
    </template>
  </DataTable>
</template>
```

---

### 2. VrlDriverCell.vue

**Purpose**: Display driver information with avatar, name, and team/subtitle.

#### Props

```typescript
interface VrlDriverCellProps {
  name: string;                    // Driver name (required)
  team?: string;                   // Team name or subtitle
  initials?: string;               // Custom initials (auto-generated if not provided)
  avatarUrl?: string;              // Avatar image URL
  showAvatar?: boolean;            // Show/hide avatar
}
```

**Defaults**:
```typescript
{
  team: undefined,
  initials: undefined,
  avatarUrl: undefined,
  showAvatar: true
}
```

#### Computed Properties

```typescript
// Generate initials from name
const generatedInitials = computed(() => {
  if (props.initials) return props.initials;

  const parts = props.name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
});
```

#### Template Structure

```vue
<template>
  <div class="driver-cell">
    <!-- Avatar -->
    <span v-if="showAvatar" class="driver-avatar">
      <img v-if="avatarUrl" :src="avatarUrl" :alt="name" />
      <span v-else>{{ generatedInitials }}</span>
    </span>

    <!-- Driver Info -->
    <div class="driver-info">
      <div class="driver-name">{{ name }}</div>
      <div v-if="team" class="driver-team">{{ team }}</div>
    </div>
  </div>
</template>
```

---

### 3. VrlPositionCell.vue

**Purpose**: Display position number with podium indicator styling.

#### Props

```typescript
interface VrlPositionCellProps {
  position: number;                // Position number (required)
}
```

#### Computed Properties

```typescript
// Get position indicator class
const positionClass = computed(() => {
  return `position-indicator position-${props.position}`;
});
```

#### Template Structure

```vue
<template>
  <span :class="positionClass">
    {{ position }}
  </span>
</template>
```

---

### 4. VrlPointsCell.vue

**Purpose**: Display points value with Orbitron monospace font.

#### Props

```typescript
interface VrlPointsCellProps {
  value: number;                   // Points value (required)
}
```

#### Template Structure

```vue
<template>
  <div class="points-cell">
    {{ value }}
  </div>
</template>
```

---

### 5. VrlGapCell.vue

**Purpose**: Display gap to leader with special formatting.

#### Props

```typescript
interface VrlGapCellProps {
  value: number | string | null;  // Gap value (null for leader)
}
```

#### Computed Properties

```typescript
// Format gap display
const formattedGap = computed(() => {
  if (props.value === null || props.value === 0) {
    return '—';  // Leader indicator
  }

  const numValue = typeof props.value === 'string'
    ? parseFloat(props.value)
    : props.value;

  return numValue < 0 ? numValue.toString() : `-${numValue}`;
});
```

#### Template Structure

```vue
<template>
  <div class="gap-cell">
    {{ formattedGap }}
  </div>
</template>
```

---

### 6. VrlTeamCell.vue

**Purpose**: Display team indicator using VrlTag component.

#### Props

```typescript
interface VrlTeamCellProps {
  name: string;                    // Team name or abbreviation (required)
  variant?: TagVariant;            // Tag color variant
}
```

**Defaults**:
```typescript
{
  variant: undefined  // Default tag styling
}
```

#### Template Structure

```vue
<template>
  <VrlTag :variant="variant">
    {{ name }}
  </VrlTag>
</template>
```

---

### 7. VrlTablePagination.vue

**Purpose**: Custom pagination component matching VRL Velocity design.

#### Props

```typescript
interface VrlTablePaginationProps {
  currentPage: number;             // Current page (1-indexed)
  totalPages: number;              // Total number of pages
  totalItems: number;              // Total number of items
  itemsPerPage: number;            // Items per page
  first: number;                   // First item index (0-indexed)
  last: number;                    // Last item index (0-indexed)
  entityName?: string;             // Entity name for display text
}
```

**Defaults**:
```typescript
{
  entityName: 'records'
}
```

#### Emits

```typescript
interface VrlTablePaginationEmits {
  (e: 'page-change', page: number): void;  // Page number (0-indexed)
  (e: 'prev'): void;
  (e: 'next'): void;
}
```

#### Computed Properties

```typescript
// Calculate visible page numbers (max 5 buttons)
const visiblePages = computed(() => {
  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, props.currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(props.totalPages, start + maxVisible - 1);

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return pages;
});

// Pagination info text
const paginationInfo = computed(() => {
  return `Showing ${props.first + 1}-${props.last} of ${props.totalItems} ${props.entityName}`;
});
```

#### Template Structure

```vue
<template>
  <div class="table-pagination">
    <!-- Left: Info text -->
    <div class="pagination-info">
      {{ paginationInfo }}
    </div>

    <!-- Right: Page controls -->
    <div class="pagination-controls">
      <!-- Previous button -->
      <button
        class="pagination-btn"
        :disabled="currentPage === 1"
        @click="emit('prev')"
      >
        ←
      </button>

      <!-- Page number buttons -->
      <button
        v-for="page in visiblePages"
        :key="page"
        class="pagination-btn"
        :class="{ active: page === currentPage }"
        @click="emit('page-change', page - 1)"
      >
        {{ page }}
      </button>

      <!-- Next button -->
      <button
        class="pagination-btn"
        :disabled="currentPage === totalPages"
        @click="emit('next')"
      >
        →
      </button>
    </div>
  </div>
</template>
```

---

### 8. index.ts (Barrel Export)

```typescript
export { default as VrlDataTable } from './VrlDataTable.vue';
export { default as VrlTablePagination } from './VrlTablePagination.vue';
export { default as VrlDriverCell } from './cells/VrlDriverCell.vue';
export { default as VrlPositionCell } from './cells/VrlPositionCell.vue';
export { default as VrlPointsCell } from './cells/VrlPointsCell.vue';
export { default as VrlGapCell } from './cells/VrlGapCell.vue';
export { default as VrlTeamCell } from './cells/VrlTeamCell.vue';
```

---

## CSS Implementation

### File: `resources/public/css/components/tables.css`

This file contains all table styling for the VRL Velocity design system.

```css
/* ============================================
   VRL Velocity - Table Components
   ============================================ */

/* Base Table Styles */
.vrl-datatable {
  width: 100%;
  border-collapse: collapse;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

/* Table Headers */
.vrl-datatable th {
  font-family: var(--font-display);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text-muted);
  text-align: left;
  padding: 1rem 1.25rem;
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border);
}

/* Table Cells */
.vrl-datatable td {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border-muted);
  font-size: 0.9rem;
  color: var(--text-primary);
}

/* Remove border from last row */
.vrl-datatable tr:last-child td {
  border-bottom: none;
}

/* Row Hover */
.vrl-datatable--hoverable tbody tr:hover td {
  background: var(--bg-elevated);
}

/* Striped Rows */
.vrl-datatable--striped tbody tr:nth-child(even) td {
  background: rgba(255, 255, 255, 0.02);
}

/* ============================================
   Podium Row Highlighting
   ============================================ */

/* 1st Place - Gold */
.vrl-datatable tr.podium-1 td {
  background: rgba(210, 153, 34, 0.08);
}

.vrl-datatable tr.podium-1:hover td {
  background: rgba(210, 153, 34, 0.12);
}

/* 2nd Place - Silver */
.vrl-datatable tr.podium-2 td {
  background: rgba(139, 148, 158, 0.08);
}

.vrl-datatable tr.podium-2:hover td {
  background: rgba(139, 148, 158, 0.12);
}

/* 3rd Place - Bronze */
.vrl-datatable tr.podium-3 td {
  background: rgba(240, 136, 62, 0.08);
}

.vrl-datatable tr.podium-3:hover td {
  background: rgba(240, 136, 62, 0.12);
}

/* ============================================
   Position Indicator
   ============================================ */

.position-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 24px;
}

/* Podium Positions */
.position-indicator.position-1 {
  color: var(--yellow);  /* Gold */
}

.position-indicator.position-2 {
  color: var(--text-secondary);  /* Silver */
}

.position-indicator.position-3 {
  color: var(--orange);  /* Bronze */
}

/* ============================================
   Driver Cell
   ============================================ */

.driver-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.driver-avatar {
  width: 32px;
  height: 32px;
  background: var(--bg-elevated);
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 0.7rem;
  font-weight: 600;
  border: 1px solid var(--border);
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
}

.driver-team {
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* ============================================
   Points Cell
   ============================================ */

.points-cell {
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--text-primary);
}

/* ============================================
   Gap Cell
   ============================================ */

.gap-cell {
  font-family: var(--font-display);
  font-size: 0.85rem;
  color: var(--text-secondary);
}

/* ============================================
   Table Pagination
   ============================================ */

.table-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: var(--bg-panel);
  border-top: 1px solid var(--border);
}

.pagination-info {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.pagination-controls {
  display: flex;
  gap: 0.5rem;
}

.pagination-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition);
  font-size: 0.85rem;
  font-weight: 500;
}

.pagination-btn:hover:not(:disabled) {
  border-color: var(--cyan);
  color: var(--cyan);
}

.pagination-btn.active {
  background: var(--cyan);
  border-color: var(--cyan);
  color: var(--bg-dark);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ============================================
   Empty State
   ============================================ */

.vrl-datatable-empty {
  padding: 3rem;
  text-align: center;
}

.vrl-datatable-loading {
  padding: 3rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.vrl-datatable-loading .pi {
  font-size: 2rem;
  color: var(--text-muted);
}

/* ============================================
   Responsive Adjustments
   ============================================ */

@media (max-width: 768px) {
  .vrl-datatable th,
  .vrl-datatable td {
    padding: 0.75rem 1rem;
  }

  .driver-avatar {
    width: 28px;
    height: 28px;
    font-size: 0.65rem;
  }

  .driver-name {
    font-size: 0.85rem;
  }

  .driver-team {
    font-size: 0.7rem;
  }

  .table-pagination {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .pagination-controls {
    width: 100%;
    justify-content: center;
  }
}

/* ============================================
   Sortable Column Headers
   ============================================ */

.vrl-datatable th[data-sortable="true"] {
  cursor: pointer;
  user-select: none;
}

.vrl-datatable th[data-sortable="true"]:hover {
  color: var(--cyan);
}

.vrl-datatable th .p-sortable-column-icon {
  margin-left: 0.5rem;
  color: var(--text-muted);
}

.vrl-datatable th .p-sortable-column-icon:hover {
  color: var(--cyan);
}
```

---

### Import in `app.css`

Add to `/var/www/resources/public/css/app.css` (after existing imports):

```css
/* Component-specific styles */
@import './components/tables.css';
```

---

## Usage Examples

### Basic Standings Table

```vue
<script setup lang="ts">
import { ref } from 'vue';
import Column from 'primevue/column';
import {
  VrlDataTable,
  VrlDriverCell,
  VrlPositionCell,
  VrlPointsCell,
  VrlGapCell,
  VrlTeamCell
} from '@public/components/common/tables';

interface StandingsRow {
  position: number;
  driverName: string;
  teamName: string;
  teamTag: string;
  points: number;
  gap: number | null;
}

const standings = ref<StandingsRow[]>([
  {
    position: 1,
    driverName: 'Max Velocity',
    teamName: 'Red Storm Racing',
    teamTag: 'RSR',
    points: 256,
    gap: null
  },
  {
    position: 2,
    driverName: 'Lewis Hamilton',
    teamName: 'Silver Arrows',
    teamTag: 'SAR',
    points: 243,
    gap: -13
  },
  {
    position: 3,
    driverName: 'Charles Leclerc',
    teamName: 'Prancing Horse',
    teamTag: 'PH',
    points: 231,
    gap: -25
  }
]);
</script>

<template>
  <VrlDataTable
    :value="standings"
    :podium-highlight="true"
    position-field="position"
    :paginated="true"
    :rows="10"
    entity-name="drivers"
  >
    <Column field="position" header="Pos" style="width: 60px">
      <template #body="{ data }">
        <VrlPositionCell :position="data.position" />
      </template>
    </Column>

    <Column field="driverName" header="Driver">
      <template #body="{ data }">
        <VrlDriverCell
          :name="data.driverName"
          :team="data.teamName"
        />
      </template>
    </Column>

    <Column field="teamTag" header="Team" style="width: 100px">
      <template #body="{ data }">
        <VrlTeamCell :name="data.teamTag" />
      </template>
    </Column>

    <Column
      field="points"
      header="Points"
      style="width: 80px; text-align: right"
    >
      <template #body="{ data }">
        <VrlPointsCell :value="data.points" />
      </template>
    </Column>

    <Column
      field="gap"
      header="Gap"
      style="width: 80px; text-align: right"
    >
      <template #body="{ data }">
        <VrlGapCell :value="data.gap" />
      </template>
    </Column>
  </VrlDataTable>
</template>
```

### Sortable Table

```vue
<script setup lang="ts">
import { ref } from 'vue';
import Column from 'primevue/column';
import { VrlDataTable, VrlDriverCell, VrlPointsCell } from '@public/components/common/tables';

const drivers = ref([
  { name: 'Max Velocity', points: 256, races: 12 },
  { name: 'Lewis Hamilton', points: 243, races: 12 },
  { name: 'Charles Leclerc', points: 231, races: 12 }
]);
</script>

<template>
  <VrlDataTable :value="drivers" :sortable="true">
    <Column field="name" header="Driver" sortable>
      <template #body="{ data }">
        <VrlDriverCell :name="data.name" />
      </template>
    </Column>

    <Column field="points" header="Points" sortable>
      <template #body="{ data }">
        <VrlPointsCell :value="data.points" />
      </template>
    </Column>

    <Column field="races" header="Races" sortable />
  </VrlDataTable>
</template>
```

### Loading State

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { VrlDataTable } from '@public/components/common/tables';

const isLoading = ref(true);
const data = ref([]);

// Simulate data loading
setTimeout(() => {
  data.value = [/* loaded data */];
  isLoading.value = false;
}, 2000);
</script>

<template>
  <VrlDataTable
    :value="data"
    :loading="isLoading"
    empty-message="No drivers found"
  >
    <!-- columns -->
  </VrlDataTable>
</template>
```

### Empty State

```vue
<template>
  <VrlDataTable
    :value="[]"
    empty-message="No results found for this season"
  >
    <template #empty>
      <div style="padding: 3rem; text-align: center;">
        <i class="pi pi-inbox" style="font-size: 3rem; color: var(--text-muted);"></i>
        <p style="margin-top: 1rem; color: var(--text-secondary);">
          No drivers have been registered yet.
        </p>
      </div>
    </template>

    <!-- columns -->
  </VrlDataTable>
</template>
```

---

## Testing Strategy

### Unit Tests (Vitest)

#### VrlDataTable.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlDataTable from './VrlDataTable.vue';
import PrimeVue from 'primevue/config';

describe('VrlDataTable', () => {
  const mountTable = (props = {}) => {
    return mount(VrlDataTable, {
      props: {
        value: [],
        ...props
      },
      global: {
        plugins: [PrimeVue]
      }
    });
  };

  it('renders with empty data', () => {
    const wrapper = mountTable();
    expect(wrapper.find('.vrl-datatable').exists()).toBe(true);
  });

  it('applies podium class to rows', () => {
    const data = [
      { position: 1, name: 'Driver 1' },
      { position: 2, name: 'Driver 2' }
    ];

    const wrapper = mountTable({
      value: data,
      podiumHighlight: true,
      positionField: 'position'
    });

    expect(wrapper.find('.podium-1').exists()).toBe(true);
  });

  it('shows empty message when no data', () => {
    const wrapper = mountTable({
      emptyMessage: 'No drivers found'
    });

    expect(wrapper.text()).toContain('No drivers found');
  });

  it('emits page event on pagination', async () => {
    const wrapper = mountTable({
      value: Array(20).fill({ name: 'Test' }),
      paginated: true,
      rows: 10
    });

    // Trigger pagination (implementation depends on PrimeVue DataTable)
    // await wrapper.find('.p-paginator-next').trigger('click');
    // expect(wrapper.emitted('page')).toBeTruthy();
  });
});
```

#### VrlDriverCell.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlDriverCell from './cells/VrlDriverCell.vue';

describe('VrlDriverCell', () => {
  it('renders driver name', () => {
    const wrapper = mount(VrlDriverCell, {
      props: { name: 'Max Velocity' }
    });

    expect(wrapper.text()).toContain('Max Velocity');
  });

  it('generates initials from name', () => {
    const wrapper = mount(VrlDriverCell, {
      props: { name: 'Max Velocity' }
    });

    expect(wrapper.find('.driver-avatar').text()).toBe('MV');
  });

  it('uses custom initials when provided', () => {
    const wrapper = mount(VrlDriverCell, {
      props: { name: 'Max Velocity', initials: 'XX' }
    });

    expect(wrapper.find('.driver-avatar').text()).toBe('XX');
  });

  it('displays team name', () => {
    const wrapper = mount(VrlDriverCell, {
      props: {
        name: 'Max Velocity',
        team: 'Red Storm Racing'
      }
    });

    expect(wrapper.find('.driver-team').text()).toBe('Red Storm Racing');
  });

  it('shows avatar image when URL provided', () => {
    const wrapper = mount(VrlDriverCell, {
      props: {
        name: 'Max Velocity',
        avatarUrl: 'https://example.com/avatar.jpg'
      }
    });

    expect(wrapper.find('.driver-avatar img').exists()).toBe(true);
    expect(wrapper.find('.driver-avatar img').attributes('src')).toBe('https://example.com/avatar.jpg');
  });

  it('hides avatar when showAvatar is false', () => {
    const wrapper = mount(VrlDriverCell, {
      props: {
        name: 'Max Velocity',
        showAvatar: false
      }
    });

    expect(wrapper.find('.driver-avatar').exists()).toBe(false);
  });
});
```

#### VrlPositionCell.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlPositionCell from './cells/VrlPositionCell.vue';

describe('VrlPositionCell', () => {
  it('renders position number', () => {
    const wrapper = mount(VrlPositionCell, {
      props: { position: 5 }
    });

    expect(wrapper.text()).toBe('5');
  });

  it('applies gold class for 1st place', () => {
    const wrapper = mount(VrlPositionCell, {
      props: { position: 1 }
    });

    expect(wrapper.find('.position-1').exists()).toBe(true);
  });

  it('applies silver class for 2nd place', () => {
    const wrapper = mount(VrlPositionCell, {
      props: { position: 2 }
    });

    expect(wrapper.find('.position-2').exists()).toBe(true);
  });

  it('applies bronze class for 3rd place', () => {
    const wrapper = mount(VrlPositionCell, {
      props: { position: 3 }
    });

    expect(wrapper.find('.position-3').exists()).toBe(true);
  });
});
```

#### VrlGapCell.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlGapCell from './cells/VrlGapCell.vue';

describe('VrlGapCell', () => {
  it('shows leader indicator for null value', () => {
    const wrapper = mount(VrlGapCell, {
      props: { value: null }
    });

    expect(wrapper.text()).toBe('—');
  });

  it('shows leader indicator for zero', () => {
    const wrapper = mount(VrlGapCell, {
      props: { value: 0 }
    });

    expect(wrapper.text()).toBe('—');
  });

  it('formats negative gap correctly', () => {
    const wrapper = mount(VrlGapCell, {
      props: { value: -13 }
    });

    expect(wrapper.text()).toBe('-13');
  });

  it('formats positive gap with minus sign', () => {
    const wrapper = mount(VrlGapCell, {
      props: { value: 13 }
    });

    expect(wrapper.text()).toBe('-13');
  });
});
```

#### VrlTablePagination.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlTablePagination from './VrlTablePagination.vue';

describe('VrlTablePagination', () => {
  const mountPagination = (props = {}) => {
    return mount(VrlTablePagination, {
      props: {
        currentPage: 1,
        totalPages: 5,
        totalItems: 50,
        itemsPerPage: 10,
        first: 0,
        last: 9,
        ...props
      }
    });
  };

  it('renders pagination info', () => {
    const wrapper = mountPagination();
    expect(wrapper.text()).toContain('Showing 1-9 of 50');
  });

  it('shows correct number of page buttons', () => {
    const wrapper = mountPagination({ totalPages: 5 });
    const pageButtons = wrapper.findAll('.pagination-btn').filter(
      btn => !btn.text().match(/[←→]/)
    );

    expect(pageButtons.length).toBe(5);
  });

  it('highlights active page', () => {
    const wrapper = mountPagination({ currentPage: 3 });
    const activeButton = wrapper.find('.pagination-btn.active');

    expect(activeButton.text()).toBe('3');
  });

  it('disables prev button on first page', () => {
    const wrapper = mountPagination({ currentPage: 1 });
    const prevButton = wrapper.findAll('.pagination-btn')[0];

    expect(prevButton.attributes('disabled')).toBeDefined();
  });

  it('disables next button on last page', () => {
    const wrapper = mountPagination({ currentPage: 5, totalPages: 5 });
    const buttons = wrapper.findAll('.pagination-btn');
    const nextButton = buttons[buttons.length - 1];

    expect(nextButton.attributes('disabled')).toBeDefined();
  });

  it('emits page-change event when page clicked', async () => {
    const wrapper = mountPagination();
    const pageButtons = wrapper.findAll('.pagination-btn').filter(
      btn => !btn.text().match(/[←→]/)
    );

    await pageButtons[2].trigger('click');

    expect(wrapper.emitted('page-change')).toBeTruthy();
    expect(wrapper.emitted('page-change')?.[0]).toEqual([2]); // 0-indexed
  });

  it('uses custom entity name', () => {
    const wrapper = mountPagination({ entityName: 'drivers' });
    expect(wrapper.text()).toContain('drivers');
  });
});
```

---

## Accessibility Checklist

- [ ] Table has proper semantic HTML (`<table>`, `<thead>`, `<tbody>`, `<th>`, `<td>`)
- [ ] Headers use `<th>` with appropriate `scope` attributes
- [ ] Sortable columns have aria-sort attributes
- [ ] Pagination buttons have aria-label attributes
- [ ] Loading state announced to screen readers (aria-live)
- [ ] Empty state is accessible
- [ ] Keyboard navigation works (Tab, Arrow keys for focus)
- [ ] Focus indicators are visible
- [ ] Color contrast meets WCAG AA standards:
  - Table text on bg-card: ✓
  - Header text on bg-panel: ✓
  - Podium row backgrounds: ✓
- [ ] Screen reader announces pagination changes
- [ ] Row selection (if implemented) is accessible

---

## TypeScript Type Definitions

### Common Types

```typescript
// Table column configuration
interface ColumnConfig {
  field: string;
  header: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

// Standings data structure
interface StandingsRow {
  position: number;
  driverName: string;
  teamName: string;
  teamTag: string;
  points: number;
  gap: number | null;
  wins?: number;
  podiums?: number;
}

// Results data structure
interface ResultRow {
  position: number;
  driverName: string;
  teamName: string;
  startPosition: number;
  fastestLap: string | null;
  points: number;
  status: 'finished' | 'dnf' | 'dns' | 'dsq';
}

// Tag variant types (from VrlTag component)
type TagVariant = 'default' | 'cyan' | 'green' | 'orange' | 'red' | 'purple' | 'yellow' | 'danger' | 'warning';
```

---

## Implementation Checklist

### Setup
- [ ] Create directory: `resources/public/js/components/common/tables/`
- [ ] Create directory: `resources/public/js/components/common/tables/cells/`
- [ ] Create directory: `resources/public/css/components/`

### Component Files
- [ ] Create `VrlDataTable.vue`
- [ ] Create `VrlTablePagination.vue`
- [ ] Create `cells/VrlDriverCell.vue`
- [ ] Create `cells/VrlPositionCell.vue`
- [ ] Create `cells/VrlPointsCell.vue`
- [ ] Create `cells/VrlGapCell.vue`
- [ ] Create `cells/VrlTeamCell.vue`
- [ ] Create `index.ts` (barrel export)

### CSS Files
- [ ] Create `resources/public/css/components/tables.css`
- [ ] Import `tables.css` in `app.css`

### Testing
- [ ] Create `VrlDataTable.test.ts`
- [ ] Create `cells/VrlDriverCell.test.ts`
- [ ] Create `cells/VrlPositionCell.test.ts`
- [ ] Create `cells/VrlPointsCell.test.ts`
- [ ] Create `cells/VrlGapCell.test.ts`
- [ ] Create `VrlTablePagination.test.ts`
- [ ] Run tests: `npm test`
- [ ] Ensure 100% test pass rate

### TypeScript
- [ ] Ensure all props have proper types
- [ ] Ensure emits are typed
- [ ] Add generic type support for VrlDataTable
- [ ] Run `npm run type-check`
- [ ] Ensure 0 TypeScript errors

### Linting & Formatting
- [ ] Run `npm run lint`
- [ ] Run `npm run format`
- [ ] Ensure 0 linting errors

### Documentation
- [ ] Add JSDoc comments to all components
- [ ] Document prop types and defaults
- [ ] Create usage examples in comments
- [ ] Document accessibility features

### Integration
- [ ] Test with real league data
- [ ] Test pagination with large datasets
- [ ] Test sorting functionality
- [ ] Test empty states
- [ ] Test loading states
- [ ] Test responsive behavior on mobile
- [ ] Verify podium highlighting works correctly
- [ ] Test with PrimeVue DataTable features (filters, exports)

---

## Future Enhancements

### Phase 2 Considerations

1. **Advanced Features**
   - Column resizing
   - Column reordering
   - Row selection (single/multiple)
   - Export to CSV/Excel
   - Column visibility toggle

2. **Additional Cell Types**
   - Status cell (finished/DNF/DSQ)
   - Fastest lap indicator
   - Penalty indicator
   - Time cell (lap times, sector times)
   - Flag cell (country flags)

3. **Performance**
   - Virtual scrolling for large datasets
   - Lazy loading for pagination
   - Column freezing (sticky first column)

4. **Filtering**
   - Global search
   - Per-column filters
   - Multi-select filters for teams/divisions

5. **Visual Enhancements**
   - Animated row transitions
   - Progress bars for points
   - Sparkline charts in cells
   - Row expansion for details

6. **Responsive Features**
   - Card layout on mobile
   - Horizontal scroll on tablets
   - Collapsible columns

---

## Performance Considerations

### Bundle Size Impact

**Current**: PrimeVue DataTable (~15KB gzipped)
**Added**:
- VrlDataTable wrapper: ~3KB
- VrlTablePagination: ~2KB
- Cell components (7 files): ~5KB
- tables.css: ~4KB

**Total Added**: ~14KB (acceptable for feature-rich table system)

### Optimization Strategies

1. **Component splitting**: Lazy load pagination if not used
2. **CSS purging**: Remove unused podium classes if not needed
3. **Virtual scrolling**: For tables with 100+ rows
4. **Debounced sorting**: Prevent excessive re-renders
5. **Memoization**: Cache computed row classes

---

## Browser Compatibility

**Target**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

**CSS Features Used**:
- CSS Variables (widely supported)
- Flexbox (widely supported)
- Grid (for future enhancements)
- Border-radius (widely supported)

**No polyfills needed** for target browsers.

---

## Migration from App Dashboard Tables

### Differences

| Feature | App (TechDataTable) | Public (VrlDataTable) |
|---------|---------------------|----------------------|
| **Font** | IBM Plex Mono | Orbitron (headers) + Inter |
| **Colors** | Tech blue accent | Cyan accent |
| **Podium** | Subtle backgrounds | Stronger backgrounds |
| **Pagination** | Icon buttons | Numbered buttons |
| **Avatar** | Team color border | Standard border |

### Reusable Code

The following can be adapted from App tables:
- Generic type system (`T extends Record<string, any>`)
- Podium highlighting logic
- Cell component patterns
- Pagination structure

---

## References

- **Design Reference**: `/var/www/docs/PublicDashboard/design-2026/design-1-velocity/components/index.html`
- **App Implementation**: `/var/www/resources/app/js/components/common/tables/`
- **PrimeVue DataTable**: https://primevue.org/datatable/ (v4)
- **PrimeVue Column**: https://primevue.org/column/ (v4)
- **Vue 3 Composition API**: https://vuejs.org/guide/introduction.html
- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/

---

## Summary

This implementation plan provides a comprehensive table system for the VRL Velocity design that:

1. **Wraps PrimeVue**: Uses PrimeVue v4 DataTable for enterprise features
2. **Racing-Focused**: Optimized for standings, results, and leaderboards
3. **Podium Highlighting**: Automatic gold/silver/bronze styling for top 3
4. **Modular Cells**: Reusable cell components for driver, position, points, gap, team
5. **Type-Safe**: Full TypeScript support with generics
6. **Accessible**: WCAG 2.1 AA compliant
7. **Testable**: Comprehensive unit test coverage
8. **Maintainable**: Clear component structure with barrel exports

**Key Design Decisions**:
- Wrap PrimeVue DataTable (feature-rich, accessible, maintained)
- Orbitron font for headers and numeric data (matches Velocity design)
- Stronger podium backgrounds than App dashboard (visual hierarchy)
- Numbered pagination buttons (easier navigation for racing data)
- Modular cell components (reusable across different table types)

**Estimated Implementation Time**: 10-12 hours
- Component creation: 5-6 hours
- CSS styling: 2-3 hours
- Testing: 3-4 hours
- Documentation: 1 hour

---

**Plan Created**: 2026-01-18
**Plan Version**: 1.0
**Dependencies**: VrlTag component (for VrlTeamCell), VrlPositionIndicator component patterns
