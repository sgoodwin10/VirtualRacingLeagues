# BaseBadge Component Specification

> **Priority**: 1 (Foundation)
> **Location**: `resources/app/js/components/common/indicators/BaseBadge.vue`

## Overview

The foundational badge component that provides consistent styling for all badge variants. Other indicator components can compose this component or follow its design patterns.

## Design Reference

From `badges.html`:
```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  border-radius: 4px;
}
```

## Props Interface

```typescript
interface BaseBadgeProps {
  /**
   * Color variant
   * @default 'default'
   */
  variant?: 'default' | 'cyan' | 'green' | 'orange' | 'red' | 'purple';

  /**
   * Size variant
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Transform text to uppercase
   * @default false
   */
  uppercase?: boolean;

  /**
   * Optional icon (Phosphor icon component name)
   */
  icon?: Component;
}
```

## Slots

| Slot | Description |
|------|-------------|
| `default` | Badge content/label |
| `icon` | Custom icon slot (overrides icon prop) |

## Size Specifications

| Size | Font Size | Padding | Gap |
|------|-----------|---------|-----|
| `sm` | 10px | 2px 6px | 4px |
| `md` | 11px | 4px 10px | 6px |
| `lg` | 12px | 6px 12px | 8px |

## Color Specifications

| Variant | Background | Text Color |
|---------|------------|------------|
| `default` | `var(--bg-elevated)` | `var(--text-secondary)` |
| `cyan` | `var(--cyan-dim)` | `var(--cyan)` |
| `green` | `var(--green-dim)` | `var(--green)` |
| `orange` | `var(--orange-dim)` | `var(--orange)` |
| `red` | `var(--red-dim)` | `var(--red)` |
| `purple` | `var(--purple-dim)` | `var(--purple)` |

## Implementation Template

```vue
<template>
  <span
    :class="[
      'base-badge',
      `base-badge--${variant}`,
      `base-badge--${size}`,
      { 'base-badge--uppercase': uppercase }
    ]"
  >
    <slot name="icon">
      <component :is="icon" v-if="icon" class="base-badge__icon" />
    </slot>
    <slot />
  </span>
</template>

<script setup lang="ts">
import type { Component } from 'vue';

interface Props {
  variant?: 'default' | 'cyan' | 'green' | 'orange' | 'red' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  uppercase?: boolean;
  icon?: Component;
}

withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
  uppercase: false,
});
</script>

<style scoped>
.base-badge {
  display: inline-flex;
  align-items: center;
  font-family: var(--font-mono);
  font-weight: 500;
  border-radius: 4px;
  white-space: nowrap;
}

/* Sizes */
.base-badge--sm {
  gap: 4px;
  padding: 2px 6px;
  font-size: 10px;
}

.base-badge--md {
  gap: 6px;
  padding: 4px 10px;
  font-size: 11px;
}

.base-badge--lg {
  gap: 8px;
  padding: 6px 12px;
  font-size: 12px;
}

/* Variants */
.base-badge--default {
  background: var(--bg-elevated);
  color: var(--text-secondary);
}

.base-badge--cyan {
  background: var(--cyan-dim);
  color: var(--cyan);
}

.base-badge--green {
  background: var(--green-dim);
  color: var(--green);
}

.base-badge--orange {
  background: var(--orange-dim);
  color: var(--orange);
}

.base-badge--red {
  background: var(--red-dim);
  color: var(--red);
}

.base-badge--purple {
  background: var(--purple-dim);
  color: var(--purple);
}

/* Modifiers */
.base-badge--uppercase {
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Icon */
.base-badge__icon {
  width: 1em;
  height: 1em;
  flex-shrink: 0;
}
</style>
```

## Usage Examples

```vue
<!-- Basic usage -->
<BaseBadge>Default</BaseBadge>

<!-- With variant -->
<BaseBadge variant="cyan">Information</BaseBadge>
<BaseBadge variant="green">Success</BaseBadge>
<BaseBadge variant="orange">Warning</BaseBadge>
<BaseBadge variant="red">Error</BaseBadge>

<!-- With size -->
<BaseBadge size="sm" variant="cyan">Small</BaseBadge>
<BaseBadge size="lg" variant="green">Large</BaseBadge>

<!-- Uppercase -->
<BaseBadge uppercase variant="purple">CATEGORY</BaseBadge>

<!-- With icon -->
<BaseBadge variant="cyan" :icon="PhInfo">With Icon</BaseBadge>
```

## Test Cases

```typescript
describe('BaseBadge', () => {
  it('renders default variant', () => {
    const wrapper = mount(BaseBadge, {
      slots: { default: 'Test' }
    });
    expect(wrapper.classes()).toContain('base-badge--default');
  });

  it('renders all color variants', () => {
    const variants = ['default', 'cyan', 'green', 'orange', 'red', 'purple'];
    variants.forEach(variant => {
      const wrapper = mount(BaseBadge, {
        props: { variant },
        slots: { default: 'Test' }
      });
      expect(wrapper.classes()).toContain(`base-badge--${variant}`);
    });
  });

  it('renders all sizes', () => {
    const sizes = ['sm', 'md', 'lg'];
    sizes.forEach(size => {
      const wrapper = mount(BaseBadge, {
        props: { size },
        slots: { default: 'Test' }
      });
      expect(wrapper.classes()).toContain(`base-badge--${size}`);
    });
  });

  it('applies uppercase modifier', () => {
    const wrapper = mount(BaseBadge, {
      props: { uppercase: true },
      slots: { default: 'Test' }
    });
    expect(wrapper.classes()).toContain('base-badge--uppercase');
  });

  it('renders slot content', () => {
    const wrapper = mount(BaseBadge, {
      slots: { default: 'Badge Text' }
    });
    expect(wrapper.text()).toBe('Badge Text');
  });

  it('renders icon when provided', () => {
    const TestIcon = { template: '<svg />' };
    const wrapper = mount(BaseBadge, {
      props: { icon: TestIcon },
      slots: { default: 'Test' }
    });
    expect(wrapper.find('.base-badge__icon').exists()).toBe(true);
  });
});
```

## Accessibility

- Uses `<span>` element (inline)
- Ensure sufficient color contrast (all variants meet WCAG AA)
- When used to convey status, ensure context is provided via surrounding text
