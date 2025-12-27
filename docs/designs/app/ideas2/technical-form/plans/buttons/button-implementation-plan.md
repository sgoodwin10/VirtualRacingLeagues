# Button Component Implementation Plan - Technical Blueprint Design System

**Status**: Ready for Implementation
**Target Application**: User Dashboard (`resources/app`)
**Design Reference**: `/var/www/docs/designs/app/ideas2/technical-form/buttons.html`
**Current PrimeVue Button Usage**: `/var/www/resources/app/js/components/league/partials/LeagueHeader.vue`

---

## Executive Summary

This plan creates a comprehensive button component system for the Technical Blueprint design that wraps PrimeVue v4 Button components with design system styling. The approach balances the power of PrimeVue's accessibility and functionality with the precise visual aesthetic of the Technical Blueprint design.

### Key Strategy
- **Wrap, Don't Replace**: Use PrimeVue v4 Button as the foundation (accessibility, events, states)
- **Design System Layer**: Add Technical Blueprint styling via wrapper components and CSS overrides
- **Component Variants**: Create dedicated components for common patterns (IconButton, ButtonGroup)
- **Type Safety**: Full TypeScript support with proper prop types and emits

---

## Design Analysis

### Design Aesthetic (from buttons.html)

The Technical Blueprint button design has distinct characteristics:

#### Color Palette
```css
--bg-dark: #0d1117          /* Body background */
--bg-panel: #161b22         /* Panel/sidebar background */
--bg-card: #1c2128          /* Card background */
--bg-elevated: #21262d      /* Elevated surfaces */
--bg-highlight: #272d36     /* Hover highlight */
--text-primary: #e6edf3     /* Primary text */
--text-secondary: #8b949e   /* Secondary text */
--text-muted: #6e7681       /* Muted text */
--cyan: #58a6ff             /* Primary/accent color */
--green: #7ee787            /* Success color */
--orange: #f0883e           /* Warning color */
--red: #f85149              /* Danger/error color */
--border: #30363d           /* Default border */
--radius: 6px               /* Border radius */
```

#### Button Variants

| Variant | Background | Text Color | Border | Hover Background |
|---------|-----------|------------|--------|------------------|
| **Primary** | `#58a6ff` (cyan) | `#0d1117` (dark) | `#58a6ff` | `#79b8ff` (lighter cyan) |
| **Secondary** | `#21262d` (elevated) | `#e6edf3` (primary) | `#30363d` (border) | `#272d36` (highlight) |
| **Ghost** | `transparent` | `#8b949e` (secondary) | `transparent` | `#21262d` (elevated) |
| **Outline** | `transparent` | `#58a6ff` (cyan) | `#58a6ff` | `rgba(88, 166, 255, 0.15)` (cyan-dim) |
| **Danger** | `rgba(248, 81, 73, 0.15)` (red-dim) | `#f85149` (red) | `#f85149` | `#f85149` with white text |
| **Success** | `rgba(126, 231, 135, 0.15)` (green-dim) | `#7ee787` (green) | `#7ee787` | `#7ee787` with dark text |
| **Warning** | `rgba(240, 136, 62, 0.15)` (orange-dim) | `#f0883e` (orange) | `#f0883e` | `#f0883e` with dark text |

#### Size Scale

| Size | Height | Padding | Font Size |
|------|--------|---------|-----------|
| **sm** | 28px | 6px 10px | 12px |
| **default** | 36px | 8px 14px | 13px |
| **lg** | 44px | 12px 20px | 14px |
| **xl** | 48px | 14px 24px | 15px |

#### Typography
- **Font Family**: Inter (sans-serif), NOT monospace
- **Font Weight**: 500
- **Letter Spacing**: Normal (no tracking)
- **Text Transform**: None (natural case)

#### Interaction States
- **Transition**: `all 0.15s ease` (faster than default 0.2s)
- **Disabled**: 50% opacity, `cursor: not-allowed`
- **Focus**: 2px solid cyan outline with 2px offset
- **Icon Size**: 14px (default/sm), 16px (lg/xl)

---

## Current State Analysis

### Existing PrimeVue Button Usage

From `LeagueHeader.vue` (lines 76-84):

```vue
<Button
  label="Edit League"
  icon="pi pi-pencil"
  severity="secondary"
  class="bg-white"
  outlined
  size="small"
  @click="handleEdit"
/>
```

