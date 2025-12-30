# Reusable List Components Implementation Plan

## Overview

This plan details the implementation of reusable list components based on the Technical Blueprint design system. These components enable the creation of structured, accessible lists with status indicators, metadata, statistics, and actions.

**Design Reference**: `docs/designs/app/ideas2/technical-form/plans/leagues/variation-3-split-panel.html`

**Location**: `resources/app/js/components/common/lists/`

## Design Principles

1. **Generic & Reusable**: Components are domain-agnostic and work with any data type
2. **Composition-Based**: Use slots extensively for maximum flexibility
3. **Accessible**: ARIA attributes, keyboard navigation, semantic HTML
4. **Type-Safe**: Full TypeScript support with comprehensive interfaces
5. **Technical Blueprint Aesthetic**: Monospace fonts, precise spacing, technical feel
6. **Design System Aligned**: Use existing CSS variables and Tailwind utilities

---

## Component Architecture

### Component Hierarchy

```
ListSectionHeader (standalone header with extending line)
ListContainer (flex column wrapper)
  └─ ListRow (individual list item)
      ├─ ListRowIndicator (vertical status bar)
      ├─ Content Slot (flexible main content)
      ├─ ListRowStats (stats container)
      │   └─ ListRowStat (individual stat)
      └─ Action Slot (button/link)
```

---

## 1. ListSectionHeader Component

### Purpose
Displays a section header with an extending horizontal line, mimicking terminal/console aesthetics.

### File
`resources/app/js/components/common/lists/ListSectionHeader.vue`

### Props Interface

```typescript
export interface ListSectionHeaderProps {
  /**
   * Section title text (e.g., "Active Seasons", "Recent Activity")
   */
  title: string;

  /**
   * Additional CSS classes for the header container
   */
  class?: string;
}
```

### Slots

None - simple component with just title prop.

### Markup Structure

```html
<div class="activity-header">
  <span class="activity-title">{{ title }}</span>
  <div class="activity-line"></div>
</div>
```

### Styling

```css
.activity-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.activity-title {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text-muted);
}

.activity-line {
  flex: 1;
  height: 1px;
  background: var(--border);
}
```

### Tailwind Implementation

```vue
<div
  :class="['flex items-center gap-3 mb-4', props.class]"
  role="separator"
  aria-label="Section divider"
>
  <span class="font-mono text-[11px] font-semibold tracking-[1px] uppercase text-[var(--text-muted)]">
    {{ title }}
  </span>
  <div class="flex-1 h-px bg-[var(--border)]"></div>
</div>
```

### Usage Example

```vue
<ListSectionHeader title="Active Seasons" />
<ListSectionHeader title="Recent Activity" class="mt-8" />
```

---

## 2. ListContainer Component

### Purpose
Generic flex column container for list items with consistent gap spacing.

### File
`resources/app/js/components/common/lists/ListContainer.vue`

### Props Interface

```typescript
export interface ListContainerProps {
  /**
   * Gap between list items
   * @default '12px'
   */
  gap?: string | number;

  /**
   * Additional CSS classes for the container
   */
  class?: string;

  /**
   * ARIA label for the list
   */
  ariaLabel?: string;
}
```

### Slots

- **Default**: List items (typically `ListRow` components)

### Markup Structure

```html
<div class="seasons-list">
  <slot />
</div>
```

### Styling

```css
.seasons-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
```

### Tailwind Implementation

```vue
<div
  :class="['flex flex-col', props.class]"
  :style="{ gap: typeof gap === 'number' ? `${gap}px` : gap }"
  role="list"
  :aria-label="ariaLabel"
>
  <slot />
</div>
```

### Usage Example

```vue
<ListContainer aria-label="Active seasons list">
  <ListRow v-for="season in seasons" :key="season.id">
    <!-- row content -->
  </ListRow>
</ListContainer>

<ListContainer :gap="8" class="mt-4">
  <ListRow>...</ListRow>
  <ListRow>...</ListRow>
</ListContainer>
```

---

## 3. ListRowIndicator Component

### Purpose
Vertical colored bar indicating status (active, upcoming, completed, etc.).

### File
`resources/app/js/components/common/lists/ListRowIndicator.vue`

### Props Interface

```typescript
export type IndicatorStatus = 'active' | 'upcoming' | 'completed' | 'pending' | 'inactive';

export interface ListRowIndicatorProps {
  /**
   * Status type - determines color and glow effect
   */
  status: IndicatorStatus;

  /**
   * Height of the indicator bar
   * @default '40px'
   */
  height?: string | number;

  /**
   * Width of the indicator bar
   * @default '4px'
   */
  width?: string | number;

  /**
   * Additional CSS classes
   */
  class?: string;
}
```

### Slots

None - purely visual component.

### Markup Structure

```html
<div class="season-indicator season-indicator--active"></div>
```

### Styling

```css
.season-indicator {
  width: 4px;
  height: 40px;
  border-radius: 2px;
  flex-shrink: 0;
}

.season-indicator--active {
  background: var(--green);
  box-shadow: 0 0 8px var(--green);
}

.season-indicator--upcoming {
  background: var(--cyan);
}

.season-indicator--completed {
  background: var(--text-muted);
}

.season-indicator--pending {
  background: var(--orange);
}

.season-indicator--inactive {
  background: var(--border);
}
```

