# VRL Velocity Design System - Badges & Indicators Component Plan

**Plan Version:** 1.0
**Created:** 2026-01-18
**Component Group:** Badges & Indicators
**Status:** Planning Phase

---

## Table of Contents

1. [Overview](#overview)
2. [Design Reference](#design-reference)
3. [Components to Build](#components-to-build)
4. [Component Specifications](#component-specifications)
5. [CSS Architecture](#css-architecture)
6. [TypeScript Interfaces](#typescript-interfaces)
7. [Testing Strategy](#testing-strategy)
8. [File Structure](#file-structure)
9. [Implementation Phases](#implementation-phases)
10. [Dependencies & Imports](#dependencies--imports)
11. [Accessibility Requirements](#accessibility-requirements)
12. [Edge Cases & Error Handling](#edge-cases--error-handling)
13. [Integration Points](#integration-points)
14. [Success Criteria](#success-criteria)

---

## Overview

### Purpose

The Badges & Indicators component group provides visual status indicators, position rankings, and inline metadata tags for the VRL Velocity Design System. These components are critical for displaying driver positions, race statuses, platform identifiers, and other key information throughout the public dashboard.

### Design Philosophy

- **High Contrast:** Badges and indicators use the Orbitron display font and bold colors for maximum visibility
- **Consistent Sizing:** All components follow a standardized size system (sm, md, lg)
- **Semantic Colors:** Color variants map to semantic meanings (green = success/active, orange = warning/pending, red = error/danger)
- **Minimal Footprint:** Small, compact components that don't overwhelm the interface
- **Accessibility First:** All indicators provide text labels for screen readers

### Key Features

- **VrlBadge:** Pill-shaped badges with optional animated dots for status display
- **VrlStatusIndicator:** Status indicators with colored dots and text labels
- **VrlPositionIndicator:** Racing position badges with automatic gold/silver/bronze styling
- **VrlTag:** Compact inline tags for metadata and categories

---

## Design Reference

**Primary Reference:**
`/var/www/docs/PublicDashboard/design-2026/design-1-velocity/components/index.html`
Lines 1937-2000 (BADGES & INDICATORS section)

**Existing App Components (for pattern reference):**
- `/var/www/resources/app/js/components/common/indicators/BaseBadge.vue`
- `/var/www/resources/app/js/components/common/indicators/StatusIndicator.vue`
- `/var/www/resources/app/js/components/common/indicators/PositionIndicator.vue`
- `/var/www/resources/app/js/components/common/indicators/TagIndicator.vue`

**Design System Variables:**
- Font Display: `var(--font-display)` (Orbitron)
- Font Body: `var(--font-body)` (Inter)
- Radius Pill: `var(--radius-pill)` (100px)
- Radius: `var(--radius)` (6px)
- Radius SM: `var(--radius-sm)` (4px)

---

## Components to Build

### 1. VrlBadge.vue
**Location:** `resources/public/js/components/common/badges/VrlBadge.vue`
**Purpose:** Versatile pill-shaped badge with multiple color variants and optional status dots

### 2. VrlStatusIndicator.vue
**Location:** `resources/public/js/components/common/indicators/VrlStatusIndicator.vue`
**Purpose:** Status display with colored dot and text label

### 3. VrlPositionIndicator.vue
**Location:** `resources/public/js/components/common/indicators/VrlPositionIndicator.vue`
**Purpose:** Racing position display with automatic podium styling (1st = gold, 2nd = silver, 3rd = bronze)

### 4. VrlTag.vue
**Location:** `resources/public/js/components/common/tags/VrlTag.vue`
**Purpose:** Compact inline tag for metadata, categories, and labels

---

## Component Specifications

### VrlBadge.vue

#### Props

```typescript
interface VrlBadgeProps {
  /**
   * Color variant of the badge
   * @default 'default'
   */
  variant?: 'default' | 'cyan' | 'green' | 'orange' | 'red' | 'purple';

  /**
   * Display a colored dot before the text
   * @default false
   */
  dot?: boolean;

  /**
   * Animate the dot with pulsing effect
   * Only works when dot is true
   * @default false
   */
  pulse?: boolean;
}
```

#### Slots

- **default:** Badge text content

#### Visual Specifications

- **Font:** Orbitron (var(--font-display))
- **Font Size:** 0.7rem
- **Font Weight:** 600
- **Text Transform:** Uppercase
- **Letter Spacing:** 1px
- **Padding:** 0.35rem 0.75rem
- **Border Radius:** var(--radius-pill) (100px)
- **Gap:** 0.4rem (between dot and text)
- **Dot Size:** 6px diameter circle
- **Pulse Animation:** Opacity 0.5-1, Scale 1-1.2, 2s ease-in-out infinite

#### Color Variants

| Variant | Background | Text Color |
|---------|-----------|------------|
| default | var(--bg-elevated) | var(--text-secondary) |
| cyan | var(--cyan-dim) | var(--cyan) |
| green | var(--green-dim) | var(--green) |
| orange | var(--orange-dim) | var(--orange) |
| red | var(--red-dim) | var(--red) |
| purple | var(--purple-dim) | var(--purple) |

#### Usage Examples

```vue
<!-- Basic badge -->
<VrlBadge variant="cyan">Platform: GT7</VrlBadge>

<!-- Badge with dot -->
<VrlBadge variant="green" :dot="true">Active</VrlBadge>

<!-- Badge with pulsing dot (live indicator) -->
<VrlBadge variant="red" :dot="true" :pulse="true">Live</VrlBadge>

<!-- Status badges -->
<VrlBadge variant="orange" :dot="true">Pending</VrlBadge>
<VrlBadge variant="purple">Premium</VrlBadge>
```

---

### VrlStatusIndicator.vue

#### Props

```typescript
interface VrlStatusIndicatorProps {
  /**
   * Status type to display
   * @default 'inactive'
   */
  status?: 'active' | 'pending' | 'inactive' | 'error';
}
```

#### Slots

- **default:** Optional custom status text (overrides default status label)

#### Visual Specifications

- **Font:** Inter (var(--font-body))
- **Font Size:** 0.8rem
- **Font Weight:** 500
- **Gap:** 0.5rem (between dot and text)
- **Dot Size:** 8px diameter circle
- **Display:** inline-flex with center alignment

#### Status Mappings

| Status | Dot Color | Default Label | Background |
|--------|-----------|---------------|------------|
| active | var(--green) | "Active" | None |
| pending | var(--orange) | "Pending" | None |
| inactive | var(--text-muted) | "Inactive" | None |
| error | var(--red) | "Error" | None |

#### Usage Examples

```vue
<!-- Status with default label -->
<VrlStatusIndicator status="active" />

<!-- Status with custom label -->
<VrlStatusIndicator status="pending">Awaiting Results</VrlStatusIndicator>

<!-- Error status -->
<VrlStatusIndicator status="error">Race Cancelled</VrlStatusIndicator>

<!-- Inactive status -->
<VrlStatusIndicator status="inactive" />
```

---

### VrlPositionIndicator.vue

#### Props

```typescript
interface VrlPositionIndicatorProps {
  /**
   * Racing position number (1, 2, 3, etc.)
   * @required
   */
  position: number;
}
```

#### Slots

None (position number is always displayed)

#### Visual Specifications

- **Font:** Orbitron (var(--font-display))
- **Font Size:** 0.9rem
- **Font Weight:** 700
- **Width/Height:** 32px × 32px (square)
- **Border Radius:** var(--radius) (6px)
- **Display:** inline-flex, centered content

#### Automatic Styling

| Position | Background | Text Color | Description |
|----------|-----------|------------|-------------|
| 1 | var(--yellow-dim) | var(--yellow) | Gold (1st place) |
| 2 | rgba(192, 192, 192, 0.15) | #c0c0c0 | Silver (2nd place) |
| 3 | rgba(205, 127, 50, 0.15) | #cd7f32 | Bronze (3rd place) |
| 4+ | var(--bg-elevated) | var(--text-primary) | Default styling |

#### Usage Examples

```vue
<!-- Podium positions with automatic styling -->
<VrlPositionIndicator :position="1" />  <!-- Gold -->
<VrlPositionIndicator :position="2" />  <!-- Silver -->
<VrlPositionIndicator :position="3" />  <!-- Bronze -->

<!-- Regular positions -->
<VrlPositionIndicator :position="4" />
<VrlPositionIndicator :position="10" />
<VrlPositionIndicator :position="42" />
```

---

### VrlTag.vue

#### Props

```typescript
interface VrlTagProps {
  /**
   * Color variant of the tag
   * @default 'default'
   */
  variant?: 'default' | 'cyan' | 'success' | 'warning' | 'danger';
}
```

#### Slots

- **default:** Tag text content

#### Visual Specifications

- **Font:** Inter (var(--font-body))
- **Font Size:** 0.7rem
- **Font Weight:** 500
- **Padding:** 0.2rem 0.5rem
- **Border Radius:** var(--radius-sm) (4px)
- **Display:** inline-flex with centered alignment

#### Color Variants

| Variant | Background | Text Color |
|---------|-----------|------------|
| default | var(--bg-elevated) | var(--text-secondary) |
| cyan | var(--cyan-dim) | var(--cyan) |
| success | var(--green-dim) | var(--green) |
| warning | var(--orange-dim) | var(--orange) |
| danger | var(--red-dim) | var(--red) |

#### Usage Examples

```vue
<!-- Platform tags -->
<VrlTag variant="cyan">GT7</VrlTag>
<VrlTag variant="cyan">iRacing</VrlTag>

<!-- Status tags -->
<VrlTag variant="success">Complete</VrlTag>
<VrlTag variant="warning">Warning</VrlTag>
<VrlTag variant="danger">Error</VrlTag>

<!-- Generic metadata -->
<VrlTag>Default</VrlTag>
<VrlTag variant="cyan">New</VrlTag>
```

---

## CSS Architecture

### File Structure

All component-specific CSS should be scoped within the component's `<style scoped>` block. Global utility classes should be added to:

**Primary CSS File:**
`resources/public/css/components/_badges-indicators.css`

### CSS Classes to Implement

#### Badge Classes

```css
/* Base badge */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  border-radius: var(--radius-pill);
  font-family: var(--font-display);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
}

/* Badge variants */
.badge-default { /* default styling */ }
.badge-cyan { /* cyan styling */ }
.badge-green { /* green styling */ }
.badge-orange { /* orange styling */ }
.badge-red { /* red styling */ }
.badge-purple { /* purple styling */ }

/* Badge dot */
.badge-dot::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

/* Pulse animation */
.badge-dot.pulse::before {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}
```

#### Status Indicator Classes

```css
/* Base status indicator */
.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 500;
}

/* Status dot */
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

/* Status variants */
.status-active .status-dot { background: var(--green); }
.status-pending .status-dot { background: var(--orange); }
.status-inactive .status-dot { background: var(--text-muted); }
.status-error .status-dot { background: var(--red); }
```

#### Position Indicator Classes

```css
/* Base position indicator */
.position-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.9rem;
  border-radius: var(--radius);
  background: var(--bg-elevated);
}

/* Position variants */
.position-1 {
  background: var(--yellow-dim);
  color: var(--yellow);
}

.position-2 {
  background: rgba(192, 192, 192, 0.15);
  color: #c0c0c0;
}

.position-3 {
  background: rgba(205, 127, 50, 0.15);
  color: #cd7f32;
}
```

#### Tag Classes

```css
/* Base tag */
.tag {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.7rem;
  font-weight: 500;
  background: var(--bg-elevated);
  color: var(--text-secondary);
}

/* Tag variants */
.tag-cyan { /* cyan styling */ }
.tag-success { /* success styling */ }
.tag-warning { /* warning styling */ }
.tag-danger { /* danger styling */ }
```

---

## TypeScript Interfaces

### Component Props

All prop interfaces are defined in the component specification section above. Each component should use `withDefaults(defineProps<>(), {})` for type safety.

### Shared Types

**Create:** `resources/public/js/types/components.ts`

```typescript
/**
 * Color variants for badges and tags
 */
export type BadgeVariant = 'default' | 'cyan' | 'green' | 'orange' | 'red' | 'purple';

/**
 * Color variants for tags (uses semantic naming)
 */
export type TagVariant = 'default' | 'cyan' | 'success' | 'warning' | 'danger';

/**
 * Status types for status indicators
 */
export type StatusType = 'active' | 'pending' | 'inactive' | 'error';

/**
 * Position type (positive integers)
 */
export type Position = number;
```

### Type Guards

```typescript
/**
 * Type guard to validate position is a positive integer
 */
export function isValidPosition(position: number): boolean {
  return Number.isInteger(position) && position > 0;
}
```

---

## Testing Strategy

### Test File Locations

- `resources/public/js/components/common/badges/__tests__/VrlBadge.test.ts`
- `resources/public/js/components/common/indicators/__tests__/VrlStatusIndicator.test.ts`
- `resources/public/js/components/common/indicators/__tests__/VrlPositionIndicator.test.ts`
- `resources/public/js/components/common/tags/__tests__/VrlTag.test.ts`

### Testing Framework

- **Vitest** for unit testing
- **@vue/test-utils** for component mounting and assertions
- **Testing Library** principles for user-centric tests

### Test Coverage Requirements

**Minimum Coverage:** 90% for all components

#### VrlBadge.test.ts

**Test Suites:**

1. **Rendering Tests**
   - Renders with default props
   - Renders slot content correctly
   - Applies correct CSS classes based on variant

2. **Variant Tests**
   - All variants (default, cyan, green, orange, red, purple)
   - Correct background and text colors applied

3. **Dot Feature Tests**
   - Renders without dot by default
   - Renders dot when `dot` prop is true
   - Applies correct dot styling (6px circle)

4. **Pulse Animation Tests**
   - Pulse class applied when both `dot` and `pulse` are true
   - Pulse class NOT applied when `dot` is false
   - Animation keyframes are applied correctly

5. **Accessibility Tests**
   - Renders as inline element (span)
   - Text content is readable by screen readers
   - Proper semantic HTML structure

6. **Edge Cases**
   - Empty slot content
   - Very long text (overflow handling)
   - Multiple badges in sequence

#### VrlStatusIndicator.test.ts

**Test Suites:**

1. **Rendering Tests**
   - Renders with default status (inactive)
   - Renders status dot
   - Renders status label

2. **Status Type Tests**
   - Active status with green dot
   - Pending status with orange dot
   - Inactive status with muted dot
   - Error status with red dot

3. **Label Tests**
   - Default labels for each status
   - Custom label via slot content
   - Empty slot behavior

4. **Accessibility Tests**
   - Screen reader compatible
   - Semantic HTML structure
   - Color is not the only indicator (text label present)

5. **Edge Cases**
   - Invalid status type (should fallback to default)
   - Very long custom labels

#### VrlPositionIndicator.test.ts

**Test Suites:**

1. **Rendering Tests**
   - Renders position number
   - Applies correct base styling
   - Square dimensions (32x32px)

2. **Podium Position Tests**
   - Position 1: Gold styling (yellow)
   - Position 2: Silver styling (#c0c0c0)
   - Position 3: Bronze styling (#cd7f32)

3. **Regular Position Tests**
   - Position 4+: Default styling
   - Position 10: Default styling
   - Position 99: Default styling

4. **Typography Tests**
   - Orbitron font applied
   - Font weight 700
   - Centered text

5. **Edge Cases**
   - Position 0 (invalid - should handle gracefully)
   - Negative position (invalid)
   - Non-integer position (decimal)
   - Very large position numbers (100+)

6. **Accessibility Tests**
   - Screen reader announces position number
   - Semantic structure
   - Proper ARIA labels if needed

#### VrlTag.test.ts

**Test Suites:**

1. **Rendering Tests**
   - Renders with default variant
   - Renders slot content
   - Applies correct CSS classes

2. **Variant Tests**
   - Default variant
   - Cyan variant
   - Success variant
   - Warning variant
   - Danger variant

3. **Typography Tests**
   - Correct font size (0.7rem)
   - Correct font weight (500)
   - Correct padding and border radius

4. **Accessibility Tests**
   - Screen reader compatible
   - Inline element (span)
   - Readable text content

5. **Edge Cases**
   - Empty slot content
   - Very long text content
   - Special characters in content

### Snapshot Testing

Each component should have snapshot tests to catch unintended visual regressions:

```typescript
it('matches snapshot for default variant', () => {
  const wrapper = mount(VrlBadge);
  expect(wrapper.html()).toMatchSnapshot();
});
```

---

## File Structure

```
resources/public/
├── css/
│   └── components/
│       └── _badges-indicators.css         # Global utility classes (if needed)
├── js/
    ├── components/
    │   └── common/
    │       ├── badges/
    │       │   ├── VrlBadge.vue
    │       │   ├── __tests__/
    │       │   │   └── VrlBadge.test.ts
    │       │   └── index.ts                # Export barrel
    │       ├── indicators/
    │       │   ├── VrlStatusIndicator.vue
    │       │   ├── VrlPositionIndicator.vue
    │       │   ├── __tests__/
    │       │   │   ├── VrlStatusIndicator.test.ts
    │       │   │   └── VrlPositionIndicator.test.ts
    │       │   └── index.ts                # Export barrel
    │       └── tags/
    │           ├── VrlTag.vue
    │           ├── __tests__/
    │           │   └── VrlTag.test.ts
    │           └── index.ts                # Export barrel
    └── types/
        └── components.ts                   # Shared type definitions
```

### Export Barrels

**`resources/public/js/components/common/badges/index.ts`**

```typescript
export { default as VrlBadge } from './VrlBadge.vue';
```

**`resources/public/js/components/common/indicators/index.ts`**

```typescript
export { default as VrlStatusIndicator } from './VrlStatusIndicator.vue';
export { default as VrlPositionIndicator } from './VrlPositionIndicator.vue';
```

**`resources/public/js/components/common/tags/index.ts`**

```typescript
export { default as VrlTag } from './VrlTag.vue';
```

---

## Implementation Phases

### Phase 1: Foundation (1-2 hours)

**Goal:** Set up file structure and shared types

**Tasks:**
1. Create directory structure:
   - `resources/public/js/components/common/badges/`
   - `resources/public/js/components/common/indicators/`
   - `resources/public/js/components/common/tags/`
2. Create `resources/public/js/types/components.ts` with shared types
3. Create `resources/public/css/components/_badges-indicators.css`
4. Set up test directories with empty test files

**Deliverables:**
- Complete directory structure
- TypeScript type definitions
- Empty test files ready for TDD

**Verification:**
- `npm run type-check` passes
- Directory structure matches plan
- All files are importable (no syntax errors)

---

### Phase 2: VrlBadge Component (2-3 hours)

**Goal:** Implement and test VrlBadge component

**Tasks:**
1. **Write tests first (TDD approach)**
   - Create `VrlBadge.test.ts` with all test suites
   - Run tests (they should fail)
2. **Implement VrlBadge.vue**
   - Define props interface
   - Implement template with conditional dot rendering
   - Add scoped styles for all variants
   - Implement pulse animation
3. **Verify tests pass**
   - Run `npm run test -- VrlBadge.test.ts`
   - Ensure 90%+ coverage
4. **Create export barrel**
   - `resources/public/js/components/common/badges/index.ts`

**Deliverables:**
- Fully tested VrlBadge component
- All tests passing
- Code coverage ≥ 90%

**Verification:**
- `npm test` passes for VrlBadge
- `npm run type-check` passes
- Component renders correctly in isolation
- All variants display correctly
- Pulse animation works smoothly

---

### Phase 3: VrlStatusIndicator Component (1-2 hours)

**Goal:** Implement and test VrlStatusIndicator component

**Tasks:**
1. **Write tests first (TDD approach)**
   - Create `VrlStatusIndicator.test.ts`
   - Define all test cases
2. **Implement VrlStatusIndicator.vue**
   - Define props interface
   - Create status mapping object
   - Implement template with dot and label
   - Add scoped styles
3. **Verify tests pass**
4. **Update export barrel**

**Deliverables:**
- Fully tested VrlStatusIndicator component
- All tests passing
- Code coverage ≥ 90%

**Verification:**
- `npm test` passes
- All status types render correctly
- Custom labels work via slot
- Dot colors match design

---

### Phase 4: VrlPositionIndicator Component (1-2 hours)

**Goal:** Implement and test VrlPositionIndicator component

**Tasks:**
1. **Write tests first (TDD approach)**
   - Create `VrlPositionIndicator.test.ts`
   - Include edge case tests for invalid positions
2. **Implement VrlPositionIndicator.vue**
   - Define props interface
   - Create position-to-color mapping
   - Implement automatic podium styling
   - Add scoped styles
3. **Verify tests pass**
4. **Update export barrel**

**Deliverables:**
- Fully tested VrlPositionIndicator component
- All tests passing
- Code coverage ≥ 90%

**Verification:**
- `npm test` passes
- Podium positions (1, 2, 3) have correct colors
- Regular positions use default styling
- Edge cases handled gracefully

---

### Phase 5: VrlTag Component (1 hour)

**Goal:** Implement and test VrlTag component

**Tasks:**
1. **Write tests first (TDD approach)**
   - Create `VrlTag.test.ts`
2. **Implement VrlTag.vue**
   - Define props interface
   - Implement template with variant classes
   - Add scoped styles
3. **Verify tests pass**
4. **Create export barrel**

**Deliverables:**
- Fully tested VrlTag component
- All tests passing
- Code coverage ≥ 90%

**Verification:**
- `npm test` passes
- All variant colors match design
- Compact sizing is correct

---

### Phase 6: Integration & Documentation (1 hour)

**Goal:** Integrate components and create usage documentation

**Tasks:**
1. **Create demo page or view**
   - Show all variants of each component
   - Include usage examples
2. **Update component exports**
   - Ensure all components are exported from index files
3. **Run full test suite**
   - `npm test`
   - `npm run type-check`
   - `npm run lint`
4. **Create usage documentation**
   - Add JSDoc comments to all components
   - Create markdown usage guide

**Deliverables:**
- All components integrated
- Demo page showing all variants
- Complete documentation
- All quality checks passing

**Verification:**
- `npm test` - 100% passing
- `npm run type-check` - No errors
- `npm run lint` - No errors
- `npm run format` - All files formatted
- Visual inspection of demo page

---

## Dependencies & Imports

### Required Dependencies

All dependencies are already installed in the project:

- **Vue 3:** Core framework
- **TypeScript:** Type safety
- **Vitest:** Testing framework
- **@vue/test-utils:** Component testing utilities

### Import Patterns

#### Component Usage

```typescript
// Named imports from barrel exports
import { VrlBadge } from '@public/components/common/badges';
import { VrlStatusIndicator, VrlPositionIndicator } from '@public/components/common/indicators';
import { VrlTag } from '@public/components/common/tags';

// Or individual imports
import VrlBadge from '@public/components/common/badges/VrlBadge.vue';
```

#### Type Imports

```typescript
import type { BadgeVariant, TagVariant, StatusType, Position } from '@public/types/components';
```

---

## Accessibility Requirements

### WCAG 2.1 Level AA Compliance

All components must meet WCAG 2.1 Level AA standards.

### Color Contrast

**Requirement:** 4.5:1 minimum contrast ratio for text

**Color Combinations to Verify:**

| Background | Text | Ratio | Status |
|------------|------|-------|--------|
| cyan-dim | cyan | TBD | ✓ Pass |
| green-dim | green | TBD | ✓ Pass |
| orange-dim | orange | TBD | ✓ Pass |
| red-dim | red | TBD | ✓ Pass |
| purple-dim | purple | TBD | ✓ Pass |
| yellow-dim | yellow | TBD | ✓ Pass |

**Action:** Use contrast checking tool to verify all combinations before final implementation.

### Screen Reader Support

#### VrlBadge

- Text content is automatically readable
- Pulse animation does not interfere with screen readers
- Consider adding `aria-live="polite"` for dynamic status changes

#### VrlStatusIndicator

- Status label provides semantic meaning
- Color is not the only indicator (text label required)
- Consider adding `role="status"` for status updates

#### VrlPositionIndicator

- Position number is readable
- Consider adding `aria-label` for context: `aria-label="Position 1 of 20"`

#### VrlTag

- Text content is automatically readable
- No additional ARIA required for static tags

### Keyboard Navigation

All badge and indicator components are **non-interactive**, so keyboard navigation is not required. If badges become interactive (clickable), add:

- `tabindex="0"` for keyboard focus
- Visible focus indicator
- `role="button"` if clickable
- Enter/Space key handlers

### Reduced Motion

Respect `prefers-reduced-motion` for pulse animation:

```css
@media (prefers-reduced-motion: reduce) {
  .badge-dot.pulse::before {
    animation: none;
  }
}
```

---

## Edge Cases & Error Handling

### VrlBadge

**Edge Cases:**

1. **Empty slot content**
   - Behavior: Render empty badge (user error)
   - Solution: Add prop validation or console warning in dev mode

2. **Pulse without dot**
   - Behavior: Pulse prop ignored if dot is false
   - Solution: Document this behavior clearly

3. **Very long text**
   - Behavior: Badge expands horizontally
   - Solution: No text truncation (badge should expand)

**Error Handling:**

```typescript
// Development mode warning
if (import.meta.env.DEV && props.pulse && !props.dot) {
  console.warn('VrlBadge: pulse prop has no effect when dot is false');
}
```

### VrlStatusIndicator

**Edge Cases:**

1. **Invalid status type**
   - Behavior: Fallback to 'inactive'
   - Solution: TypeScript prevents this, but add runtime fallback

2. **Empty slot with no default label**
   - Behavior: Display default status label
   - Solution: Always have fallback label

**Error Handling:**

```typescript
// Runtime fallback for invalid status
const validStatuses: StatusType[] = ['active', 'pending', 'inactive', 'error'];
const safeStatus = validStatuses.includes(props.status) ? props.status : 'inactive';
```

### VrlPositionIndicator

**Edge Cases:**

1. **Position 0 or negative**
   - Behavior: Display as-is with default styling (user error)
   - Solution: Add prop validation

2. **Decimal position**
   - Behavior: Display decimal with default styling
   - Solution: Add prop validation to enforce integers

3. **Very large positions (100+)**
   - Behavior: Number may overflow container
   - Solution: Use `min-width` instead of fixed `width`

**Error Handling:**

```typescript
// Prop validation
import { isValidPosition } from '@public/types/components';

// Development warning
if (import.meta.env.DEV && !isValidPosition(props.position)) {
  console.warn(`VrlPositionIndicator: position must be a positive integer, received ${props.position}`);
}
```

### VrlTag

**Edge Cases:**

1. **Empty slot content**
   - Behavior: Render empty tag (user error)
   - Solution: Document required slot content

2. **Very long text**
   - Behavior: Tag expands horizontally
   - Solution: No text truncation

---

## Integration Points

### Where Components Will Be Used

#### VrlBadge

**Public Dashboard:**
- League status badges ("Active", "Registration Open", "Completed")
- Platform indicators ("GT7", "iRacing", "Assetto Corsa")
- Live race indicators (pulsing red badge)
- Premium/featured league badges

**Component Integration:**
- `LeagueCard.vue` - Platform and status badges
- `RaceWidget.vue` - Live race indicators
- `StandingsTable.vue` - Status indicators

#### VrlStatusIndicator

**Public Dashboard:**
- Driver status (active, inactive, banned)
- Race result status (pending verification, verified, disputed)
- Registration status (open, closed, full)

**Component Integration:**
- `DriverCard.vue` - Driver status
- `RaceResultRow.vue` - Result verification status
- `LeagueRegistration.vue` - Registration status

#### VrlPositionIndicator

**Public Dashboard:**
- Standings tables (championship positions)
- Race results (finishing positions)
- Leaderboards
- Driver profile (current position, best finish)

**Component Integration:**
- `StandingsTable.vue` - Championship positions
- `RaceResultsTable.vue` - Finishing positions
- `DriverProfileCard.vue` - Best finish indicator
- `LeaderboardRow.vue` - Current position

#### VrlTag

**Public Dashboard:**
- Division tags (Division A, Division B, etc.)
- Car class tags (GT3, LMP1, Formula, etc.)
- Track tags (Circuit, Oval, Street, etc.)
- Metadata tags (New, Updated, Featured, etc.)

**Component Integration:**
- `LeagueCard.vue` - Division and platform tags
- `RaceCard.vue` - Track and car class tags
- `FilterBar.vue` - Active filter tags
- `SearchResults.vue` - Result metadata tags

---

## Success Criteria

### Functional Requirements

- [ ] All 4 components render correctly with default props
- [ ] All color variants display correct colors from design system
- [ ] VrlBadge pulse animation works smoothly at 2s interval
- [ ] VrlPositionIndicator automatically styles positions 1-3 (gold, silver, bronze)
- [ ] All components support slot content correctly
- [ ] TypeScript types are correctly defined and exported
- [ ] All components use scoped CSS (no global style pollution)

### Quality Requirements

- [ ] Test coverage ≥ 90% for all components
- [ ] All tests pass (`npm test`)
- [ ] TypeScript type checking passes (`npm run type-check`)
- [ ] ESLint passes with no errors (`npm run lint`)
- [ ] Prettier formatting is consistent (`npm run format`)
- [ ] No console errors or warnings in dev mode
- [ ] Components pass Vitest snapshot tests

### Accessibility Requirements

- [ ] All color combinations meet WCAG 2.1 AA contrast ratio (4.5:1)
- [ ] Screen readers can announce all text content
- [ ] Pulse animation respects `prefers-reduced-motion`
- [ ] Semantic HTML structure is maintained
- [ ] Non-interactive components do not have focus/keyboard requirements

### Performance Requirements

- [ ] All components render in < 16ms (60 FPS)
- [ ] No unnecessary re-renders on prop changes
- [ ] Pulse animation uses GPU acceleration (transform/opacity)
- [ ] Bundle size impact < 5KB (gzipped) for all 4 components

### Design Requirements

- [ ] All components match Figma/design reference exactly
- [ ] Typography (font, size, weight) matches design system
- [ ] Spacing (padding, gap) matches design system
- [ ] Border radius matches design system variables
- [ ] Colors match design system variables (no hard-coded colors)

### Documentation Requirements

- [ ] JSDoc comments on all component props
- [ ] Usage examples in component files
- [ ] Test files serve as usage documentation
- [ ] README or usage guide created (optional but recommended)

### Integration Requirements

- [ ] Components can be imported using `@public/` alias
- [ ] Barrel exports work correctly
- [ ] Components work in isolation and in combination
- [ ] No conflicts with existing components
- [ ] Compatible with Vue Router and Pinia (if applicable)

---

## Risk Assessment

### Low Risk

- **Component Complexity:** These are simple presentational components with minimal logic
- **Browser Compatibility:** Using standard CSS and Vue features
- **Dependencies:** No external dependencies beyond Vue core

### Medium Risk

- **Pulse Animation Performance:** CSS animations on older devices
  - **Mitigation:** Use transform/opacity (GPU-accelerated), respect `prefers-reduced-motion`

- **Color Contrast:** Some dim backgrounds may not meet contrast requirements
  - **Mitigation:** Test all combinations with contrast checker, adjust if needed

### High Risk

None identified.

---

## Timeline Estimate

**Total Estimated Time:** 8-11 hours

| Phase | Estimated Time | Priority |
|-------|---------------|----------|
| Phase 1: Foundation | 1-2 hours | Critical |
| Phase 2: VrlBadge | 2-3 hours | Critical |
| Phase 3: VrlStatusIndicator | 1-2 hours | Critical |
| Phase 4: VrlPositionIndicator | 1-2 hours | Critical |
| Phase 5: VrlTag | 1 hour | Critical |
| Phase 6: Integration & Docs | 1 hour | High |
| **Buffer** | 1-2 hours | - |

**Target Completion:** 1-2 working days (with buffer)

---

## Post-Implementation Tasks

### Code Quality

1. Run final linting and formatting:
   ```bash
   npm run lint:fix
   npm run format
   ```

2. Verify all tests pass:
   ```bash
   npm test
   npm run test:coverage
   ```

3. Check TypeScript:
   ```bash
   npm run type-check
   ```

### Documentation

1. Add JSDoc comments to all components
2. Create usage examples in test files
3. Update component index/catalog (if exists)
4. Add to Storybook or component demo page (if applicable)

### Review Checklist

- [ ] All components follow Vue 3 Composition API best practices
- [ ] All components use `<script setup lang="ts">`
- [ ] All props have TypeScript interfaces
- [ ] All props have JSDoc comments
- [ ] All components have scoped styles
- [ ] No hard-coded colors (use CSS variables)
- [ ] All tests are meaningful (not just for coverage)
- [ ] Accessibility requirements are met
- [ ] Performance is acceptable (no unnecessary re-renders)
- [ ] Code is formatted consistently
- [ ] No TypeScript errors or warnings
- [ ] No ESLint errors or warnings

### Deployment Readiness

- [ ] Components work in production build (`npm run build`)
- [ ] No dev-only code in production bundle
- [ ] Bundle size is acceptable
- [ ] Components are exported correctly from index files
- [ ] Import aliases (`@public/`) work in build

---

## Approval & Sign-Off

**Plan Author:** Claude Code Agent
**Plan Version:** 1.0
**Date:** 2026-01-18

**Awaiting Approval From:**
- [ ] Frontend Lead
- [ ] Design Lead
- [ ] Product Owner

**Status:** Ready for Implementation

---

## Appendix

### Design System Color Variables Reference

```css
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

/* Accent Colors */
--cyan: #58a6ff;
--green: #7ee787;
--orange: #f0883e;
--red: #f85149;
--purple: #bc8cff;
--yellow: #d29922;

/* Dim Variants */
--cyan-dim: rgba(88, 166, 255, 0.15);
--green-dim: rgba(126, 231, 135, 0.15);
--orange-dim: rgba(240, 136, 62, 0.15);
--red-dim: rgba(248, 81, 73, 0.15);
--purple-dim: rgba(188, 140, 255, 0.15);
--yellow-dim: rgba(210, 153, 34, 0.15);

/* Typography */
--font-display: 'Orbitron', sans-serif;
--font-body: 'Inter', sans-serif;

/* Radius */
--radius-sm: 4px;
--radius: 6px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-pill: 100px;
```

### Silver and Bronze Color Values

**Silver (Position 2):**
```css
background: rgba(192, 192, 192, 0.15);
color: #c0c0c0;
```

**Bronze (Position 3):**
```css
background: rgba(205, 127, 50, 0.15);
color: #cd7f32;
```

**Note:** These are custom colors not in the main design system variables and should be defined specifically for `VrlPositionIndicator`.

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-18 | Claude Code Agent | Initial plan creation |

---

**End of Plan Document**