**Current PrimeVue Pattern**:
- Uses PrimeVue `severity` prop (primary, secondary, success, danger, etc.)
- Uses `outlined` prop for outline variant
- Uses PrimeVue icon system (`pi pi-*`)
- Applies custom class `bg-white` to override background
- Uses `size` prop (small, large)

**Gaps with Design System**:
- PrimeVue colors don't match Technical Blueprint palette
- Typography (font-family, weight, size) differs from design
- Border radius may not match 6px standard
- Hover states use PrimeVue defaults, not Technical Blueprint colors
- Icon system uses PrimeIcons instead of Phosphor Icons (used elsewhere in app)

### Existing Color System

From `app.css` (lines 1-317):
- Technical Blueprint colors are already defined as CSS variables ✓
- PrimeVue theme overrides are in place ✓
- Font families (IBM Plex Mono, Inter) are loaded ✓
- Typography utilities exist ✓

**Key Variables Available**:
```css
--bg-elevated, --bg-highlight
--text-primary, --text-secondary, --text-muted
--cyan, --green, --orange, --red
--cyan-dim, --green-dim, --orange-dim, --red-dim
--border
--font-sans (Inter)
--font-mono (IBM Plex Mono)
```

---

## Integration Strategy with PrimeVue v4

### Why Wrap PrimeVue Button?

**Advantages**:
1. **Accessibility**: PrimeVue handles ARIA attributes, keyboard navigation, focus management
2. **Functionality**: Loading states, disabled states, ripple effects built-in
3. **Events**: Proper click handling, touch support
4. **Consistency**: Familiar API for developers already using PrimeVue
5. **Maintenance**: PrimeVue updates improve our buttons automatically

**Approach**: Create wrapper components that:
- Accept simplified props aligned with Technical Blueprint design
- Map those props to PrimeVue Button props
- Apply design system CSS overrides via classes
- Support all PrimeVue functionality (events, slots, directives)

---

## Component Architecture

### Component Hierarchy

```
resources/app/js/components/common/buttons/
├── TechButton.vue              [Main button component - wraps PrimeVue Button]
├── TechIconButton.vue          [Icon-only button variant]
├── TechButtonGroup.vue         [Button group container]
└── index.ts                    [Barrel export]
```

### Additional Files

```
resources/app/css/
└── components/                 [NEW DIRECTORY]
    └── buttons.css             [Button-specific CSS overrides]
```

---

## Component Specifications

### 1. TechButton.vue

**Purpose**: Main button component for the Technical Blueprint design system.

#### Props

```typescript
interface TechButtonProps {
  // Variant (maps to design system variants)
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success' | 'warning';

  // Size
  size?: 'sm' | 'default' | 'lg' | 'xl';

  // Content
  label?: string;
  icon?: Component;          // Phosphor icon component
  iconPos?: 'left' | 'right';

  // States
  disabled?: boolean;
  loading?: boolean;

  // HTML attributes
  type?: 'button' | 'submit' | 'reset';

  // Passthrough for advanced PrimeVue features
  pt?: any;  // PrimeVue passthrough options
}
```

**Defaults**:
```typescript
{
  variant: 'secondary',
  size: 'default',
  iconPos: 'left',
  disabled: false,
  loading: false,
  type: 'button'
}
```

#### Emits

```typescript
interface TechButtonEmits {
  (e: 'click', event: MouseEvent): void;
}
```

#### Template Structure

```vue
<template>
  <Button
    :label="label"
    :disabled="disabled"
    :loading="loading"
    :type="type"
    :size="primeVueSize"
    :severity="primeVueSeverity"
    :text="variant === 'ghost'"
    :outlined="variant === 'outline'"
    :class="buttonClasses"
    :pt="pt"
    @click="handleClick"
  >
    <!-- Icon Slot (if icon prop provided) -->
    <template #icon v-if="icon">
      <component :is="icon" :size="iconSize" weight="regular" />
    </template>

    <!-- Default slot for custom content -->
    <slot />
  </Button>
</template>
```

#### Computed Properties

