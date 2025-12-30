# List Components Usage Examples

## Basic Usage

```vue
<script setup lang="ts">
import {
  ListContainer,
  ListSectionHeader,
  ListRow,
  ListRowStats,
  ListRowStat,
} from '@app/components/common/lists';

const races = [
  { id: 1, name: 'Monaco Grand Prix', status: 'completed', laps: 78, duration: '1:45:32' },
  { id: 2, name: 'Silverstone Circuit', status: 'active', laps: 52, duration: '1:32:15' },
  { id: 3, name: 'Spa-Francorchamps', status: 'upcoming', laps: 44, duration: 'TBA' },
];
</script>

<template>
  <ListContainer aria-label="Race list">
    <!-- Section Header -->
    <ListSectionHeader title="Season Races" />

    <!-- List Items -->
    <ListRow
      v-for="race in races"
      :key="race.id"
      :status="race.status"
      clickable
      @click="viewRace(race.id)"
    >
      <!-- Main Content -->
      <div class="flex flex-col gap-1">
        <h3 class="text-base font-semibold text-[var(--text-primary)]">
          {{ race.name }}
        </h3>
        <p class="text-sm text-[var(--text-secondary)]">
          Round {{ race.id }}
        </p>
      </div>

      <!-- Stats Slot -->
      <template #stats>
        <ListRowStats>
          <ListRowStat :value="race.laps" label="Laps" />
          <ListRowStat :value="race.duration" label="Duration" />
        </ListRowStats>
      </template>
    </ListRow>
  </ListContainer>
</template>
```

## Custom Indicator

```vue
<template>
  <ListRow>
    <!-- Custom Indicator -->
    <template #indicator>
      <div class="w-2 h-2 rounded-full bg-blue-500" />
    </template>

    <div>Custom indicator content</div>
  </ListRow>
</template>
```

## With Action Buttons

```vue
<template>
  <ListRow status="active">
    <div>Race name</div>

    <!-- Action Slot -->
    <template #action>
      <button class="px-3 py-1 rounded bg-[var(--cyan)] text-white">
        View Details
      </button>
    </template>
  </ListRow>
</template>
```

## Non-Clickable Row (No Hover Effect)

```vue
<template>
  <ListRow status="completed" no-hover>
    <div>Static content - no hover or click</div>
  </ListRow>
</template>
```

## Custom Stats with Slots

```vue
<template>
  <ListRow>
    <div>Content</div>

    <template #stats>
      <ListRowStats gap="32px">
        <ListRowStat value="15" label="Drivers">
          <!-- Custom value rendering -->
          <template #value>
            <span class="text-green-500">15</span>
          </template>
        </ListRowStat>
        <ListRowStat value="100" label="Points" />
      </ListRowStats>
    </template>
  </ListRow>
</template>
```

## Multiple Sections

```vue
<template>
  <ListContainer gap="16px">
    <!-- Active Section -->
    <ListSectionHeader title="Active Rounds" />
    <ListRow v-for="race in activeRaces" :key="race.id" status="active">
      {{ race.name }}
    </ListRow>

    <!-- Upcoming Section -->
    <ListSectionHeader title="Upcoming Rounds" class="mt-6" />
    <ListRow v-for="race in upcomingRaces" :key="race.id" status="upcoming">
      {{ race.name }}
    </ListRow>
  </ListContainer>
</template>
```

## Accessibility Features

All components include proper ARIA attributes:

- `ListContainer`: `role="list"`
- `ListRow`: `role="listitem"`, keyboard navigation (Tab, Enter, Space)
- `ListRowIndicator`: `role="status"` with status label
- `ListRowStats` and `ListRowStat`: `role="group"` with descriptive labels

## Available Status Types

- `active` - Green with glow
- `upcoming` - Cyan
- `completed` - Muted gray
- `pending` - Orange
- `inactive` - Border color

## CSS Variables Used

These components use the following CSS variables from the design system:

- `--text-primary` - Primary text color
- `--text-secondary` - Secondary text color
- `--text-muted` - Muted text color
- `--bg-card` - Card background
- `--border` - Border color
- `--cyan` - Cyan accent
- `--green` - Green status
- `--orange` - Orange status
- `--font-mono` - Monospace font
- `--radius` - Border radius

## Reduced Motion Support

All components respect user preferences for reduced motion via:
```css
motion-reduce:transition-none
motion-reduce:transform-none
```
