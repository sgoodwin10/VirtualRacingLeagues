# VRL Velocity Design System - LOADING STATES Components Plan

**Version:** 1.0
**Date:** 2026-01-18
**Status:** Planning
**Target Directory:** `resources/public/js/components/common/loading/`
**CSS Target:** `resources/public/css/app.css`

---

## Overview

This document outlines the implementation plan for the LOADING STATES components of the VRL Velocity Design System. Loading states provide visual feedback during data fetching, transitions, and asynchronous operations. The system includes skeleton loaders (shimmer animations) and spinners (rotation animations) that maintain the Velocity design aesthetic with dark backgrounds, cyan accents, and smooth animations.

**Design Philosophy:** Loading states should be unobtrusive, performant, and consistent with the "technical blueprint" aesthetic. Use CSS animations for optimal performance and provide flexible composition for various use cases.

---

## 1. Component Architecture

### 1.1 Component Hierarchy
```
resources/public/js/components/common/loading/
├── VrlSkeleton.vue                    # Base skeleton with shimmer animation
├── VrlSkeletonText.vue                # Multi-line text skeleton
├── VrlSkeletonAvatar.vue              # Circular avatar skeleton
├── VrlSkeletonCard.vue                # Composite card skeleton (avatar + text)
├── VrlSpinner.vue                     # Border spinner with rotation
├── VrlLoadingOverlay.vue              # Full container overlay with spinner
└── __tests__/
    ├── VrlSkeleton.test.ts
    ├── VrlSkeletonText.test.ts
    ├── VrlSkeletonAvatar.test.ts
    ├── VrlSkeletonCard.test.ts
    ├── VrlSpinner.test.ts
    └── VrlLoadingOverlay.test.ts
```

### 1.2 Design Principles
- **Performance**: Use CSS animations (GPU-accelerated) over JavaScript
- **Composability**: Build complex skeletons from simple primitives
- **Flexibility**: Accept custom dimensions and styles via props
- **Consistency**: Match Velocity design tokens (colors, radius, animations)
- **Accessibility**: Include proper ARIA attributes for screen readers

---

## 2. Component Specifications

### 2.1 VrlSkeleton.vue

**Purpose:** Base skeleton component with shimmer animation gradient. Flexible dimensions and border radius.

**File:** `resources/public/js/components/common/loading/VrlSkeleton.vue`

#### Props Interface
```typescript
interface Props {
  /** Predefined skeleton type */
  type?: 'text' | 'title' | 'avatar' | 'card' | 'custom';

  /** Custom width (CSS value: px, %, rem, etc.) */
  width?: string;

  /** Custom height (CSS value: px, %, rem, etc.) */
  height?: string;

  /** Custom border radius (CSS value) */
  borderRadius?: string;

  /** Additional CSS classes */
  class?: string;
}
```

#### Default Values
```typescript
withDefaults(defineProps<Props>(), {
  type: 'custom',
  width: '100%',
  height: '20px',
  borderRadius: 'var(--radius)',
});
```

#### Type Presets
| Type | Width | Height | Border Radius | Use Case |
|------|-------|--------|---------------|----------|
| `text` | 100% | 14px | `var(--radius)` | Body text line |
| `title` | 40% | 20px | `var(--radius)` | Section/card title |
| `avatar` | 40px | 40px | `var(--radius)` | User avatar (square) |
| `card` | 100% | 120px | `var(--radius-md)` | Full card placeholder |
| `custom` | Props | Props | Props | Custom dimensions |

#### Computed Styles
```typescript
const skeletonStyles = computed(() => {
  if (props.type === 'custom') {
    return {
      width: props.width,
      height: props.height,
      borderRadius: props.borderRadius,
    };
  }

  // Return preset dimensions based on type
  const presets = {
    text: { width: '100%', height: '14px', borderRadius: 'var(--radius)' },
    title: { width: '40%', height: '20px', borderRadius: 'var(--radius)' },
    avatar: { width: '40px', height: '40px', borderRadius: 'var(--radius)' },
    card: { width: '100%', height: '120px', borderRadius: 'var(--radius-md)' },
  };

  return presets[props.type];
});
```

#### Template
```vue
<template>
  <div
    class="skeleton"
    :style="skeletonStyles"
    role="status"
    aria-live="polite"
    aria-label="Loading content"
  />
</template>
```

#### CSS Class Requirements
```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-elevated) 25%,
    var(--bg-highlight) 50%,
    var(--bg-elevated) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius);
}
```

#### Usage Examples
```vue
<!-- Text line -->
<VrlSkeleton type="text" />

<!-- Title -->
<VrlSkeleton type="title" />

<!-- Avatar -->
<VrlSkeleton type="avatar" />

<!-- Custom dimensions -->
<VrlSkeleton width="200px" height="32px" border-radius="4px" />
```

---

### 2.2 VrlSkeletonText.vue

**Purpose:** Multi-line text skeleton with optional short last line.

**File:** `resources/public/js/components/common/loading/VrlSkeletonText.vue`

