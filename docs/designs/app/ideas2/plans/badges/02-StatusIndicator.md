# StatusIndicator Component Specification

> **Priority**: 1 (Foundation)
> **Location**: `resources/app/js/components/common/indicators/StatusIndicator.vue`

## Overview

A specialized badge for displaying system states with an optional status dot indicator. This is the most frequently used indicator component.

## Design Reference

From `badges.html`:
```css
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
  background: currentColor;
}
```

## Props Interface

```typescript
type StatusType =
  | 'active'
  | 'success'
  | 'pending'
  | 'warning'
  | 'inactive'
  | 'offline'
  | 'error'
  | 'failed'
  | 'completed'
  | 'scheduled';

interface StatusIndicatorProps {
  /**
   * Status type - determines color and default label
   * @default 'inactive'
   */
  status?: StatusType;

  /**
   * Show status dot indicator
   * @default true
   */
  showDot?: boolean;

  /**
   * Custom label (auto-generated from status if omitted)
   */
  label?: string;

  /**
   * Size variant
   * @default 'md'
   */
  size?: 'sm' | 'md';

  /**
   * Transform label to uppercase
   * @default false
   */
  uppercase?: boolean;
}
```

## Status Mapping

```typescript
const STATUS_CONFIG = {
  // Success states (green)
  active: { color: 'green', defaultLabel: 'Active' },
  success: { color: 'green', defaultLabel: 'Success' },
  completed: { color: 'green', defaultLabel: 'Completed' },

  // Warning states (orange)
  pending: { color: 'orange', defaultLabel: 'Pending' },
  warning: { color: 'orange', defaultLabel: 'Warning' },
  scheduled: { color: 'orange', defaultLabel: 'Scheduled' },

  // Neutral states (muted)
  inactive: { color: 'muted', defaultLabel: 'Inactive' },
  offline: { color: 'muted', defaultLabel: 'Offline' },

  // Error states (red)
  error: { color: 'red', defaultLabel: 'Error' },
  failed: { color: 'red', defaultLabel: 'Failed' },
} as const;
```

## Slots

| Slot | Description |
|------|-------------|
| `default` | Override the label content entirely |

## Implementation Template

```vue
<template>
  <span
    :class="[
      'status-indicator',
      `status-indicator--${statusConfig.color}`,
      `status-indicator--${size}`,
      { 'status-indicator--uppercase': uppercase }
    ]"
  >
    <span v-if="showDot" class="status-indicator__dot" />
    <slot>{{ displayLabel }}</slot>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type StatusType =
  | 'active'
  | 'success'
  | 'pending'
  | 'warning'
  | 'inactive'
  | 'offline'
  | 'error'
  | 'failed'
  | 'completed'
  | 'scheduled';

interface Props {
  status?: StatusType;
  showDot?: boolean;
  label?: string;
  size?: 'sm' | 'md';
  uppercase?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  status: 'inactive',
  showDot: true,
  size: 'md',
  uppercase: false,
});

const STATUS_CONFIG = {
  active: { color: 'green', defaultLabel: 'Active' },
  success: { color: 'green', defaultLabel: 'Success' },
  completed: { color: 'green', defaultLabel: 'Completed' },
  pending: { color: 'orange', defaultLabel: 'Pending' },
  warning: { color: 'orange', defaultLabel: 'Warning' },
  scheduled: { color: 'orange', defaultLabel: 'Scheduled' },
  inactive: { color: 'muted', defaultLabel: 'Inactive' },
  offline: { color: 'muted', defaultLabel: 'Offline' },
  error: { color: 'red', defaultLabel: 'Error' },
  failed: { color: 'red', defaultLabel: 'Failed' },
} as const;

const statusConfig = computed(() => STATUS_CONFIG[props.status] ?? STATUS_CONFIG.inactive);
const displayLabel = computed(() => props.label ?? statusConfig.value.defaultLabel);
</script>

<style scoped>
.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-weight: 500;
  border-radius: 4px;
  white-space: nowrap;
}

/* Sizes */
.status-indicator--sm {
  padding: 2px 8px;
  font-size: 10px;
}

.status-indicator--sm .status-indicator__dot {
  width: 5px;
  height: 5px;
}

.status-indicator--md {
  padding: 4px 10px;
  font-size: 11px;
}

/* Dot */
.status-indicator__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

/* Color variants */
.status-indicator--green {
  background: var(--green-dim);
  color: var(--green);
}

.status-indicator--orange {
  background: var(--orange-dim);
  color: var(--orange);
}

.status-indicator--muted {
  background: var(--bg-elevated);
  color: var(--text-muted);
}

.status-indicator--red {
  background: var(--red-dim);
  color: var(--red);
}

/* Modifiers */
.status-indicator--uppercase {
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>
```

