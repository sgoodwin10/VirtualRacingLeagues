# MetricCard Component - Implementation Specification

## Component: `MetricCard.vue`

The MetricCard component displays KPI (Key Performance Indicator) data with a colored top accent bar, icon, label, value, and optional change indicator. It's designed for dashboard metrics and statistics.

## Component API

### Props

```typescript
interface MetricCardProps {
  label: string;                          // Metric label (e.g., "Drivers", "Teams")
  value: string | number;                 // Metric value (e.g., "20", "5,420")
  change?: string;                        // Change indicator (e.g., "+2 active", "63.6% complete")
  changeDirection?: ChangeDirection;      // Change direction: 'positive' | 'negative' | 'neutral'
  icon?: Component;                       // Phosphor icon component
  variant?: MetricVariant;                // Visual variant: 'default' | 'green' | 'orange' | 'purple' | 'red'
  class?: string;                         // Additional CSS classes
}
```

### Slots

```typescript
{
  'full-content'?: () => VNode[];  // Replaces ALL content (keeps accent bar), use for completely custom layouts
  'half-content'?: () => VNode[];  // Replaces value + change (keeps header), use for custom bottom section
  icon?: () => VNode[];            // Custom icon content
  label?: () => VNode[];           // Custom label content
  value?: () => VNode[];           // Custom value content
  change?: () => VNode[];          // Custom change indicator content
}
```

**Slot Priority:**
1. If `full-content` is provided, only render that (+ accent bar)
2. Else render header (label + icon), then check for `half-content`
3. If `half-content` is provided, render that instead of value + change
4. Else render normal value/change slots

### Events

None (metric cards are display-only)

## HTML Structure from Design

```html
<!-- Default Variant (Cyan) -->
<div class="metric-card">
  <div class="metric-header">
    <span class="metric-label">Drivers</span>
    <div class="metric-icon">
      <svg><!-- user icon --></svg>
    </div>
  </div>
  <div class="metric-value">20</div>
  <div class="metric-change">
    <svg><!-- up arrow --></svg>
    +2 active
  </div>
</div>

<!-- Green Variant -->
<div class="metric-card green">
  <div class="metric-header">
    <span class="metric-label">Teams</span>
    <div class="metric-icon">
      <svg><!-- users icon --></svg>
    </div>
  </div>
  <div class="metric-value">10</div>
  <div class="metric-change">Full grid</div>
</div>

<!-- Orange Variant -->
<div class="metric-card orange">
  <div class="metric-header">
    <span class="metric-label">Races</span>
    <div class="metric-icon">
      <svg><!-- clock icon --></svg>
    </div>
  </div>
  <div class="metric-value">14/22</div>
  <div class="metric-change">63.6% complete</div>
</div>
```

## CSS Classes from Design

```css
.metric-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  position: relative;
}

.metric-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--cyan);
  border-radius: var(--radius) var(--radius) 0 0;
}

.metric-card.green::before { background: var(--green); }
.metric-card.orange::before { background: var(--orange); }
.metric-card.purple::before { background: var(--purple); }
.metric-card.red::before { background: var(--red); }

.metric-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.metric-label {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text-muted);
}

.metric-icon {
  width: 28px;
  height: 28px;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--cyan-dim);
  color: var(--cyan);
}

.metric-card.green .metric-icon { background: var(--green-dim); color: var(--green); }
.metric-card.orange .metric-icon { background: var(--orange-dim); color: var(--orange); }
.metric-card.purple .metric-icon { background: var(--purple-dim); color: var(--purple); }
.metric-card.red .metric-icon { background: var(--red-dim); color: var(--red); }

.metric-icon svg { width: 14px; height: 14px; }

.metric-value {
  font-family: var(--font-mono);
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1;
}

.metric-change {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--green);
}

.metric-change.negative { color: var(--red); }
.metric-change svg { width: 12px; height: 12px; }
```

## Tailwind Implementation

The top accent bar requires scoped CSS (::before pseudo-element). Other styles use Tailwind:

