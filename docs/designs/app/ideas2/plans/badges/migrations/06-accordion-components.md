# Accordion Components Migration Guide

> **Priority**: Low (Refactor to align with design tokens)
> **Files**: AccordionBadge.vue, AccordionStatusIndicator.vue

---

## Overview

The accordion components already follow a similar pattern to the design system. This migration is about:
1. Aligning CSS variables with the global design tokens
2. Ensuring consistency with other indicator components
3. Optional: Composing the new indicator components

---

## 1. AccordionBadge.vue

**Location**: `resources/app/js/components/common/accordions/AccordionBadge.vue`

### Current Implementation

Custom badge with inline dynamic styles:

```vue
<template>
  <div class="accordion-badge" :style="badgeStyles">
    {{ label }}
  </div>
</template>

<script setup>
const severityColors = {
  success: { bg: 'rgba(126, 231, 135, 0.15)', text: '#7ee787', border: 'rgba(126, 231, 135, 0.3)' },
  info: { bg: 'rgba(88, 166, 255, 0.15)', text: '#58a6ff', border: 'rgba(88, 166, 255, 0.3)' },
  warning: { bg: 'rgba(240, 136, 62, 0.15)', text: '#f0883e', border: 'rgba(240, 136, 62, 0.3)' },
  danger: { bg: 'rgba(248, 81, 73, 0.15)', text: '#f85149', border: 'rgba(248, 81, 73, 0.3)' },
  muted: { bg: '#21262d', text: '#6e7681', border: '#30363d' },
};
</script>

<style scoped>
.accordion-badge {
  font-family: var(--accordion-font-mono);
  font-size: 10px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>
```

### Target Implementation

Align with design system CSS variables:

```vue
<template>
  <span
    :class="[
      'accordion-badge',
      `accordion-badge--${severity}`
    ]"
  >
    <slot>{{ label }}</slot>
  </span>
</template>

<script setup lang="ts">
interface Props {
  label?: string;
  severity?: 'success' | 'info' | 'warning' | 'danger' | 'muted';
}

withDefaults(defineProps<Props>(), {
  severity: 'muted',
});
</script>

<style scoped>
.accordion-badge {
  display: inline-flex;
  align-items: center;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.accordion-badge--success {
  background: var(--green-dim);
  color: var(--green);
}

.accordion-badge--info {
  background: var(--cyan-dim);
  color: var(--cyan);
}

.accordion-badge--warning {
  background: var(--orange-dim);
  color: var(--orange);
}

.accordion-badge--danger {
  background: var(--red-dim);
  color: var(--red);
}

.accordion-badge--muted {
  background: var(--bg-elevated);
  color: var(--text-muted);
}
</style>
```

### Key Changes

1. **Remove inline styles** - Use CSS classes with design token variables
2. **Remove border** - Technical blueprint badges don't have borders
3. **Use global CSS variables** - `--font-mono`, `--green-dim`, `--green`, etc.
4. **Add slot** - Allow custom content beyond label prop

---

## 2. AccordionStatusIndicator.vue

**Location**: `resources/app/js/components/common/accordions/AccordionStatusIndicator.vue`

### Current Implementation

Custom vertical bar indicator with inline styles:

```vue
<template>
  <div
    class="accordion-status-indicator"
    :style="indicatorStyle"
  />
</template>

<script setup>
const STATUS_COLOR_MAP = {
  active: { color: '#7ee787', glow: true },
  upcoming: { color: '#58a6ff', glow: false },
  completed: { color: '#6e7681', glow: false },
  pending: { color: '#f0883e', glow: false },
  inactive: { color: '#30363d', glow: false },
};
</script>

<style scoped>
.accordion-status-indicator {
  width: 4px;
  height: 40px;
  border-radius: 2px;
}
</style>
```

### Target Implementation

Align with design system and use CSS classes:

```vue
<template>
  <span
    :class="[
      'accordion-status-indicator',
      `accordion-status-indicator--${status}`,
      `accordion-status-indicator--${size}`
    ]"
  />
</template>

<script setup lang="ts">
interface Props {
  status?: 'active' | 'upcoming' | 'completed' | 'pending' | 'inactive';
  size?: 'sm' | 'md' | 'lg';
}

withDefaults(defineProps<Props>(), {
  status: 'inactive',
  size: 'md',
});
</script>

<style scoped>
.accordion-status-indicator {
  display: inline-block;
  border-radius: 2px;
  flex-shrink: 0;
}

/* Sizes */
.accordion-status-indicator--sm {
  width: 3px;
  height: 28px;
}

.accordion-status-indicator--md {
  width: 4px;
  height: 40px;
}

.accordion-status-indicator--lg {
  width: 4px;
  height: 56px;
}

/* Status colors */
.accordion-status-indicator--active {
  background-color: var(--green);
  box-shadow: 0 0 8px var(--green);
}

.accordion-status-indicator--upcoming {
  background-color: var(--cyan);
}

.accordion-status-indicator--completed {
  background-color: var(--text-muted);
}

.accordion-status-indicator--pending {
  background-color: var(--orange);
}

.accordion-status-indicator--inactive {
  background-color: var(--border);
}
</style>
```

### Key Changes

1. **Remove inline styles** - Use CSS classes
2. **Use global CSS variables** - `--green`, `--cyan`, `--orange`, etc.
3. **Add size prop** - For different accordion contexts
4. **Maintain glow effect** - Only for active status

---

## Comparison: AccordionBadge vs BaseBadge

| Feature | AccordionBadge | BaseBadge |
|---------|---------------|-----------|
| **Purpose** | Accordion-specific labels | General-purpose badges |
| **Size** | Compact (10px) | Multiple sizes (10-12px) |
| **Uppercase** | Always | Optional |
| **Slot** | Yes | Yes |
| **Icon support** | No | Yes |

### Decision: Keep Separate or Merge?

**Recommendation**: Keep `AccordionBadge` as a specialized component but have it use the same CSS variables as the design system. This maintains:
- Accordion-specific styling (always uppercase, compact)
- Separation of concerns
- Easier testing

---

## Step-by-Step Migration

### AccordionBadge.vue

1. **Update CSS variables**:
   ```css
   /* Before */
   font-family: var(--accordion-font-mono);

   /* After */
   font-family: var(--font-mono);
   ```

2. **Remove inline styles**:
   ```vue
   <!-- Before -->
   <div class="accordion-badge" :style="badgeStyles">

   <!-- After -->
   <span :class="['accordion-badge', `accordion-badge--${severity}`]">
   ```

3. **Add CSS classes for severities**:
   ```css
   .accordion-badge--success {
     background: var(--green-dim);
     color: var(--green);
   }
   ```

4. **Remove border styling** (not in technical blueprint design)

### AccordionStatusIndicator.vue

1. **Remove inline styles**:
   ```vue
   <!-- Before -->
   <div class="accordion-status-indicator" :style="indicatorStyle" />

   <!-- After -->
   <span :class="['accordion-status-indicator', `accordion-status-indicator--${status}`]" />
   ```

2. **Add CSS classes for statuses**:
   ```css
   .accordion-status-indicator--active {
     background-color: var(--green);
     box-shadow: 0 0 8px var(--green);
   }
   ```

3. **Use global CSS variables**

---

## Testing Checklist

### AccordionBadge.vue
- [ ] All severities render with correct colors
- [ ] Uppercase text transformation works
- [ ] Slot content renders correctly
- [ ] No border (matches technical blueprint)
- [ ] Font is monospace

### AccordionStatusIndicator.vue
- [ ] All status types render with correct colors
- [ ] Active status has glow effect
- [ ] Size variants work correctly
- [ ] Vertical bar displays correctly in accordion headers

---

## Files to Update

1. `resources/app/js/components/common/accordions/AccordionBadge.vue`
2. `resources/app/js/components/common/accordions/AccordionStatusIndicator.vue`
3. `resources/app/js/components/common/accordions/__tests__/AccordionBadge.test.ts`
4. `resources/app/js/components/common/accordions/__tests__/AccordionStatusIndicator.test.ts`

---

## CSS Variable Dependencies

Ensure these global variables are available:

```css
:root {
  /* Colors */
  --green: #7ee787;
  --green-dim: rgba(126, 231, 135, 0.15);
  --cyan: #58a6ff;
  --cyan-dim: rgba(88, 166, 255, 0.15);
  --orange: #f0883e;
  --orange-dim: rgba(240, 136, 62, 0.15);
  --red: #f85149;
  --red-dim: rgba(248, 81, 73, 0.15);

  /* Backgrounds */
  --bg-elevated: #21262d;
  --border: #30363d;

  /* Text */
  --text-muted: #6e7681;

  /* Typography */
  --font-mono: 'IBM Plex Mono', 'SF Mono', monospace;
}
```