### Tailwind Implementation

```vue
<script setup lang="ts">
import { computed } from 'vue';

const indicatorClass = computed(() => {
  const baseClass = 'rounded-sm flex-shrink-0';
  const statusClasses: Record<IndicatorStatus, string> = {
    active: 'bg-[var(--green)] shadow-[0_0_8px_var(--green)]',
    upcoming: 'bg-[var(--cyan)]',
    completed: 'bg-[var(--text-muted)]',
    pending: 'bg-[var(--orange)]',
    inactive: 'bg-[var(--border)]',
  };
  return `${baseClass} ${statusClasses[props.status]}`;
});

const indicatorStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height,
}));
</script>

<template>
  <div
    :class="[indicatorClass, props.class]"
    :style="indicatorStyle"
    role="status"
    :aria-label="`Status: ${status}`"
  />
</template>
```

### Usage Example

```vue
<ListRowIndicator status="active" />
<ListRowIndicator status="upcoming" height="32px" />
<ListRowIndicator status="completed" width="3px" />
```

---

## 4. ListRowStat Component

### Purpose
Displays a single statistic with value and label (e.g., "46 Drivers", "8 Races").

### File
`resources/app/js/components/common/lists/ListRowStat.vue`

### Props Interface

```typescript
export interface ListRowStatProps {
  /**
   * Stat value (numeric or text)
   */
  value: string | number;

  /**
   * Stat label (e.g., "Drivers", "Races", "Registered")
   */
  label: string;

  /**
   * Additional CSS classes
   */
  class?: string;
}
```

### Slots

- **value** (optional): Custom value rendering
- **label** (optional): Custom label rendering

### Markup Structure

```html
<div class="season-stat">
  <div class="season-stat-value">46</div>
  <div class="season-stat-label">Drivers</div>
</div>
```

### Styling

```css
.season-stat {
  text-align: center;
}

.season-stat-value {
  font-family: var(--font-mono);
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.season-stat-label {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
```

### Tailwind Implementation

```vue
<div :class="['text-center', props.class]" role="group" :aria-label="`${value} ${label}`">
  <div class="font-mono text-[16px] font-semibold text-[var(--text-primary)] leading-tight">
    <slot name="value">{{ value }}</slot>
  </div>
  <div class="font-mono text-[9px] text-[var(--text-muted)] uppercase tracking-[0.5px] mt-0.5">
    <slot name="label">{{ label }}</slot>
  </div>
</div>
```

### Usage Example

```vue
<ListRowStat :value="46" label="Drivers" />
<ListRowStat :value="8" label="Races" />
<ListRowStat value="14/22" label="Progress" />
```

---

## 5. ListRowStats Component

### Purpose
Container for multiple `ListRowStat` components with consistent spacing.

### File
`resources/app/js/components/common/lists/ListRowStats.vue`

### Props Interface

```typescript
export interface ListRowStatsProps {
  /**
   * Gap between individual stats
   * @default '24px'
   */
  gap?: string | number;

  /**
   * Additional CSS classes
   */
  class?: string;
}
```

### Slots

- **Default**: `ListRowStat` components

### Markup Structure

```html
<div class="season-stats">
  <slot />
</div>
```

### Styling

```css
.season-stats {
  display: flex;
  gap: 24px;
  flex-shrink: 0;
}
```

### Tailwind Implementation

```vue
<div
  :class="['flex flex-shrink-0', props.class]"
  :style="{ gap: typeof gap === 'number' ? `${gap}px` : gap }"
  role="group"
  aria-label="Statistics"
>
  <slot />
</div>
```

### Usage Example

```vue
<ListRowStats>
  <ListRowStat :value="46" label="Drivers" />
  <ListRowStat :value="8" label="Races" />
</ListRowStats>

<ListRowStats :gap="16">
  <ListRowStat :value="31" label="Drivers" />
  <ListRowStat :value="3" label="Races" />
</ListRowStats>
```

---

## 6. ListRow Component

### Purpose
Main row component that composes indicator, content, stats, and action slots.

### File
`resources/app/js/components/common/lists/ListRow.vue`

### Props Interface

```typescript
export interface ListRowProps {
  /**
   * Status for the indicator bar
   */
  status?: IndicatorStatus;

  /**
   * Whether to show the indicator
   * @default true if status is provided
   */
  showIndicator?: boolean;

  /**
   * Whether the row is clickable
   * @default false
   */
  clickable?: boolean;

  /**
   * Disable hover effects
   * @default false
   */
  noHover?: boolean;

  /**
   * Additional CSS classes
   */
  class?: string;

  /**
   * ARIA label for the row
   */
  ariaLabel?: string;
}
```

### Slots

- **indicator** (optional): Custom indicator (defaults to `ListRowIndicator` if status provided)
- **default**: Main content area
- **stats** (optional): Statistics section (typically `ListRowStats`)
- **action** (optional): Action button/link

### Emits

```typescript
export interface ListRowEmits {
  /**
   * Emitted when the row is clicked (only if clickable=true)
   */
  (e: 'click', event: MouseEvent): void;
}
```

### Markup Structure