```typescript
// Container (with scoped CSS for ::before)
<div class="
  metric-card                // Custom class for ::before pseudo-element
  metric-card--{variant}     // Variant class for accent color
  bg-card                    // background: var(--bg-card)
  border                     // border: 1px solid
  border-[var(--border)]     // border-color: var(--border)
  rounded-[var(--radius)]    // border-radius: var(--radius)
  p-4                        // padding: 16px
  relative                   // position: relative (for ::before)
">

// Header
<div class="
  flex                       // display: flex
  items-center               // align-items: center
  justify-between            // justify-content: space-between
  mb-2                       // margin-bottom: 8px
">

// Label
<span class="
  font-mono                  // font-family: var(--font-mono)
  text-xs                    // font-size: 10px
  font-semibold              // font-weight: 600
  tracking-widest            // letter-spacing: 1px
  uppercase                  // text-transform: uppercase
  text-[var(--text-muted)]   // color: var(--text-muted)
">

// Icon container
<div class="
  w-7 h-7                    // width: 28px, height: 28px
  rounded-[var(--radius)]    // border-radius: var(--radius)
  flex                       // display: flex
  items-center               // align-items: center
  justify-center             // justify-content: center
  metric-icon--{variant}     // Background and color via scoped CSS
">

// Value
<div class="
  font-mono                  // font-family: var(--font-mono)
  text-[28px]                // font-size: 28px
  font-semibold              // font-weight: 600
  text-[var(--text-primary)] // color: var(--text-primary)
  leading-none               // line-height: 1
">

// Change indicator
<div class="
  flex                       // display: flex
  items-center               // align-items: center
  gap-1                      // gap: 4px
  mt-1.5                     // margin-top: 6px
  font-mono                  // font-family: var(--font-mono)
  text-[11px]                // font-size: 11px
  metric-change--{direction} // Color via scoped CSS
">
```

## Implementation

### File: `MetricCard.vue`

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { PhArrowUp, PhArrowDown } from '@phosphor-icons/vue';
import type { MetricCardProps } from './types';

const props = withDefaults(defineProps<MetricCardProps>(), {
  variant: 'default',
  changeDirection: 'neutral',
});

/**
 * Determine which icon to show for change direction
 */
const changeIcon = computed(() => {
  if (props.changeDirection === 'positive') return PhArrowUp;
  if (props.changeDirection === 'negative') return PhArrowDown;
  return null;
});

/**
 * Format the value for display
 */
const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.value.toLocaleString();
  }
  return props.value;
});
</script>

<template>
  <div
    :class="[
      'metric-card',
      `metric-card--${variant}`,
      'bg-card border border-[var(--border)] rounded-[var(--radius)] p-4 relative',
      props.class,
    ]"
    role="region"
    :aria-label="`${label}: ${formattedValue}`"
  >
    <!-- Full Content Slot: Replaces everything except accent bar -->
    <slot name="full-content">
      <!-- Header: Label + Icon -->
      <div class="flex items-center justify-between mb-2">
        <!-- Label -->
        <slot name="label">
          <span class="font-mono text-xs font-semibold tracking-widest uppercase text-[var(--text-muted)]">
            {{ label }}
          </span>
        </slot>

        <!-- Icon -->
        <slot name="icon">
          <div
            v-if="icon"
            :class="[
              'w-7 h-7 rounded-[var(--radius)] flex items-center justify-center',
              `metric-icon--${variant}`,
            ]"
            aria-hidden="true"
          >
            <component :is="icon" :size="14" weight="regular" />
          </div>
        </slot>
      </div>

      <!-- Half Content Slot: Replaces value + change -->
      <slot name="half-content">
        <!-- Value -->
        <slot name="value">
          <div class="font-mono text-[28px] font-semibold text-[var(--text-primary)] leading-none">
            {{ formattedValue }}
          </div>
        </slot>

        <!-- Change Indicator -->
        <slot name="change">
          <div
            v-if="change"
            :class="[
              'flex items-center gap-1 mt-1.5 font-mono text-[11px]',
              `metric-change--${changeDirection}`,
            ]"
          >
            <component
              v-if="changeIcon"
              :is="changeIcon"
              :size="12"
              weight="regular"
              aria-hidden="true"
            />
            {{ change }}
          </div>
        </slot>
      </slot>
    </slot>
  </div>
</template>

<style scoped>
/* Top accent bar - requires pseudo-element */
.metric-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  border-radius: var(--radius) var(--radius) 0 0;
}

