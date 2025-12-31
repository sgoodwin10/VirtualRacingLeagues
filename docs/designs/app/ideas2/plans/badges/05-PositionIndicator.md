# PositionIndicator Component Specification

> **Priority**: 2 (Specialized)
> **Location**: `resources/app/js/components/common/indicators/PositionIndicator.vue`

## Overview

Displays racing positions with special podium styling for P1, P2, P3 (gold, silver, bronze).

## Design Reference

From `badges.html`:
```css
.position-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  border-radius: var(--radius);
  background: var(--bg-elevated);
  color: var(--text-secondary);
}

.position-badge.p1 {
  background: var(--yellow);
  color: var(--bg-dark);
}

.position-badge.p2 {
  background: #c0c0c0;
  color: var(--bg-dark);
}

.position-badge.p3 {
  background: #cd7f32;
  color: var(--bg-dark);
}
```

## Props Interface

```typescript
interface PositionIndicatorProps {
  /**
   * The position number
   * @default 1
   */
  position: number;

  /**
   * Size variant
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Display format
   * @default 'number'
   */
  format?: 'number' | 'ordinal';
}
```

## Size Specifications

| Size | Width/Height | Font Size |
|------|--------------|-----------|
| `sm` | 22px | 10px |
| `md` | 28px | 12px |
| `lg` | 36px | 14px |

## Position Colors

| Position | Background | Text Color | Name |
|----------|------------|------------|------|
| 1 | `#d29922` | `#0d1117` | Gold |
| 2 | `#c0c0c0` | `#0d1117` | Silver |
| 3 | `#cd7f32` | `#0d1117` | Bronze |
| 4+ | `var(--bg-elevated)` | `var(--text-secondary)` | Neutral |

## Implementation Template

```vue
<template>
  <span
    :class="[
      'position-indicator',
      `position-indicator--${size}`,
      positionClass
    ]"
    :title="positionTitle"
  >
    {{ displayPosition }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  position: number;
  size?: 'sm' | 'md' | 'lg';
  format?: 'number' | 'ordinal';
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  format: 'number',
});

const positionClass = computed(() => {
  if (props.position === 1) return 'position-indicator--p1';
  if (props.position === 2) return 'position-indicator--p2';
  if (props.position === 3) return 'position-indicator--p3';
  return 'position-indicator--default';
});

const displayPosition = computed(() => {
  if (props.format === 'ordinal') {
    return getOrdinal(props.position);
  }
  return props.position;
});

const positionTitle = computed(() => {
  const ordinal = getOrdinal(props.position);
  if (props.position === 1) return `${ordinal} place - Gold`;
  if (props.position === 2) return `${ordinal} place - Silver`;
  if (props.position === 3) return `${ordinal} place - Bronze`;
  return `${ordinal} place`;
});

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
</script>

<style scoped>
.position-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-weight: 700;
  border-radius: 6px;
}

/* Sizes */
.position-indicator--sm {
  width: 22px;
  height: 22px;
  font-size: 10px;
}

.position-indicator--md {
  width: 28px;
  height: 28px;
  font-size: 12px;
}

.position-indicator--lg {
  width: 36px;
  height: 36px;
  font-size: 14px;
}

/* Position variants */
.position-indicator--default {
  background: var(--bg-elevated);
  color: var(--text-secondary);
}

.position-indicator--p1 {
  background: #d29922;
  color: #0d1117;
}

.position-indicator--p2 {
  background: #c0c0c0;
  color: #0d1117;
}

.position-indicator--p3 {
  background: #cd7f32;
  color: #0d1117;
}
</style>
```

## Usage Examples

```vue
<!-- Basic positions -->
<PositionIndicator :position="1" />
<PositionIndicator :position="2" />
<PositionIndicator :position="3" />
<PositionIndicator :position="4" />
<PositionIndicator :position="10" />

<!-- Different sizes -->
<PositionIndicator :position="1" size="sm" />
<PositionIndicator :position="1" size="md" />
<PositionIndicator :position="1" size="lg" />

<!-- Ordinal format (1st, 2nd, 3rd) -->
<PositionIndicator :position="1" format="ordinal" />
<PositionIndicator :position="2" format="ordinal" />

<!-- In standings table -->
<tr v-for="driver in standings" :key="driver.id">
  <td>
    <PositionIndicator :position="driver.position" />
  </td>
  <td>{{ driver.name }}</td>
  <td>{{ driver.points }}</td>
</tr>
```

## Integration Pattern

### Standings Table

```vue
<DataTable :value="standings">
  <Column header="Pos">
    <template #body="{ data }">
      <PositionIndicator :position="data.position" size="sm" />
    </template>
  </Column>
  <Column field="driver" header="Driver" />
  <Column field="points" header="Points" />
</DataTable>
```

### Race Results

```vue
<div class="result-row" v-for="result in results" :key="result.id">
  <PositionIndicator :position="result.finishPosition" />
  <span class="driver-name">{{ result.driverName }}</span>
  <span class="time">{{ result.time }}</span>
</div>
```

## Test Cases

```typescript
describe('PositionIndicator', () => {
  it('renders position number', () => {
    const wrapper = mount(PositionIndicator, { props: { position: 5 } });
    expect(wrapper.text()).toBe('5');
  });

  it('applies gold styling for P1', () => {
    const wrapper = mount(PositionIndicator, { props: { position: 1 } });
    expect(wrapper.classes()).toContain('position-indicator--p1');
  });

  it('applies silver styling for P2', () => {
    const wrapper = mount(PositionIndicator, { props: { position: 2 } });
    expect(wrapper.classes()).toContain('position-indicator--p2');
  });

  it('applies bronze styling for P3', () => {
    const wrapper = mount(PositionIndicator, { props: { position: 3 } });
    expect(wrapper.classes()).toContain('position-indicator--p3');
  });

  it('applies default styling for P4+', () => {
    [4, 5, 10, 20].forEach(position => {
      const wrapper = mount(PositionIndicator, { props: { position } });
      expect(wrapper.classes()).toContain('position-indicator--default');
    });
  });

  it('renders ordinal format', () => {
    const cases = [
      { position: 1, expected: '1st' },
      { position: 2, expected: '2nd' },
      { position: 3, expected: '3rd' },
      { position: 4, expected: '4th' },
      { position: 11, expected: '11th' },
      { position: 21, expected: '21st' },
    ];
    cases.forEach(({ position, expected }) => {
      const wrapper = mount(PositionIndicator, {
        props: { position, format: 'ordinal' }
      });
      expect(wrapper.text()).toBe(expected);
    });
  });

  it('renders all sizes', () => {
    ['sm', 'md', 'lg'].forEach(size => {
      const wrapper = mount(PositionIndicator, {
        props: { position: 1, size }
      });
      expect(wrapper.classes()).toContain(`position-indicator--${size}`);
    });
  });
});
```

## Accessibility

- Has `title` attribute explaining the position
- Color is supplemented by the number
- Podium positions use universally recognized colors
- Consider adding `role="text"` with `aria-label` for screen readers