#### Props Interface
```typescript
interface Props {
  /** Number of text lines to render */
  lines?: number;

  /** Make last line 60% width */
  shortLastLine?: boolean;

  /** Gap between lines (CSS value) */
  gap?: string;
}
```

#### Default Values
```typescript
withDefaults(defineProps<Props>(), {
  lines: 3,
  shortLastLine: true,
  gap: '0.5rem',
});
```

#### Template
```vue
<template>
  <div class="skeleton-text-wrapper" :style="{ gap }">
    <VrlSkeleton
      v-for="(_, index) in lines"
      :key="index"
      type="text"
      :width="isLastLine(index) && shortLastLine ? '60%' : '100%'"
    />
  </div>
</template>

<script setup lang="ts">
const isLastLine = (index: number): boolean => index === props.lines - 1;
</script>
```

#### CSS Requirements
```css
.skeleton-text-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem; /* Default, overridden by prop */
}
```

#### Usage Examples
```vue
<!-- 3 lines with short last line (default) -->
<VrlSkeletonText />

<!-- 5 lines, all full width -->
<VrlSkeletonText :lines="5" :short-last-line="false" />

<!-- Custom gap -->
<VrlSkeletonText :lines="4" gap="0.75rem" />
```

---

### 2.3 VrlSkeletonAvatar.vue

**Purpose:** Circular or square avatar skeleton with size variants.

**File:** `resources/public/js/components/common/loading/VrlSkeletonAvatar.vue`

#### Props Interface
```typescript
interface Props {
  /** Avatar size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';

  /** Avatar shape */
  shape?: 'circle' | 'square';
}
```

#### Default Values
```typescript
withDefaults(defineProps<Props>(), {
  size: 'md',
  shape: 'circle',
});
```

#### Size Presets
| Size | Dimensions | Border Radius (circle) | Border Radius (square) |
|------|------------|------------------------|------------------------|
| `sm` | 32px × 32px | 50% | 4px (`--radius-sm`) |
| `md` | 40px × 40px | 50% | 6px (`--radius`) |
| `lg` | 56px × 56px | 50% | 8px (`--radius-md`) |
| `xl` | 72px × 72px | 50% | 12px (`--radius-lg`) |

#### Computed Styles
```typescript
const avatarStyles = computed(() => {
  const sizes = {
    sm: '32px',
    md: '40px',
    lg: '56px',
    xl: '72px',
  };

  const borderRadii = {
    circle: '50%',
    square: {
      sm: 'var(--radius-sm)',
      md: 'var(--radius)',
      lg: 'var(--radius-md)',
      xl: 'var(--radius-lg)',
    },
  };

  const dimension = sizes[props.size];
  const radius = props.shape === 'circle'
    ? borderRadii.circle
    : borderRadii.square[props.size];

  return {
    width: dimension,
    height: dimension,
    borderRadius: radius,
  };
});
```

#### Template
```vue
<template>
  <div
    class="skeleton skeleton-avatar"
    :style="avatarStyles"
    role="status"
    aria-label="Loading avatar"
  />
</template>
```

#### CSS Requirements
```css
.skeleton-avatar {
  flex-shrink: 0; /* Prevent squashing in flex layouts */
}
```

#### Usage Examples
```vue
<!-- Default: medium circle -->
<VrlSkeletonAvatar />

<!-- Small square -->
<VrlSkeletonAvatar size="sm" shape="square" />

<!-- Large circle -->
<VrlSkeletonAvatar size="lg" />

<!-- Extra large square -->
<VrlSkeletonAvatar size="xl" shape="square" />
```

---

### 2.4 VrlSkeletonCard.vue

**Purpose:** Composite skeleton for list items/cards. Combines avatar, title, and text lines.

**File:** `resources/public/js/components/common/loading/VrlSkeletonCard.vue`

#### Props Interface
```typescript
interface Props {
  /** Show avatar on the left */
  showAvatar?: boolean;

  /** Avatar size */
  avatarSize?: 'sm' | 'md' | 'lg';

  /** Show title skeleton */
  showTitle?: boolean;

  /** Number of text lines */
  textLines?: number;

  /** Layout direction */
  layout?: 'horizontal' | 'vertical';
}
```

#### Default Values
```typescript
withDefaults(defineProps<Props>(), {
  showAvatar: true,
  avatarSize: 'md',
  showTitle: true,
  textLines: 2,
  layout: 'horizontal',
});
```

#### Template
```vue
<template>
  <div :class="['skeleton-card', `skeleton-card--${layout}`]">
    <VrlSkeletonAvatar
      v-if="showAvatar"
      :size="avatarSize"
      class="skeleton-card__avatar"
    />

    <div class="skeleton-card__content">
      <VrlSkeleton
        v-if="showTitle"
        type="title"
        class="skeleton-card__title"
      />
      <VrlSkeletonText
        :lines="textLines"
        class="skeleton-card__text"
      />
    </div>
  </div>
</template>
```

#### CSS Requirements
```css
.skeleton-card {
  display: flex;
  gap: 1rem;
}

.skeleton-card--horizontal {
  flex-direction: row;
  align-items: flex-start;
}

.skeleton-card--vertical {
  flex-direction: column;
  align-items: center;
}

.skeleton-card__content {
  flex: 1;
  min-width: 0; /* Prevent flex overflow */
}

.skeleton-card__title {
  margin-bottom: 0.75rem;
}
```