/* Variant-specific accent colors */
.metric-card--default::before {
  background: var(--cyan);
}
.metric-card--green::before {
  background: var(--green);
}
.metric-card--orange::before {
  background: var(--orange);
}
.metric-card--purple::before {
  background: var(--purple);
}
.metric-card--red::before {
  background: var(--red);
}

/* Icon background and color by variant */
.metric-icon--default {
  background: var(--cyan-dim);
  color: var(--cyan);
}
.metric-icon--green {
  background: var(--green-dim);
  color: var(--green);
}
.metric-icon--orange {
  background: var(--orange-dim);
  color: var(--orange);
}
.metric-icon--purple {
  background: var(--purple-dim);
  color: var(--purple);
}
.metric-icon--red {
  background: var(--red-dim);
  color: var(--red);
}

/* Change indicator colors by direction */
.metric-change--positive {
  color: var(--green);
}
.metric-change--negative {
  color: var(--red);
}
.metric-change--neutral {
  color: var(--text-muted);
}
</style>
```

## Usage Examples

### Basic Metric Card

```vue
<MetricCard
  label="Drivers"
  :value="20"
  variant="default"
  :icon="PhUser"
/>
```

### Metric Card with Positive Change

```vue
<MetricCard
  label="Drivers"
  :value="20"
  change="+2 active"
  change-direction="positive"
  :icon="PhUser"
  variant="default"
/>
```

### Metric Card with Negative Change

```vue
<MetricCard
  label="Errors"
  :value="5"
  change="-2 from last week"
  change-direction="negative"
  :icon="PhWarning"
  variant="red"
/>
```

### Metric Card with Neutral Change

```vue
<MetricCard
  label="Teams"
  :value="10"
  change="Full grid"
  change-direction="neutral"
  :icon="PhUsers"
  variant="green"
/>
```

### All Variants

```vue
<div class="grid grid-cols-4 gap-5">
  <MetricCard
    label="Drivers"
    :value="20"
    change="+2 active"
    change-direction="positive"
    :icon="PhUser"
    variant="default"
  />

  <MetricCard
    label="Teams"
    :value="10"
    change="Full grid"
    :icon="PhUsers"
    variant="green"
  />

  <MetricCard
    label="Races"
    :value="'14/22'"
    change="63.6% complete"
    :icon="PhClock"
    variant="orange"
  />

  <MetricCard
    label="Points"
    :value="5420"
    change="+387 last race"
    change-direction="positive"
    :icon="PhChartBar"
    variant="purple"
  />
</div>
```

### Full Content Slot - Completely Custom Layout

```vue
<MetricCard
  label="Active Users"
  :value="0"
  variant="purple"
>
  <template #full-content>
    <div class="flex flex-col gap-3">
      <!-- Custom header with status badge -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="font-mono text-xs font-semibold tracking-widest uppercase text-[var(--text-muted)]">
            System Status
          </span>
          <span class="px-2 py-0.5 text-[10px] font-mono font-semibold bg-[var(--green-dim)] text-[var(--green)] rounded">
            ONLINE
          </span>
        </div>
        <PhActivity :size="14" class="text-[var(--purple)]" />
      </div>

      <!-- Custom multi-value display -->
      <div class="grid grid-cols-2 gap-3">
        <div>
          <div class="font-mono text-xs text-[var(--text-muted)] mb-1">CPU</div>
          <div class="font-mono text-lg font-semibold text-[var(--text-primary)]">45%</div>
        </div>
        <div>
          <div class="font-mono text-xs text-[var(--text-muted)] mb-1">Memory</div>
          <div class="font-mono text-lg font-semibold text-[var(--text-primary)]">62%</div>
        </div>
      </div>

      <!-- Custom footer -->
      <div class="font-mono text-[10px] text-[var(--text-muted)]">
        Last updated 2 min ago
      </div>
    </div>
  </template>
</MetricCard>
```

### Half Content Slot - Progress Bar Example

```vue
<script setup lang="ts">
import { computed } from 'vue';

const completed = 14;
const total = 22;
const percentage = computed(() => Math.round((completed / total) * 100));
</script>

