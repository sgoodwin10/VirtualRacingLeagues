# VRL Velocity Design System - LISTS Components Implementation Plan

## Overview

This document outlines the comprehensive implementation plan for the **LISTS** component system in the VRL Velocity Design System for the public dashboard. These components enable the creation of structured, accessible, and visually consistent list displays with status indicators, metadata, statistics, and actions.

**Design Reference**: `/var/www/docs/PublicDashboard/design-2026/design-1-velocity/components/index.html` (LISTS section, lines 2251-2325)

**Existing App Implementation**: `/var/www/resources/app/js/components/common/lists/`

**Target Location**: `/var/www/resources/public/js/components/common/lists/`

---

## Design Principles

### VRL Velocity Design Language

1. **Racing-Inspired Aesthetics**: Clean, technical design with racing-inspired visual elements
2. **Status-Driven**: Clear visual indicators for item status (active, pending, inactive)
3. **Data-Dense**: Efficient presentation of metadata and statistics
4. **Hover Interactions**: Smooth hover effects with border color changes and background elevation
5. **Action-on-Hover**: Actions appear only when the user hovers over the row
6. **Orbitron Typography**: Display font (Orbitron) for labels and stats

### Component Architecture Goals

1. **Generic & Reusable**: Domain-agnostic components that work with any data type
2. **Composition-Based**: Extensive use of slots for maximum flexibility
3. **Accessible**: Full ARIA support, keyboard navigation, semantic HTML
4. **Type-Safe**: Complete TypeScript support with comprehensive interfaces
5. **Design System Aligned**: Consistent with existing VRL Velocity components

---

## Component Architecture

### Component Hierarchy

```
VrlListSectionHeader (standalone section divider)
VrlListContainer (flex column wrapper)
  └─ VrlListRow (individual list item)
      ├─ VrlListRowIndicator (vertical status bar)
      ├─ VrlListRowContent (title + subtitle)
      ├─ VrlListRowStats (stats container)
      │   └─ VrlListRowStat (individual stat)
      └─ VrlListRowAction (action button/icon)
```

### Component Flow

```
User Views List
     ↓
VrlListSectionHeader: "Active Seasons"
     ↓
VrlListContainer
     ↓
VrlListRow (for each item)
     ├─ Indicator: Green vertical bar (active)
     ├─ Content: "GT4 Championship 2026" + "Started Jan 15, 2026"
     ├─ Stats: "24 Drivers" + "8 Races"
     └─ Action: Arrow button (appears on hover)
```

---

## Component Specifications

## 1. VrlListContainer

### Purpose
Generic flex column container for list items with consistent gap spacing.

### File Location
`resources/public/js/components/common/lists/VrlListContainer.vue`

### Props Interface

```typescript
export interface VrlListContainerProps {
  /**
   * Gap between list items
   * @default '0.5rem' (8px)
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

- **default**: List rows (typically `VrlListRow` components)

### Design Specifications

**From Design HTML**:
```css
.list-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
```

### Implementation Notes

- Use CSS variable references for consistency
- Apply `role="list"` for accessibility
- Support both string and numeric gap values
- Default gap: `0.5rem` (8px)

### Markup Structure

```vue
<div
  class="list-container"
  role="list"
  :aria-label="ariaLabel"
  :style="{ gap: gapValue }"
>
  <slot />
</div>
```

### Accessibility

- **Role**: `list`
- **ARIA Label**: Optional `aria-label` for list context
- Child `VrlListRow` components should have `role="listitem"`

### Usage Example

```vue
<VrlListContainer aria-label="Active seasons list">
  <VrlListRow v-for="season in seasons" :key="season.id" status="active">
    <!-- row content -->
  </VrlListRow>
</VrlListContainer>
```

---

## 2. VrlListSectionHeader

### Purpose
Section header with Orbitron typography and uppercase styling, used to divide list sections.

### File Location
`resources/public/js/components/common/lists/VrlListSectionHeader.vue`

### Props Interface

```typescript
export interface VrlListSectionHeaderProps {
  /**
   * Section title text (e.g., "Active Seasons", "Completed")
   */
  title?: string;

  /**
   * Additional CSS classes for the header
   */
  class?: string;
}
```

### Slots

- **default**: Header text (alternative to `title` prop)

### Design Specifications

**From Design HTML**:
```css
.list-section-header {
  font-family: var(--font-display); /* Orbitron */
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 2px;
  text-transform: uppercase;
  padding: 0.75rem 0;
  margin-top: 1rem;
}
```

### Implementation Notes

- Use Orbitron font (var(--font-display))
- Font size: 0.7rem (~11px)
- Font weight: 600 (semibold)
- Letter spacing: 2px
- Text transform: uppercase
- Color: var(--text-muted)
- Padding: 0.75rem vertical, 0 horizontal
- Margin top: 1rem

### Markup Structure

```vue
<div class="list-section-header">
  <slot>{{ title }}</slot>
</div>
```

### Accessibility

- **Role**: `separator` or `heading` (level 3)
- **ARIA Label**: "Section divider" or use title as accessible name

### Usage Examples

```vue
<!-- Using prop -->
<VrlListSectionHeader title="Active Seasons" />

<!-- Using slot -->
<VrlListSectionHeader>
  <span>Completed Seasons</span>
</VrlListSectionHeader>
```

---

## 3. VrlListRow

### Purpose
Main row component that composes indicator, content, stats, and action slots. Supports clickable and hover states.

### File Location
`resources/public/js/components/common/lists/VrlListRow.vue`

### Props Interface

```typescript
export interface VrlListRowProps {
  /**
   * Status for the indicator bar
   * Determines indicator color
   */
  status?: VrlIndicatorStatus;

