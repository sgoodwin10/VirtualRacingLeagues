# CountIndicator Component Specification

> **Priority**: 1 (Foundation)
> **Location**: `resources/app/js/components/common/indicators/CountIndicator.vue`

## Overview

A pill-shaped badge for displaying notification counts, item counts, and numeric indicators. Supports overflow display (e.g., "99+").

## Design Reference

From `badges.html`:
```css
.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  border-radius: 10px;
}
```

## Props Interface

```typescript
interface CountIndicatorProps {
  /**
   * The count to display
   * @default 0
   */
  count?: number | string;

  /**
   * Color variant
   * @default 'cyan'
   */
  variant?: 'cyan' | 'orange' | 'red' | 'green' | 'purple';

  /**
   * Maximum number before showing overflow (e.g., 99+)
   * @default 99
   */
  max?: number;

  /**
   * Size variant
   * @default 'md'
   */
  size?: 'sm' | 'md';

  /**
   * Show even when count is 0
   * @default false
   */
  showZero?: boolean;
}
```

## Size Specifications

| Size | Min Width | Height | Font Size | Padding |
|------|-----------|--------|-----------|---------|
| `sm` | 16px | 16px | 9px | 0 4px |
| `md` | 20px | 20px | 10px | 0 6px |

## Implementation Template

```vue
<template>
  <span
    v-if="shouldShow"
    :class="[
      'count-indicator',
      `count-indicator--${variant}`,
      `count-indicator--${size}`
    ]"
  >
    {{ displayValue }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  count?: number | string;
  variant?: 'cyan' | 'orange' | 'red' | 'green' | 'purple';
  max?: number;
  size?: 'sm' | 'md';
  showZero?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,
  variant: 'cyan',
  max: 99,
  size: 'md',
  showZero: false,
});

const numericCount = computed(() => {
  if (typeof props.count === 'string') {
    return props.count; // Allow string values like "!"
  }
  return props.count;
});

const shouldShow = computed(() => {
  if (typeof numericCount.value === 'string') return true;
  if (props.showZero) return true;
  return numericCount.value > 0;
});

const displayValue = computed(() => {
  if (typeof numericCount.value === 'string') {
    return numericCount.value;
  }
  if (numericCount.value > props.max) {
    return `${props.max}+`;
  }
  return numericCount.value;
});
</script>

<style scoped>
.count-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-weight: 600;
  border-radius: 10px;
  white-space: nowrap;
}

/* Sizes */
.count-indicator--sm {
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font-size: 9px;
}

.count-indicator--md {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  font-size: 10px;
}

/* Variants */
.count-indicator--cyan {
  background: var(--cyan-dim);
  color: var(--cyan);
}

.count-indicator--orange {
  background: var(--orange-dim);
  color: var(--orange);
}

.count-indicator--red {
  background: var(--red-dim);
  color: var(--red);
}

.count-indicator--green {
  background: var(--green-dim);
  color: var(--green);
}

.count-indicator--purple {
  background: var(--purple-dim);
  color: var(--purple);
}
</style>
```

## Usage Examples

```vue
<!-- Basic counts -->
<CountIndicator :count="3" />
<CountIndicator :count="10" />
<CountIndicator :count="150" />  <!-- Shows "99+" -->

<!-- Color variants -->
<CountIndicator :count="5" variant="cyan" />
<CountIndicator :count="3" variant="orange" />
<CountIndicator :count="1" variant="red" />

<!-- Alert indicator -->
<CountIndicator count="!" variant="orange" />

<!-- Custom max -->
<CountIndicator :count="1500" :max="999" />  <!-- Shows "999+" -->

<!-- Show zero -->
<CountIndicator :count="0" show-zero />

<!-- Sizes -->
<CountIndicator :count="5" size="sm" />
<CountIndicator :count="5" size="md" />

<!-- In navigation item -->
<div class="nav-item">
  <span>Messages</span>
  <CountIndicator :count="unreadCount" />
</div>

<!-- In button -->
<Button>
  Notifications
  <CountIndicator :count="notifications.length" variant="red" size="sm" />
</Button>
```

## Integration Patterns

### Sidebar Navigation

```vue
<nav>
  <a href="/inbox" class="nav-link">
    <PhEnvelope />
    <span>Inbox</span>
    <CountIndicator :count="unreadEmails" />
  </a>
  <a href="/alerts" class="nav-link">
    <PhBell />
    <span>Alerts</span>
    <CountIndicator :count="alertCount" variant="orange" />
  </a>
</nav>
```

### Table Header

```vue
<th>
  Errors
  <CountIndicator
    v-if="errorCount > 0"
    :count="errorCount"
    variant="red"
    size="sm"
  />
</th>
```

## Test Cases

```typescript
describe('CountIndicator', () => {
  it('renders count value', () => {
    const wrapper = mount(CountIndicator, { props: { count: 5 } });
    expect(wrapper.text()).toBe('5');
  });

  it('shows overflow when exceeding max', () => {
    const wrapper = mount(CountIndicator, { props: { count: 150, max: 99 } });
    expect(wrapper.text()).toBe('99+');
  });

  it('hides when count is 0 by default', () => {
    const wrapper = mount(CountIndicator, { props: { count: 0 } });
    expect(wrapper.find('.count-indicator').exists()).toBe(false);
  });

  it('shows when count is 0 with showZero prop', () => {
    const wrapper = mount(CountIndicator, { props: { count: 0, showZero: true } });
    expect(wrapper.text()).toBe('0');
  });

  it('renders string values', () => {
    const wrapper = mount(CountIndicator, { props: { count: '!' } });
    expect(wrapper.text()).toBe('!');
  });

  it('applies variant classes', () => {
    const variants = ['cyan', 'orange', 'red', 'green', 'purple'];
    variants.forEach(variant => {
      const wrapper = mount(CountIndicator, { props: { count: 1, variant } });
      expect(wrapper.classes()).toContain(`count-indicator--${variant}`);
    });
  });

  it('respects custom max value', () => {
    const wrapper = mount(CountIndicator, { props: { count: 1500, max: 999 } });
    expect(wrapper.text()).toBe('999+');
  });
});
```

## Accessibility

- Numbers are announced by screen readers
- Consider `aria-label` for context: "5 unread messages"
- Use alongside text labels for full context
- Overflow text ("99+") is clear to screen readers