```html
<div class="season-row">
  <div class="season-indicator season-indicator--active"></div>
  <div class="season-info">
    <!-- content slot -->
  </div>
  <div class="season-stats">
    <!-- stats slot -->
  </div>
  <div class="season-action">
    <!-- action slot -->
  </div>
</div>
```

### Styling

```css
.season-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: all 0.2s ease;
}

.season-row:hover {
  border-color: var(--cyan);
  transform: translateX(4px);
}

.season-row.clickable {
  cursor: pointer;
}

.season-row.clickable:active {
  transform: translateX(6px);
}

.season-info {
  flex: 1;
  min-width: 0;
}

.season-action {
  flex-shrink: 0;
}
```

### Tailwind Implementation

```vue
<script setup lang="ts">
import { computed } from 'vue';
import ListRowIndicator from './ListRowIndicator.vue';

const props = withDefaults(defineProps<ListRowProps>(), {
  showIndicator: undefined,
  clickable: false,
  noHover: false,
});

const emit = defineEmits<ListRowEmits>();

const shouldShowIndicator = computed(() => {
  if (props.showIndicator !== undefined) {
    return props.showIndicator;
  }
  return !!props.status;
});

const rowClasses = computed(() => [
  'flex items-center gap-4 p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius)]',
  'transition-all duration-200 ease-in-out',
  {
    'cursor-pointer': props.clickable,
    'hover:border-[var(--cyan)] hover:translate-x-1': !props.noHover,
    'active:translate-x-1.5': props.clickable && !props.noHover,
  },
  props.class,
]);

function handleClick(event: MouseEvent) {
  if (props.clickable) {
    emit('click', event);
  }
}
</script>

<template>
  <div
    :class="rowClasses"
    role="listitem"
    :aria-label="ariaLabel"
    :tabindex="clickable ? 0 : undefined"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <!-- Indicator -->
    <div v-if="shouldShowIndicator || $slots.indicator">
      <slot name="indicator">
        <ListRowIndicator v-if="status" :status="status" />
      </slot>
    </div>

    <!-- Main Content -->
    <div class="flex-1 min-w-0">
      <slot />
    </div>

    <!-- Stats -->
    <div v-if="$slots.stats" class="flex-shrink-0">
      <slot name="stats" />
    </div>

    <!-- Action -->
    <div v-if="$slots.action" class="flex-shrink-0">
      <slot name="action" />
    </div>
  </div>
</template>
```

### Usage Examples

**Basic Usage**:

```vue
<ListRow status="active">
  <h3 class="font-mono text-sm font-semibold">F1 2024 Championship</h3>
  <div class="flex gap-4 mt-1 text-xs text-[var(--text-muted)]">
    <span>GT World Series</span>
    <span>Round 8 of 12</span>
  </div>

  <template #stats>
    <ListRowStats>
      <ListRowStat :value="46" label="Drivers" />
      <ListRowStat :value="8" label="Races" />
    </ListRowStats>
  </template>

  <template #action>
    <Button variant="ghost" label="View" icon="ArrowRight" />
  </template>
</ListRow>
```

**Clickable Row**:

```vue
<ListRow
  status="upcoming"
  clickable
  aria-label="iRacing Season 2025S1"
  @click="navigateToSeason(season.id)"
>
  <h3 class="font-mono text-sm font-semibold">iRacing Season 2025S1</h3>
  <div class="flex gap-4 mt-1 text-xs text-[var(--text-muted)]">
    <span>Prototype Challenge</span>
    <span>Starts Jan 15</span>
  </div>

  <template #stats>
    <ListRowStats>
      <ListRowStat :value="18" label="Registered" />
      <ListRowStat :value="0" label="Races" />
    </ListRowStats>
  </template>
</ListRow>
```

**Custom Indicator**:

```vue
<ListRow>
  <template #indicator>
    <div class="w-1 h-10 rounded bg-gradient-to-b from-cyan to-purple"></div>
  </template>

  <div>Custom indicator example</div>
</ListRow>
```

**No Indicator**:

```vue
<ListRow :show-indicator="false">
  <div>Row without indicator</div>
</ListRow>
```

---

## TypeScript Types

### File
`resources/app/js/components/common/lists/types.ts`