#### Usage Examples
```vue
<!-- Default: avatar + title + 2 text lines -->
<VrlSkeletonCard />

<!-- No avatar, 3 text lines -->
<VrlSkeletonCard :show-avatar="false" :text-lines="3" />

<!-- Vertical layout (centered avatar) -->
<VrlSkeletonCard layout="vertical" avatar-size="lg" />

<!-- Multiple cards in a list -->
<div v-for="n in 5" :key="n" class="mb-4">
  <VrlSkeletonCard />
</div>
```

---

### 2.5 VrlSpinner.vue

**Purpose:** Rotating border spinner for inline or centered loading indicators.

**File:** `resources/public/js/components/common/loading/VrlSpinner.vue`

#### Props Interface
```typescript
interface Props {
  /** Spinner size */
  size?: 'sm' | 'default' | 'lg';

  /** Accent color (CSS color value) */
  color?: string;

  /** Border thickness (CSS value) */
  thickness?: string;

  /** Center spinner in container */
  centered?: boolean;

  /** Loading message (accessibility) */
  label?: string;
}
```

#### Default Values
```typescript
withDefaults(defineProps<Props>(), {
  size: 'default',
  color: 'var(--cyan)',
  thickness: undefined, // Auto-calculated based on size
  centered: false,
  label: 'Loading',
});
```

#### Size Presets
| Size | Dimensions | Border Width | Use Case |
|------|------------|--------------|----------|
| `sm` | 16px | 2px | Inline, buttons |
| `default` | 24px | 3px | Standard loading |
| `lg` | 40px | 4px | Page/section loading |

#### Computed Styles
```typescript
const spinnerStyles = computed(() => {
  const sizes = {
    sm: { size: '16px', thickness: '2px' },
    default: { size: '24px', thickness: '3px' },
    lg: { size: '40px', thickness: '4px' },
  };

  const { size: dimension, thickness: defaultThickness } = sizes[props.size];

  return {
    width: dimension,
    height: dimension,
    borderWidth: props.thickness || defaultThickness,
    borderTopColor: props.color,
  };
});
```

#### Template
```vue
<template>
  <div v-if="centered" class="spinner-container">
    <div
      class="spinner"
      :style="spinnerStyles"
      role="status"
      :aria-label="label"
    >
      <span class="sr-only">{{ label }}</span>
    </div>
  </div>

  <div
    v-else
    class="spinner"
    :style="spinnerStyles"
    role="status"
    :aria-label="label"
  >
    <span class="sr-only">{{ label }}</span>
  </div>
</template>
```

#### CSS Requirements
```css
.spinner {
  display: inline-block;
  border: 3px solid var(--border);
  border-top-color: var(--cyan);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Screen-reader only text */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

#### Usage Examples
```vue
<!-- Default spinner -->
<VrlSpinner />

<!-- Small spinner (inline) -->
<VrlSpinner size="sm" />

<!-- Large spinner (centered) -->
<VrlSpinner size="lg" centered />

<!-- Custom color -->
<VrlSpinner color="var(--green)" />

<!-- Inside a button -->
<button class="flex items-center gap-2">
  <VrlSpinner size="sm" />
  Loading...
</button>
```

---

### 2.6 VrlLoadingOverlay.vue

**Purpose:** Full container overlay with semi-transparent background, centered spinner, and optional message.

**File:** `resources/public/js/components/common/loading/VrlLoadingOverlay.vue`

#### Props Interface
```typescript
interface Props {
  /** Show/hide overlay */
  visible: boolean;

  /** Loading message */
  message?: string;

  /** Spinner size */
  spinnerSize?: 'default' | 'lg';

  /** Overlay background opacity (0-1) */
  opacity?: number;

  /** Z-index value */
  zIndex?: number;
}
```

#### Default Values
```typescript
withDefaults(defineProps<Props>(), {
  message: undefined,
  spinnerSize: 'lg',
  opacity: 0.8,
  zIndex: 1000,
});
```

#### Template
```vue
<template>
  <Transition name="fade">
    <div
      v-if="visible"
      class="loading-overlay"
      :style="overlayStyles"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loading-message"
    >
      <div class="loading-overlay__content">
        <VrlSpinner :size="spinnerSize" />
        <p
          v-if="message"
          id="loading-message"
          class="loading-overlay__message"
        >
          {{ message }}
        </p>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const overlayStyles = computed(() => ({
  backgroundColor: `rgba(13, 17, 23, ${props.opacity})`, // --bg-dark with opacity
  zIndex: props.zIndex,
}));
</script>
```

#### CSS Requirements
```css
.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(13, 17, 23, 0.8); /* --bg-dark with 80% opacity */
  backdrop-filter: blur(4px);
  z-index: 1000;
}

