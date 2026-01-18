# VRL Velocity Design System - Lists Components Usage

This document demonstrates how to use the VRL Velocity Design System list components.

## Basic Usage

```vue
<script setup lang="ts">
import { ref } from 'vue';
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

interface Season {
  id: number;
  name: string;
  subtitle: string;
  drivers: number;
  races: number;
  status: VrlIndicatorStatus;
}

const activeSeasons = ref<Season[]>([
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
]);

const completedSeasons = ref<Season[]>([
  {
    id: 3,
    name: 'GT4 Championship 2025',
    subtitle: 'Completed Dec 20, 2025 • 10 rounds',
    drivers: 20,
    races: 10,
    status: 'inactive',
  },
]);

const viewSeason = (id: number) => {
  console.log('Viewing season:', id);
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
          <VrlListRowContent :title="season.name" :subtitle="season.subtitle" />
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
            <button class="btn btn-icon btn-ghost" aria-label="View details">→</button>
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
          <VrlListRowContent :title="season.name" :subtitle="season.subtitle" />
        </template>

        <template #stats>
          <VrlListRowStats>
            <VrlListRowStat :value="season.drivers" label="Drivers" />
            <VrlListRowStat :value="season.races" label="Races" />
          </VrlListRowStats>
        </template>

        <template #action>
          <VrlListRowAction>
            <button class="btn btn-icon btn-ghost" aria-label="View details">→</button>
          </VrlListRowAction>
        </template>
      </VrlListRow>
    </VrlListContainer>
  </div>
</template>
```

## Component Details

### VrlListContainer

Wrapper for list items with consistent gap spacing.

**Props:**
- `gap?: string | number` - Gap between items (default: '0.5rem')
- `class?: string` - Custom classes
- `ariaLabel?: string` - ARIA label for the list

### VrlListSectionHeader

Section divider with Orbitron typography.

**Props:**
- `title?: string` - Section title
- `class?: string` - Custom classes

### VrlListRow

Main row component with support for all slots.

**Props:**
- `status?: 'active' | 'pending' | 'inactive'` - Status for indicator
- `clickable?: boolean` - Enable click events (default: false)
- `class?: string` - Custom classes
- `ariaLabel?: string` - ARIA label

**Slots:**
- `indicator` - Custom indicator (defaults to VrlListRowIndicator if status provided)
- `content` - Main content area
- `stats` - Statistics section
- `action` - Action buttons/icons

**Events:**
- `click` - Emitted when row is clicked (only if clickable=true)

### VrlListRowIndicator

Vertical status bar.

**Props:**
- `status: 'active' | 'pending' | 'inactive'` - Status type (required)
- `height?: string | number` - Height (default: '40px')
- `width?: string | number` - Width (default: '4px')
- `class?: string` - Custom classes

### VrlListRowContent

Title and subtitle display.

**Props:**
- `title: string` - Main title (required)
- `subtitle?: string` - Subtitle text
- `class?: string` - Custom classes

**Slots:**
- `title` - Custom title rendering
- `subtitle` - Custom subtitle rendering

### VrlListRowStats

Container for multiple stats.

**Props:**
- `gap?: string | number` - Gap between stats (default: '1.5rem')
- `class?: string` - Custom classes

### VrlListRowStat

Individual statistic with Orbitron font.

**Props:**
- `value: string | number` - Stat value (required)
- `label: string` - Stat label (required)
- `valueColor?: 'cyan' | 'orange' | 'green' | 'red' | 'purple'` - Color variant
- `class?: string` - Custom classes

**Slots:**
- `value` - Custom value rendering
- `label` - Custom label rendering

### VrlListRowAction

Action container that appears on hover.

**Props:**
- `class?: string` - Custom classes

## Status Colors

- **active** - Green indicator (var(--green))
- **pending** - Orange indicator (var(--orange))
- **inactive** - Muted gray indicator (var(--text-muted))

## Accessibility Features

- Semantic HTML with proper ARIA roles (`role="list"`, `role="listitem"`, `role="status"`)
- Full keyboard navigation support (Tab, Enter, Space)
- Clear focus visible states
- Screen reader friendly with descriptive ARIA labels
- Respects `prefers-reduced-motion` for users with motion sensitivity

## Responsive Behavior

- Stats automatically hide on tablets (max-width: 768px)
- Reduced padding on mobile devices (max-width: 640px)
- Smaller indicators on mobile (3px × 32px)
- Touch-friendly tap targets

## Design Tokens

The components use the following CSS variables:

```css
--bg-card: Card background
--bg-elevated: Elevated/hover background
--border: Default border color
--text-primary: Primary text color
--text-secondary: Secondary text color
--text-muted: Muted text color
--cyan: Primary accent color
--green: Success/active color
--orange: Warning/pending color
--font-display: Orbitron font for stats and labels
--font-body: Inter font for body text
--radius: Border radius
--transition: Animation timing
```

## Advanced Examples

### Custom Indicator

```vue
<VrlListRow clickable @click="handleClick">
  <template #indicator>
    <div class="custom-indicator">
      <img src="/icon.png" alt="Custom icon" />
    </div>
  </template>
  <!-- ... other slots ... -->
</VrlListRow>
```

### Custom Content with Slots

```vue
<VrlListRowContent>
  <template #title>
    <div class="flex items-center gap-2">
      <span class="text-cyan">★</span>
      <strong>Featured Season</strong>
    </div>
  </template>
  <template #subtitle>
    <span class="text-orange">Starting soon!</span>
  </template>
</VrlListRowContent>
```

### Multiple Actions

```vue
<VrlListRowAction>
  <div class="flex gap-2">
    <button class="btn btn-sm btn-ghost">Edit</button>
    <button class="btn btn-sm btn-ghost">Delete</button>
  </div>
</VrlListRowAction>
```

## Testing

All components have comprehensive unit tests. Run tests with:

```bash
npm test -- --run resources/public/js/components/common/lists
```

Test coverage: 77 tests across 8 components.