```typescript
// resources/app/js/components/common/lists/types.ts

/**
 * Status types for list row indicators
 */
export type IndicatorStatus = 'active' | 'upcoming' | 'completed' | 'pending' | 'inactive';

/**
 * Props for ListSectionHeader component
 */
export interface ListSectionHeaderProps {
  /**
   * Section title text (e.g., "Active Seasons", "Recent Activity")
   */
  title: string;

  /**
   * Additional CSS classes for the header container
   */
  class?: string;
}

/**
 * Props for ListContainer component
 */
export interface ListContainerProps {
  /**
   * Gap between list items
   * @default '12px'
   */
  gap?: string | number;

  /**
   * Additional CSS classes for the container
   */
  class?: string;

  /**
   * ARIA label for the list
   */
  ariaLabel?: string;
}

/**
 * Props for ListRowIndicator component
 */
export interface ListRowIndicatorProps {
  /**
   * Status type - determines color and glow effect
   */
  status: IndicatorStatus;

  /**
   * Height of the indicator bar
   * @default '40px'
   */
  height?: string | number;

  /**
   * Width of the indicator bar
   * @default '4px'
   */
  width?: string | number;

  /**
   * Additional CSS classes
   */
  class?: string;
}

/**
 * Props for ListRowStat component
 */
export interface ListRowStatProps {
  /**
   * Stat value (numeric or text)
   */
  value: string | number;

  /**
   * Stat label (e.g., "Drivers", "Races", "Registered")
   */
  label: string;

  /**
   * Additional CSS classes
   */
  class?: string;
}

/**
 * Props for ListRowStats component
 */
export interface ListRowStatsProps {
  /**
   * Gap between individual stats
   * @default '24px'
   */
  gap?: string | number;

  /**
   * Additional CSS classes
   */
  class?: string;
}

/**
 * Props for ListRow component
 */
export interface ListRowProps {
  /**
   * Status for the indicator bar
   */
  status?: IndicatorStatus;

  /**
   * Whether to show the indicator
   * @default true if status is provided
   */
  showIndicator?: boolean;

  /**
   * Whether the row is clickable
   * @default false
   */
  clickable?: boolean;

  /**
   * Disable hover effects
   * @default false
   */
  noHover?: boolean;

  /**
   * Additional CSS classes
   */
  class?: string;

  /**
   * ARIA label for the row
   */
  ariaLabel?: string;
}

/**
 * Emits for ListRow component
 */
export interface ListRowEmits {
  /**
   * Emitted when the row is clicked (only if clickable=true)
   */
  (e: 'click', event: MouseEvent): void;
}
```

---

## Barrel Export (index.ts)

### File
`resources/app/js/components/common/lists/index.ts`

```typescript
// resources/app/js/components/common/lists/index.ts

export { default as ListSectionHeader } from './ListSectionHeader.vue';
export { default as ListContainer } from './ListContainer.vue';
export { default as ListRow } from './ListRow.vue';
export { default as ListRowIndicator } from './ListRowIndicator.vue';
export { default as ListRowStats } from './ListRowStats.vue';
export { default as ListRowStat } from './ListRowStat.vue';

export * from './types';
```

---

## Complete Usage Examples

### Season List (from Design)

```vue
<script setup lang="ts">
import {
  ListSectionHeader,
  ListContainer,
  ListRow,
  ListRowStats,
  ListRowStat,
} from '@app/components/common/lists';
import { Button } from '@app/components/common/buttons';
import { PhTrophy, PhCalendar } from '@phosphor-icons/vue';

interface Season {
  id: number;
  name: string;
  competition: string;
  round: string;
  drivers: number;
  races: number;
  status: 'active' | 'upcoming' | 'completed';
}

const activeSeasons: Season[] = [
  {
    id: 1,
    name: 'F1 2024 Championship',
    competition: 'GT World Series',
    round: 'Round 8 of 12',
    drivers: 46,
    races: 8,
    status: 'active',
  },
  {
    id: 2,
    name: 'ACC GT3 Masters',
    competition: 'Endurance Cup',
    round: 'Round 3 of 6',
    drivers: 31,
    races: 3,
    status: 'active',
  },
  {
    id: 3,
    name: 'iRacing Season 2025S1',
    competition: 'Prototype Challenge',
    round: 'Starts Jan 15',
    drivers: 18,
    races: 0,
    status: 'upcoming',
  },
];

function viewSeason(id: number) {
  console.log('View season:', id);
}
</script>

<template>
  <section>
    <ListSectionHeader title="Active Seasons" />

    <ListContainer aria-label="Active seasons list">
      <ListRow
        v-for="season in activeSeasons"
        :key="season.id"
        :status="season.status"
      >
        <!-- Main Content -->
        <div>
          <h3 class="font-mono text-sm font-semibold text-[var(--text-primary)] mb-1">
            {{ season.name }}
          </h3>
          <div class="flex gap-4 text-xs text-[var(--text-muted)]">
            <span class="flex items-center gap-1">
              <PhTrophy :size="12" />
              {{ season.competition }}
            </span>
            <span class="flex items-center gap-1">
              <PhCalendar :size="12" />
              {{ season.round }}
            </span>
          </div>
        </div>

        <!-- Stats -->
        <template #stats>
          <ListRowStats>
            <ListRowStat :value="season.drivers" label="Drivers" />
            <ListRowStat :value="season.races" label="Races" />
          </ListRowStats>
        </template>

        <!-- Action -->
        <template #action>
          <Button
            variant="ghost"
            label="View"
            size="sm"
            @click="viewSeason(season.id)"
          />
        </template>
      </ListRow>
    </ListContainer>
  </section>
</template>
```

### Driver List