.loading-overlay__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loading-overlay__message {
  font-family: var(--font-body);
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
```

#### Usage Examples
```vue
<!-- Basic overlay -->
<div class="relative">
  <VrlLoadingOverlay :visible="isLoading" />
  <!-- Content -->
</div>

<!-- With message -->
<VrlLoadingOverlay
  :visible="isLoading"
  message="Loading race results..."
/>

<!-- Custom opacity and z-index -->
<VrlLoadingOverlay
  :visible="isLoading"
  :opacity="0.9"
  :z-index="2000"
/>

<!-- In a modal/dialog -->
<Dialog>
  <VrlLoadingOverlay :visible="isSaving" message="Saving changes..." />
  <DialogContent>...</DialogContent>
</Dialog>
```

---

## 3. CSS Additions to `resources/public/css/app.css`

Add the following CSS to the main stylesheet.

### 3.1 Skeleton Base Styles
```css
/* ================================================================
   LOADING STATES
   ================================================================ */

/* Skeleton Base */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-elevated) 25%,
    var(--bg-highlight) 50%,
    var(--bg-elevated) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius);
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Skeleton Variants */
.skeleton-text {
  height: 14px;
  margin-bottom: 0.5rem;
}

.skeleton-text.short {
  width: 60%;
}

.skeleton-title {
  height: 20px;
  width: 40%;
  margin-bottom: 1rem;
}

.skeleton-avatar {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: var(--radius);
}

/* Skeleton Text Wrapper */
.skeleton-text-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Skeleton Card Layouts */
.skeleton-card {
  display: flex;
  gap: 1rem;
}

.skeleton-card--horizontal {
  flex-direction: row;
  align-items: flex-start;
}

.skeleton-card--vertical {
  flex-direction: column;
  align-items: center;
}

.skeleton-card__content {
  flex: 1;
  min-width: 0;
}