<template>
  <MetricCard
    label="Season Progress"
    :value="0"
    :icon="PhTrophy"
    variant="orange"
  >
    <template #half-content>
      <!-- Race completion display -->
      <div class="flex items-baseline gap-2 mb-3">
        <span class="font-mono text-[28px] font-semibold text-[var(--text-primary)] leading-none">
          {{ completed }}
        </span>
        <span class="font-mono text-sm text-[var(--text-muted)]">
          / {{ total }} races
        </span>
      </div>

      <!-- Progress bar -->
      <div class="space-y-1.5">
        <div class="h-1.5 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
          <div
            class="h-full bg-[var(--orange)] transition-all duration-300"
            :style="{ width: `${percentage}%` }"
          />
        </div>
        <div class="font-mono text-[11px] text-[var(--text-muted)]">
          {{ percentage }}% complete
        </div>
      </div>
    </template>
  </MetricCard>
</template>
```

### Half Content Slot - Mini Sparkline Chart

```vue
<script setup lang="ts">
import { computed } from 'vue';

const dataPoints = [12, 15, 13, 18, 20, 17, 22, 20];
const current = computed(() => dataPoints[dataPoints.length - 1]);
const previous = computed(() => dataPoints[dataPoints.length - 2]);
const change = computed(() => current.value - previous.value);
const trend = computed(() => (change.value > 0 ? 'up' : change.value < 0 ? 'down' : 'stable'));