```vue
<script setup lang="ts">
import {
  ListSectionHeader,
  ListContainer,
  ListRow,
  ListRowStats,
  ListRowStat,
} from '@app/components/common/lists';

interface Driver {
  id: number;
  name: string;
  team: string;
  races: number;
  points: number;
  status: 'active' | 'inactive';
}

const drivers: Driver[] = [
  { id: 1, name: 'Max Verstappen', team: 'Red Bull Racing', races: 8, points: 246, status: 'active' },
  { id: 2, name: 'Lewis Hamilton', team: 'Mercedes', races: 8, points: 198, status: 'active' },
  { id: 3, name: 'Charles Leclerc', team: 'Ferrari', races: 7, points: 175, status: 'active' },
];
</script>

<template>
  <section>
    <ListSectionHeader title="Top Drivers" />

    <ListContainer aria-label="Top drivers list">
      <ListRow
        v-for="driver in drivers"
        :key="driver.id"
        :status="driver.status"
      >
        <!-- Driver Info -->
        <div>
          <h3 class="font-sans text-sm font-medium text-[var(--text-primary)]">
            {{ driver.name }}
          </h3>
          <p class="text-xs text-[var(--text-muted)] mt-0.5">
            {{ driver.team }}
          </p>
        </div>

        <!-- Stats -->
        <template #stats>
          <ListRowStats>
            <ListRowStat :value="driver.points" label="Points" />
            <ListRowStat :value="driver.races" label="Races" />
          </ListRowStats>
        </template>
      </ListRow>
    </ListContainer>
  </section>
</template>
```

### Activity Feed

```vue
<script setup lang="ts">
import {
  ListSectionHeader,
  ListContainer,
  ListRow,
} from '@app/components/common/lists';

interface Activity {
  id: number;
  type: 'result' | 'driver' | 'season' | 'race';
  title: string;
  description: string;
  time: string;
}

const activities: Activity[] = [
  {
    id: 1,
    type: 'result',
    title: 'Results Added',
    description: 'Results added for Spa-Francorchamps - F1 2024 Championship',
    time: '2 hours ago',
  },
  {
    id: 2,
    type: 'driver',
    title: 'New Driver',
    description: 'Max Verstappen joined ACC GT3 Masters',
    time: '5 hours ago',
  },
];

function getActivityStatus(type: string) {
  const statusMap: Record<string, 'active' | 'upcoming' | 'completed' | 'pending'> = {
    result: 'completed',
    driver: 'active',
    season: 'upcoming',
    race: 'pending',
  };
  return statusMap[type] || 'active';
}
</script>

<template>
  <section>
    <ListSectionHeader title="Recent Activity" />

    <ListContainer aria-label="Recent activity list">
      <ListRow
        v-for="activity in activities"
        :key="activity.id"
        :status="getActivityStatus(activity.type)"
      >
        <div>
          <p class="text-sm text-[var(--text-primary)] mb-0.5">
            {{ activity.description }}
          </p>
          <span class="font-mono text-[10px] text-[var(--text-muted)]">
            {{ activity.time }}
          </span>
        </div>
      </ListRow>
    </ListContainer>
  </section>
</template>
```

---

## Testing Plan

### Unit Tests

Create tests for each component in `resources/app/js/components/common/lists/__tests__/`

#### ListSectionHeader.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ListSectionHeader from '../ListSectionHeader.vue';

describe('ListSectionHeader', () => {
  it('renders title correctly', () => {
    const wrapper = mount(ListSectionHeader, {
      props: { title: 'Active Seasons' },
    });
    expect(wrapper.text()).toContain('Active Seasons');
  });

  it('applies custom classes', () => {
    const wrapper = mount(ListSectionHeader, {
      props: { title: 'Test', class: 'custom-class' },
    });
    expect(wrapper.classes()).toContain('custom-class');
  });

  it('has proper ARIA attributes', () => {
    const wrapper = mount(ListSectionHeader, {
      props: { title: 'Test Section' },
    });
    expect(wrapper.attributes('role')).toBe('separator');
    expect(wrapper.attributes('aria-label')).toBe('Section divider');
  });

  it('renders the extending line', () => {
    const wrapper = mount(ListSectionHeader, {
      props: { title: 'Test' },
    });
    const line = wrapper.find('.flex-1');
    expect(line.exists()).toBe(true);
  });
});
```

#### ListContainer.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ListContainer from '../ListContainer.vue';

describe('ListContainer', () => {
  it('renders slot content', () => {
    const wrapper = mount(ListContainer, {
      slots: {
        default: '<div class="test-item">Item</div>',
      },
    });
    expect(wrapper.find('.test-item').exists()).toBe(true);
  });

  it('applies default gap', () => {
    const wrapper = mount(ListContainer);
    expect(wrapper.attributes('style')).toContain('gap: 12px');
  });

  it('applies custom gap as number', () => {
    const wrapper = mount(ListContainer, {
      props: { gap: 8 },
    });
    expect(wrapper.attributes('style')).toContain('gap: 8px');
  });

  it('applies custom gap as string', () => {
    const wrapper = mount(ListContainer, {
      props: { gap: '1rem' },
    });
    expect(wrapper.attributes('style')).toContain('gap: 1rem');
  });

  it('has proper ARIA attributes', () => {
    const wrapper = mount(ListContainer, {
      props: { ariaLabel: 'Seasons list' },
    });
    expect(wrapper.attributes('role')).toBe('list');
    expect(wrapper.attributes('aria-label')).toBe('Seasons list');
  });
});
```

#### ListRowIndicator.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ListRowIndicator from '../ListRowIndicator.vue';