.skeleton-card__title {
  margin-bottom: 0.75rem;
}
```

### 3.2 Spinner Styles
```css
/* Loading Spinner */
.spinner {
  display: inline-block;
  width: 24px;
  height: 24px;
  border: 3px solid var(--border);
  border-top-color: var(--cyan);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-sm {
  width: 16px;
  height: 16px;
  border-width: 2px;
}

.spinner-lg {
  width: 40px;
  height: 40px;
  border-width: 4px;
}

.spinner-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### 3.3 Loading Overlay
```css
/* Loading Overlay */
.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(13, 17, 23, 0.8);
  backdrop-filter: blur(4px);
  z-index: 1000;
}

.loading-overlay__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loading-overlay__message {
  font-family: var(--font-body);
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
}
```

### 3.4 Accessibility Utilities
```css
/* Screen-reader only text */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### 3.5 Transitions
```css
/* Fade transition for overlays */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
```

---

## 4. TypeScript Types

Create shared type definitions for loading components.

**File:** `resources/public/js/types/loading.ts`

```typescript
/**
 * Skeleton component types
 */
export type SkeletonType = 'text' | 'title' | 'avatar' | 'card' | 'custom';

export type SkeletonSize = 'sm' | 'md' | 'lg' | 'xl';

export type SkeletonShape = 'circle' | 'square';

/**
 * Spinner component types
 */
export type SpinnerSize = 'sm' | 'default' | 'lg';

/**
 * Loading overlay types
 */
export interface LoadingState {
  visible: boolean;
  message?: string;
}

/**
 * Skeleton card layout types
 */
export type SkeletonCardLayout = 'horizontal' | 'vertical';
```

---

## 5. Composables

### 5.1 useLoadingState.ts

Create a composable for managing loading states.

**File:** `resources/public/js/composables/useLoadingState.ts`

```typescript
import { ref, type Ref } from 'vue';

export interface UseLoadingStateReturn {
  isLoading: Ref<boolean>;
  loadingMessage: Ref<string | undefined>;
  startLoading: (message?: string) => void;
  stopLoading: () => void;
  withLoading: <T>(fn: () => Promise<T>, message?: string) => Promise<T>;
}

/**
 * Composable for managing loading states
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const { isLoading, loadingMessage, withLoading } = useLoadingState();
 *
 * const fetchData = () => withLoading(
 *   async () => {
 *     const data = await api.getData();
 *     return data;
 *   },
 *   'Loading race results...'
 * );
 * </script>
 *
 * <template>
 *   <VrlLoadingOverlay :visible="isLoading" :message="loadingMessage" />
 * </template>
 * ```
 */
export function useLoadingState(): UseLoadingStateReturn {
  const isLoading = ref(false);
  const loadingMessage = ref<string | undefined>(undefined);

  const startLoading = (message?: string): void => {
    isLoading.value = true;
    loadingMessage.value = message;
  };

  const stopLoading = (): void => {
    isLoading.value = false;
    loadingMessage.value = undefined;
  };

  const withLoading = async <T>(
    fn: () => Promise<T>,
    message?: string
  ): Promise<T> => {
    try {
      startLoading(message);
      return await fn();
    } finally {
      stopLoading();
    }
  };

  return {
    isLoading,
    loadingMessage,
    startLoading,
    stopLoading,
    withLoading,
  };
}
```

**Test File:** `resources/public/js/composables/__tests__/useLoadingState.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { useLoadingState } from '../useLoadingState';

describe('useLoadingState', () => {
  it('should initialize with loading state false', () => {
    const { isLoading } = useLoadingState();
    expect(isLoading.value).toBe(false);
  });

  it('should start loading with message', () => {
    const { isLoading, loadingMessage, startLoading } = useLoadingState();

    startLoading('Loading data...');

    expect(isLoading.value).toBe(true);
    expect(loadingMessage.value).toBe('Loading data...');
  });

  it('should stop loading and clear message', () => {
    const { isLoading, loadingMessage, startLoading, stopLoading } = useLoadingState();

    startLoading('Loading data...');
    stopLoading();

    expect(isLoading.value).toBe(false);
    expect(loadingMessage.value).toBeUndefined();
  });

  it('should handle async operations with withLoading', async () => {
    const { isLoading, withLoading } = useLoadingState();

    const asyncFn = vi.fn().mockResolvedValue('result');

    expect(isLoading.value).toBe(false);

    const promise = withLoading(asyncFn, 'Loading...');

    expect(isLoading.value).toBe(true);

    const result = await promise;

    expect(result).toBe('result');
    expect(isLoading.value).toBe(false);
  });

  it('should stop loading even if async operation fails', async () => {
    const { isLoading, withLoading } = useLoadingState();

    const asyncFn = vi.fn().mockRejectedValue(new Error('Failed'));

    await expect(withLoading(asyncFn)).rejects.toThrow('Failed');
    expect(isLoading.value).toBe(false);
  });
});
```

---

## 6. Testing Strategy

### 6.1 Component Tests

Each component requires comprehensive Vitest tests covering:

1. **Rendering**: Component mounts correctly with default props
2. **Props**: All props apply expected styles/behavior
3. **Accessibility**: ARIA attributes present and correct
4. **Computed Styles**: Presets and custom values calculate correctly
5. **Animations**: CSS classes applied for animations
6. **Slots**: Slot content rendered (where applicable)

### 6.2 Test Template Example

**File:** `resources/public/js/components/common/loading/__tests__/VrlSkeleton.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlSkeleton from '../VrlSkeleton.vue';

describe('VrlSkeleton', () => {
  describe('rendering', () => {
    it('should render with default props', () => {
      const wrapper = mount(VrlSkeleton);

      expect(wrapper.find('.skeleton').exists()).toBe(true);
      expect(wrapper.attributes('role')).toBe('status');
      expect(wrapper.attributes('aria-live')).toBe('polite');
    });
  });

  describe('type presets', () => {
    it('should apply text preset', () => {
      const wrapper = mount(VrlSkeleton, {
        props: { type: 'text' },
      });

      const element = wrapper.find('.skeleton').element as HTMLElement;
      expect(element.style.width).toBe('100%');
      expect(element.style.height).toBe('14px');
    });

    it('should apply title preset', () => {
      const wrapper = mount(VrlSkeleton, {
        props: { type: 'title' },
      });

      const element = wrapper.find('.skeleton').element as HTMLElement;
      expect(element.style.width).toBe('40%');
      expect(element.style.height).toBe('20px');
    });

    it('should apply avatar preset', () => {
      const wrapper = mount(VrlSkeleton, {
        props: { type: 'avatar' },
      });

      const element = wrapper.find('.skeleton').element as HTMLElement;
      expect(element.style.width).toBe('40px');
      expect(element.style.height).toBe('40px');
    });
  });

  describe('custom dimensions', () => {
    it('should apply custom width and height', () => {
      const wrapper = mount(VrlSkeleton, {
        props: {
          width: '200px',
          height: '50px',
        },
      });

      const element = wrapper.find('.skeleton').element as HTMLElement;
      expect(element.style.width).toBe('200px');
      expect(element.style.height).toBe('50px');
    });

    it('should apply custom border radius', () => {
      const wrapper = mount(VrlSkeleton, {
        props: {
          borderRadius: '12px',
        },
      });

      const element = wrapper.find('.skeleton').element as HTMLElement;
      expect(element.style.borderRadius).toBe('12px');
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const wrapper = mount(VrlSkeleton);

      expect(wrapper.attributes('role')).toBe('status');
      expect(wrapper.attributes('aria-live')).toBe('polite');
      expect(wrapper.attributes('aria-label')).toBe('Loading content');
    });
  });

  describe('CSS classes', () => {
    it('should have skeleton base class', () => {
      const wrapper = mount(VrlSkeleton);
      expect(wrapper.classes()).toContain('skeleton');
    });
  });
});
```

### 6.3 Test Coverage Requirements

All components must achieve:
- **Line Coverage**: 100%
- **Branch Coverage**: 100%
- **Function Coverage**: 100%
- **Statement Coverage**: 100%

---

## 7. Animation Performance Considerations

### 7.1 CSS Animation Optimization

**Use GPU-Accelerated Properties:**
- `transform` (rotate, translate, scale)
- `opacity`
- `filter` (blur, brightness)

**Avoid:**
- Animating `width`, `height`, `top`, `left` (causes layout recalculation)
- Animating `box-shadow` (expensive repaints)

### 7.2 Shimmer Animation Analysis

```css
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

**Performance Characteristics:**
- Animates `background-position` (GPU-accelerated on modern browsers)
- Uses `linear-gradient` with fixed colors (no color interpolation)
- 1.5s duration balances smoothness and performance
- Infinite loop with no pauses

**Optimization:**
- Set `will-change: background-position` for frequently used skeletons
- Use `transform: translateX()` alternative for better performance (if needed)

### 7.3 Spin Animation Analysis

```css
@keyframes spin {
  to { transform: rotate(360deg); }
}
```

**Performance Characteristics:**
- Uses `transform: rotate()` (GPU-accelerated)
- 0.8s duration for smooth rotation
- Linear timing for constant speed
- Infinite loop

**Optimization:**
- Already optimal (uses transform)
- Consider reducing border width on low-end devices

### 7.4 Performance Testing

Test animations on:
1. **Desktop**: Chrome, Firefox, Safari
2. **Mobile**: iOS Safari, Chrome Android
3. **Low-End Devices**: Test with CPU throttling in DevTools

**Metrics:**
- Target: 60 FPS during animations
- No janky scrolling when skeletons visible
- No layout thrashing

---

## 8. Accessibility Requirements

### 8.1 ARIA Attributes

All loading components must include:
- `role="status"` - Identifies loading region
- `aria-live="polite"` - Screen reader announces changes politely
- `aria-label` - Descriptive label for screen readers

### 8.2 Screen Reader Text

Provide hidden text for screen readers:
```html
<span class="sr-only">Loading race results</span>
```

### 8.3 Keyboard Navigation

Loading overlays should:
- Trap focus within overlay when visible
- Return focus to trigger element when dismissed
- Allow Escape key to cancel (if applicable)

### 8.4 Reduced Motion

Respect user's motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  .skeleton,
  .spinner {
    animation: none;
  }

  /* Show static gradient instead */
  .skeleton {
    background: var(--bg-elevated);
  }

  /* Show static spinner */
  .spinner {
    opacity: 0.6;
  }
}
```

---

## 9. Usage Patterns & Best Practices

### 9.1 When to Use Skeletons vs. Spinners

**Use Skeletons When:**
- Loading structured content (lists, cards, tables)
- User knows what type of content to expect
- Content has predictable layout
- Initial page load

**Use Spinners When:**
- Loading time is short (< 2 seconds)
- Content structure is unknown
- Processing/saving operations
- Inline actions (button clicks)

### 9.2 Skeleton Layout Patterns

#### List Loading
```vue
<template>
  <div v-if="isLoading" class="space-y-4">
    <VrlSkeletonCard v-for="n in 5" :key="n" />
  </div>
  <div v-else>
    <!-- Actual content -->
  </div>