// Simple SVG path generation for sparkline
const sparklinePath = computed(() => {
  const width = 120;
  const height = 32;
  const max = Math.max(...dataPoints);
  const min = Math.min(...dataPoints);
  const range = max - min || 1;

  const points = dataPoints.map((value, index) => {
    const x = (index / (dataPoints.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  });

  return `M ${points.join(' L ')}`;
});
</script>

<template>
  <MetricCard
    label="Active Drivers"
    :value="0"
    :icon="PhTrendUp"
    variant="default"
  >
    <template #half-content>
      <!-- Current value -->
      <div class="flex items-baseline gap-2 mb-3">
        <span class="font-mono text-[28px] font-semibold text-[var(--text-primary)] leading-none">
          {{ current }}
        </span>
        <span
          :class="[
            'flex items-center gap-0.5 font-mono text-[11px]',
            trend === 'up' ? 'text-[var(--green)]' : trend === 'down' ? 'text-[var(--red)]' : 'text-[var(--text-muted)]'
          ]"
        >
          <PhArrowUp v-if="trend === 'up'" :size="10" />
          <PhArrowDown v-if="trend === 'down'" :size="10" />
          {{ Math.abs(change) }}
        </span>
      </div>

      <!-- Sparkline SVG -->
      <svg viewBox="0 0 120 32" class="w-full h-8">
        <path
          :d="sparklinePath"
          fill="none"
          stroke="var(--cyan)"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <!-- Gradient fill under line -->
        <defs>
          <linearGradient id="sparkline-gradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="var(--cyan)" stop-opacity="0.2" />
            <stop offset="100%" stop-color="var(--cyan)" stop-opacity="0" />
          </linearGradient>
        </defs>
        <path
          :d="`${sparklinePath} L 120,32 L 0,32 Z`"
          fill="url(#sparkline-gradient)"
        />
      </svg>

      <div class="font-mono text-[10px] text-[var(--text-muted)] mt-1">
        Last 8 weeks trend
      </div>
    </template>
  </MetricCard>
</template>
```

### Half Content Slot - Stacked Values

```vue
<MetricCard
  label="League Stats"
  :value="0"
  :icon="PhChartBar"
  variant="green"
>
  <template #half-content>
    <div class="space-y-2">
      <!-- Active seasons -->
      <div class="flex items-center justify-between">
        <span class="font-mono text-xs text-[var(--text-muted)]">Active Seasons</span>
        <span class="font-mono text-lg font-semibold text-[var(--text-primary)]">3</span>
      </div>

      <!-- Total drivers -->
      <div class="flex items-center justify-between">
        <span class="font-mono text-xs text-[var(--text-muted)]">Total Drivers</span>
        <span class="font-mono text-lg font-semibold text-[var(--text-primary)]">48</span>
      </div>

      <!-- Divider -->
      <div class="border-t border-[var(--border)]" />

      <!-- Races this week -->
      <div class="flex items-center justify-between">
        <span class="font-mono text-xs text-[var(--text-muted)]">Races This Week</span>
        <span class="font-mono text-base font-semibold text-[var(--green)]">5</span>
      </div>
    </div>
  </template>
</MetricCard>
```

## Accessibility

### ARIA Attributes

```vue
<div
  role="region"
  :aria-label="`${label}: ${formattedValue}`"
>
```

### Semantic HTML

- Use `role="region"` for the metric card container
- Include descriptive `aria-label` combining label and value
- Icons are decorative with `aria-hidden="true"`

### Screen Reader Support

- Metric label and value are announced together
- Change indicator is read as additional context
- Icons are hidden from screen readers (decorative only)

### Color Contrast

- All text meets WCAG AA contrast requirements
- Accent bar is decorative only (no information conveyed by color alone)
- Change direction is indicated by icon + text, not just color

## Testing Specification

### File: `__tests__/MetricCard.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MetricCard from '@app/components/common/cards/MetricCard.vue';
import { PhUser, PhUsers } from '@phosphor-icons/vue';

describe('MetricCard', () => {
  it('renders with required props', () => {
    const wrapper = mount(MetricCard, {
      props: {
        label: 'Drivers',
        value: 20,
      },
    });
    expect(wrapper.text()).toContain('Drivers');
    expect(wrapper.text()).toContain('20');
  });

  it('renders icon when provided', () => {
    const wrapper = mount(MetricCard, {
      props: {
        label: 'Drivers',
        value: 20,
        icon: PhUser,
      },
    });
    expect(wrapper.findComponent(PhUser).exists()).toBe(true);
  });

  it('renders change indicator when provided', () => {
    const wrapper = mount(MetricCard, {
      props: {
        label: 'Drivers',
        value: 20,
        change: '+2 active',
      },
    });
    expect(wrapper.text()).toContain('+2 active');
  });

  it('shows positive change icon', () => {
    const wrapper = mount(MetricCard, {
      props: {
        label: 'Drivers',
        value: 20,
        change: '+2 active',
        changeDirection: 'positive',
      },
    });
    expect(wrapper.find('.metric-change--positive').exists()).toBe(true);
  });

  it('shows negative change icon', () => {
    const wrapper = mount(MetricCard, {
      props: {
        label: 'Drivers',
        value: 20,
        change: '-2 inactive',
        changeDirection: 'negative',
      },
    });
    expect(wrapper.find('.metric-change--negative').exists()).toBe(true);
  });

  it('applies default variant class', () => {
    const wrapper = mount(MetricCard, {
      props: {
        label: 'Drivers',
        value: 20,
        variant: 'default',
      },
    });
    expect(wrapper.find('.metric-card--default').exists()).toBe(true);
  });

  it('applies all variant classes correctly', () => {
    const variants = ['default', 'green', 'orange', 'purple', 'red'] as const;

    variants.forEach((variant) => {
      const wrapper = mount(MetricCard, {
        props: {
          label: 'Test',
          value: 10,
          variant,
        },
      });
      expect(wrapper.find(`.metric-card--${variant}`).exists()).toBe(true);
    });
  });

  it('formats numeric values with locale', () => {
    const wrapper = mount(MetricCard, {
      props: {
        label: 'Points',
        value: 5420,
      },
    });
    expect(wrapper.text()).toContain('5,420');
  });

  it('displays string values as-is', () => {
    const wrapper = mount(MetricCard, {
      props: {
        label: 'Races',
        value: '14/22',
      },
    });
    expect(wrapper.text()).toContain('14/22');
  });

  it('applies custom classes', () => {
    const wrapper = mount(MetricCard, {
      props: {
        label: 'Test',
        value: 10,
        class: 'custom-class',
      },
    });
    expect(wrapper.find('.custom-class').exists()).toBe(true);
  });

  it('has accessible role and label', () => {
    const wrapper = mount(MetricCard, {
      props: {
        label: 'Drivers',
        value: 20,
      },
    });
    expect(wrapper.attributes('role')).toBe('region');
    expect(wrapper.attributes('aria-label')).toBe('Drivers: 20');
  });

  it('hides icons from screen readers', () => {
    const wrapper = mount(MetricCard, {
      props: {
        label: 'Drivers',
        value: 20,
        icon: PhUser,
        change: '+2',
        changeDirection: 'positive',
      },
    });
    const iconContainers = wrapper.findAll('[aria-hidden="true"]');
    expect(iconContainers.length).toBeGreaterThan(0);
  });

  it('renders label slot content', () => {
    const wrapper = mount(MetricCard, {
      props: {
        label: 'Drivers',
        value: 20,
      },
      slots: {
        label: '<span class="custom-label">Custom Label</span>',
      },
    });
    expect(wrapper.find('.custom-label').exists()).toBe(true);
  });

  it('renders value slot content', () => {
    const wrapper = mount(MetricCard, {
      props: {
        label: 'Drivers',
        value: 20,
      },
      slots: {
        value: '<span class="custom-value">100</span>',
      },
    });
    expect(wrapper.find('.custom-value').exists()).toBe(true);
  });

  it('renders change slot content', () => {
    const wrapper = mount(MetricCard, {
      props: {
        label: 'Drivers',
        value: 20,
      },
      slots: {
        change: '<span class="custom-change">+5</span>',
      },
    });
    expect(wrapper.find('.custom-change').exists()).toBe(true);
  });

  describe('full-content slot', () => {
    it('renders full-content slot when provided', () => {
      const wrapper = mount(MetricCard, {
        props: {
          label: 'Test',
          value: 20,
        },
        slots: {
          'full-content': '<div class="custom-full-content">Fully custom content</div>',
        },
      });
      expect(wrapper.find('.custom-full-content').exists()).toBe(true);
      expect(wrapper.text()).toContain('Fully custom content');
    });

    it('replaces all default content when full-content slot is used', () => {
      const wrapper = mount(MetricCard, {
        props: {
          label: 'Drivers',
          value: 20,
          change: '+2 active',
          icon: PhUser,
        },
        slots: {
          'full-content': '<div class="custom-content">Custom</div>',
        },
      });

      // Should not render default label, value, or change
      expect(wrapper.text()).not.toContain('Drivers');
      expect(wrapper.text()).not.toContain('20');
      expect(wrapper.text()).not.toContain('+2 active');

      // Should render custom content
      expect(wrapper.find('.custom-content').exists()).toBe(true);
    });

    it('keeps accent bar when using full-content slot', () => {
      const wrapper = mount(MetricCard, {
        props: {
          label: 'Test',
          value: 20,
          variant: 'green',
        },
        slots: {
          'full-content': '<div>Custom</div>',
        },
      });

      // Accent bar classes should still exist
      expect(wrapper.find('.metric-card--green').exists()).toBe(true);
    });
  });

  describe('half-content slot', () => {
    it('renders half-content slot when provided', () => {
      const wrapper = mount(MetricCard, {
        props: {
          label: 'Season',
          value: 20,
        },
        slots: {
          'half-content': '<div class="custom-half-content">Custom bottom</div>',
        },
      });
      expect(wrapper.find('.custom-half-content').exists()).toBe(true);
      expect(wrapper.text()).toContain('Custom bottom');
    });

    it('keeps header when half-content slot is used', () => {
      const wrapper = mount(MetricCard, {
        props: {
          label: 'Drivers',
          value: 20,
          icon: PhUser,
        },
        slots: {
          'half-content': '<div class="custom-bottom">Custom</div>',
        },
      });

      // Should render label and icon
      expect(wrapper.text()).toContain('Drivers');
      expect(wrapper.findComponent(PhUser).exists()).toBe(true);

      // Should render custom bottom
      expect(wrapper.find('.custom-bottom').exists()).toBe(true);
    });

    it('replaces value and change when half-content slot is used', () => {
      const wrapper = mount(MetricCard, {
        props: {
          label: 'Drivers',
          value: 20,
          change: '+2 active',
          changeDirection: 'positive',
        },
        slots: {
          'half-content': '<div class="custom-bottom">Progress bar here</div>',
        },
      });

      // Should not render default value or change
      expect(wrapper.text()).not.toContain('20');
      expect(wrapper.text()).not.toContain('+2 active');

      // Should render custom content
      expect(wrapper.text()).toContain('Progress bar here');
    });

    it('half-content slot works with label and icon slots', () => {
      const wrapper = mount(MetricCard, {
        props: {
          label: 'Default Label',
          value: 20,
        },
        slots: {
          label: '<span class="custom-label">Custom Label</span>',
          icon: '<div class="custom-icon">Icon</div>',
          'half-content': '<div class="custom-bottom">Bottom</div>',
        },
      });

      expect(wrapper.find('.custom-label').exists()).toBe(true);
      expect(wrapper.find('.custom-icon').exists()).toBe(true);
      expect(wrapper.find('.custom-bottom').exists()).toBe(true);
    });
  });

  describe('slot priority', () => {
    it('full-content slot takes priority over half-content', () => {
      const wrapper = mount(MetricCard, {
        props: {
          label: 'Test',
          value: 20,
        },
        slots: {
          'full-content': '<div class="full">Full content</div>',
          'half-content': '<div class="half">Half content</div>',
        },
      });

      expect(wrapper.find('.full').exists()).toBe(true);
      expect(wrapper.find('.half').exists()).toBe(false);
    });

    it('full-content slot takes priority over other slots', () => {
      const wrapper = mount(MetricCard, {
        props: {
          label: 'Test',
          value: 20,
        },
        slots: {
          'full-content': '<div class="full">Full</div>',
          label: '<span class="label">Label</span>',
          value: '<span class="value">Value</span>',
          change: '<span class="change">Change</span>',
        },
      });

      expect(wrapper.find('.full').exists()).toBe(true);
      expect(wrapper.find('.label').exists()).toBe(false);
      expect(wrapper.find('.value').exists()).toBe(false);
      expect(wrapper.find('.change').exists()).toBe(false);
    });

    it('half-content slot takes priority over value and change slots', () => {
      const wrapper = mount(MetricCard, {
        props: {
          label: 'Test',
          value: 20,
        },
        slots: {
          'half-content': '<div class="half">Half</div>',
          value: '<span class="value">Value</span>',
          change: '<span class="change">Change</span>',
        },
      });

      expect(wrapper.find('.half').exists()).toBe(true);
      expect(wrapper.find('.value').exists()).toBe(false);
      expect(wrapper.find('.change').exists()).toBe(false);
    });
  });
});
```

## Performance Considerations

1. **Number Formatting**: `toLocaleString()` is called once per render
2. **Icon Components**: Lazy loaded with tree-shaking
3. **Scoped CSS**: Minimal - only for pseudo-element styling
4. **Computed Properties**: Simple, no heavy calculations

## Design Rationale

### Why Scoped CSS for Accent Bar?

The top accent bar uses a `::before` pseudo-element which cannot be styled with Tailwind utilities. This is the only use of scoped CSS in the component.

### Why Separate Change Direction Prop?

Separating `change` (text) from `changeDirection` (visual indicator) provides flexibility:
- Change text can be any descriptive string
- Direction controls icon and color
- Not all changes need directional indicators

### Why Allow String or Number for Value?

Some metrics are numeric (20), some are ratios (14/22), and some are formatted text. Supporting both types provides maximum flexibility.

### Why Add `full-content` and `half-content` Slots?

These slots provide progressive levels of customization while maintaining the MetricCard's visual identity:

**When to use `full-content` slot:**
- You need a completely custom layout inside the card
- The metric doesn't fit the standard label/value/change pattern
- You want to display multiple related metrics in one card
- Examples: System status with multiple indicators, multi-value displays, custom data visualizations

**When to use `half-content` slot:**
- You want to keep the standard header (label + icon) but customize the bottom section
- You need to show progress bars, charts, or custom formatted data
- You want to maintain consistency in header styling across cards
- Examples: Progress indicators, sparkline charts, stacked values, comparison displays

**When to use standard value/change slots:**
- Simple customization of individual parts (e.g., formatting, icons)
- You want to keep the overall structure intact
- Examples: Custom number formatting, additional badges, custom change indicators

**Slot priority rationale:**
The priority system ensures predictable behavior:
1. `full-content` completely overrides everything (most specific)
2. `half-content` keeps the header, overrides bottom section (moderately specific)
3. Individual slots (`value`, `change`) provide fine-grained control (least specific)

This approach follows the principle of "progressive enhancement" - start with the standard component, then customize as needed without breaking the design system.