describe('ListRowIndicator', () => {
  it('renders with active status', () => {
    const wrapper = mount(ListRowIndicator, {
      props: { status: 'active' },
    });
    expect(wrapper.classes()).toContain('bg-[var(--green)]');
    expect(wrapper.classes()).toContain('shadow-[0_0_8px_var(--green)]');
  });

  it('renders with upcoming status', () => {
    const wrapper = mount(ListRowIndicator, {
      props: { status: 'upcoming' },
    });
    expect(wrapper.classes()).toContain('bg-[var(--cyan)]');
  });

  it('renders with completed status', () => {
    const wrapper = mount(ListRowIndicator, {
      props: { status: 'completed' },
    });
    expect(wrapper.classes()).toContain('bg-[var(--text-muted)]');
  });

  it('applies default dimensions', () => {
    const wrapper = mount(ListRowIndicator, {
      props: { status: 'active' },
    });
    expect(wrapper.attributes('style')).toContain('width: 4px');
    expect(wrapper.attributes('style')).toContain('height: 40px');
  });

  it('applies custom dimensions', () => {
    const wrapper = mount(ListRowIndicator, {
      props: { status: 'active', width: 3, height: 32 },
    });
    expect(wrapper.attributes('style')).toContain('width: 3px');
    expect(wrapper.attributes('style')).toContain('height: 32px');
  });

  it('has proper ARIA attributes', () => {
    const wrapper = mount(ListRowIndicator, {
      props: { status: 'active' },
    });
    expect(wrapper.attributes('role')).toBe('status');
    expect(wrapper.attributes('aria-label')).toBe('Status: active');
  });
});
```

#### ListRowStat.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ListRowStat from '../ListRowStat.vue';

describe('ListRowStat', () => {
  it('renders value and label', () => {
    const wrapper = mount(ListRowStat, {
      props: { value: 46, label: 'Drivers' },
    });
    expect(wrapper.text()).toContain('46');
    expect(wrapper.text()).toContain('Drivers');
  });

  it('renders string value', () => {
    const wrapper = mount(ListRowStat, {
      props: { value: '14/22', label: 'Progress' },
    });
    expect(wrapper.text()).toContain('14/22');
  });

  it('supports value slot', () => {
    const wrapper = mount(ListRowStat, {
      props: { value: 46, label: 'Drivers' },
      slots: {
        value: '<strong>46</strong>',
      },
    });
    expect(wrapper.find('strong').exists()).toBe(true);
  });

  it('supports label slot', () => {
    const wrapper = mount(ListRowStat, {
      props: { value: 46, label: 'Drivers' },
      slots: {
        label: '<em>Drivers</em>',
      },
    });
    expect(wrapper.find('em').exists()).toBe(true);
  });

  it('has proper ARIA attributes', () => {
    const wrapper = mount(ListRowStat, {
      props: { value: 46, label: 'Drivers' },
    });
    expect(wrapper.attributes('role')).toBe('group');
    expect(wrapper.attributes('aria-label')).toBe('46 Drivers');
  });
});
```

#### ListRowStats.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ListRowStats from '../ListRowStats.vue';
import ListRowStat from '../ListRowStat.vue';