```typescript
// Map Technical Blueprint variants to PrimeVue severity
const primeVueSeverity = computed(() => {
  const severityMap = {
    primary: 'primary',
    secondary: 'secondary',
    ghost: 'secondary',
    outline: 'primary',
    danger: 'danger',
    success: 'success',
    warning: 'warn'
  };
  return severityMap[props.variant];
});

// Map size to PrimeVue size
const primeVueSize = computed(() => {
  const sizeMap = {
    sm: 'small',
    default: undefined,  // PrimeVue default
    lg: 'large',
    xl: 'large'          // Use large + custom class
  };
  return sizeMap[props.size];
});

// Icon size based on button size
const iconSize = computed(() => {
  const sizeMap = {
    sm: 14,
    default: 14,
    lg: 16,
    xl: 16
  };
  return sizeMap[props.size];
});

// CSS classes for design system styling
const buttonClasses = computed(() => [
  'tech-button',
  `tech-button--${props.variant}`,
  `tech-button--${props.size}`,
  {
    'tech-button--icon-only': !props.label && props.icon
  }
]);
```

#### Full Component Code

```vue
<script setup lang="ts">
import { computed } from 'vue';
import Button from 'primevue/button';
import type { Component } from 'vue';

interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'default' | 'lg' | 'xl';
  label?: string;
  icon?: Component;
  iconPos?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  pt?: any;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'secondary',
  size: 'default',
  iconPos: 'left',
  disabled: false,
  loading: false,
  type: 'button'
});

interface Emits {
  (e: 'click', event: MouseEvent): void;
}

const emit = defineEmits<Emits>();

const primeVueSeverity = computed(() => {
  const severityMap: Record<string, string> = {
    primary: 'primary',
    secondary: 'secondary',
    ghost: 'secondary',
    outline: 'primary',
    danger: 'danger',
    success: 'success',
    warning: 'warn'
  };
  return severityMap[props.variant];
});

const primeVueSize = computed(() => {
  const sizeMap: Record<string, string | undefined> = {
    sm: 'small',
    default: undefined,
    lg: 'large',
    xl: 'large'
  };
  return sizeMap[props.size];
});

const iconSize = computed(() => {
  const sizeMap: Record<string, number> = {
    sm: 14,
    default: 14,
    lg: 16,
    xl: 16
  };
  return sizeMap[props.size];
});

const buttonClasses = computed(() => [
  'tech-button',
  `tech-button--${props.variant}`,
  `tech-button--${props.size}`,
  {
    'tech-button--icon-only': !props.label && props.icon
  }
]);

function handleClick(event: MouseEvent): void {
  if (!props.disabled && !props.loading) {
    emit('click', event);
  }
}
</script>

<template>
  <Button
    :label="label"
    :disabled="disabled"
    :loading="loading"
    :type="type"
    :size="primeVueSize"
    :severity="primeVueSeverity"
    :text="variant === 'ghost'"
    :outlined="variant === 'outline'"
    :class="buttonClasses"
    :pt="pt"
    @click="handleClick"
  >
    <template v-if="icon" #icon>
      <component :is="icon" :size="iconSize" weight="regular" />
    </template>

    <slot />
  </Button>
</template>

<style scoped>
/* Component-level styles are minimal - main styles in buttons.css */
</style>
```

---

### 2. TechIconButton.vue

**Purpose**: Icon-only button (square, no label).

#### Props

```typescript
interface TechIconButtonProps {
  icon: Component;           // Required - Phosphor icon
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'default' | 'lg';
  disabled?: boolean;
  tooltip?: string;          // Tooltip text (uses PrimeVue Tooltip directive)
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  ariaLabel?: string;        // Required for accessibility
}
```

#### Template

```vue
<template>
  <TechButton
    v-tooltip.[tooltipPosition]="tooltip"
    :icon="icon"
    :variant="variant"
    :size="size"
    :disabled="disabled"
    :aria-label="ariaLabel || tooltip"
    class="tech-icon-button"
    @click="emit('click', $event)"
  />
</template>
```

#### Full Component Code

```vue
<script setup lang="ts">
import TechButton from './TechButton.vue';
import type { Component } from 'vue';

interface Props {
  icon: Component;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'default' | 'lg';
  disabled?: boolean;
  tooltip?: string;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  ariaLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'secondary',
  size: 'default',
  disabled: false,
  tooltipPosition: 'top'
});

interface Emits {
  (e: 'click', event: MouseEvent): void;
}

const emit = defineEmits<Emits>();
</script>

<template>
  <TechButton
    v-tooltip.[tooltipPosition]="tooltip"
    :icon="icon"
    :variant="variant"
    :size="size"
    :disabled="disabled"
    :aria-label="ariaLabel || tooltip"
    class="tech-icon-button"
    @click="emit('click', $event)"
  />
</template>

<style scoped>
/* Icon button specific styles in buttons.css */
</style>
```

