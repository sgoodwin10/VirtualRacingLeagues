# TagIndicator Component Specification

> **Priority**: 1 (Foundation)
> **Location**: `resources/app/js/components/common/indicators/TagIndicator.vue`

## Overview

Compact tags for sidebar navigation, inline labels, and small metadata indicators. Smaller and more subtle than `BaseBadge`.

## Design Reference

From `badges.html`:
```css
.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  background: var(--cyan-dim);
  color: var(--cyan);
  border-radius: 3px;
}
```

## Props Interface

```typescript
interface TagIndicatorProps {
  /**
   * Color variant
   * @default 'cyan'
   */
  variant?: 'default' | 'cyan' | 'success' | 'warning' | 'danger' | 'purple';

  /**
   * Size variant
   * @default 'sm'
   */
  size?: 'xs' | 'sm';

  /**
   * Transform to uppercase
   * @default false
   */
  uppercase?: boolean;

  /**
   * Optional icon component
   */
  icon?: Component;
}
```

## Size Specifications

| Size | Font Size | Padding | Border Radius |
|------|-----------|---------|---------------|
| `xs` | 9px | 1px 4px | 2px |
| `sm` | 10px | 2px 6px | 3px |

## Color Mapping

| Variant | Background | Text Color |
|---------|------------|------------|
| `default` | `var(--bg-elevated)` | `var(--text-muted)` |
| `cyan` | `var(--cyan-dim)` | `var(--cyan)` |
| `success` | `var(--green-dim)` | `var(--green)` |
| `warning` | `var(--orange-dim)` | `var(--orange)` |
| `danger` | `var(--red-dim)` | `var(--red)` |
| `purple` | `var(--purple-dim)` | `var(--purple)` |

## Implementation Template

```vue
<template>
  <span
    :class="[
      'tag-indicator',
      `tag-indicator--${variant}`,
      `tag-indicator--${size}`,
      { 'tag-indicator--uppercase': uppercase }
    ]"
  >
    <slot name="icon">
      <component :is="icon" v-if="icon" class="tag-indicator__icon" />
    </slot>
    <slot />
  </span>
</template>

<script setup lang="ts">
import type { Component } from 'vue';

interface Props {
  variant?: 'default' | 'cyan' | 'success' | 'warning' | 'danger' | 'purple';
  size?: 'xs' | 'sm';
  uppercase?: boolean;
  icon?: Component;
}

withDefaults(defineProps<Props>(), {
  variant: 'cyan',
  size: 'sm',
  uppercase: false,
});
</script>

<style scoped>
.tag-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-mono);
  font-weight: 500;
  white-space: nowrap;
}

/* Sizes */
.tag-indicator--xs {
  padding: 1px 4px;
  font-size: 9px;
  border-radius: 2px;
}

.tag-indicator--sm {
  padding: 2px 6px;
  font-size: 10px;
  border-radius: 3px;
}

/* Variants */
.tag-indicator--default {
  background: var(--bg-elevated);
  color: var(--text-muted);
}

.tag-indicator--cyan {
  background: var(--cyan-dim);
  color: var(--cyan);
}

.tag-indicator--success {
  background: var(--green-dim);
  color: var(--green);
}

.tag-indicator--warning {
  background: var(--orange-dim);
  color: var(--orange);
}

.tag-indicator--danger {
  background: var(--red-dim);
  color: var(--red);
}

.tag-indicator--purple {
  background: var(--purple-dim);
  color: var(--purple);
}

/* Modifiers */
.tag-indicator--uppercase {
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

/* Icon */
.tag-indicator__icon {
  width: 1em;
  height: 1em;
  flex-shrink: 0;
}
</style>
```

## Usage Examples

```vue
<!-- Basic usage -->
<TagIndicator>NEW</TagIndicator>

<!-- Variants -->
<TagIndicator variant="cyan">10</TagIndicator>
<TagIndicator variant="success">OK</TagIndicator>
<TagIndicator variant="warning">3</TagIndicator>
<TagIndicator variant="danger">!</TagIndicator>

<!-- Sizes -->
<TagIndicator size="xs">xs</TagIndicator>
<TagIndicator size="sm">sm</TagIndicator>

<!-- Uppercase -->
<TagIndicator uppercase>beta</TagIndicator>

<!-- Racing indicators -->
<TagIndicator variant="purple">P</TagIndicator>   <!-- Pole -->
<TagIndicator variant="purple">FL</TagIndicator>  <!-- Fastest lap -->

<!-- In sidebar -->
<nav class="sidebar">
  <a href="/races">
    <span>Races</span>
    <TagIndicator>20</TagIndicator>
  </a>
  <a href="/incidents">
    <span>Incidents</span>
    <TagIndicator variant="warning">3</TagIndicator>
  </a>
</nav>
```

## Migration Guide

### Pole Position Tag

**Before:**
```vue
<Tag class="text-xs bg-purple-200 text-purple-800" :pt="{ root: { style: 'padding: 0.15rem 0.4rem' } }">P</Tag>
```

**After:**
```vue
<TagIndicator variant="purple">P</TagIndicator>
```

### Fastest Lap Tag

**Before:**
```vue
<Tag class="text-xs bg-purple-500 text-white mr-1" :pt="{ root: { style: 'padding: 0.15rem 0.35rem' } }">FL</Tag>
```

**After:**
```vue
<TagIndicator variant="purple">FL</TagIndicator>
```

### Navigation Count Tags

**Before:**
```vue
<span class="tag">10</span>
<span class="tag warning">3</span>
```

**After:**
```vue
<TagIndicator>10</TagIndicator>
<TagIndicator variant="warning">3</TagIndicator>
```

## Test Cases

```typescript
describe('TagIndicator', () => {
  it('renders slot content', () => {
    const wrapper = mount(TagIndicator, {
      slots: { default: 'TEST' }
    });
    expect(wrapper.text()).toBe('TEST');
  });

  it('applies default variant (cyan)', () => {
    const wrapper = mount(TagIndicator, {
      slots: { default: 'Test' }
    });
    expect(wrapper.classes()).toContain('tag-indicator--cyan');
  });

  it('renders all variants', () => {
    const variants = ['default', 'cyan', 'success', 'warning', 'danger', 'purple'];
    variants.forEach(variant => {
      const wrapper = mount(TagIndicator, {
        props: { variant },
        slots: { default: 'Test' }
      });
      expect(wrapper.classes()).toContain(`tag-indicator--${variant}`);
    });
  });

  it('renders both sizes', () => {
    const sizes = ['xs', 'sm'];
    sizes.forEach(size => {
      const wrapper = mount(TagIndicator, {
        props: { size },
        slots: { default: 'Test' }
      });
      expect(wrapper.classes()).toContain(`tag-indicator--${size}`);
    });
  });

  it('applies uppercase modifier', () => {
    const wrapper = mount(TagIndicator, {
      props: { uppercase: true },
      slots: { default: 'test' }
    });
    expect(wrapper.classes()).toContain('tag-indicator--uppercase');
  });
});
```

## Accessibility

- Use alongside descriptive text when meaning isn't obvious
- For abbreviations like "P" or "FL", consider `title` attribute or `aria-label`
- Ensure sufficient color contrast (all variants pass WCAG AA)