describe('ListRowStats', () => {
  it('renders slot content', () => {
    const wrapper = mount(ListRowStats, {
      slots: {
        default: '<div class="test-stat">Stat</div>',
      },
    });
    expect(wrapper.find('.test-stat').exists()).toBe(true);
  });

  it('applies default gap', () => {
    const wrapper = mount(ListRowStats);
    expect(wrapper.attributes('style')).toContain('gap: 24px');
  });

  it('applies custom gap', () => {
    const wrapper = mount(ListRowStats, {
      props: { gap: 16 },
    });
    expect(wrapper.attributes('style')).toContain('gap: 16px');
  });

  it('renders multiple stats', () => {
    const wrapper = mount(ListRowStats, {
      slots: {
        default: [
          mount(ListRowStat, { props: { value: 46, label: 'Drivers' } }),
          mount(ListRowStat, { props: { value: 8, label: 'Races' } }),
        ],
      },
    });
    expect(wrapper.text()).toContain('Drivers');
    expect(wrapper.text()).toContain('Races');
  });

  it('has proper ARIA attributes', () => {
    const wrapper = mount(ListRowStats);
    expect(wrapper.attributes('role')).toBe('group');
    expect(wrapper.attributes('aria-label')).toBe('Statistics');
  });
});
```

#### ListRow.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ListRow from '../ListRow.vue';
import ListRowIndicator from '../ListRowIndicator.vue';

describe('ListRow', () => {
  it('renders default slot content', () => {
    const wrapper = mount(ListRow, {
      slots: {
        default: '<div class="test-content">Content</div>',
      },
    });
    expect(wrapper.find('.test-content').exists()).toBe(true);
  });

  it('shows indicator when status is provided', () => {
    const wrapper = mount(ListRow, {
      props: { status: 'active' },
      slots: {
        default: '<div>Content</div>',
      },
    });
    expect(wrapper.findComponent(ListRowIndicator).exists()).toBe(true);
  });

  it('hides indicator when showIndicator is false', () => {
    const wrapper = mount(ListRow, {
      props: { status: 'active', showIndicator: false },
      slots: {
        default: '<div>Content</div>',
      },
    });
    expect(wrapper.findComponent(ListRowIndicator).exists()).toBe(false);
  });

  it('renders stats slot', () => {
    const wrapper = mount(ListRow, {
      slots: {
        default: '<div>Content</div>',
        stats: '<div class="test-stats">Stats</div>',
      },
    });
    expect(wrapper.find('.test-stats').exists()).toBe(true);
  });

  it('renders action slot', () => {
    const wrapper = mount(ListRow, {
      slots: {
        default: '<div>Content</div>',
        action: '<button class="test-action">Action</button>',
      },
    });
    expect(wrapper.find('.test-action').exists()).toBe(true);
  });

  it('emits click event when clickable', async () => {
    const wrapper = mount(ListRow, {
      props: { clickable: true },
      slots: {
        default: '<div>Content</div>',
      },
    });
    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('does not emit click when not clickable', async () => {
    const wrapper = mount(ListRow, {
      props: { clickable: false },
      slots: {
        default: '<div>Content</div>',
      },
    });
    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toBeUndefined();
  });

  it('is keyboard accessible when clickable', async () => {
    const wrapper = mount(ListRow, {
      props: { clickable: true },
      slots: {
        default: '<div>Content</div>',
      },
    });

    expect(wrapper.attributes('tabindex')).toBe('0');

    await wrapper.trigger('keydown.enter');
    expect(wrapper.emitted('click')).toHaveLength(1);

    await wrapper.trigger('keydown.space');
    expect(wrapper.emitted('click')).toHaveLength(2);
  });

  it('applies hover effects by default', () => {
    const wrapper = mount(ListRow, {
      slots: {
        default: '<div>Content</div>',
      },
    });
    expect(wrapper.classes()).toContain('hover:border-[var(--cyan)]');
    expect(wrapper.classes()).toContain('hover:translate-x-1');
  });

  it('disables hover effects when noHover is true', () => {
    const wrapper = mount(ListRow, {
      props: { noHover: true },
      slots: {
        default: '<div>Content</div>',
      },
    });
    expect(wrapper.classes()).not.toContain('hover:border-[var(--cyan)]');
  });

  it('has proper ARIA attributes', () => {
    const wrapper = mount(ListRow, {
      props: { ariaLabel: 'Season item' },
      slots: {
        default: '<div>Content</div>',
      },
    });
    expect(wrapper.attributes('role')).toBe('listitem');
    expect(wrapper.attributes('aria-label')).toBe('Season item');
  });
});
```

### Integration Tests

Test components working together:

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import {
  ListSectionHeader,
  ListContainer,
  ListRow,
  ListRowStats,
  ListRowStat,
} from '../index';

describe('List Components Integration', () => {
  it('renders a complete list structure', () => {
    const wrapper = mount({
      components: {
        ListSectionHeader,
        ListContainer,
        ListRow,
        ListRowStats,
        ListRowStat,
      },
      template: `
        <div>
          <ListSectionHeader title="Active Seasons" />
          <ListContainer aria-label="Seasons list">
            <ListRow status="active">
              <div>F1 2024 Championship</div>
              <template #stats>
                <ListRowStats>
                  <ListRowStat :value="46" label="Drivers" />
                  <ListRowStat :value="8" label="Races" />
                </ListRowStats>
              </template>
            </ListRow>
          </ListContainer>
        </div>
      `,
    });

    expect(wrapper.text()).toContain('Active Seasons');
    expect(wrapper.text()).toContain('F1 2024 Championship');
    expect(wrapper.text()).toContain('46');
    expect(wrapper.text()).toContain('Drivers');
  });
});
```

---

## Accessibility Checklist

- [x] Semantic HTML elements (`role="list"`, `role="listitem"`, etc.)
- [x] ARIA labels for screen readers
- [x] Keyboard navigation support (Tab, Enter, Space)
- [x] Focus visible states
- [x] Color contrast meets WCAG AA standards
- [x] Status indicators have text alternatives (aria-label)
- [x] Interactive elements are keyboard accessible
- [x] No motion for users with reduced motion preferences

### Reduced Motion Support

Add to components with animations:

```css
@media (prefers-reduced-motion: reduce) {
  .season-row {
    transition: none;
    transform: none !important;
  }
}
```

Or in Tailwind:

```vue
<div class="transition-all motion-reduce:transition-none motion-reduce:transform-none">
```

---

## Responsive Design

### Mobile Breakpoints

```css
@media (max-width: 1024px) {
  .season-stats {
    display: none; /* Hide stats on tablets */
  }
}

@media (max-width: 640px) {
  .season-row {
    gap: 12px; /* Reduce gap */
    padding: 12px; /* Reduce padding */
  }

  .season-indicator {
    height: 32px; /* Smaller indicator */
  }
}
```

### Responsive Props

Consider adding responsive variants:

```typescript
export interface ListRowProps {
  // ... existing props

  /**
   * Hide stats on mobile
   * @default false
   */
  hideStatsOnMobile?: boolean;

  /**
   * Stack layout on mobile
   * @default false
   */
  stackOnMobile?: boolean;
}
```

---

## Performance Considerations

1. **Virtual Scrolling**: For large lists (100+ items), consider using `vue-virtual-scroller`
2. **Lazy Loading**: Load list items on scroll for very long lists
3. **Memoization**: Use `computed` for complex calculations
4. **Event Delegation**: Use parent-level click handlers instead of individual row handlers

### Example: Optimized List

```vue
<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ items: any[] }>();