</template>
```

#### Table Loading
```vue
<template>
  <table>
    <thead><!-- Headers --></thead>
    <tbody>
      <tr v-if="isLoading" v-for="n in 10" :key="n">
        <td><VrlSkeleton type="text" /></td>
        <td><VrlSkeleton type="text" width="80px" /></td>
        <td><VrlSkeleton type="text" width="120px" /></td>
      </tr>
      <tr v-else v-for="row in data" :key="row.id">
        <!-- Actual data -->
      </tr>
    </tbody>
  </table>
</template>
```

#### Card Grid Loading
```vue
<template>
  <div class="grid grid-cols-3 gap-4">
    <div v-if="isLoading" v-for="n in 9" :key="n">
      <VrlSkeleton type="card" />
    </div>
    <div v-else v-for="card in cards" :key="card.id">
      <!-- Actual card -->
    </div>
  </div>
</template>
```

### 9.3 Spinner Usage Patterns

#### Inline Button Loading
```vue
<template>
  <button :disabled="isLoading" class="flex items-center gap-2">
    <VrlSpinner v-if="isLoading" size="sm" />
    <span>{{ isLoading ? 'Saving...' : 'Save' }}</span>
  </button>
</template>
```

#### Section Loading
```vue
<template>
  <div class="relative min-h-[200px]">
    <VrlLoadingOverlay :visible="isLoading" message="Loading standings..." />

    <div v-if="!isLoading">
      <!-- Content -->
    </div>
  </div>
</template>
```

#### Page Loading
```vue
<template>
  <div v-if="isLoading" class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <VrlSpinner size="lg" />
      <p class="mt-4 text-secondary">Loading league data...</p>
    </div>
  </div>

  <div v-else>
    <!-- Page content -->
  </div>
</template>
```

### 9.4 Composable Integration

```vue
<script setup lang="ts">
import { useLoadingState } from '@public/composables/useLoadingState';

const { isLoading, loadingMessage, withLoading } = useLoadingState();

const fetchLeagueData = async () => {
  await withLoading(
    async () => {
      const data = await api.getLeague(leagueId);
      // Process data
    },
    'Loading league information...'
  );
};
</script>

<template>
  <div class="relative">
    <VrlLoadingOverlay :visible="isLoading" :message="loadingMessage" />
    <!-- Content -->
  </div>