---

### 3. TechButtonGroup.vue

**Purpose**: Container for grouped buttons (segmented control style).

#### Props

```typescript
interface TechButtonGroupProps {
  orientation?: 'horizontal' | 'vertical';
}
```

#### Template

```vue
<template>
  <div
    class="tech-button-group"
    :class="`tech-button-group--${orientation}`"
  >
    <slot />
  </div>
</template>
```

#### Full Component Code

```vue
<script setup lang="ts">
interface Props {
  orientation?: 'horizontal' | 'vertical';
}

withDefaults(defineProps<Props>(), {
  orientation: 'horizontal'
});
</script>

<template>
  <div
    class="tech-button-group"
    :class="`tech-button-group--${orientation}`"
  >
    <slot />
  </div>
</template>

<style scoped>
/* Button group styles in buttons.css */
</style>
```

---

### 4. index.ts (Barrel Export)

```typescript
export { default as TechButton } from './TechButton.vue';
export { default as TechIconButton } from './TechIconButton.vue';
export { default as TechButtonGroup } from './TechButtonGroup.vue';
```

---

## CSS Implementation

### File: `resources/app/css/components/buttons.css`

This file contains all button styling overrides for the Technical Blueprint design system.

```css
/* ============================================
   Technical Blueprint - Button Components
   ============================================ */

/* Base Button Styles */
.tech-button.p-button {
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: 13px;
  border-radius: var(--p-content-border-radius, 6px);
  transition: all 0.15s ease;
  border: 1px solid var(--border);
  gap: 8px;
  padding: 8px 14px;
  letter-spacing: normal;
}

/* ============================================
   Variant Styles
   ============================================ */

/* Primary Variant */
.tech-button--primary.p-button {
  background: var(--cyan);
  color: var(--bg-dark);
  border-color: var(--cyan);
}

.tech-button--primary.p-button:hover:not(:disabled) {
  background: #79b8ff;
  border-color: #79b8ff;
}

.tech-button--primary.p-button:focus-visible {
  outline: 2px solid var(--cyan);
  outline-offset: 2px;
  box-shadow: none;
}

/* Secondary Variant */
.tech-button--secondary.p-button {
  background: var(--bg-elevated);
  color: var(--text-primary);
  border-color: var(--border);
}

.tech-button--secondary.p-button:hover:not(:disabled) {
  background: var(--bg-highlight);
  border-color: var(--border);
}

/* Ghost Variant */
.tech-button--ghost.p-button {
  background: transparent;
  color: var(--text-secondary);
  border-color: transparent;
}

.tech-button--ghost.p-button:hover:not(:disabled) {
  background: var(--bg-elevated);
  color: var(--text-primary);
  border-color: transparent;
}

/* Outline Variant */
.tech-button--outline.p-button {
  background: transparent;
  color: var(--cyan);
  border-color: var(--cyan);
}

.tech-button--outline.p-button:hover:not(:disabled) {
  background: var(--cyan-dim);
  border-color: var(--cyan);
}

/* Danger Variant */
.tech-button--danger.p-button {
  background: var(--red-dim);
  color: var(--red);
  border-color: var(--red);
}

.tech-button--danger.p-button:hover:not(:disabled) {
  background: var(--red);
  color: white;
  border-color: var(--red);
}

/* Success Variant */
.tech-button--success.p-button {
  background: var(--green-dim);
  color: var(--green);
  border-color: var(--green);
}

.tech-button--success.p-button:hover:not(:disabled) {
  background: var(--green);
  color: var(--bg-dark);
  border-color: var(--green);
}

/* Warning Variant */
.tech-button--warning.p-button {
  background: var(--orange-dim);
  color: var(--orange);
  border-color: var(--orange);
}

.tech-button--warning.p-button:hover:not(:disabled) {
  background: var(--orange);
  color: var(--bg-dark);
  border-color: var(--orange);
}

/* ============================================
   Size Variants
   ============================================ */

/* Small */
.tech-button--sm.p-button {
  padding: 6px 10px;
  font-size: 12px;
  height: 28px;
}

/* Default (already set in base) */
.tech-button--default.p-button {
  padding: 8px 14px;
  font-size: 13px;
  height: 36px;
}

/* Large */
.tech-button--lg.p-button {
  padding: 12px 20px;
  font-size: 14px;
  height: 44px;
}

/* Extra Large */
.tech-button--xl.p-button {
  padding: 14px 24px;
  font-size: 15px;
  height: 48px;
}

/* ============================================
   Icon Button Styles
   ============================================ */

.tech-icon-button.p-button {
  width: 36px;
  height: 36px;
  padding: 0;
  justify-content: center;
}

.tech-icon-button.tech-button--sm.p-button {
  width: 28px;
  height: 28px;
}

.tech-icon-button.tech-button--lg.p-button {
  width: 44px;
  height: 44px;
}

/* ============================================
   Button Group Styles
   ============================================ */

.tech-button-group {
  display: flex;
  gap: 0;
}

.tech-button-group--horizontal {
  flex-direction: row;
}

.tech-button-group--vertical {
  flex-direction: column;
}

/* Remove border radius from middle buttons */
.tech-button-group--horizontal > .tech-button.p-button {
  border-radius: 0;
}

.tech-button-group--horizontal > .tech-button.p-button:first-child {
  border-radius: var(--p-content-border-radius, 6px) 0 0 var(--p-content-border-radius, 6px);
}

.tech-button-group--horizontal > .tech-button.p-button:last-child {
  border-radius: 0 var(--p-content-border-radius, 6px) var(--p-content-border-radius, 6px) 0;
}

/* Remove duplicate borders between buttons */
.tech-button-group--horizontal > .tech-button.p-button:not(:last-child) {
  border-right: none;
}

.tech-button-group--vertical > .tech-button.p-button {
  border-radius: 0;
}

.tech-button-group--vertical > .tech-button.p-button:first-child {
  border-radius: var(--p-content-border-radius, 6px) var(--p-content-border-radius, 6px) 0 0;
}

.tech-button-group--vertical > .tech-button.p-button:last-child {
  border-radius: 0 0 var(--p-content-border-radius, 6px) var(--p-content-border-radius, 6px);
}

.tech-button-group--vertical > .tech-button.p-button:not(:last-child) {
  border-bottom: none;
}

/* ============================================
   Disabled State
   ============================================ */

.tech-button.p-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ============================================
   Loading State
   ============================================ */

.tech-button.p-button .p-button-loading-icon {
  color: currentColor;
}

/* ============================================
   Focus States (Accessibility)
   ============================================ */

.tech-button.p-button:focus-visible {
  outline: 2px solid var(--cyan);
  outline-offset: 2px;
  box-shadow: none;
}

/* ============================================
   Icon Alignment
   ============================================ */

.tech-button.p-button .p-button-icon {
  margin: 0; /* Remove PrimeVue default margins */
}

.tech-button.p-button .p-button-label {
  font-weight: 500;
  line-height: 1;
}
```

