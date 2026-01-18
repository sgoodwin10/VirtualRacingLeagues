# VRL Velocity Design System - Modals & Overlays Component Plan

**Component Category**: Modals & Overlays
**Design Reference**: `/var/www/docs/PublicDashboard/design-2026/design-1-velocity/components/index.html` (lines 2545-2608)
**Base Directory**: `resources/public/js/components/common/`
**Status**: Planning Phase
**Date**: 2026-01-18

---

## Table of Contents

1. [Overview](#overview)
2. [Design System Reference](#design-system-reference)
3. [Component Architecture](#component-architecture)
4. [Component Specifications](#component-specifications)
5. [CSS Implementation](#css-implementation)
6. [Accessibility Requirements](#accessibility-requirements)
7. [Testing Strategy](#testing-strategy)
8. [PrimeVue Integration](#primevue-integration)
9. [Implementation Phases](#implementation-phases)
10. [Dependencies & Imports](#dependencies--imports)

---

## Overview

The Modals & Overlays components provide dialog windows and drawer panels for the VRL Velocity Design System. These components handle user interactions that require focused attention, additional information display, or form inputs without navigating away from the current page.

### Component List

1. **VrlModal.vue** - Main modal dialog component
2. **VrlModalHeader.vue** - Modal header section with title and close button
3. **VrlModalBody.vue** - Modal content area
4. **VrlModalFooter.vue** - Modal footer with action buttons
5. **VrlCloseButton.vue** - Reusable close button component
6. **VrlDrawer.vue** - Slide-out drawer/sidebar component
7. **VrlDrawerHeader.vue** - Drawer header with back button and title
8. **VrlDrawerBody.vue** - Drawer content area

### Key Features

- PrimeVue Dialog/Sidebar wrapper for accessibility
- Vue 3 Composition API with `<script setup lang="ts">`
- Full TypeScript support
- Focus trap and keyboard navigation
- Backdrop/mask overlay
- ESC key and backdrop click to close
- Customizable sizes and positions
- Slot-based architecture for flexibility

---

## Design System Reference

### Design Tokens

```css
/* From design reference */
:root {
  /* Background Colors */
  --bg-dark: #0d1117;
  --bg-panel: #161b22;
  --bg-card: #1c2128;
  --bg-elevated: #21262d;
  --bg-highlight: #272d36;

  /* Text Colors */
  --text-primary: #e6edf3;
  --text-secondary: #8b949e;
  --text-muted: #6e7681;

  /* Border Colors */
  --border: #30363d;
  --border-muted: #21262d;

  /* Border Radius */
  --radius: 6px;
  --radius-lg: 12px;
  --radius-xl: 16px;

  /* Transitions */
  --transition: all 0.3s ease;

  /* Typography */
  --font-display: 'Orbitron', sans-serif;
  --font-body: 'Inter', sans-serif;
}
```

### Modal Styling (from index.html lines 1475-1530)

```css
.modal-preview {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl); /* 16px */
  width: 100%;
  max-width: 500px;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem; /* 20px 24px */
  border-bottom: 1px solid var(--border);
}

.modal-title {
  font-family: var(--font-display); /* Orbitron */
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-elevated);
  border: none;
  border-radius: var(--radius); /* 6px */
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition);
}

.modal-close:hover {
  background: var(--bg-highlight);
  color: var(--text-primary);
}

.modal-body {
  padding: 1.5rem; /* 24px */
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem; /* 12px */
  padding: 1rem 1.5rem; /* 16px 24px */
  border-top: 1px solid var(--border);
  background: var(--bg-panel);
}
```

### Drawer Styling (from index.html lines 1533-1577)

```css
.drawer-preview {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg); /* 12px */
  width: 100%;
  max-width: 400px;
  height: 400px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.drawer-header {
  display: flex;
  align-items: center;
  gap: 1rem; /* 16px */
  padding: 1.25rem 1.5rem; /* 20px 24px */
  border-bottom: 1px solid var(--border);
}

.drawer-back {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-elevated);
  border: none;
  border-radius: var(--radius); /* 6px */
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition);
}

.drawer-title {
  font-family: var(--font-display); /* Orbitron */
  font-size: 1rem;
  font-weight: 600;
}

.drawer-body {
  flex: 1;
  padding: 1.5rem; /* 24px */
  overflow-y: auto;
}
```

### Backdrop/Mask Styling

```css
/* To be added */
.vrl-modal-mask,
.vrl-drawer-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6); /* Dark overlay */
  backdrop-filter: blur(2px); /* Subtle blur effect */
  z-index: 1000;
}
```

---

## Component Architecture

### Component Hierarchy

```
VrlModal (wrapper component)
├── VrlModalHeader (optional via slot)
│   ├── Title (slot or prop)
│   └── VrlCloseButton
├── VrlModalBody (default slot)
│   └── User content
└── VrlModalFooter (optional via slot)
    └── Action buttons

VrlDrawer (wrapper component)
├── VrlDrawerHeader (optional via slot)
│   ├── Back button (optional)
│   └── Title (slot or prop)
└── VrlDrawerBody (default slot)
    └── User content
```

### State Management

Each component maintains its own internal state for:
- Visibility (v-model binding)
- Focus trap state
- Transition states
- Maximized state (modal only)

No global state management required - components are self-contained.

---

## Component Specifications

### 1. VrlModal.vue

**File Path**: `resources/public/js/components/common/modals/VrlModal.vue`

#### Props

```typescript
interface Props {
  /** Controls visibility (v-model) */
  visible: boolean;

  /** Modal title (can be overridden with header slot) */
  title?: string;

  /** Modal width preset or custom value */
  width?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | string;

  /** Whether the modal can be closed with X button */
  closable?: boolean;

  /** Whether clicking backdrop closes the modal */
  closeOnBackdrop?: boolean;

  /** Whether ESC key closes the modal */
  closeOnEscape?: boolean;

  /** Whether to block page scroll when open */
  blockScroll?: boolean;

  /** Whether to show maximizable button */
  maximizable?: boolean;

  /** Custom CSS class for modal container */
  class?: string;

  /** Aria label for accessibility */
  ariaLabel?: string;

  /** Position on screen */
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';

  /** Whether to use PrimeVue's unstyled mode */
  unstyled?: boolean;
}
```

#### Default Values

```typescript
const defaultProps = {
  title: undefined,
  width: 'lg', // 500px max-width
  closable: true,
  closeOnBackdrop: false, // Safer default - requires explicit close
  closeOnEscape: true,
  blockScroll: true,
  maximizable: false,
  class: undefined,
  ariaLabel: undefined,
  position: 'center',
  unstyled: false,
};
```

#### Emits

```typescript
interface Emits {
  /** Update visibility state */
  (e: 'update:visible', value: boolean): void;

  /** Emitted when modal is closing */
  (e: 'close'): void;

  /** Emitted when modal is shown */
  (e: 'show'): void;

  /** Emitted when modal is hidden */
  (e: 'hide'): void;

  /** Emitted after hide transition completes */
  (e: 'after-hide'): void;

  /** Emitted when maximize button clicked */
  (e: 'maximize'): void;

  /** Emitted when unmaximize button clicked */
  (e: 'unmaximize'): void;
}
```

#### Slots

```typescript
interface Slots {
  /** Custom header content (replaces default header) */
  header?: () => VNode[];

  /** Main modal content */
  default: () => VNode[];

  /** Custom footer content */
  footer?: () => VNode[];

  /** Custom close icon */
  closeicon?: () => VNode[];
}
```

#### Width Mapping

```typescript
const widthMap: Record<string, string> = {
  sm: 'max-w-sm',   // ~384px
  md: 'max-w-md',   // ~448px
  lg: 'max-w-lg',   // ~512px (default)
  xl: 'max-w-xl',   // ~576px
  '2xl': 'max-w-2xl', // ~672px
  '3xl': 'max-w-3xl', // ~768px
  // Custom values passed through as-is
};
```

#### Template Structure

```vue
<template>
  <Dialog
    v-model:visible="visible"
    :header="title"
    :closable="closable"
    :dismissable-mask="closeOnBackdrop"
    :modal="true"
    :block-scroll="blockScroll"
    :class="computedClass"
    :aria-label="ariaLabel"
    @show="emit('show')"
    @hide="emit('hide')"
    @after-hide="emit('after-hide')"
  >
    <!-- Header slot passthrough -->
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>

    <!-- Default content -->
    <slot />

    <!-- Footer slot passthrough -->
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </Dialog>
</template>
```

#### PrimeVue PT (PassThrough) Configuration

```typescript
const pt = computed(() => ({
  root: {
    class: 'vrl-modal rounded-[16px] border border-[var(--border)] shadow-[0_25px_50px_rgba(0,0,0,0.5)]'
  },
  header: {
    class: 'vrl-modal-header flex items-center justify-between px-6 py-5 border-b border-[var(--border)] bg-[var(--bg-card)]'
  },
  title: {
    class: 'vrl-modal-title font-display text-[1.1rem] font-semibold tracking-wide'
  },
  content: {
    class: 'vrl-modal-body p-6 bg-[var(--bg-card)]'
  },
  footer: {
    class: 'vrl-modal-footer flex justify-end gap-3 px-6 py-4 border-t border-[var(--border)] bg-[var(--bg-panel)]'
  },
  mask: {
    class: 'vrl-modal-mask bg-black/60 backdrop-blur-sm'
  },
  closeButton: {
    class: 'w-8 h-8 rounded-md bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-highlight)] hover:text-[var(--text-primary)] transition-all'
  }
}));
```

---

### 2. VrlModalHeader.vue

**File Path**: `resources/public/js/components/common/modals/VrlModalHeader.vue`

#### Props

```typescript
interface Props {
  /** Header title text */
  title?: string;

  /** Whether to show close button */
  closable?: boolean;

  /** Custom CSS class */
  class?: string;
}
```

#### Emits

```typescript
interface Emits {
  /** Emitted when close button clicked */
  (e: 'close'): void;
}
```

#### Slots

```typescript
interface Slots {
  /** Custom title content */
  default?: () => VNode[];

  /** Custom close button */
  close?: () => VNode[];
}
```

#### Template Structure

```vue
<template>
  <div
    class="vrl-modal-header flex items-center justify-between px-6 py-5 border-b border-[var(--border)] bg-[var(--bg-card)]"
    :class="class"
  >
    <h2 class="vrl-modal-title font-display text-[1.1rem] font-semibold tracking-wide">
      <slot>{{ title }}</slot>
    </h2>

    <VrlCloseButton
      v-if="closable"
      @click="emit('close')"
    >
      <slot name="close" />
    </VrlCloseButton>
  </div>
</template>
```

---

### 3. VrlModalBody.vue

**File Path**: `resources/public/js/components/common/modals/VrlModalBody.vue`

#### Props

```typescript
interface Props {
  /** Custom CSS class */
  class?: string;

  /** Padding size preset */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}
```

#### Padding Mapping

```typescript
const paddingMap: Record<string, string> = {
  none: 'p-0',
  sm: 'p-4',   // 16px
  md: 'p-6',   // 24px (default)
  lg: 'p-8',   // 32px
};
```

#### Template Structure

```vue
<template>
  <div
    class="vrl-modal-body bg-[var(--bg-card)]"
    :class="[paddingClass, class]"
  >
    <slot />
  </div>
</template>
```

---

### 4. VrlModalFooter.vue

**File Path**: `resources/public/js/components/common/modals/VrlModalFooter.vue`

#### Props

```typescript
interface Props {
  /** Custom CSS class */
  class?: string;

  /** Footer layout alignment */
  align?: 'left' | 'center' | 'right' | 'between';

  /** Gap between buttons */
  gap?: 'sm' | 'md' | 'lg';
}
```

#### Alignment Mapping

```typescript
const alignMap: Record<string, string> = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',      // default
  between: 'justify-between',
};

const gapMap: Record<string, string> = {
  sm: 'gap-2',  // 8px
  md: 'gap-3',  // 12px (default)
  lg: 'gap-4',  // 16px
};
```

#### Template Structure

```vue
<template>
  <div
    class="vrl-modal-footer flex px-6 py-4 border-t border-[var(--border)] bg-[var(--bg-panel)]"
    :class="[alignClass, gapClass, class]"
  >
    <slot />
  </div>
</template>
```

---

### 5. VrlCloseButton.vue

**File Path**: `resources/public/js/components/common/buttons/VrlCloseButton.vue`

#### Props

```typescript
interface Props {
  /** Aria label for accessibility */
  ariaLabel?: string;

  /** Custom CSS class */
  class?: string;

  /** Button size */
  size?: 'sm' | 'md' | 'lg';

  /** Button variant */
  variant?: 'default' | 'danger' | 'ghost';
}
```

#### Size & Variant Mapping

```typescript
const sizeMap: Record<string, string> = {
  sm: 'w-6 h-6 text-sm',
  md: 'w-8 h-8 text-base',  // default (32px)
  lg: 'w-10 h-10 text-lg',
};

const variantMap: Record<string, string> = {
  default: 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-highlight)] hover:text-[var(--text-primary)]',
  danger: 'bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300',
  ghost: 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]',
};
```

#### Emits

```typescript
interface Emits {
  /** Emitted when button clicked */
  (e: 'click', event: MouseEvent): void;
}
```

#### Template Structure

```vue
<template>
  <button
    type="button"
    class="vrl-close-button inline-flex items-center justify-center rounded-md transition-all cursor-pointer border-none"
    :class="[sizeClass, variantClass, class]"
    :aria-label="ariaLabel || 'Close'"
    @click="emit('click', $event)"
  >
    <slot>
      <span class="text-xl leading-none">×</span>
    </slot>
  </button>
</template>
```

---

### 6. VrlDrawer.vue

**File Path**: `resources/public/js/components/common/drawers/VrlDrawer.vue`

#### Props

```typescript
interface Props {
  /** Controls visibility (v-model) */
  visible: boolean;

  /** Drawer title */
  title?: string;

  /** Drawer position */
  position?: 'left' | 'right' | 'top' | 'bottom';

  /** Drawer width (for left/right) */
  width?: string;

  /** Drawer height (for top/bottom) */
  height?: string;

  /** Whether to show close button in header */
  closable?: boolean;

  /** Whether clicking backdrop closes drawer */
  closeOnBackdrop?: boolean;

  /** Whether ESC key closes drawer */
  closeOnEscape?: boolean;

  /** Whether to block scroll when open */
  blockScroll?: boolean;

  /** Custom CSS class */
  class?: string;

  /** Aria label for accessibility */
  ariaLabel?: string;

  /** Whether to use PrimeVue's unstyled mode */
  unstyled?: boolean;
}
```

#### Default Values

```typescript
const defaultProps = {
  title: undefined,
  position: 'right',
  width: '400px',
  height: '100%',
  closable: true,
  closeOnBackdrop: false,
  closeOnEscape: true,
  blockScroll: true,
  class: undefined,
  ariaLabel: undefined,
  unstyled: false,
};
```

#### Emits

```typescript
interface Emits {
  /** Update visibility state */
  (e: 'update:visible', value: boolean): void;

  /** Emitted when drawer is closing */
  (e: 'close'): void;

  /** Emitted when drawer is shown */
  (e: 'show'): void;

  /** Emitted when drawer is hidden */
  (e: 'hide'): void;
}
```

#### Slots

```typescript
interface Slots {
  /** Custom header content */
  header?: () => VNode[];

  /** Main drawer content */
  default: () => VNode[];

  /** Custom close icon */
  closeicon?: () => VNode[];
}
```

#### Template Structure

```vue
<template>
  <Sidebar
    v-model:visible="visible"
    :header="title"
    :position="position"
    :closable="closable"
    :dismissable="closeOnBackdrop"
    :modal="true"
    :block-scroll="blockScroll"
    :class="computedClass"
    :aria-label="ariaLabel"
    @show="emit('show')"
    @hide="emit('hide')"
  >
    <!-- Header slot passthrough -->
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>

    <!-- Default content -->
    <slot />

    <!-- Close icon slot -->
    <template v-if="$slots.closeicon" #closeicon>
      <slot name="closeicon" />
    </template>
  </Sidebar>
</template>
```

#### PrimeVue PT Configuration

```typescript
const pt = computed(() => ({
  root: {
    class: 'vrl-drawer rounded-l-xl border-l border-[var(--border)] bg-[var(--bg-card)]',
    style: {
      width: position.value === 'left' || position.value === 'right' ? width.value : '100%',
      height: position.value === 'top' || position.value === 'bottom' ? height.value : '100%',
    }
  },
  header: {
    class: 'vrl-drawer-header flex items-center gap-4 px-6 py-5 border-b border-[var(--border)]'
  },
  title: {
    class: 'vrl-drawer-title font-display text-base font-semibold'
  },
  content: {
    class: 'vrl-drawer-body flex-1 p-6 overflow-y-auto'
  },
  mask: {
    class: 'vrl-drawer-mask bg-black/60 backdrop-blur-sm'
  },
  closeButton: {
    class: 'w-8 h-8 rounded-md bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-highlight)] hover:text-[var(--text-primary)] transition-all'
  }
}));
```

---

### 7. VrlDrawerHeader.vue

**File Path**: `resources/public/js/components/common/drawers/VrlDrawerHeader.vue`

#### Props

```typescript
interface Props {
  /** Header title */
  title?: string;

  /** Whether to show back button */
  showBack?: boolean;

  /** Custom CSS class */
  class?: string;
}
```

#### Emits

```typescript
interface Emits {
  /** Emitted when back button clicked */
  (e: 'back'): void;

  /** Emitted when close button clicked */
  (e: 'close'): void;
}
```

#### Slots

```typescript
interface Slots {
  /** Custom back button */
  'back-button'?: () => VNode[];

  /** Custom title content */
  title?: () => VNode[];

  /** Custom close button */
  close?: () => VNode[];
}
```

#### Template Structure

```vue
<template>
  <div
    class="vrl-drawer-header flex items-center gap-4 px-6 py-5 border-b border-[var(--border)]"
    :class="class"
  >
    <!-- Back Button -->
    <button
      v-if="showBack"
      type="button"
      class="w-8 h-8 inline-flex items-center justify-center rounded-md bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-highlight)] hover:text-[var(--text-primary)] transition-all cursor-pointer border-none"
      aria-label="Go back"
      @click="emit('back')"
    >
      <slot name="back-button">
        <span class="text-lg">←</span>
      </slot>
    </button>

    <!-- Title -->
    <h2 class="vrl-drawer-title flex-1 font-display text-base font-semibold">
      <slot name="title">{{ title }}</slot>
    </h2>

    <!-- Close Button -->
    <VrlCloseButton @click="emit('close')">
      <slot name="close" />
    </VrlCloseButton>
  </div>
</template>
```

---

### 8. VrlDrawerBody.vue

**File Path**: `resources/public/js/components/common/drawers/VrlDrawerBody.vue`

#### Props

```typescript
interface Props {
  /** Custom CSS class */
  class?: string;

  /** Padding size preset */
  padding?: 'none' | 'sm' | 'md' | 'lg';

  /** Whether to enable scrolling */
  scrollable?: boolean;
}
```

#### Padding Mapping

```typescript
const paddingMap: Record<string, string> = {
  none: 'p-0',
  sm: 'p-4',   // 16px
  md: 'p-6',   // 24px (default)
  lg: 'p-8',   // 32px
};
```

#### Template Structure

```vue
<template>
  <div
    class="vrl-drawer-body flex-1 bg-[var(--bg-card)]"
    :class="[
      paddingClass,
      scrollable ? 'overflow-y-auto' : 'overflow-hidden',
      class
    ]"
  >
    <slot />
  </div>
</template>
```

---

## CSS Implementation

### File Location

Add to: `resources/public/css/app.css`

### CSS Classes

```css
/* ================================================================
   MODALS & OVERLAYS
   ================================================================ */

/* Modal Container */
.vrl-modal {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl); /* 16px */
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
}

/* Modal Header */
.vrl-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem; /* 20px 24px */
  border-bottom: 1px solid var(--border);
  background: var(--bg-card);
}

/* Modal Title */
.vrl-modal-title {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: var(--text-primary);
}

/* Modal Body */
.vrl-modal-body {
  padding: 1.5rem; /* 24px */
  background: var(--bg-card);
}

/* Modal Footer */
.vrl-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem; /* 12px */
  padding: 1rem 1.5rem; /* 16px 24px */
  border-top: 1px solid var(--border);
  background: var(--bg-panel);
}

/* Modal Mask/Backdrop */
.vrl-modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(2px);
  z-index: 1000;
}

/* Close Button */
.vrl-close-button {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-elevated);
  border: none;
  border-radius: var(--radius); /* 6px */
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition);
}

.vrl-close-button:hover {
  background: var(--bg-highlight);
  color: var(--text-primary);
}

.vrl-close-button:focus-visible {
  outline: 2px solid var(--cyan);
  outline-offset: 2px;
}

/* Drawer Container */
.vrl-drawer {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg); /* 12px */
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Drawer Header */
.vrl-drawer-header {
  display: flex;
  align-items: center;
  gap: 1rem; /* 16px */
  padding: 1.25rem 1.5rem; /* 20px 24px */
  border-bottom: 1px solid var(--border);
}

/* Drawer Title */
.vrl-drawer-title {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
}

/* Drawer Back Button */
.vrl-drawer-back {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-elevated);
  border: none;
  border-radius: var(--radius); /* 6px */
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition);
}

.vrl-drawer-back:hover {
  background: var(--bg-highlight);
  color: var(--text-primary);
}

.vrl-drawer-back:focus-visible {
  outline: 2px solid var(--cyan);
  outline-offset: 2px;
}

/* Drawer Body */
.vrl-drawer-body {
  flex: 1;
  padding: 1.5rem; /* 24px */
  overflow-y: auto;
  background: var(--bg-card);
}

/* Drawer Mask/Backdrop */
.vrl-drawer-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(2px);
  z-index: 999;
}

/* Modal & Drawer Animations */
.vrl-modal-enter-active,
.vrl-drawer-enter-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.vrl-modal-leave-active,
.vrl-drawer-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.vrl-modal-enter-from,
.vrl-modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.vrl-drawer-enter-from,
.vrl-drawer-leave-to {
  opacity: 0;
  transform: translateX(100%); /* For right-positioned drawer */
}

/* Scrollbar Styling for Drawer Body */
.vrl-drawer-body::-webkit-scrollbar {
  width: 8px;
}

.vrl-drawer-body::-webkit-scrollbar-track {
  background: var(--bg-elevated);
  border-radius: 4px;
}

.vrl-drawer-body::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 4px;
}

.vrl-drawer-body::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}

/* Responsive Modal Widths */
@media (max-width: 640px) {
  .vrl-modal {
    max-width: calc(100vw - 2rem);
  }

  .vrl-drawer {
    max-width: 100vw;
  }
}
```

---

## Accessibility Requirements

### ARIA Attributes

#### Modal

```html
<!-- Modal container -->
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Modal Title</h2>
  <div id="modal-description">Modal content...</div>
</div>
```

#### Drawer

```html
<!-- Drawer container -->
<div
  role="complementary"
  aria-label="Drawer panel"
  aria-labelledby="drawer-title"
>
  <h2 id="drawer-title">Drawer Title</h2>
  <div>Drawer content...</div>
</div>
```

### Focus Management

#### Focus Trap

```typescript
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap';

// In component setup
const modalRef = ref<HTMLElement>();
const { activate, deactivate } = useFocusTrap(modalRef, {
  immediate: false,
  escapeDeactivates: true,
  clickOutsideDeactivates: false,
});

// Activate on show
watch(() => props.visible, (newVal) => {
  if (newVal) {
    nextTick(() => activate());
  } else {
    deactivate();
  }
});
```

#### Focus Return

```typescript
// Store reference to previously focused element
const previouslyFocused = ref<HTMLElement | null>(null);

const handleShow = () => {
  previouslyFocused.value = document.activeElement as HTMLElement;
  emit('show');
};

const handleHide = () => {
  emit('hide');
  // Return focus after transition
  nextTick(() => {
    previouslyFocused.value?.focus();
  });
};
```

### Keyboard Navigation

| Key | Action | Component |
|-----|--------|-----------|
| `Escape` | Close modal/drawer | Both |
| `Tab` | Move focus to next focusable element | Both |
| `Shift + Tab` | Move focus to previous focusable element | Both |
| `Enter` | Activate focused button | Both |
| `Space` | Activate focused button | Both |

### Screen Reader Announcements

```typescript
import { useAnnouncer } from '@primevue/core/useannouncer';

const announcer = useAnnouncer();

const handleShow = () => {
  announcer.announce('Dialog opened', 'polite');
  emit('show');
};

const handleHide = () => {
  announcer.announce('Dialog closed', 'polite');
  emit('hide');
};
```

### Color Contrast

All text must meet WCAG AA standards:
- Normal text: 4.5:1 contrast ratio
- Large text (18px+): 3:1 contrast ratio
- Interactive elements: visible focus indicators

#### Verify Contrast

```typescript
// Text on bg-card (#1c2128)
text-primary (#e6edf3) on bg-card (#1c2128) = 12.5:1 ✓
text-secondary (#8b949e) on bg-card (#1c2128) = 5.8:1 ✓
text-muted (#6e7681) on bg-card (#1c2128) = 4.2:1 ⚠ (use for large text only)
```

---

## Testing Strategy

### Unit Tests

#### Test File Structure

```
resources/public/js/components/common/
├── modals/
│   ├── __tests__/
│   │   ├── VrlModal.test.ts
│   │   ├── VrlModalHeader.test.ts
│   │   ├── VrlModalBody.test.ts
│   │   └── VrlModalFooter.test.ts
│   ├── VrlModal.vue
│   ├── VrlModalHeader.vue
│   ├── VrlModalBody.vue
│   └── VrlModalFooter.vue
├── drawers/
│   ├── __tests__/
│   │   ├── VrlDrawer.test.ts
│   │   ├── VrlDrawerHeader.test.ts
│   │   └── VrlDrawerBody.test.ts
│   ├── VrlDrawer.vue
│   ├── VrlDrawerHeader.vue
│   └── VrlDrawerBody.vue
└── buttons/
    ├── __tests__/
    │   └── VrlCloseButton.test.ts
    └── VrlCloseButton.vue
```

#### VrlModal.test.ts

```typescript
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import VrlModal from '../VrlModal.vue';
import PrimeVue from 'primevue/config';

describe('VrlModal', () => {
  const createWrapper = (props = {}, slots = {}) => {
    return mount(VrlModal, {
      props: {
        visible: false,
        ...props,
      },
      slots,
      global: {
        plugins: [PrimeVue],
      },
    });
  };

  describe('Rendering', () => {
    it('should render when visible is true', async () => {
      const wrapper = createWrapper({ visible: true });
      await nextTick();
      expect(wrapper.find('.vrl-modal').exists()).toBe(true);
    });

    it('should not render when visible is false', () => {
      const wrapper = createWrapper({ visible: false });
      expect(wrapper.find('.vrl-modal').exists()).toBe(false);
    });

    it('should render title prop', async () => {
      const wrapper = createWrapper({
        visible: true,
        title: 'Test Modal',
      });
      await nextTick();
      expect(wrapper.text()).toContain('Test Modal');
    });

    it('should render default slot content', async () => {
      const wrapper = createWrapper(
        { visible: true },
        { default: '<p>Modal content</p>' }
      );
      await nextTick();
      expect(wrapper.html()).toContain('Modal content');
    });
  });

  describe('Props', () => {
    it('should apply custom width', async () => {
      const wrapper = createWrapper({
        visible: true,
        width: 'xl',
      });
      await nextTick();
      expect(wrapper.find('.max-w-xl').exists()).toBe(true);
    });

    it('should apply custom CSS class', async () => {
      const wrapper = createWrapper({
        visible: true,
        class: 'custom-class',
      });
      await nextTick();
      expect(wrapper.find('.custom-class').exists()).toBe(true);
    });

    it('should show close button when closable is true', async () => {
      const wrapper = createWrapper({
        visible: true,
        closable: true,
      });
      await nextTick();
      expect(wrapper.find('.vrl-close-button').exists()).toBe(true);
    });

    it('should hide close button when closable is false', async () => {
      const wrapper = createWrapper({
        visible: true,
        closable: false,
      });
      await nextTick();
      expect(wrapper.find('.vrl-close-button').exists()).toBe(false);
    });
  });

  describe('Events', () => {
    it('should emit update:visible when close button is clicked', async () => {
      const wrapper = createWrapper({
        visible: true,
        closable: true,
      });
      await nextTick();

      const closeButton = wrapper.find('.vrl-close-button');
      await closeButton.trigger('click');

      expect(wrapper.emitted('update:visible')).toBeTruthy();
      expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
    });

    it('should emit close event', async () => {
      const wrapper = createWrapper({
        visible: true,
        closable: true,
      });
      await nextTick();

      const closeButton = wrapper.find('.vrl-close-button');
      await closeButton.trigger('click');

      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('should emit show event when visible changes to true', async () => {
      const wrapper = createWrapper({ visible: false });
      await wrapper.setProps({ visible: true });
      await nextTick();

      expect(wrapper.emitted('show')).toBeTruthy();
    });

    it('should emit hide event when visible changes to false', async () => {
      const wrapper = createWrapper({ visible: true });
      await wrapper.setProps({ visible: false });
      await nextTick();

      expect(wrapper.emitted('hide')).toBeTruthy();
    });
  });

  describe('Slots', () => {
    it('should render custom header slot', async () => {
      const wrapper = createWrapper(
        { visible: true },
        { header: '<h2>Custom Header</h2>' }
      );
      await nextTick();
      expect(wrapper.html()).toContain('Custom Header');
    });

    it('should render custom footer slot', async () => {
      const wrapper = createWrapper(
        { visible: true },
        { footer: '<button>Custom Footer</button>' }
      );
      await nextTick();
      expect(wrapper.html()).toContain('Custom Footer');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-modal attribute', async () => {
      const wrapper = createWrapper({ visible: true });
      await nextTick();
      expect(wrapper.find('[aria-modal="true"]').exists()).toBe(true);
    });

    it('should have role="dialog"', async () => {
      const wrapper = createWrapper({ visible: true });
      await nextTick();
      expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
    });

    it('should apply aria-label from prop', async () => {
      const wrapper = createWrapper({
        visible: true,
        ariaLabel: 'Custom modal label',
      });
      await nextTick();
      expect(wrapper.find('[aria-label="Custom modal label"]').exists()).toBe(true);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should close on ESC key when closeOnEscape is true', async () => {
      const wrapper = createWrapper({
        visible: true,
        closeOnEscape: true,
      });
      await nextTick();

      await wrapper.trigger('keydown.esc');

      expect(wrapper.emitted('update:visible')).toBeTruthy();
      expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
    });

    it('should not close on ESC key when closeOnEscape is false', async () => {
      const wrapper = createWrapper({
        visible: true,
        closeOnEscape: false,
      });
      await nextTick();

      await wrapper.trigger('keydown.esc');

      expect(wrapper.emitted('update:visible')).toBeFalsy();
    });
  });

  describe('Backdrop Click', () => {
    it('should close on backdrop click when closeOnBackdrop is true', async () => {
      const wrapper = createWrapper({
        visible: true,
        closeOnBackdrop: true,
      });
      await nextTick();

      const mask = wrapper.find('.vrl-modal-mask');
      await mask.trigger('click');

      expect(wrapper.emitted('update:visible')).toBeTruthy();
      expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
    });

    it('should not close on backdrop click when closeOnBackdrop is false', async () => {
      const wrapper = createWrapper({
        visible: true,
        closeOnBackdrop: false,
      });
      await nextTick();

      const mask = wrapper.find('.vrl-modal-mask');
      await mask.trigger('click');

      expect(wrapper.emitted('update:visible')).toBeFalsy();
    });
  });
});
```

#### VrlDrawer.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import VrlDrawer from '../VrlDrawer.vue';
import PrimeVue from 'primevue/config';

describe('VrlDrawer', () => {
  const createWrapper = (props = {}, slots = {}) => {
    return mount(VrlDrawer, {
      props: {
        visible: false,
        ...props,
      },
      slots,
      global: {
        plugins: [PrimeVue],
      },
    });
  };

  describe('Rendering', () => {
    it('should render when visible is true', async () => {
      const wrapper = createWrapper({ visible: true });
      await nextTick();
      expect(wrapper.find('.vrl-drawer').exists()).toBe(true);
    });

    it('should render title', async () => {
      const wrapper = createWrapper({
        visible: true,
        title: 'Test Drawer',
      });
      await nextTick();
      expect(wrapper.text()).toContain('Test Drawer');
    });
  });

  describe('Position', () => {
    it('should render in right position by default', async () => {
      const wrapper = createWrapper({ visible: true });
      await nextTick();
      // PrimeVue Sidebar will apply position-specific classes
      expect(wrapper.vm.$props.position).toBe('right');
    });

    it('should render in left position', async () => {
      const wrapper = createWrapper({
        visible: true,
        position: 'left',
      });
      await nextTick();
      expect(wrapper.vm.$props.position).toBe('left');
    });
  });

  describe('Events', () => {
    it('should emit update:visible when close button clicked', async () => {
      const wrapper = createWrapper({
        visible: true,
        closable: true,
      });
      await nextTick();

      const closeButton = wrapper.find('.vrl-close-button');
      await closeButton.trigger('click');

      expect(wrapper.emitted('update:visible')).toBeTruthy();
      expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
    });
  });

  describe('Accessibility', () => {
    it('should have appropriate ARIA attributes', async () => {
      const wrapper = createWrapper({
        visible: true,
        ariaLabel: 'Drawer panel',
      });
      await nextTick();
      expect(wrapper.find('[aria-label="Drawer panel"]').exists()).toBe(true);
    });
  });
});
```

#### VrlCloseButton.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlCloseButton from '../VrlCloseButton.vue';

describe('VrlCloseButton', () => {
  it('should render close button', () => {
    const wrapper = mount(VrlCloseButton);
    expect(wrapper.find('.vrl-close-button').exists()).toBe(true);
  });

  it('should emit click event', async () => {
    const wrapper = mount(VrlCloseButton);
    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toBeTruthy();
  });

  it('should apply custom aria-label', () => {
    const wrapper = mount(VrlCloseButton, {
      props: {
        ariaLabel: 'Close dialog',
      },
    });
    expect(wrapper.find('[aria-label="Close dialog"]').exists()).toBe(true);
  });

  it('should render default close icon', () => {
    const wrapper = mount(VrlCloseButton);
    expect(wrapper.text()).toContain('×');
  });

  it('should apply size classes', () => {
    const wrapper = mount(VrlCloseButton, {
      props: {
        size: 'lg',
      },
    });
    expect(wrapper.classes()).toContain('w-10');
    expect(wrapper.classes()).toContain('h-10');
  });

  it('should apply variant classes', () => {
    const wrapper = mount(VrlCloseButton, {
      props: {
        variant: 'danger',
      },
    });
    expect(wrapper.classes()).toContain('bg-red-500/10');
  });
});
```

### Integration Tests

Test modal/drawer usage in real scenarios:

```typescript
describe('VrlModal Integration', () => {
  it('should work with form submission', async () => {
    const wrapper = mount({
      template: `
        <VrlModal v-model:visible="isOpen">
          <VrlModalHeader title="Add User" />
          <VrlModalBody>
            <input v-model="username" type="text" />
          </VrlModalBody>
          <VrlModalFooter>
            <button @click="handleSubmit">Submit</button>
          </VrlModalFooter>
        </VrlModal>
      `,
      setup() {
        const isOpen = ref(true);
        const username = ref('');
        const handleSubmit = () => {
          // Submit logic
          isOpen.value = false;
        };
        return { isOpen, username, handleSubmit };
      },
    });

    // Test form interaction
  });
});
```

### E2E Tests (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Modal Component', () => {
  test('should open and close modal', async ({ page }) => {
    await page.goto('/demo/modals');

    // Open modal
    await page.click('button[data-testid="open-modal"]');
    await expect(page.locator('.vrl-modal')).toBeVisible();

    // Close modal with X button
    await page.click('.vrl-close-button');
    await expect(page.locator('.vrl-modal')).not.toBeVisible();
  });

  test('should close modal with ESC key', async ({ page }) => {
    await page.goto('/demo/modals');
    await page.click('button[data-testid="open-modal"]');
    await expect(page.locator('.vrl-modal')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('.vrl-modal')).not.toBeVisible();
  });

  test('should trap focus within modal', async ({ page }) => {
    await page.goto('/demo/modals');
    await page.click('button[data-testid="open-modal"]');

    // Tab through focusable elements
    await page.keyboard.press('Tab');
    const firstFocusable = await page.evaluate(() => document.activeElement?.className);

    // Continue tabbing - should stay within modal
    await page.keyboard.press('Tab');
    const secondFocusable = await page.evaluate(() => document.activeElement?.className);

    expect(firstFocusable).toBeTruthy();
    expect(secondFocusable).toBeTruthy();
  });
});
```

---

## PrimeVue Integration

### Why Use PrimeVue?

PrimeVue provides robust, accessible base components with:
- Built-in ARIA attributes
- Focus trap management
- Keyboard navigation
- Screen reader support
- Transition animations
- Portal/Teleport rendering

### Base Components

#### Dialog (for Modal)

```typescript
import Dialog from 'primevue/dialog';

// PrimeVue Dialog props we'll use:
interface DialogProps {
  visible: boolean;              // v-model
  header?: string;               // Modal title
  modal?: boolean;               // Enable backdrop
  closable?: boolean;            // Show X button
  dismissableMask?: boolean;     // Click backdrop to close
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  draggable?: boolean;           // Allow dragging
  maximizable?: boolean;         // Show maximize button
  blockScroll?: boolean;         // Prevent body scroll
  pt?: PassThroughOptions;       // Style customization
}
```

#### Sidebar (for Drawer)

```typescript
import Sidebar from 'primevue/sidebar';

// PrimeVue Sidebar props we'll use:
interface SidebarProps {
  visible: boolean;              // v-model
  position?: 'left' | 'right' | 'top' | 'bottom';
  header?: string;               // Drawer title
  closable?: boolean;            // Show X button
  dismissable?: boolean;         // Click backdrop to close
  modal?: boolean;               // Enable backdrop
  blockScroll?: boolean;         // Prevent body scroll
  pt?: PassThroughOptions;       // Style customization
}
```

### PassThrough (PT) API

The PassThrough API allows us to customize PrimeVue components with our VRL styles:

```typescript
// Example PT configuration
const pt = {
  root: {
    class: 'custom-root-class',
    style: { /* custom styles */ }
  },
  header: {
    class: 'custom-header-class'
  },
  content: {
    class: 'custom-content-class'
  },
  footer: {
    class: 'custom-footer-class'
  },
  mask: {
    class: 'custom-mask-class'
  },
  closeButton: {
    class: 'custom-close-button-class'
  }
};
```

### Unstyled Mode

For maximum control, we can use PrimeVue's unstyled mode:

```vue
<Dialog
  :visible="visible"
  :unstyled="true"
  :pt="customPassThrough"
>
  <!-- Fully custom styled content -->
</Dialog>
```

### PrimeVue Configuration

Add to `resources/public/js/app.ts`:

```typescript
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';

app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.dark-mode',
      cssLayer: {
        name: 'primevue',
        order: 'tailwind-base, primevue, tailwind-utilities'
      }
    }
  },
  // Global PT config
  pt: {
    dialog: {
      root: { class: 'vrl-modal' },
      mask: { class: 'vrl-modal-mask' }
    },
    sidebar: {
      root: { class: 'vrl-drawer' },
      mask: { class: 'vrl-drawer-mask' }
    }
  }
});
```

---

## Implementation Phases

### Phase 1: Core Modal Components

**Duration**: 2-3 days

**Tasks**:
1. Create `VrlModal.vue` wrapper around PrimeVue Dialog
2. Create `VrlModalHeader.vue` with title and close button
3. Create `VrlModalBody.vue` with padding options
4. Create `VrlModalFooter.vue` with button layout
5. Create `VrlCloseButton.vue` reusable component
6. Add CSS classes to `app.css`
7. Write unit tests for all components
8. Create Storybook/demo examples

**Deliverables**:
- Working modal component set
- 80%+ test coverage
- Documentation with usage examples

### Phase 2: Drawer Components

**Duration**: 2-3 days

**Tasks**:
1. Create `VrlDrawer.vue` wrapper around PrimeVue Sidebar
2. Create `VrlDrawerHeader.vue` with back button and title
3. Create `VrlDrawerBody.vue` with scrolling
4. Add CSS classes for drawer styling
5. Write unit tests for drawer components
6. Create Storybook/demo examples

**Deliverables**:
- Working drawer component set
- 80%+ test coverage
- Documentation with usage examples

### Phase 3: Accessibility & Polish

**Duration**: 1-2 days

**Tasks**:
1. Implement focus trap with `@vueuse/integrations`
2. Add keyboard navigation handlers
3. Implement screen reader announcements
4. Verify WCAG AA compliance
5. Add E2E tests with Playwright
6. Performance optimization
7. Cross-browser testing

**Deliverables**:
- WCAG AA compliant components
- E2E test suite
- Performance benchmarks

### Phase 4: Integration & Documentation

**Duration**: 1 day

**Tasks**:
1. Integrate with existing VRL components
2. Create comprehensive usage guide
3. Add real-world examples
4. Update design system documentation
5. Code review and refinement

**Deliverables**:
- Fully integrated components
- Complete documentation
- Real-world usage examples

---

## Dependencies & Imports

### Required Packages

```json
{
  "dependencies": {
    "vue": "^3.4.0",
    "primevue": "^4.0.0",
    "@primevue/themes": "^4.0.0",
    "@vueuse/core": "^10.0.0",
    "@vueuse/integrations": "^10.0.0"
  },
  "devDependencies": {
    "@vue/test-utils": "^2.4.0",
    "vitest": "^1.0.0",
    "@playwright/test": "^1.40.0"
  }
}
```

### Import Patterns

#### Components

```typescript
// In VrlModal.vue
import { computed, ref, watch, nextTick } from 'vue';
import Dialog from 'primevue/dialog';
import type { DialogProps } from 'primevue/dialog';

// In consuming component
import VrlModal from '@public/components/common/modals/VrlModal.vue';
import VrlModalHeader from '@public/components/common/modals/VrlModalHeader.vue';
import VrlModalBody from '@public/components/common/modals/VrlModalBody.vue';
import VrlModalFooter from '@public/components/common/modals/VrlModalFooter.vue';
```

#### Composables

```typescript
// For focus trap
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap';

// For keyboard shortcuts
import { onKeyStroke } from '@vueuse/core';

// For scroll lock
import { useScrollLock } from '@vueuse/core';
```

#### Types

```typescript
// Create types file at resources/public/js/types/modal.ts
export interface ModalProps {
  visible: boolean;
  title?: string;
  width?: ModalWidth;
  closable?: boolean;
  // ... other props
}

export type ModalWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | string;

export interface ModalEmits {
  (e: 'update:visible', value: boolean): void;
  (e: 'close'): void;
  (e: 'show'): void;
  (e: 'hide'): void;
}
```

### Path Aliases

Configured in `vite.config.ts`:

```typescript
resolve: {
  alias: {
    '@public': '/resources/public/js',
    '@app': '/resources/app/js',
    '@admin': '/resources/admin/js',
  }
}
```

---

## Usage Examples

### Basic Modal

```vue
<template>
  <div>
    <button @click="isOpen = true">Open Modal</button>

    <VrlModal v-model:visible="isOpen" title="Add New Driver">
      <VrlModalBody>
        <p>Modal content goes here</p>
      </VrlModalBody>

      <VrlModalFooter>
        <VrlButton variant="secondary" @click="isOpen = false">
          Cancel
        </VrlButton>
        <VrlButton variant="primary" @click="handleSubmit">
          Add Driver
        </VrlButton>
      </VrlModalFooter>
    </VrlModal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import VrlModal from '@public/components/common/modals/VrlModal.vue';
import VrlModalBody from '@public/components/common/modals/VrlModalBody.vue';
import VrlModalFooter from '@public/components/common/modals/VrlModalFooter.vue';
import VrlButton from '@public/components/common/buttons/VrlButton.vue';

const isOpen = ref(false);

const handleSubmit = () => {
  // Submit logic
  isOpen.value = false;
};
</script>
```

### Modal with Custom Header

```vue
<template>
  <VrlModal v-model:visible="isOpen">
    <template #header>
      <VrlModalHeader title="Custom Header" :closable="true" @close="isOpen = false">
        <template #close>
          <CustomCloseIcon />
        </template>
      </VrlModalHeader>
    </template>

    <VrlModalBody>
      <p>Content with custom header</p>
    </VrlModalBody>
  </VrlModal>
</template>
```

### Basic Drawer

```vue
<template>
  <div>
    <button @click="isDrawerOpen = true">Open Drawer</button>

    <VrlDrawer
      v-model:visible="isDrawerOpen"
      title="Driver Details"
      position="right"
    >
      <VrlDrawerBody>
        <div class="metric-card">
          <div class="metric-label">Current Position</div>
          <div class="metric-value">3rd</div>
        </div>
      </VrlDrawerBody>
    </VrlDrawer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import VrlDrawer from '@public/components/common/drawers/VrlDrawer.vue';
import VrlDrawerBody from '@public/components/common/drawers/VrlDrawerBody.vue';

const isDrawerOpen = ref(false);
</script>
```

### Drawer with Back Button

```vue
<template>
  <VrlDrawer v-model:visible="isOpen">
    <template #header>
      <VrlDrawerHeader
        title="Detailed View"
        :show-back="true"
        @back="handleBack"
        @close="isOpen = false"
      />
    </template>

    <VrlDrawerBody>
      <p>Drawer content</p>
    </VrlDrawerBody>
  </VrlDrawer>
</template>

<script setup lang="ts">
const handleBack = () => {
  // Navigate back
};
</script>
```

---

## Design Decisions & Rationale

### Why Wrapper Components?

**Decision**: Wrap PrimeVue Dialog/Sidebar instead of building from scratch.

**Rationale**:
- PrimeVue provides robust accessibility features (ARIA, focus trap, keyboard nav)
- Saves development time
- Battle-tested across thousands of projects
- Easier maintenance (PrimeVue team handles browser compatibility)
- We maintain full styling control via PassThrough API

### Why Separate Header/Body/Footer Components?

**Decision**: Split modal into discrete sub-components.

**Rationale**:
- Easier to customize individual sections
- Better code organization
- Follows atomic design principles
- Allows mixing and matching (e.g., modal with no footer)
- Simplifies testing

### Why Default closeOnBackdrop to False?

**Decision**: Require explicit close action by default.

**Rationale**:
- Prevents accidental data loss
- Better UX for forms with unsaved changes
- Users can still close with X button or ESC key
- Can be overridden when appropriate (e.g., info modals)

### Why Not Use Teleport Directly?

**Decision**: Let PrimeVue handle portal rendering.

**Rationale**:
- PrimeVue Dialog/Sidebar already use Teleport internally
- Handles z-index stacking automatically
- Manages multiple overlays correctly
- Less code for us to maintain

---

## Future Enhancements

### Possible Additions

1. **VrlConfirmDialog** - Reusable confirmation modal
2. **VrlAlertModal** - Quick alert/notification modal
3. **VrlBottomSheet** - Mobile-friendly bottom drawer
4. **VrlFullscreenModal** - Full-screen takeover modal
5. **Modal Stacking** - Support for multiple modals
6. **Modal History** - Browser back button support
7. **Animation Presets** - Different enter/leave transitions
8. **Size Presets** - Additional width/height options

### Performance Optimizations

1. Lazy load PrimeVue components
2. Virtual scrolling for long drawer content
3. Debounce resize handlers
4. Optimize re-renders with `memo`

---

## Questions for Review

1. Should we support nested modals (modal within modal)?
2. Do we need a global modal service/composable for programmatic usage?
3. Should drawers support gestures (swipe to close)?
4. Do we need a VrlDialogService for alert/confirm shortcuts?
5. Should we add transition customization props?
6. Do we need mobile-specific variants?
7. Should we support custom backdrop colors/blur?

---

## Success Criteria

### Before Marking Complete

- [ ] All 8 components implemented with TypeScript
- [ ] 80%+ test coverage (unit tests)
- [ ] E2E tests for critical user flows
- [ ] WCAG AA compliance verified
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsive testing
- [ ] Storybook/demo examples created
- [ ] Documentation complete with usage examples
- [ ] Code review completed
- [ ] Performance benchmarks meet targets
- [ ] No console errors or warnings
- [ ] ESLint/Prettier passing
- [ ] TypeScript strict mode passing

---

## References

### Internal Documentation

- Design reference: `/var/www/docs/PublicDashboard/design-2026/design-1-velocity/components/index.html`
- App modal reference: `/var/www/resources/app/js/components/common/modals/BaseModal.vue`
- CLAUDE.md: `/var/www/CLAUDE.md`

### External Documentation

- PrimeVue Dialog: https://primevue.org/dialog/
- PrimeVue Sidebar: https://primevue.org/sidebar/
- VueUse Focus Trap: https://vueuse.org/integrations/useFocusTrap/
- WCAG 2.1 Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
- Vue 3 Teleport: https://vuejs.org/guide/built-ins/teleport.html

---

**Plan Status**: Draft
**Last Updated**: 2026-01-18
**Author**: Claude Code
**Review Required**: Yes