  /**
   * Whether the row is clickable
   * Adds cursor pointer and enables click events
   * @default false
   */
  clickable?: boolean;

  /**
   * Additional CSS classes
   */
  class?: string;

  /**
   * ARIA label for the row
   */
  ariaLabel?: string;
}

export type VrlIndicatorStatus = 'active' | 'pending' | 'inactive';
```

### Slots

- **indicator**: Custom indicator (defaults to `VrlListRowIndicator` if status provided)
- **content**: Main content area (typically `VrlListRowContent`)
- **stats**: Statistics section (typically `VrlListRowStats`)
- **action**: Action button/icon (typically `VrlListRowAction`)

### Emits

```typescript
export interface VrlListRowEmits {
  /**
   * Emitted when the row is clicked (only if clickable=true)
   */
  (e: 'click', event: MouseEvent): void;
}
```

### Design Specifications

**From Design HTML**:
```css
.list-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: var(--transition);
  cursor: pointer;
}

.list-row:hover {
  border-color: var(--cyan);
  background: var(--bg-elevated);
}
```

### Implementation Notes

- Display: flex with center alignment
- Gap: 1rem (16px) between sections
- Padding: 1rem top/bottom, 1.25rem left/right
- Background: var(--bg-card)
- Border: 1px solid var(--border)
- Border radius: var(--radius)
- Transition: var(--transition)
- Hover: border-color changes to var(--cyan), background to var(--bg-elevated)
- Cursor: pointer (when clickable)

### Keyboard Accessibility

- **Tab**: Focus the row (when clickable)
- **Enter**: Activate the row (trigger click)
- **Space**: Activate the row (trigger click)
- **Focus visible**: Show focus ring (2px cyan)

### Markup Structure

```vue
<div
  class="list-row"
  :class="{ 'cursor-pointer': clickable }"
  role="listitem"
  :aria-label="ariaLabel"
  :tabindex="clickable ? 0 : undefined"
  @click="handleClick"
  @keydown.enter="handleClick"
  @keydown.space.prevent="handleClick"
>
  <slot name="indicator">
    <VrlListRowIndicator v-if="status" :status="status" />
  </slot>

  <slot name="content" />

  <slot name="stats" />

  <slot name="action" />
</div>
```

### Usage Examples

```vue
<!-- Basic row with all slots -->
<VrlListRow status="active">
  <template #content>
    <VrlListRowContent
      title="GT4 Championship 2026"
      subtitle="Started Jan 15, 2026 • 12 rounds"
    />
  </template>

  <template #stats>
    <VrlListRowStats>
      <VrlListRowStat value="24" label="Drivers" value-color="cyan" />
      <VrlListRowStat value="8" label="Races" />
    </VrlListRowStats>
  </template>

  <template #action>
    <VrlListRowAction>
      <button class="btn btn-icon btn-ghost">→</button>
    </VrlListRowAction>
  </template>
</VrlListRow>

<!-- Clickable row -->
<VrlListRow
  status="active"
  clickable
  @click="handleSeasonClick"
  aria-label="View GT4 Championship details"
>
  <!-- ... -->
</VrlListRow>
```

---

## 4. VrlListRowIndicator

### Purpose
Vertical colored status bar that indicates item status (active, pending, inactive).

### File Location
`resources/public/js/components/common/lists/VrlListRowIndicator.vue`

### Props Interface

```typescript
export interface VrlListRowIndicatorProps {
  /**
   * Status type - determines color
   */
  status: VrlIndicatorStatus;

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

export type VrlIndicatorStatus = 'active' | 'pending' | 'inactive';
```

### Design Specifications

**From Design HTML**:
```css
.list-row-indicator {
  width: 4px;
  height: 40px;
  border-radius: 2px;
  background: var(--border);
}

.list-row-indicator.active { background: var(--green); }
.list-row-indicator.pending { background: var(--orange); }
.list-row-indicator.inactive { background: var(--text-muted); }
```

### Color Mapping

| Status   | Color Variable       | Visual          |
|----------|---------------------|-----------------|
| active   | var(--green)        | Green indicator |
| pending  | var(--orange)       | Orange indicator|
| inactive | var(--text-muted)   | Muted gray      |

### Implementation Notes

- Default width: 4px
- Default height: 40px
- Border radius: 2px
- Flex-shrink: 0 (prevent shrinking)
- Support both string and numeric dimensions

### Markup Structure

```vue
<div
  class="list-row-indicator"
  :class="`list-row-indicator--${status}`"
  :style="{ width: widthValue, height: heightValue }"
  role="status"
  :aria-label="`Status: ${status}`"
/>
```

### Accessibility

- **Role**: `status`
- **ARIA Label**: "Status: active", "Status: pending", etc.

### Usage Examples

```vue
<!-- Default dimensions -->
<VrlListRowIndicator status="active" />

<!-- Custom dimensions -->
<VrlListRowIndicator status="pending" width="3px" height="32px" />

<!-- With class override -->
<VrlListRowIndicator status="inactive" class="my-custom-class" />
```

---

## 5. VrlListRowContent

### Purpose
Displays title and subtitle content for a list row.

### File Location
`resources/public/js/components/common/lists/VrlListRowContent.vue`

### Props Interface

```typescript
export interface VrlListRowContentProps {
  /**
   * Main title text
   */
  title: string;