// Memoize processed items
const processedItems = computed(() => {
  return props.items.map(item => ({
    ...item,
    displayValue: formatValue(item.value),
  }));
});
</script>
```

---

## File Structure Summary

```
resources/app/js/components/common/lists/
├── ListSectionHeader.vue
├── ListContainer.vue
├── ListRow.vue
├── ListRowIndicator.vue
├── ListRowStats.vue
├── ListRowStat.vue
├── types.ts
├── index.ts
└── __tests__/
    ├── ListSectionHeader.test.ts
    ├── ListContainer.test.ts
    ├── ListRow.test.ts
    ├── ListRowIndicator.test.ts
    ├── ListRowStats.test.ts
    └── ListRowStat.test.ts
```

---

## Implementation Checklist

### Phase 1: Core Components
- [ ] Create `types.ts` with all TypeScript interfaces
- [ ] Implement `ListSectionHeader.vue`
- [ ] Implement `ListContainer.vue`
- [ ] Implement `ListRowIndicator.vue`
- [ ] Write unit tests for Phase 1 components
- [ ] Verify accessibility (ARIA, keyboard navigation)

### Phase 2: Stats Components
- [ ] Implement `ListRowStat.vue`
- [ ] Implement `ListRowStats.vue`
- [ ] Write unit tests for Phase 2 components
- [ ] Test responsive behavior

### Phase 3: Main Row Component
- [ ] Implement `ListRow.vue`
- [ ] Integrate all slot components
- [ ] Write unit tests for `ListRow`
- [ ] Write integration tests

### Phase 4: Export & Documentation
- [ ] Create `index.ts` barrel export
- [ ] Add JSDoc comments to all components
- [ ] Create Storybook stories (optional)
- [ ] Update component library documentation

### Phase 5: Testing & QA
- [ ] Run all unit tests (`npm run test:app`)
- [ ] Test with screen readers
- [ ] Test keyboard navigation
- [ ] Test responsive layouts
- [ ] Test in different browsers
- [ ] Check TypeScript types (`npm run type-check`)
- [ ] Run linter (`npm run lint:app`)
- [ ] Run formatter (`npm run format:app`)

### Phase 6: Real-World Integration
- [ ] Refactor existing season list to use new components
- [ ] Refactor driver lists
- [ ] Refactor activity feeds
- [ ] Performance testing with large datasets
- [ ] Gather user feedback
- [ ] Iterate based on feedback

---

## Design Tokens Reference

### Colors (from CSS Variables)

```css
--text-primary: #e6edf3
--text-secondary: #8b949e
--text-muted: #6e7681

--bg-card: #1c2128
--bg-elevated: #21262d

--border: #30363d

--cyan: #58a6ff
--green: #7ee787
--orange: #f0883e
--red: #f85149
--purple: #bc8cff
```

### Typography

```css
--font-mono: 'IBM Plex Mono', monospace
--font-sans: 'Inter', sans-serif
```

### Spacing

```css
--radius: 6px
```

### Font Sizes

- Section Label: 11px / 600 / 1px tracking / uppercase
- Card Title: 14px / 600
- Stat Value: 16px / 600 / monospace
- Stat Label: 9px / uppercase / 0.5px tracking / monospace
- Body: 13px / 400

---

## Future Enhancements

1. **Skeleton Loading**: Add skeleton states for loading lists
2. **Animations**: Entry/exit animations for list items
3. **Drag & Drop**: Reorderable list items
4. **Selection**: Multi-select with checkboxes
5. **Filtering**: Built-in search/filter capabilities
6. **Pagination**: Integrated pagination component
7. **Sorting**: Column-based sorting
8. **Grouping**: Grouped list items with headers
9. **Virtualization**: Virtual scrolling for performance
10. **Export**: Export list data to CSV/JSON

---

## Questions & Considerations

1. **Should we support compact/dense variants?** (smaller padding, fonts)
2. **Do we need a "grid" variant** for card-style layouts?
3. **Should stats be responsive** (hide on mobile by default)?
4. **Do we need built-in empty states?** (no items message)
5. **Should we support infinite scroll** out of the box?

---

## Success Criteria

1. All components pass TypeScript type checking
2. 100% test coverage for unit tests
3. All components are keyboard accessible
4. Components work across Chrome, Firefox, Safari, Edge
5. Responsive design works on mobile, tablet, desktop
6. Performance: Render 100 items in under 100ms
7. Accessibility: Pass automated accessibility tests (axe-core)
8. Documentation: All props, slots, emits documented with JSDoc
9. Real-world usage: At least 3 different list types implemented
10. Developer experience: Easy to use, clear API, good defaults

---

## Notes

- These components follow the **Technical Blueprint** design system
- All measurements and colors are extracted from the design HTML
- Components are designed to be **composition-friendly** with slots
- **Accessibility is a priority** - all interactive elements are keyboard accessible
- **TypeScript** provides type safety and better DX
- Components are **framework-agnostic** in logic (easy to port if needed)
- Follows **Vue 3 Composition API** best practices
- Aligns with existing component patterns (Card, Button, Table cells)

---

**End of Implementation Plan**