## Usage Examples

```vue
<!-- Basic usage -->
<StatusIndicator status="active" />
<StatusIndicator status="pending" />
<StatusIndicator status="inactive" />
<StatusIndicator status="error" />

<!-- Without dot -->
<StatusIndicator status="active" :show-dot="false" />

<!-- Custom label -->
<StatusIndicator status="active" label="Online" />
<StatusIndicator status="pending" label="Processing" />

<!-- Uppercase -->
<StatusIndicator status="active" uppercase />

<!-- Different sizes -->
<StatusIndicator status="active" size="sm" />
<StatusIndicator status="active" size="md" />

<!-- Driver status migration -->
<StatusIndicator
  :status="driver.isActive ? 'active' : 'inactive'"
  :label="driver.isActive ? 'Active' : 'Inactive'"
/>

<!-- Season status migration -->
<StatusIndicator
  :status="seasonStatusMap[season.status]"
  :label="season.status"
  uppercase
/>
```

## Migration Guide

### From DriverStatusBadge

**Before:**
```vue
<DriverStatusBadge :status="driver.status" />
```

**After:**
```vue
<StatusIndicator
  :status="driver.status === 'active' ? 'active' : driver.status === 'banned' ? 'error' : 'inactive'"
  :label="driver.status"
/>
```

### From PrimeVue Chip (SeasonCard)

**Before:**
```vue
<Chip
  :label="season.status"
  :severity="statusSeverity[season.status]"
/>
```

**After:**
```vue
<StatusIndicator
  :status="seasonStatusMap[season.status]"
  :label="season.status"
  uppercase
/>
```

### From LeagueVisibilityTag

**Before:**
```vue
<Tag
  :value="visibility"
  :severity="visibilitySeverity"
/>
```

**After:**
```vue
<StatusIndicator
  :status="visibilityMap[visibility]"
  :label="visibility"
  :show-dot="false"
  uppercase
/>
```

## Test Cases

```typescript
describe('StatusIndicator', () => {
  it('renders with default props', () => {
    const wrapper = mount(StatusIndicator);
    expect(wrapper.classes()).toContain('status-indicator--muted');
    expect(wrapper.text()).toBe('Inactive');
  });

  it('renders all status types', () => {
    const statuses = ['active', 'success', 'pending', 'warning', 'inactive', 'error'];
    statuses.forEach(status => {
      const wrapper = mount(StatusIndicator, { props: { status } });
      expect(wrapper.text()).toBeTruthy();
    });
  });

  it('shows dot by default', () => {
    const wrapper = mount(StatusIndicator, { props: { status: 'active' } });
    expect(wrapper.find('.status-indicator__dot').exists()).toBe(true);
  });

  it('hides dot when showDot is false', () => {
    const wrapper = mount(StatusIndicator, {
      props: { status: 'active', showDot: false }
    });
    expect(wrapper.find('.status-indicator__dot').exists()).toBe(false);
  });

  it('uses custom label when provided', () => {
    const wrapper = mount(StatusIndicator, {
      props: { status: 'active', label: 'Custom' }
    });
    expect(wrapper.text()).toBe('Custom');
  });

  it('applies correct color for each status', () => {
    const colorMap = {
      active: 'green',
      success: 'green',
      pending: 'orange',
      warning: 'orange',
      inactive: 'muted',
      error: 'red',
    };
    Object.entries(colorMap).forEach(([status, color]) => {
      const wrapper = mount(StatusIndicator, { props: { status } });
      expect(wrapper.classes()).toContain(`status-indicator--${color}`);
    });
  });
});
```

## Accessibility

- Uses semantic color + text label (not color alone)
- Status dot is decorative (relies on text for meaning)
- Consider adding `role="status"` for live status updates
- Ensure sufficient color contrast