</template>
```

---

## 10. Implementation Checklist

### Phase 1: CSS Foundation
- [ ] Add skeleton base styles to `app.css`
- [ ] Add `@keyframes shimmer` animation
- [ ] Add `@keyframes spin` animation
- [ ] Add spinner styles (base + variants)
- [ ] Add loading overlay styles
- [ ] Add accessibility utility classes (`.sr-only`)
- [ ] Add fade transition styles
- [ ] Add reduced-motion media query styles
- [ ] Test animations in browser (60 FPS)

### Phase 2: Base Components
- [ ] Implement `VrlSkeleton.vue` with type presets
- [ ] Implement `VrlSpinner.vue` with size variants
- [ ] Test base components in isolation
- [ ] Verify CSS animations working
- [ ] Verify accessibility attributes

### Phase 3: Composite Components
- [ ] Implement `VrlSkeletonText.vue`
- [ ] Implement `VrlSkeletonAvatar.vue`
- [ ] Implement `VrlSkeletonCard.vue`
- [ ] Implement `VrlLoadingOverlay.vue`
- [ ] Test composite components
- [ ] Test different prop combinations

### Phase 4: Composables & Types
- [ ] Create `resources/public/js/types/loading.ts`
- [ ] Implement `useLoadingState.ts` composable
- [ ] Write tests for `useLoadingState.ts`
- [ ] Verify TypeScript type safety

### Phase 5: Component Tests
- [ ] Write tests for `VrlSkeleton.test.ts`
- [ ] Write tests for `VrlSkeletonText.test.ts`
- [ ] Write tests for `VrlSkeletonAvatar.test.ts`
- [ ] Write tests for `VrlSkeletonCard.test.ts`
- [ ] Write tests for `VrlSpinner.test.ts`
- [ ] Write tests for `VrlLoadingOverlay.test.ts`
- [ ] Achieve 100% test coverage
- [ ] All tests pass (`npm run test`)

### Phase 6: Documentation & Examples
- [ ] Create Storybook stories (if applicable)
- [ ] Document usage patterns in component comments
- [ ] Create example views demonstrating patterns
- [ ] Add JSDoc comments to composables

### Phase 7: Integration Testing
- [ ] Test in actual views (HomeView, LeagueDetailView, etc.)
- [ ] Test responsive behavior (mobile, tablet, desktop)
- [ ] Test with screen reader (NVDA/JAWS)
- [ ] Test keyboard navigation
- [ ] Test reduced-motion preferences
- [ ] Test performance (60 FPS animations)

### Phase 8: Quality Assurance
- [ ] Run TypeScript type check (`npm run type-check`)
- [ ] Run all tests (`npm test`)
- [ ] Run linter (`npm run lint`)
- [ ] Run formatter (`npm run format`)
- [ ] Verify no console errors
- [ ] Verify WCAG AA compliance
- [ ] Cross-browser testing (Chrome, Firefox, Safari)

---

## 11. File Structure Summary

```
resources/public/
├── css/
│   └── app.css                        # Updated with loading styles
├── js/
│   ├── components/
│   │   └── common/
│   │       └── loading/
│   │           ├── VrlSkeleton.vue
│   │           ├── VrlSkeletonText.vue
│   │           ├── VrlSkeletonAvatar.vue
│   │           ├── VrlSkeletonCard.vue
│   │           ├── VrlSpinner.vue
│   │           ├── VrlLoadingOverlay.vue
│   │           └── __tests__/
│   │               ├── VrlSkeleton.test.ts
│   │               ├── VrlSkeletonText.test.ts
│   │               ├── VrlSkeletonAvatar.test.ts
│   │               ├── VrlSkeletonCard.test.ts
│   │               ├── VrlSpinner.test.ts
│   │               └── VrlLoadingOverlay.test.ts
│   ├── composables/
│   │   ├── useLoadingState.ts
│   │   └── __tests__/
│   │       └── useLoadingState.test.ts
│   └── types/
│       └── loading.ts
```

---

## 12. Design Tokens Reference

### Animation Timings
| Animation | Duration | Timing Function | Iterations |
|-----------|----------|-----------------|------------|
| Shimmer | 1.5s | linear | infinite |
| Spin | 0.8s | linear | infinite |
| Fade | 0.3s | ease | 1 |

### Skeleton Dimensions
| Type | Width | Height | Border Radius |
|------|-------|--------|---------------|
| Text | 100% | 14px | `var(--radius)` |
| Title | 40% | 20px | `var(--radius)` |
| Avatar (MD) | 40px | 40px | `var(--radius)` |
| Card | 100% | 120px | `var(--radius-md)` |

### Spinner Dimensions
| Size | Dimensions | Border Width |
|------|------------|--------------|
| Small | 16px × 16px | 2px |
| Default | 24px × 24px | 3px |
| Large | 40px × 40px | 4px |

### Colors
| Element | Color | Variable |
|---------|-------|----------|
| Skeleton start | #21262d | `var(--bg-elevated)` |
| Skeleton middle | #272d36 | `var(--bg-highlight)` |
| Skeleton end | #21262d | `var(--bg-elevated)` |
| Spinner border | #30363d | `var(--border)` |
| Spinner accent | #58a6ff | `var(--cyan)` |
| Overlay background | rgba(13, 17, 23, 0.8) | `var(--bg-dark)` + opacity |
| Overlay text | #8b949e | `var(--text-secondary)` |

---

## 13. Performance Benchmarks

### Target Metrics
- **Animation FPS**: 60 FPS (16.67ms per frame)
- **Time to Interactive**: No blocking during skeleton render
- **Memory**: < 5MB additional for all loading components
- **CPU Usage**: < 10% during animations

### Testing Methodology
1. Chrome DevTools Performance tab
2. Record 10-second session with multiple skeletons
3. Analyze FPS, CPU usage, memory
4. Test with CPU throttling (4x slowdown)
5. Test on mobile device (iOS/Android)

### Optimization Strategies
- Use `will-change: transform` sparingly (only on active animations)
- Limit number of simultaneous skeleton instances (< 50)
- Use `requestAnimationFrame` for JavaScript-based animations (if needed)
- Debounce/throttle loading state changes

---

## 14. Browser Compatibility

### Supported Browsers
- Chrome 90+ (full support)
- Firefox 88+ (full support)
- Safari 14+ (full support)
- Edge 90+ (full support)

### Fallbacks
- CSS animations: 98% support (no fallback needed)
- `background-position` animation: 99% support
- `transform: rotate()`: 99% support
- `backdrop-filter`: 95% support (graceful degradation)

### Polyfills
None required for target browsers.

---

## 15. Migration Notes

### Replacing Existing Loading States

**Before (DrawerLoading.vue):**
```vue
<div class="h-full flex items-center justify-center">
  <div class="text-center">
    <i class="pi pi-spin pi-spinner text-4xl text-blue-500 mb-4"></i>
    <p class="text-gray-600">{{ message }}</p>
  </div>