---

### Import in `app.css`

Add to `/var/www/resources/app/css/app.css` (after the existing imports):

```css
/* Component-specific styles */
@import './components/buttons.css';
```

---

## Usage Examples

### Basic Usage

```vue
<script setup lang="ts">
import { TechButton } from '@app/components/common/buttons';
import { PhPencil } from '@phosphor-icons/vue';

function handleEdit() {
  console.log('Edit clicked');
}
</script>

<template>
  <!-- Primary button with icon -->
  <TechButton
    variant="primary"
    label="Save Changes"
    :icon="PhPencil"
    @click="handleEdit"
  />

  <!-- Secondary button -->
  <TechButton
    variant="secondary"
    label="Cancel"
    @click="handleCancel"
  />

  <!-- Ghost button -->
  <TechButton
    variant="ghost"
    label="More Options"
  />

  <!-- Danger button -->
  <TechButton
    variant="danger"
    label="Delete"
    :icon="PhTrash"
    @click="handleDelete"
  />
</template>
```

### Size Variants

```vue
<template>
  <TechButton variant="primary" size="sm" label="Small" />
  <TechButton variant="primary" size="default" label="Default" />
  <TechButton variant="primary" size="lg" label="Large" />
  <TechButton variant="primary" size="xl" label="Extra Large" />
</template>
```

### Icon Buttons

```vue
<script setup lang="ts">
import { TechIconButton } from '@app/components/common/buttons';
import { PhPencil, PhTrash, PhDotsThree } from '@phosphor-icons/vue';
</script>

<template>
  <TechIconButton
    :icon="PhPencil"
    variant="primary"
    tooltip="Edit"
    aria-label="Edit item"
    @click="handleEdit"
  />

  <TechIconButton
    :icon="PhTrash"
    variant="danger"
    tooltip="Delete"
    aria-label="Delete item"
    @click="handleDelete"
  />

  <TechIconButton
    :icon="PhDotsThree"
    variant="ghost"
    tooltip="More options"
    aria-label="More options"
    @click="handleMore"
  />
</template>
```