  /**
   * Subtitle text (metadata, secondary info)
   */
  subtitle?: string;

  /**
   * Additional CSS classes
   */
  class?: string;
}
```

### Slots

- **title**: Custom title content (alternative to `title` prop)
- **subtitle**: Custom subtitle content (alternative to `subtitle` prop)

### Design Specifications

**From Design HTML**:
```css
.list-row-content {
  flex: 1;
}

.list-row-title {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.list-row-subtitle {
  font-size: 0.8rem;
  color: var(--text-secondary);
}
```

### Implementation Notes

- Flex: 1 (take remaining space)
- Title font weight: 500 (medium)
- Title margin bottom: 0.25rem
- Subtitle font size: 0.8rem
- Subtitle color: var(--text-secondary)

### Markup Structure

```vue
<div class="list-row-content">
  <div class="list-row-title">
    <slot name="title">{{ title }}</slot>
  </div>
  <div v-if="subtitle || $slots.subtitle" class="list-row-subtitle">
    <slot name="subtitle">{{ subtitle }}</slot>
  </div>
</div>
```

### Usage Examples

```vue
<!-- Using props -->
<VrlListRowContent
  title="GT4 Championship 2026"
  subtitle="Started Jan 15, 2026 • 12 rounds"
/>

<!-- Using slots -->
<VrlListRowContent>
  <template #title>
    <strong>GT4 Championship 2026</strong>
  </template>
  <template #subtitle>
    <span>Started Jan 15, 2026</span> • <span>12 rounds</span>
  </template>
</VrlListRowContent>
```

---

## 6. VrlListRowStats

### Purpose
Container for multiple `VrlListRowStat` components with consistent spacing.

### File Location
`resources/public/js/components/common/lists/VrlListRowStats.vue`

### Props Interface

```typescript
export interface VrlListRowStatsProps {
  /**
   * Gap between individual stats
   * @default '1.5rem' (24px)
   */
  gap?: string | number;

  /**
   * Additional CSS classes
   */
  class?: string;
}
```

### Slots

- **default**: `VrlListRowStat` components

### Design Specifications

**From Design HTML**:
```css
.list-row-stats {
  display: flex;
  gap: 1.5rem;
}
```

### Implementation Notes

- Display: flex
- Gap: 1.5rem (24px) between stats
- Flex-shrink: 0 (prevent shrinking)

### Markup Structure

```vue
<div
  class="list-row-stats"
  :style="{ gap: gapValue }"
  role="group"
  aria-label="Statistics"
>
  <slot />
</div>
```

### Accessibility

- **Role**: `group`
- **ARIA Label**: "Statistics"

### Usage Example

```vue
<VrlListRowStats>
  <VrlListRowStat value="24" label="Drivers" />
  <VrlListRowStat value="8" label="Races" />
</VrlListRowStats>

<!-- Custom gap -->
<VrlListRowStats gap="1rem">
  <VrlListRowStat value="46" label="Points" />
  <VrlListRowStat value="12" label="Wins" />
</VrlListRowStats>
```

---

## 7. VrlListRowStat

### Purpose
Displays a single statistic with value and label.

### File Location
`resources/public/js/components/common/lists/VrlListRowStat.vue`

### Props Interface

```typescript
export interface VrlListRowStatProps {
  /**
   * Stat value (numeric or text)
   */
  value: string | number;

  /**
   * Stat label (e.g., "Drivers", "Races", "Points")
   */
  label: string;

  /**
   * Color variant for the value
   * Applies color class to value
   * @default undefined (no color class)
   */
  valueColor?: 'cyan' | 'orange' | 'green' | 'red' | 'purple';

  /**
   * Additional CSS classes
   */
  class?: string;
}
```

### Slots

- **value**: Custom value rendering
- **label**: Custom label rendering

### Design Specifications

**From Design HTML**:
```css
.list-row-stat {
  text-align: right;
}

.list-row-stat-value {
  font-family: var(--font-display); /* Orbitron */
  font-size: 0.9rem;
  font-weight: 600;
}

.list-row-stat-label {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
```

**From Design Example**:
```html
<div class="list-row-stat-value text-cyan">24</div>
<div class="list-row-stat-label">Drivers</div>
```

### Implementation Notes

- Text align: right
- Value font: Orbitron (var(--font-display))
- Value font size: 0.9rem
- Value font weight: 600
- Label font size: 0.7rem
- Label color: var(--text-muted)
- Label text transform: uppercase
- Label letter spacing: 0.5px
- Optional color classes: text-cyan, text-orange, etc.

### Color Classes

```typescript
const colorClasses = {
  cyan: 'text-cyan',
  orange: 'text-orange',
  green: 'text-green',
  red: 'text-red',
  purple: 'text-purple',
};
```

### Markup Structure

```vue
<div class="list-row-stat" role="group" :aria-label="`${value} ${label}`">
  <div class="list-row-stat-value" :class="valueColorClass">
    <slot name="value">{{ value }}</slot>
  </div>
  <div class="list-row-stat-label">
    <slot name="label">{{ label }}</slot>
  </div>
</div>
```

### Accessibility

- **Role**: `group`
- **ARIA Label**: Combines value and label (e.g., "24 Drivers")

### Usage Examples

```vue
<!-- Basic stat -->
<VrlListRowStat value="24" label="Drivers" />

<!-- Colored value -->
<VrlListRowStat value="24" label="Drivers" value-color="cyan" />
<VrlListRowStat value="18" label="Registered" value-color="orange" />

<!-- String value -->
<VrlListRowStat value="14/22" label="Progress" />

<!-- Custom rendering -->
<VrlListRowStat value="24" label="Drivers">
  <template #value>
    <strong>24</strong>
  </template>
</VrlListRowStat>
```

---

## 8. VrlListRowAction

### Purpose
Container for action buttons/icons that appear on row hover.

### File Location
`resources/public/js/components/common/lists/VrlListRowAction.vue`

### Props Interface

```typescript
export interface VrlListRowActionProps {
  /**
   * Additional CSS classes
   */
  class?: string;
}
```

### Slots

- **default**: Action button or icon

### Design Specifications

**From Design HTML**:
```css
.list-row-action {
  opacity: 0;
  transition: var(--transition);
}

.list-row:hover .list-row-action {
  opacity: 1;
}
```

### Implementation Notes

- Default opacity: 0 (hidden)
- Transition: var(--transition)
- Parent row hover: opacity 1 (visible)
- Flex-shrink: 0 (prevent shrinking)

### Markup Structure

```vue
<div class="list-row-action">
  <slot />
</div>
```

### Usage Examples

```vue
<VrlListRowAction>
  <button class="btn btn-icon btn-ghost">→</button>
</VrlListRowAction>

<VrlListRowAction>
  <VrlIconButton icon="arrow-right" variant="ghost" />
</VrlListRowAction>
```

---

## CSS Implementation

### File Location
`resources/public/css/app.css` (add to existing file)

### CSS Classes

```css
/* ================================================================
   LIST COMPONENTS
   ================================================================ */

/* List Container */
.list-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* List Section Header */
.list-section-header {
  font-family: var(--font-display); /* Orbitron */
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 2px;
  text-transform: uppercase;
  padding: 0.75rem 0;
  margin-top: 1rem;
}

/* List Row */
.list-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: var(--transition);
}

.list-row.cursor-pointer {
  cursor: pointer;
}

.list-row:hover {
  border-color: var(--cyan);
  background: var(--bg-elevated);
}

.list-row:focus-visible {
  outline: 2px solid var(--cyan);
  outline-offset: 2px;
}

/* List Row Indicator */
.list-row-indicator {
  width: 4px;
  height: 40px;
  border-radius: 2px;
  background: var(--border);
  flex-shrink: 0;
}

.list-row-indicator.list-row-indicator--active {
  background: var(--green);
}

.list-row-indicator.list-row-indicator--pending {
  background: var(--orange);
}

.list-row-indicator.list-row-indicator--inactive {
  background: var(--text-muted);
}

/* List Row Content */
.list-row-content {
  flex: 1;
  min-width: 0;
}

.list-row-title {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.list-row-subtitle {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

/* List Row Stats */
.list-row-stats {
  display: flex;
  gap: 1.5rem;
  flex-shrink: 0;
}

/* List Row Stat */
.list-row-stat {
  text-align: right;
}

.list-row-stat-value {
  font-family: var(--font-display); /* Orbitron */
  font-size: 0.9rem;
  font-weight: 600;
}

.list-row-stat-label {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* List Row Action */
.list-row-action {
  opacity: 0;
  transition: var(--transition);
  flex-shrink: 0;
}

.list-row:hover .list-row-action {
  opacity: 1;
}

/* Color Utility Classes */
.text-cyan { color: var(--cyan); }
.text-orange { color: var(--orange); }
.text-green { color: var(--green); }
.text-red { color: var(--red); }
.text-purple { color: var(--purple); }

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  .list-row,
  .list-row-action {
    transition: none;
  }
}
```

---

## TypeScript Types

### File Location
`resources/public/js/components/common/lists/types.ts`

### Type Definitions

```typescript
/**
 * List Component Types
 *
 * TypeScript interfaces for the VRL Velocity Design System list components.
 */

/**
 * Status types for list row indicators
 */
export type VrlIndicatorStatus = 'active' | 'pending' | 'inactive';

/**
 * Color variants for stat values
 */
export type VrlStatColor = 'cyan' | 'orange' | 'green' | 'red' | 'purple';

/**
 * Props for VrlListContainer component
 */
export interface VrlListContainerProps {
  /**
   * Gap between list items
   * @default '0.5rem'
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
 * Props for VrlListSectionHeader component
 */
export interface VrlListSectionHeaderProps {
  /**
   * Section title text (e.g., "Active Seasons", "Completed")
   */
  title?: string;

  /**
   * Additional CSS classes for the header
   */
  class?: string;
}

/**
 * Props for VrlListRow component
 */
export interface VrlListRowProps {
  /**
   * Status for the indicator bar
   * Determines indicator color
   */
  status?: VrlIndicatorStatus;

  /**
   * Whether the row is clickable
   * Adds cursor pointer and enables click events
   * @default false
   */
  clickable?: boolean;

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
 * Emits for VrlListRow component
 */
export interface VrlListRowEmits {
  /**
   * Emitted when the row is clicked (only if clickable=true)
   */
  (e: 'click', event: MouseEvent): void;
}

/**
 * Props for VrlListRowIndicator component
 */
export interface VrlListRowIndicatorProps {
  /**
   * Status type - determines color
   */
  status: VrlIndicatorStatus;

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
 * Props for VrlListRowContent component
 */
export interface VrlListRowContentProps {
  /**
   * Main title text
   */
  title: string;

  /**
   * Subtitle text (metadata, secondary info)
   */
  subtitle?: string;

  /**
   * Additional CSS classes
   */
  class?: string;
}

/**
 * Props for VrlListRowStats component
 */
export interface VrlListRowStatsProps {
  /**
   * Gap between individual stats
   * @default '1.5rem'
   */
  gap?: string | number;

  /**
   * Additional CSS classes
   */
  class?: string;
}

/**
 * Props for VrlListRowStat component
 */
export interface VrlListRowStatProps {
  /**
   * Stat value (numeric or text)
   */
  value: string | number;

  /**
   * Stat label (e.g., "Drivers", "Races", "Points")
   */
  label: string;

  /**
   * Color variant for the value
   * Applies color class to value
   * @default undefined
   */
  valueColor?: VrlStatColor;

  /**
   * Additional CSS classes
   */
  class?: string;
}

/**
 * Props for VrlListRowAction component
 */
export interface VrlListRowActionProps {
  /**
   * Additional CSS classes
   */
  class?: string;
}
```

---

## Barrel Export (index.ts)

### File Location
`resources/public/js/components/common/lists/index.ts`

### Export Structure

```typescript
// Component exports
export { default as VrlListContainer } from './VrlListContainer.vue';
export { default as VrlListSectionHeader } from './VrlListSectionHeader.vue';
export { default as VrlListRow } from './VrlListRow.vue';
export { default as VrlListRowIndicator } from './VrlListRowIndicator.vue';
export { default as VrlListRowContent } from './VrlListRowContent.vue';
export { default as VrlListRowStats } from './VrlListRowStats.vue';
export { default as VrlListRowStat } from './VrlListRowStat.vue';
export { default as VrlListRowAction } from './VrlListRowAction.vue';

// Type exports
export * from './types';
```

---

## Complete Usage Example

### Season List Implementation

```vue
<script setup lang="ts">
import {
  VrlListSectionHeader,
  VrlListContainer,
  VrlListRow,
  VrlListRowContent,
  VrlListRowStats,
  VrlListRowStat,
  VrlListRowAction,
  type VrlIndicatorStatus,
} from '@public/components/common/lists';
import { useRouter } from 'vue-router';

interface Season {
  id: number;
  name: string;
  subtitle: string;
  drivers: number;
  races: number;
  status: VrlIndicatorStatus;
}

const router = useRouter();

const activeSeasons: Season[] = [
  {
    id: 1,
    name: 'GT4 Championship 2026',
    subtitle: 'Started Jan 15, 2026 • 12 rounds',
    drivers: 24,
    races: 8,
    status: 'active',
  },
  {
    id: 2,
    name: 'Endurance Series',
    subtitle: 'Starts Feb 1, 2026 • 6 rounds',
    drivers: 18,
    races: 0,
    status: 'pending',
  },
];

const completedSeasons: Season[] = [
  {
    id: 3,
    name: 'GT4 Championship 2025',
    subtitle: 'Completed Dec 20, 2025 • 10 rounds',
    drivers: 20,
    races: 10,
    status: 'inactive',
  },
];

const viewSeason = (id: number) => {
  router.push({ name: 'season-detail', params: { id } });
};
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <!-- Active Seasons Section -->
    <VrlListSectionHeader title="Active Seasons" />

    <VrlListContainer aria-label="Active seasons list">
      <VrlListRow
        v-for="season in activeSeasons"
        :key="season.id"
        :status="season.status"
        clickable
        :aria-label="`View ${season.name} details`"
        @click="viewSeason(season.id)"
      >
        <template #content>
          <VrlListRowContent
            :title="season.name"
            :subtitle="season.subtitle"
          />
        </template>

        <template #stats>
          <VrlListRowStats>
            <VrlListRowStat
              :value="season.drivers"
              label="Drivers"
              :value-color="season.status === 'active' ? 'cyan' : 'orange'"
            />
            <VrlListRowStat :value="season.races" label="Races" />
          </VrlListRowStats>
        </template>

        <template #action>
          <VrlListRowAction>
            <button class="btn btn-icon btn-ghost" aria-label="View details">
              →
            </button>
          </VrlListRowAction>
        </template>
      </VrlListRow>
    </VrlListContainer>

    <!-- Completed Seasons Section -->
    <VrlListSectionHeader title="Completed" />

    <VrlListContainer aria-label="Completed seasons list">
      <VrlListRow
        v-for="season in completedSeasons"
        :key="season.id"
        :status="season.status"
        clickable
        :aria-label="`View ${season.name} details`"
        @click="viewSeason(season.id)"
      >
        <template #content>
          <VrlListRowContent
            :title="season.name"
            :subtitle="season.subtitle"
          />
        </template>

        <template #stats>
          <VrlListRowStats>
            <VrlListRowStat :value="season.drivers" label="Drivers" />
            <VrlListRowStat :value="season.races" label="Races" />
          </VrlListRowStats>
        </template>

        <template #action>
          <VrlListRowAction>
            <button class="btn btn-icon btn-ghost" aria-label="View details">
              →
            </button>
          </VrlListRowAction>
        </template>
      </VrlListRow>
    </VrlListContainer>
  </div>
</template>
```

---

## Testing Strategy

### Unit Tests

Create comprehensive tests for each component in `resources/public/js/components/common/lists/__tests__/`

#### Test Files

1. **VrlListContainer.test.ts**
   - Renders slot content
   - Applies default gap (0.5rem)
   - Applies custom gap (numeric and string)
   - Has proper ARIA attributes (role="list", aria-label)
   - Applies custom classes

2. **VrlListSectionHeader.test.ts**
   - Renders title from prop
   - Renders title from slot
   - Applies Orbitron font styling
   - Has proper semantic structure
   - Applies custom classes

3. **VrlListRow.test.ts**
   - Renders all slots (indicator, content, stats, action)
   - Shows indicator when status provided
   - Emits click event when clickable
   - Does not emit click when not clickable
   - Keyboard accessible (Enter, Space keys)
   - Applies hover effects
   - Has proper ARIA attributes (role="listitem", aria-label)
   - Applies focus visible state
   - Supports custom indicator slot

4. **VrlListRowIndicator.test.ts**
   - Renders with active status (green)
   - Renders with pending status (orange)
   - Renders with inactive status (muted)
   - Applies default dimensions (4px × 40px)
   - Applies custom dimensions
   - Has proper ARIA attributes (role="status", aria-label)

5. **VrlListRowContent.test.ts**
   - Renders title from prop
   - Renders subtitle from prop
   - Renders title from slot
   - Renders subtitle from slot
   - Hides subtitle when not provided
   - Applies proper styling

6. **VrlListRowStats.test.ts**
   - Renders slot content (multiple stats)
   - Applies default gap (1.5rem)
   - Applies custom gap
   - Has proper ARIA attributes (role="group", aria-label)

7. **VrlListRowStat.test.ts**
   - Renders value and label from props
   - Renders string value
   - Renders numeric value
   - Applies color class (cyan, orange, etc.)
   - Renders custom value slot
   - Renders custom label slot
   - Has proper ARIA attributes (aria-label combines value + label)
   - Uses Orbitron font for value

8. **VrlListRowAction.test.ts**
   - Renders slot content
   - Has opacity 0 by default (CSS verification)
   - Applies custom classes

### Integration Tests

Create integration test to verify components work together:

**VrlListIntegration.test.ts**:
- Complete list structure renders correctly
- Multiple rows with different statuses
- Click events propagate correctly
- Keyboard navigation works across rows
- Hover states work correctly

### Test Example Structure

```typescript
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlListRow from '../VrlListRow.vue';

describe('VrlListRow', () => {
  it('emits click event when clickable', async () => {
    const wrapper = mount(VrlListRow, {
      props: { clickable: true },
      slots: {
        content: '<div>Test Content</div>',
      },
    });

    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('supports keyboard navigation', async () => {
    const wrapper = mount(VrlListRow, {
      props: { clickable: true },
      slots: {
        content: '<div>Test Content</div>',
      },
    });

    expect(wrapper.attributes('tabindex')).toBe('0');

    await wrapper.trigger('keydown.enter');
    expect(wrapper.emitted('click')).toHaveLength(1);

    await wrapper.trigger('keydown.space');
    expect(wrapper.emitted('click')).toHaveLength(2);
  });
});
```

---

## Accessibility Requirements

### WCAG 2.1 AA Compliance

#### Color Contrast
- Text on backgrounds must meet 4.5:1 ratio
- Status indicators use distinct colors (green, orange, muted)
- Hover states use cyan with sufficient contrast

#### Keyboard Navigation
- All clickable rows must be keyboard accessible
- Tab: Navigate between rows
- Enter/Space: Activate row
- Focus visible: Clear 2px cyan outline

#### Screen Reader Support
- Semantic HTML: `role="list"`, `role="listitem"`, `role="status"`
- ARIA labels: Provide context for lists, rows, stats, indicators
- Status announcements: "Status: active", "Status: pending"
- Stat announcements: "24 Drivers", "8 Races"

#### Motion & Animation
- Respect `prefers-reduced-motion`
- Disable transitions for users with motion sensitivity
- No essential information conveyed through motion alone

### Accessibility Checklist

- [ ] All interactive elements are keyboard accessible
- [ ] Focus visible states are clear and visible
- [ ] Color is not the only means of conveying information
- [ ] ARIA labels provide context for screen readers
- [ ] Semantic HTML roles are used correctly
- [ ] Text meets WCAG AA color contrast requirements
- [ ] Motion respects user preferences
- [ ] Status changes are announced to screen readers

---

## Responsive Design

### Mobile Breakpoints

```css
/* Tablet (max-width: 768px) */
@media (max-width: 768px) {
  .list-row-stats {
    display: none; /* Hide stats on tablets */
  }

  .list-row {
    gap: 0.75rem;
    padding: 0.875rem 1rem;
  }
}

/* Mobile (max-width: 640px) */
@media (max-width: 640px) {
  .list-row {
    gap: 0.5rem;
    padding: 0.75rem;
  }

  .list-row-indicator {
    height: 32px; /* Smaller indicator */
    width: 3px;
  }

  .list-row-title {
    font-size: 0.875rem;
  }

  .list-row-subtitle {
    font-size: 0.75rem;
  }
}
```

### Responsive Considerations

1. **Stats Visibility**: Hide stats on small screens to prevent overcrowding
2. **Action Visibility**: Always show actions on mobile (no hover state)
3. **Touch Targets**: Ensure minimum 44×44px touch targets
4. **Spacing**: Reduce padding and gaps on smaller screens

---

## Performance Considerations

### Optimization Strategies

1. **Virtual Scrolling**: For lists with 100+ items, implement virtual scrolling
   - Consider using `vue-virtual-scroller` or `@tanstack/vue-virtual`
   - Only render visible items + buffer

2. **Lazy Loading**: Load list items on scroll
   - Implement intersection observer
   - Load chunks of 20-50 items at a time

3. **Memoization**: Use `computed` for expensive calculations
   - Process data once, not per item
   - Cache formatted values

4. **Event Delegation**: Use parent-level handlers
   - Single click handler on container
   - Identify target row from event

### Performance Example

```vue
<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ items: RawItem[] }>();

// Memoize processed items
const processedItems = computed(() => {
  return props.items.map(item => ({
    ...item,
    formattedDate: formatDate(item.startDate),
    statusColor: getStatusColor(item.status),
  }));
});

// Single click handler with event delegation
const handleListClick = (event: MouseEvent) => {
  const row = (event.target as HTMLElement).closest('.list-row');
  if (row) {
    const id = row.getAttribute('data-id');
    if (id) viewItem(parseInt(id));
  }
};
</script>
```

---

## File Structure

```
resources/public/js/components/common/lists/
├── VrlListContainer.vue
├── VrlListSectionHeader.vue
├── VrlListRow.vue
├── VrlListRowIndicator.vue
├── VrlListRowContent.vue
├── VrlListRowStats.vue
├── VrlListRowStat.vue
├── VrlListRowAction.vue
├── types.ts
├── index.ts
└── __tests__/
    ├── VrlListContainer.test.ts
    ├── VrlListSectionHeader.test.ts
    ├── VrlListRow.test.ts
    ├── VrlListRowIndicator.test.ts
    ├── VrlListRowContent.test.ts
    ├── VrlListRowStats.test.ts
    ├── VrlListRowStat.test.ts
    ├── VrlListRowAction.test.ts
    └── VrlListIntegration.test.ts
```

---

## Implementation Checklist

### Phase 1: Foundation (Types & CSS)
- [ ] Create `types.ts` with all TypeScript interfaces
- [ ] Add CSS classes to `resources/public/css/app.css`
- [ ] Verify CSS variable references exist
- [ ] Test CSS in browser with static HTML

### Phase 2: Basic Components
- [ ] Implement `VrlListContainer.vue`
- [ ] Implement `VrlListSectionHeader.vue`
- [ ] Implement `VrlListRowIndicator.vue`
- [ ] Write unit tests for Phase 2 components
- [ ] Verify accessibility (ARIA, semantic HTML)

### Phase 3: Content Components
- [ ] Implement `VrlListRowContent.vue`
- [ ] Implement `VrlListRowStat.vue`
- [ ] Implement `VrlListRowStats.vue`
- [ ] Implement `VrlListRowAction.vue`
- [ ] Write unit tests for Phase 3 components

### Phase 4: Main Row Component
- [ ] Implement `VrlListRow.vue`
- [ ] Integrate all slot components
- [ ] Add keyboard navigation support
- [ ] Write unit tests for `VrlListRow`
- [ ] Write integration tests

### Phase 5: Export & Documentation
- [ ] Create `index.ts` barrel export
- [ ] Add comprehensive JSDoc comments
- [ ] Verify all props have descriptions
- [ ] Test imports in consuming components

### Phase 6: Testing & QA
- [ ] Run all unit tests (`npm run test`)
- [ ] Achieve 100% test coverage
- [ ] Test with screen readers (NVDA, VoiceOver)
- [ ] Test keyboard navigation (Tab, Enter, Space)
- [ ] Test responsive layouts (mobile, tablet, desktop)
- [ ] Test in browsers (Chrome, Firefox, Safari, Edge)
- [ ] Run TypeScript type check (`npm run type-check`)
- [ ] Run linter (`npm run lint`)
- [ ] Run formatter (`npm run format`)

### Phase 7: Real-World Integration
- [ ] Create example implementation (season list)
- [ ] Test with real API data
- [ ] Performance test with 100+ items
- [ ] Test reduced motion support
- [ ] Gather user feedback
- [ ] Iterate based on feedback

---

## Design Tokens Reference

### CSS Variables (from Velocity Design System)

```css
/* Colors */
--text-primary: #FFFFFF
--text-secondary: rgba(255, 255, 255, 0.7)
--text-muted: rgba(255, 255, 255, 0.5)

--bg-card: rgba(255, 255, 255, 0.05)
--bg-elevated: rgba(255, 255, 255, 0.08)

--border: rgba(255, 255, 255, 0.1)

--cyan: #00D9FF
--green: #00FF88
--orange: #FF8C00
--red: #FF3B3B
--purple: #B794F4

/* Typography */
--font-display: 'Orbitron', sans-serif
--font-body: 'Inter', sans-serif

/* Spacing */
--radius: 6px
--transition: all 0.2s ease
```

### Font Sizes

| Element            | Size    | Weight | Transform  | Spacing |
|-------------------|---------|--------|------------|---------|
| Section Header    | 0.7rem  | 600    | uppercase  | 2px     |
| Row Title         | 1rem    | 500    | -          | -       |
| Row Subtitle      | 0.8rem  | 400    | -          | -       |
| Stat Value        | 0.9rem  | 600    | -          | -       |
| Stat Label        | 0.7rem  | 400    | uppercase  | 0.5px   |

---

## Migration from App Dashboard

### Component Name Mapping

| App Dashboard          | Public Dashboard        |
|------------------------|-------------------------|
| ListContainer          | VrlListContainer        |
| ListSectionHeader      | VrlListSectionHeader    |
| ListRow                | VrlListRow              |
| ListRowIndicator       | VrlListRowIndicator     |
| ListRowStats           | VrlListRowStats         |
| ListRowStat            | VrlListRowStat          |

### Key Differences

1. **Naming Convention**: `Vrl` prefix for Velocity Racing League
2. **Added Component**: `VrlListRowContent` (dedicated title/subtitle component)
3. **Added Component**: `VrlListRowAction` (dedicated action container)
4. **Status Types**: Reduced to 3 core statuses (active, pending, inactive)
5. **Styling**: Velocity design system (Orbitron font, specific colors)
6. **CSS Classes**: Prefixed with `list-` for clarity

### Migration Notes

- The app dashboard implementation serves as a solid reference
- Public dashboard adds `VrlListRowContent` for better composition
- Public dashboard adds `VrlListRowAction` for hover effects
- Status types simplified to match design (active, pending, inactive)
- All components maintain the same slot-based architecture
- TypeScript interfaces are nearly identical with naming updates

---

## Future Enhancements

### Phase 2 Features (Post-MVP)

1. **Skeleton Loading States**
   - Add `VrlListRowSkeleton` component
   - Shimmer animation during data load

2. **Empty States**
   - Add `VrlListEmpty` component
   - Message when no items exist

3. **Selection Mode**
   - Add checkbox support
   - Multi-select capability
   - Bulk actions

4. **Drag & Drop**
   - Reorderable list items
   - Touch-friendly on mobile

5. **Filtering & Sorting**
   - Built-in search/filter
   - Column-based sorting
   - Filter chips

6. **Pagination**
   - Integrated pagination component
   - Page size selector

7. **Virtualization**
   - Virtual scrolling for performance
   - Handle 1000+ items smoothly

8. **Density Variants**
   - Compact mode (smaller padding)
   - Comfortable mode (current)
   - Spacious mode (larger padding)

9. **Export Functionality**
   - Export to CSV
   - Export to JSON
   - Print-friendly view

10. **Grouping**
    - Grouped list items
    - Collapsible sections
    - Group headers

---

## Success Criteria

### Code Quality
- [ ] All components pass TypeScript type checking with no errors
- [ ] 100% test coverage for unit tests
- [ ] All tests pass (unit + integration)
- [ ] No linting errors
- [ ] Code formatted with Prettier

### Accessibility
- [ ] All components are keyboard accessible
- [ ] Screen reader tested (NVDA on Windows, VoiceOver on Mac)
- [ ] ARIA attributes implemented correctly
- [ ] Focus visible states are clear
- [ ] Color contrast meets WCAG AA
- [ ] Motion respects user preferences

### Performance
- [ ] Render 100 items in under 100ms
- [ ] No layout shifts during render
- [ ] Smooth 60fps animations
- [ ] Memory efficient (no leaks)

### Cross-Browser
- [ ] Works in Chrome (latest)
- [ ] Works in Firefox (latest)
- [ ] Works in Safari (latest)
- [ ] Works in Edge (latest)

### Responsive
- [ ] Works on mobile (320px+)
- [ ] Works on tablet (768px+)
- [ ] Works on desktop (1024px+)
- [ ] Touch targets meet 44×44px minimum

### Developer Experience
- [ ] Clear, intuitive API
- [ ] Comprehensive JSDoc comments
- [ ] Good default prop values
- [ ] Easy to use in real-world scenarios
- [ ] Type inference works correctly

### Real-World Usage
- [ ] At least 1 production implementation (season list)
- [ ] Positive user feedback
- [ ] No critical bugs reported
- [ ] Performance meets requirements

---

## Questions & Decisions

### Open Questions

1. **Should we support grid layout variant?**
   - Current: Vertical list only
   - Consideration: Add grid mode for card-style layouts

2. **Should stats hide on mobile by default?**
   - Current: Controlled by CSS media query
   - Consideration: Add prop to control visibility

3. **Should we add compact/dense variants?**
   - Current: Single density (comfortable)
   - Consideration: Add `density` prop ('compact', 'comfortable', 'spacious')

4. **Should action always show on touch devices?**
   - Current: CSS hover only
   - Consideration: Touch detection to always show action

5. **Should we support infinite scroll?**
   - Current: Manual implementation
   - Consideration: Built-in intersection observer

### Design Decisions Made

1. **Naming**: Use `Vrl` prefix for all components (VRL = Virtual Racing League)
2. **Status Types**: Limit to 3 core types (active, pending, inactive) matching design
3. **Component Granularity**: Separate `VrlListRowContent` and `VrlListRowAction` for better composition
4. **Slots Over Props**: Favor slots for flexibility while keeping props for simple cases
5. **CSS Strategy**: Use CSS classes over Tailwind for list-specific styles (better for design system)

---

## References

### Design System Documentation
- **Design HTML**: `/var/www/docs/PublicDashboard/design-2026/design-1-velocity/components/index.html`
- **App Implementation**: `/var/www/resources/app/js/components/common/lists/`
- **App List Plan**: `/var/www/docs/designs/app/ideas2/plans/leagues/lists/reusable-list-components-plan.md`

### Vue 3 Best Practices
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Vue 3 TypeScript](https://vuejs.org/guide/typescript/overview.html)
- [Vue Test Utils](https://test-utils.vuejs.org/)

### Accessibility Resources
- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

## Notes

- This plan is based on the Velocity Design System design reference
- The app dashboard implementation provides a proven architecture
- All measurements and colors are extracted from the design HTML
- Components prioritize composition and flexibility through slots
- Accessibility is a core requirement, not an afterthought
- TypeScript provides type safety and improved developer experience
- The design uses Orbitron for display elements (stats, labels)
- Hover effects are subtle (border color + background elevation)
- Actions appear on hover for a clean, minimal interface

---

**END OF PLAN DOCUMENT**

*This is a planning document only. No code implementation is included. Use this plan to guide the implementation of the VRL Velocity Design System LISTS components for the public dashboard.*