</div>
```

**After (VRL Velocity):**
```vue
<VrlLoadingOverlay :visible="true" :message="message" />
```

### Benefits
- Consistent design language (Velocity theme)
- Better performance (CSS animations vs PrimeIcons)
- More flexible (size variants, custom colors)
- Better accessibility (ARIA attributes)
- TypeScript support

---

## 16. Future Enhancements (Not in V1)

The following features are out of scope for the initial implementation but may be considered for future iterations:

### 16.1 Progress Indicators
- Linear progress bar component
- Circular progress with percentage
- Step-by-step progress indicators

### 16.2 Skeleton Variants
- Table skeleton with column structure
- Chart skeleton (bar, line, pie)
- Image skeleton with aspect ratio preservation

### 16.3 Advanced Animations
- Staggered skeleton appearance (delay between items)
- Pulse animation variant (alternative to shimmer)
- Wave animation (for lists)

### 16.4 Loading States
- Determinate loading (with progress percentage)
- Lazy loading indicators (intersection observer)
- Infinite scroll loading states

### 16.5 Smart Skeletons
- Auto-detect content dimensions from loaded data
- Generate skeleton based on component structure
- Skeleton templates for common layouts

---

## 17. Validation Criteria

Before marking this implementation as complete:

### Functional Requirements
- [ ] All 6 components implemented with full TypeScript support
- [ ] All props work as specified
- [ ] All animations run at 60 FPS
- [ ] All components are composable (can be combined)

### Testing Requirements
- [ ] 100% test coverage (line, branch, function, statement)
- [ ] All tests pass without warnings
- [ ] Integration tests in real views pass
- [ ] Screen reader testing completed

### Code Quality
- [ ] TypeScript type check passes (`npm run type-check`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Prettier formatting applied (`npm run format`)
- [ ] No console errors or warnings

### Accessibility
- [ ] All ARIA attributes present and correct
- [ ] Keyboard navigation works (where applicable)
- [ ] Screen reader announces loading states
- [ ] Reduced-motion preferences respected
- [ ] WCAG AA contrast ratios met

### Performance
- [ ] Animations run at 60 FPS on desktop
- [ ] Animations run at 30+ FPS on mobile
- [ ] No layout thrashing during skeleton render
- [ ] Memory usage within acceptable limits

### Design Consistency
- [ ] Matches reference HTML design (`index.html`)
- [ ] Uses Velocity design tokens correctly
- [ ] Follows CSS variable naming conventions
- [ ] Maintains dark theme aesthetic

### Documentation
- [ ] All components have JSDoc comments
- [ ] Usage examples documented in plan
- [ ] Composable usage patterns documented
- [ ] Migration guide provided

---

## 18. References

- **Design HTML:** `/var/www/docs/PublicDashboard/design-2026/design-1-velocity/components/index.html` (lines 2610-2644)
- **App Loading Reference:** `/var/www/resources/app/js/components/common/modals/DrawerLoading.vue`
- **Foundation Plan:** `/var/www/docs/PublicDashboard/design-2026/design-1-velocity/components/plan/01-foundation-plan.md`
- **CSS Animations:** https://developer.mozilla.org/en-US/docs/Web/CSS/animation
- **ARIA Status Role:** https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/status_role
- **Reduced Motion:** https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion

---

**End of Loading States Plan**