### Button Groups

```vue
<script setup lang="ts">
import { TechButton, TechButtonGroup, TechIconButton } from '@app/components/common/buttons';
import { PhCaretLeft, PhCaretRight } from '@phosphor-icons/vue';
</script>

<template>
  <!-- Text button group -->
  <TechButtonGroup>
    <TechButton variant="secondary" label="Left" />
    <TechButton variant="secondary" label="Center" />
    <TechButton variant="secondary" label="Right" />
  </TechButtonGroup>

  <!-- Icon button group (pagination) -->
  <TechButtonGroup>
    <TechIconButton :icon="PhCaretLeft" variant="secondary" aria-label="Previous" />
    <TechIconButton :icon="PhCaretRight" variant="secondary" aria-label="Next" />
  </TechButtonGroup>
</template>
```

### Loading State

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { TechButton } from '@app/components/common/buttons';

const isSaving = ref(false);

async function handleSave() {
  isSaving.value = true;
  await saveData();
  isSaving.value = false;
}
</script>

<template>
  <TechButton
    variant="primary"
    label="Save"
    :loading="isSaving"
    @click="handleSave"
  />
</template>
```

### Migration Example: LeagueHeader.vue

**Before** (current code):
```vue
<Button
  label="Edit League"
  icon="pi pi-pencil"
  severity="secondary"
  class="bg-white"
  outlined
  size="small"
  @click="handleEdit"
/>
```

**After** (with TechButton):
```vue
<script setup lang="ts">
import { TechButton } from '@app/components/common/buttons';
import { PhPencil } from '@phosphor-icons/vue';
</script>

<template>
  <TechButton
    label="Edit League"
    :icon="PhPencil"
    variant="outline"
    size="sm"
    @click="handleEdit"
  />
</template>
```

---

## Testing Strategy

### Unit Tests (Vitest)

Create `/var/www/resources/app/js/components/common/buttons/TechButton.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import TechButton from './TechButton.vue';
import { PhHouse } from '@phosphor-icons/vue';
import PrimeVue from 'primevue/config';

describe('TechButton', () => {
  const mountButton = (props = {}) => {
    return mount(TechButton, {
      props,
      global: {
        plugins: [PrimeVue]
      }
    });
  };

  it('renders with label', () => {
    const wrapper = mountButton({ label: 'Click Me' });
    expect(wrapper.text()).toContain('Click Me');
  });

  it('applies correct variant class', () => {
    const wrapper = mountButton({ variant: 'primary' });
    expect(wrapper.find('.tech-button--primary').exists()).toBe(true);
  });

  it('applies correct size class', () => {
    const wrapper = mountButton({ size: 'lg' });
    expect(wrapper.find('.tech-button--lg').exists()).toBe(true);
  });

  it('renders icon when provided', () => {
    const wrapper = mountButton({ icon: PhHouse });
    expect(wrapper.findComponent(PhHouse).exists()).toBe(true);
  });

  it('emits click event when clicked', async () => {
    const wrapper = mountButton({ label: 'Click Me' });
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('click')).toBeTruthy();
  });

  it('does not emit click when disabled', async () => {
    const wrapper = mountButton({ label: 'Click Me', disabled: true });
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('click')).toBeFalsy();
  });

  it('shows loading state', () => {
    const wrapper = mountButton({ label: 'Loading', loading: true });
    expect(wrapper.find('.p-button-loading-icon').exists()).toBe(true);
  });

  it('applies all variant classes correctly', () => {
    const variants = ['primary', 'secondary', 'ghost', 'outline', 'danger', 'success', 'warning'];

    variants.forEach(variant => {
      const wrapper = mountButton({ variant: variant as any });
      expect(wrapper.find(`.tech-button--${variant}`).exists()).toBe(true);
    });
  });

  it('applies all size classes correctly', () => {
    const sizes = ['sm', 'default', 'lg', 'xl'];

    sizes.forEach(size => {
      const wrapper = mountButton({ size: size as any });
      expect(wrapper.find(`.tech-button--${size}`).exists()).toBe(true);
    });
  });
});
```

### Component Tests

Create `/var/www/resources/app/js/components/common/buttons/TechButtonGroup.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TechButtonGroup from './TechButtonGroup.vue';
import TechButton from './TechButton.vue';
import PrimeVue from 'primevue/config';

describe('TechButtonGroup', () => {
  it('renders children buttons', () => {
    const wrapper = mount(TechButtonGroup, {
      slots: {
        default: [
          mount(TechButton, { props: { label: 'Button 1' }, global: { plugins: [PrimeVue] } }),
          mount(TechButton, { props: { label: 'Button 2' }, global: { plugins: [PrimeVue] } })
        ]
      }
    });

    expect(wrapper.find('.tech-button-group').exists()).toBe(true);
  });

  it('applies horizontal orientation class by default', () => {
    const wrapper = mount(TechButtonGroup);
    expect(wrapper.find('.tech-button-group--horizontal').exists()).toBe(true);
  });

  it('applies vertical orientation class when specified', () => {
    const wrapper = mount(TechButtonGroup, {
      props: { orientation: 'vertical' }
    });
    expect(wrapper.find('.tech-button-group--vertical').exists()).toBe(true);
  });
});
```

### Visual Regression Testing

Manual testing checklist:

- [ ] All variants render with correct colors
- [ ] Hover states match design
- [ ] Focus states show cyan outline
- [ ] Disabled state shows 50% opacity
- [ ] Loading state shows spinner
- [ ] Icon buttons are square
- [ ] Button groups connect seamlessly
- [ ] All sizes match design specifications
- [ ] Typography (font, weight, size) is correct
- [ ] Transitions are smooth (0.15s)

---

## Accessibility Checklist

- [ ] All icon-only buttons have `aria-label` or `aria-labelledby`
- [ ] Focus indicators are visible (2px cyan outline)
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Disabled buttons cannot receive focus
- [ ] Loading state is announced to screen readers
- [ ] Color contrast meets WCAG AA standards:
  - Primary button (cyan bg, dark text): ✓
  - Secondary button (elevated bg, primary text): ✓
  - Danger button (red bg, white text on hover): ✓
- [ ] Button group has appropriate ARIA role
- [ ] Tooltips on icon buttons are accessible

---

## Migration Guide

### Step-by-Step Migration

1. **Identify all PrimeVue Button instances in the codebase**
   ```bash
   grep -r "from 'primevue/button'" resources/app/js/
   grep -r '<Button' resources/app/js/components/
   ```

2. **Update imports**
   ```typescript
   // Before
   import Button from 'primevue/button';

   // After
   import { TechButton } from '@app/components/common/buttons';
   ```

3. **Map PrimeVue props to TechButton props**

   | PrimeVue | TechButton |
   |----------|-----------|
   | `severity="primary"` | `variant="primary"` |
   | `severity="secondary"` | `variant="secondary"` |
   | `severity="danger"` | `variant="danger"` |
   | `severity="success"` | `variant="success"` |
   | `severity="warn"` | `variant="warning"` |
   | `outlined` | `variant="outline"` |
   | `text` | `variant="ghost"` |
   | `size="small"` | `size="sm"` |
   | `size="large"` | `size="lg"` |
   | `icon="pi pi-*"` | `:icon="PhIconName"` |

4. **Replace PrimeIcons with Phosphor Icons**
   ```typescript
   // Before
   import Button from 'primevue/button';
   <Button icon="pi pi-pencil" />

   // After
   import { TechButton } from '@app/components/common/buttons';
   import { PhPencil } from '@phosphor-icons/vue';
   <TechButton :icon="PhPencil" />
   ```

5. **Update component usage**
   ```vue
   <!-- Before -->
   <Button
     label="Save"
     severity="primary"
     size="small"
     icon="pi pi-check"
     @click="handleSave"
   />

   <!-- After -->
   <TechButton
     label="Save"
     variant="primary"
     size="sm"
     :icon="PhCheck"
     @click="handleSave"
   />
   ```

### Non-Breaking Approach

If you want to migrate gradually without breaking existing code:

1. **Phase 1**: Create TechButton components (this plan)
2. **Phase 2**: Use TechButton for all NEW components
3. **Phase 3**: Gradually migrate existing components one at a time
4. **Phase 4**: Once all migrated, optionally deprecate direct PrimeVue Button usage

---

## Implementation Checklist

### Setup
- [ ] Create directory: `resources/app/js/components/common/buttons/`
- [ ] Create directory: `resources/app/css/components/`

### Component Files
- [ ] Create `TechButton.vue`
- [ ] Create `TechIconButton.vue`
- [ ] Create `TechButtonGroup.vue`
- [ ] Create `index.ts` (barrel export)

### CSS Files
- [ ] Create `resources/app/css/components/buttons.css`
- [ ] Import `buttons.css` in `app.css`

### Testing
- [ ] Create `TechButton.test.ts`
- [ ] Create `TechIconButton.test.ts`
- [ ] Create `TechButtonGroup.test.ts`
- [ ] Run tests: `npm run test:app`
- [ ] Visual testing of all variants and sizes

### TypeScript
- [ ] Ensure all props have proper types
- [ ] Ensure emits are typed
- [ ] Run `npm run type-check`

### Linting & Formatting
- [ ] Run `npm run lint:app`
- [ ] Run `npm run format:app`

### Documentation
- [ ] Add JSDoc comments to components
- [ ] Create usage examples in comments
- [ ] Update any component documentation

### Integration
- [ ] Test buttons in existing components (e.g., LeagueHeader)
- [ ] Verify PrimeVue Tooltip directive works
- [ ] Test with forms (submit buttons)
- [ ] Test loading states
- [ ] Test disabled states

---

## Future Enhancements

### Phase 2 Considerations

1. **Additional Variants**
   - `link` variant (text button with underline)
   - `gradient` variant (gradient backgrounds)

2. **Icon Positioning**
   - Support `iconPos="right"` natively
   - Support both left and right icons simultaneously

3. **Advanced Features**
   - Badge/notification dot on buttons
   - Dropdown integration (SplitButton equivalent)
   - Keyboard shortcuts display

4. **Animation**
   - Ripple effect on click
   - Loading state transitions
   - Hover micro-interactions

5. **Responsive Behavior**
   - Auto-hide labels on mobile (icon-only)
   - Stack button groups on small screens

---

## Performance Considerations

### Bundle Size Impact

**Current**: PrimeVue Button (~8KB gzipped)
**Added**:
- TechButton wrapper: ~2KB
- TechIconButton wrapper: ~1KB
- TechButtonGroup wrapper: ~0.5KB
- buttons.css: ~3KB

**Total Added**: ~6.5KB (acceptable for design system consistency)

### Optimization Strategies

1. **Tree-shaking**: Export components individually
2. **CSS purging**: Unused variant classes removed in production
3. **Icon lazy loading**: Dynamic import for Phosphor icons if needed
4. **Component code-splitting**: Lazy load ButtonGroup if rarely used

---

## Browser Compatibility

**Target**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

**CSS Features Used**:
- CSS Variables (widely supported)
- Flexbox (widely supported)
- Border-radius (widely supported)
- Transitions (widely supported)

**No polyfills needed** for target browsers.

---

## References

- **Design Reference**: `/var/www/docs/designs/app/ideas2/technical-form/buttons.html`
- **PrimeVue Button Docs**: https://primevue.org/button/ (v4)
- **Phosphor Icons**: https://phosphoricons.com/
- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/
- **Vue 3 Composition API**: https://vuejs.org/guide/introduction.html

---

## Summary

This implementation plan provides a comprehensive button system for the Technical Blueprint design that:

1. **Leverages PrimeVue**: Uses PrimeVue v4 Button as the foundation for accessibility and functionality
2. **Matches Design**: Applies exact Technical Blueprint styling via CSS overrides
3. **Type-Safe**: Full TypeScript support with proper prop types
4. **Accessible**: Follows WCAG 2.1 AA standards
5. **Testable**: Comprehensive unit and integration test coverage
6. **Maintainable**: Clear component structure with barrel exports
7. **Extensible**: Easy to add new variants and features
8. **Migration-Friendly**: Straightforward migration path from existing PrimeVue buttons

**Key Design Decisions**:
- Wrap PrimeVue instead of building from scratch (accessibility, maintenance)
- Use Phosphor Icons instead of PrimeIcons (consistency with existing app components)
- Separate CSS file for button styles (maintainability, organization)
- Simplified prop API aligned with design system (developer experience)

**Estimated Implementation Time**: 6-8 hours
- Component creation: 3-4 hours
- CSS styling: 2-3 hours
- Testing: 2-3 hours
- Documentation: 1 hour

---

**Plan Created**: 2025-12-27
**Plan Version**: 1.0
**Target Implementation**: After Typography and Color system implementation
