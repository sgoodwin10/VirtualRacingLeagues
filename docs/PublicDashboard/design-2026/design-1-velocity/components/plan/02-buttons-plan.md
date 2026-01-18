# VRL Velocity Design System - Buttons Component Plan

**Component Set**: Buttons
**Plan Version**: 1.0
**Created**: 2026-01-18
**Target Directory**: `resources/public/js/components/common/buttons/`

---

## Table of Contents

1. [Overview](#overview)
2. [Components to Build](#components-to-build)
3. [Design Specifications](#design-specifications)
4. [Component Architecture](#component-architecture)
5. [Props & API Design](#props--api-design)
6. [Styling Strategy](#styling-strategy)
7. [Accessibility Requirements](#accessibility-requirements)
8. [Testing Strategy](#testing-strategy)
9. [Implementation Phases](#implementation-phases)
10. [Dependencies & Imports](#dependencies--imports)
11. [Success Criteria](#success-criteria)

---

## Overview

### Purpose
The Buttons component set provides interactive action elements across the VRL public dashboard. These components follow the Velocity design system's futuristic, racing-inspired aesthetic with Orbitron typography and dynamic hover effects.

### Components
1. **VrlButton.vue** - Main button component with variants, sizes, and states
2. **VrlIconButton.vue** - Square icon-only button variant
3. **CSS Styles** - Button styling in Tailwind CSS

### Key Design Principles
- **Orbitron Typography**: All buttons use Orbitron font for a racing-inspired feel
- **Dynamic Hover Effects**: Subtle translateY and box-shadow animations
- **Accessibility First**: Full keyboard navigation, ARIA labels, focus states
- **PrimeVue Foundation**: Wraps PrimeVue Button for accessibility and functionality
- **Type Safety**: Full TypeScript support with strict typing

---

## Components to Build

### 1. VrlButton.vue
**File**: `resources/public/js/components/common/buttons/VrlButton.vue`

**Purpose**: Primary button component for all button interactions on the public dashboard.

**Features**:
- 7 visual variants (primary, secondary, ghost, outline, success, warning, danger)
- 4 size options (sm, default, lg, xl)
- Loading state with animated spinner
- Disabled state
- Icon support (left or right position, or icon-only)
- Slot for custom content
- Click event handling

### 2. VrlIconButton.vue
**File**: `resources/public/js/components/common/buttons/VrlIconButton.vue`

**Purpose**: Specialized square button for icon-only actions (e.g., close, expand, settings).

**Features**:
- Same variants as VrlButton
- 3 size options (sm, default, lg)
- Square aspect ratio (width === height)
- Centered icon
- Tooltip support (optional)
- Full accessibility with aria-label

### 3. CSS Styles
**File**: `resources/public/css/app.css` (or dedicated file)

**Purpose**: Tailwind-based CSS classes for button styling that matches the Velocity design system.

**Includes**:
- Base `.btn` styles
- Variant classes (`.btn-primary`, `.btn-secondary`, etc.)
- Size modifiers (`.btn-sm`, `.btn-lg`, `.btn-xl`)
- State styles (`:disabled`, `.loading`)
- Icon button specific styles (`.btn-icon`)
- Keyframe animations (spinner)

---

## Design Specifications

### Typography
- **Font Family**: Orbitron (display font)
- **Font Size**:
  - Small: 0.75rem (12px)
  - Default: 0.85rem (13.6px)
  - Large: 1rem (16px)
  - XL: 1.1rem (17.6px)
- **Font Weight**: 600
- **Letter Spacing**: 1px (tight, uppercase feel)

### Spacing & Dimensions

#### Default Button
- **Padding**: 0.75rem 1.5rem (12px 24px)
- **Border Radius**: 6px (`var(--radius)`)
- **Height**: Auto (based on padding + font)
- **Gap** (icon + text): 0.5rem (8px)

#### Size Variants
| Size | Padding | Font Size | Height (approx) |
|------|---------|-----------|-----------------|
| sm   | 0.5rem 1rem | 0.75rem | ~32px |
| default | 0.75rem 1.5rem | 0.85rem | ~40px |
| lg   | 1rem 2rem | 1rem | ~48px |
| xl   | 1.25rem 2.5rem | 1.1rem | ~56px |

#### Icon Button Dimensions
| Size | Width | Height |
|------|-------|--------|
| sm   | 32px  | 32px   |
| default | 40px | 40px |
| lg   | 48px  | 48px   |

### Color Variants

#### Primary
- **Background**: `var(--cyan)` (#58a6ff)
- **Text**: `var(--bg-dark)` (dark background color)
- **Border**: None
- **Hover Background**: #79b8ff (lighter cyan)
- **Hover Transform**: translateY(-2px)
- **Hover Shadow**: 0 10px 30px rgba(88, 166, 255, 0.3)

#### Secondary
- **Background**: transparent
- **Text**: `var(--text-primary)`
- **Border**: 1px solid `var(--border)`
- **Hover Background**: `var(--bg-elevated)`
- **Hover Border**: `var(--cyan)`
- **No transform or shadow**

#### Ghost
- **Background**: transparent
- **Text**: `var(--text-secondary)`
- **Border**: None
- **Hover Background**: `var(--bg-elevated)`
- **Hover Text**: `var(--text-primary)`
- **No transform or shadow**

#### Outline
- **Background**: transparent
- **Text**: `var(--cyan)`
- **Border**: 1px solid `var(--cyan)`
- **Hover Background**: `var(--cyan-dim)`
- **No transform or shadow**

#### Success
- **Background**: `var(--green)` (#7ee787)
- **Text**: `var(--bg-dark)`
- **Border**: None
- **Hover Background**: #9ff0a4 (lighter green)
- **Hover Transform**: translateY(-2px)
- **Hover Shadow**: 0 10px 30px rgba(126, 231, 135, 0.3)

#### Warning
- **Background**: `var(--orange)` (#f0883e)
- **Text**: `var(--bg-dark)`
- **Border**: None
- **Hover Background**: #f4a261 (lighter orange)
- **Hover Transform**: translateY(-2px)
- **Hover Shadow**: 0 10px 30px rgba(240, 136, 62, 0.3)

#### Danger
- **Background**: `var(--red)` (#f85149)
- **Text**: `var(--bg-dark)`
- **Border**: None
- **Hover Background**: #fa7970 (lighter red)
- **Hover Transform**: translateY(-2px)
- **Hover Shadow**: 0 10px 30px rgba(248, 81, 73, 0.3)

### States

#### Disabled
- **Opacity**: 0.5
- **Cursor**: not-allowed
- **No hover effects**: `transform: none !important`, `box-shadow: none !important`

#### Loading
- **Text**: transparent (hide text)
- **Position**: relative
- **Spinner**: Pseudo-element `::after`
  - Width/Height: 16px
  - Border: 2px solid transparent
  - Border-top: currentColor
  - Border-radius: 50%
  - Animation: spin 0.8s linear infinite
  - Position: absolute center

### Animations

#### Spin (Loading Spinner)
```css
@keyframes spin {
  to { transform: rotate(360deg); }
}
```

#### Hover Transition
- **Property**: all
- **Duration**: 0.3s
- **Easing**: ease

---

## Component Architecture

### VrlButton.vue Structure

```
VrlButton
├── PrimeVue Button (wrapper for accessibility)
│   ├── Props mapping (severity, size, text, outlined, disabled, loading)
│   ├── Custom CSS classes (variant, size)
│   └── Slots
│       ├── icon (if icon provided and not icon-only)
│       └── default (button text/content)
└── Click event handling
```

### VrlIconButton.vue Structure

```
VrlIconButton
└── VrlButton (reuses main button with icon-only mode)
    ├── Icon prop (required)
    ├── Variant prop
    ├── Size prop
    ├── Disabled prop
    ├── Tooltip prop (optional)
    └── AriaLabel prop (required for accessibility)
```

### Design Rationale

**Why wrap PrimeVue Button?**
- PrimeVue provides excellent accessibility features (ARIA, keyboard nav, focus management)
- Consistent behavior across the application
- Loading state built-in
- Button types (submit, button, reset) handled
- We only need to override visual styling

**Why separate IconButton component?**
- Different prop requirements (icon required, no label)
- Simplified API for icon-only use case
- Square aspect ratio enforcement
- Tooltip integration
- Clearer semantic meaning in templates

---

## Props & API Design

### VrlButton Props

```typescript
interface VrlButtonProps {
  // Visual variant
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'success' | 'warning' | 'danger';

  // Size
  size?: 'sm' | 'default' | 'lg' | 'xl';

  // Content
  label?: string;

  // Icon (Phosphor icon component)
  icon?: Component;
  iconPos?: 'left' | 'right';

  // States
  disabled?: boolean;
  loading?: boolean;

  // HTML attributes
  type?: 'button' | 'submit' | 'reset';

  // Accessibility
  ariaLabel?: string;

  // PrimeVue passthrough
  pt?: Record<string, unknown>;
}
```

**Defaults**:
- `variant`: 'secondary'
- `size`: 'default'
- `iconPos`: 'left'
- `disabled`: false
- `loading`: false
- `type`: 'button'

### VrlButton Events

```typescript
interface VrlButtonEmits {
  (e: 'click', event: MouseEvent): void;
}
```

### VrlButton Slots

```typescript
// Default slot: button text/content
<VrlButton>Click Me</VrlButton>

// Icon slot: custom icon placement (optional, prefer icon prop)
<VrlButton>
  <template #icon>
    <CustomIcon />
  </template>
  Button Text
</VrlButton>
```

### VrlIconButton Props

```typescript
interface VrlIconButtonProps {
  // Icon (required)
  icon: Component;

  // Visual variant
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'success' | 'warning' | 'danger';

  // Size
  size?: 'sm' | 'default' | 'lg';

  // States
  disabled?: boolean;

  // Tooltip (optional)
  tooltip?: string;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';

  // Accessibility (required if no tooltip)
  ariaLabel?: string;
}
```

**Defaults**:
- `variant`: 'secondary'
- `size`: 'default'
- `disabled`: false
- `tooltipPosition`: 'top'

**Validation**:
- Either `tooltip` or `ariaLabel` must be provided for accessibility
- If tooltip provided, it's automatically used as aria-label

### VrlIconButton Events

```typescript
interface VrlIconButtonEmits {
  (e: 'click', event: MouseEvent): void;
}
```

---

## Styling Strategy

### CSS Architecture

**Approach**: Tailwind CSS with component-scoped custom properties

**File Structure**:
```
resources/public/css/
├── app.css (main entry)
└── components/
    └── buttons.css (button-specific styles)
```

OR

```
resources/public/css/
└── app.css (all styles including buttons)
```

**Recommendation**: Use dedicated `buttons.css` file for better organization and maintainability.

### CSS Custom Properties Required

Ensure these are defined in the design system:

```css
/* Colors */
--cyan: #58a6ff;
--cyan-dim: rgba(88, 166, 255, 0.15);
--green: #7ee787;
--green-dim: rgba(126, 231, 135, 0.15);
--orange: #f0883e;
--orange-dim: rgba(240, 136, 62, 0.15);
--red: #f85149;
--red-dim: rgba(248, 81, 73, 0.15);
--purple: #d2a8ff;
--purple-dim: rgba(210, 168, 255, 0.15);

/* Backgrounds */
--bg-dark: #0d1117;
--bg-elevated: #161b22;
--bg-card: #1c2128;
--bg-highlight: #21262d;

/* Text */
--text-primary: #e6edf3;
--text-secondary: #8b949e;
--text-muted: #6e7681;

/* Borders */
--border: #30363d;
--border-muted: #21262d;

/* Spacing */
--radius: 6px;
--radius-pill: 9999px;

/* Transitions */
--transition: all 0.3s ease;

/* Typography */
--font-display: 'Orbitron', sans-serif;
--font-body: 'Inter', sans-serif;
```

### CSS Class Naming Convention

**Pattern**: `.btn-[variant]-[size]`

**Examples**:
- `.btn` - Base button styles
- `.btn-primary` - Primary variant
- `.btn-sm` - Small size modifier
- `.btn-icon` - Icon button base
- `.btn.loading` - Loading state (class, not pseudo)
- `.btn:disabled` - Disabled state (pseudo-class)

### Tailwind Integration

**Approach**: Use `@apply` sparingly, prefer custom CSS classes

**Why**:
- Better performance (no class duplication)
- Easier to maintain design system consistency
- Clearer separation between utility classes and component styles

**Where to use Tailwind**:
- Layout utilities in templates (flex, grid, spacing)
- Responsive design (`sm:`, `md:`, `lg:`)
- State variants (`hover:`, `focus:`, `disabled:`)

**Where to use custom CSS**:
- Component-specific styling
- Complex animations
- Pseudo-elements (::before, ::after)
- Multi-property hover effects

---

## Accessibility Requirements

### ARIA Labels

**VrlButton**:
- If `ariaLabel` prop provided, use it
- If icon-only (no label), require `ariaLabel`
- Default aria-label for icon-only: "Icon button" (generic fallback)

**VrlIconButton**:
- **REQUIRED**: Either `tooltip` or `ariaLabel` must be provided
- Priority: `ariaLabel` > `tooltip`
- Error handling: Console warning if neither provided

### Keyboard Navigation

**Requirements**:
- All buttons focusable via Tab key
- Activated via Enter or Space key
- Focus visible indicator (outline)
- Disabled buttons not in tab order

**Implementation**:
- PrimeVue Button handles keyboard events automatically
- Custom focus styles via CSS `:focus-visible`

### Focus Indicators

**Visual Design**:
- **Outline**: 2px solid `var(--cyan)`
- **Outline Offset**: 2px
- **Box Shadow**: None (remove PrimeVue default)
- **Trigger**: `:focus-visible` (not `:focus` - keyboard only)

**Code**:
```css
.btn:focus-visible {
  outline: 2px solid var(--cyan);
  outline-offset: 2px;
  box-shadow: none;
}
```

### Screen Reader Support

**Requirements**:
- Button role communicated (handled by `<button>` element)
- Button label/purpose clear (aria-label or text content)
- Loading state announced (PrimeVue handles via `aria-busy`)
- Disabled state announced (handled by `disabled` attribute)

### Color Contrast

**WCAG AA Requirements**:
- Normal text: 4.5:1 contrast ratio
- Large text (18px+): 3:1 contrast ratio

**Verify**:
- Primary (cyan on dark): ✓ High contrast
- Success (green on dark): ✓ High contrast
- Warning (orange on dark): ✓ High contrast
- Danger (red on dark): ✓ High contrast
- Secondary (text on border): ✓ Check with design tokens
- Ghost (secondary text): ✓ Check with design tokens

**Testing**: Use browser DevTools Accessibility panel

---

## Testing Strategy

### Unit Tests (Vitest)

**Test File**: `resources/public/js/components/common/buttons/__tests__/VrlButton.test.ts`

**Coverage Requirements**: >90% code coverage

**Test Cases**:

#### 1. Rendering Tests
- [ ] Renders with default props
- [ ] Renders with all variant types
- [ ] Renders with all size types
- [ ] Renders with label text
- [ ] Renders with icon (left position)
- [ ] Renders with icon (right position)
- [ ] Renders as icon-only (no label)
- [ ] Renders with loading state
- [ ] Renders with disabled state

#### 2. Props Tests
- [ ] Accepts and applies variant prop
- [ ] Accepts and applies size prop
- [ ] Accepts and applies disabled prop
- [ ] Accepts and applies loading prop
- [ ] Accepts and applies type prop (button, submit, reset)
- [ ] Accepts and applies ariaLabel prop

#### 3. Event Tests
- [ ] Emits click event when clicked
- [ ] Does not emit click when disabled
- [ ] Does not emit click when loading
- [ ] Click event receives MouseEvent

#### 4. Slot Tests
- [ ] Renders default slot content
- [ ] Renders icon slot content (if provided)

#### 5. Accessibility Tests
- [ ] Has accessible name (from label or aria-label)
- [ ] Has correct button role
- [ ] Is focusable via keyboard
- [ ] Has disabled attribute when disabled
- [ ] Icon-only button has aria-label

#### 6. CSS Class Tests
- [ ] Applies base button class
- [ ] Applies variant class
- [ ] Applies size class
- [ ] Applies icon-only class when appropriate

### VrlIconButton Tests

**Test File**: `resources/public/js/components/common/buttons/__tests__/VrlIconButton.test.ts`

**Test Cases**:
- [ ] Renders with required icon prop
- [ ] Applies square dimensions based on size
- [ ] Renders tooltip when provided
- [ ] Has aria-label from tooltip or ariaLabel prop
- [ ] Emits click event
- [ ] Forwards all props to VrlButton correctly

### Visual Regression Tests (Optional)

**Tool**: Playwright + Chromatic (or Percy)

**Test Cases**:
- [ ] All button variants (screenshot)
- [ ] All button sizes (screenshot)
- [ ] Hover states (screenshot)
- [ ] Focus states (screenshot)
- [ ] Disabled state (screenshot)
- [ ] Loading state (screenshot)
- [ ] Icon buttons (all sizes, screenshot)

### Manual Testing Checklist

**Browser Testing**:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Accessibility Testing**:
- [ ] Keyboard navigation works
- [ ] Screen reader announces correctly (NVDA/JAWS on Windows, VoiceOver on Mac)
- [ ] Focus indicators visible
- [ ] Color contrast passes WCAG AA

**Interaction Testing**:
- [ ] Click events fire correctly
- [ ] Hover animations smooth
- [ ] Loading spinner animates
- [ ] Disabled state prevents clicks
- [ ] Touch interactions work on mobile

---

## Implementation Phases

### Phase 1: Foundation Setup (Day 1)

**Tasks**:
1. Create component files
   - [ ] Create `VrlButton.vue`
   - [ ] Create `VrlIconButton.vue`
   - [ ] Create test files (`__tests__/VrlButton.test.ts`, `__tests__/VrlIconButton.test.ts`)

2. Set up CSS structure
   - [ ] Create `resources/public/css/components/buttons.css` OR add to `app.css`
   - [ ] Import in main CSS entry point
   - [ ] Verify CSS custom properties available

3. Install dependencies (if needed)
   - [ ] Verify PrimeVue installed
   - [ ] Verify Phosphor Icons installed
   - [ ] Verify @vue/test-utils installed

**Success Criteria**:
- All files created and properly imported
- CSS compiles without errors
- Test suite runs (even if empty)

---

### Phase 2: VrlButton Component (Day 1-2)

**Tasks**:
1. Implement basic VrlButton
   - [ ] Define TypeScript interfaces (Props, Emits)
   - [ ] Set up props with defaults
   - [ ] Implement PrimeVue Button wrapper
   - [ ] Map variants to PrimeVue severity
   - [ ] Map sizes to PrimeVue size
   - [ ] Handle click events

2. Implement icon support
   - [ ] Add icon prop (Phosphor component)
   - [ ] Add iconPos prop (left/right)
   - [ ] Render icon in PrimeVue icon slot
   - [ ] Handle icon-only mode (no label)
   - [ ] Calculate icon sizes based on button size

3. Implement states
   - [ ] Disabled state
   - [ ] Loading state (use PrimeVue loading prop)
   - [ ] Type attribute (button, submit, reset)

4. Add accessibility
   - [ ] ariaLabel prop
   - [ ] Automatic aria-label for icon-only
   - [ ] PrimeVue passthrough prop for customization

**Success Criteria**:
- VrlButton renders correctly
- All props work as expected
- Click events fire correctly
- TypeScript types are strict
- No console errors

---

### Phase 3: Button CSS Styling (Day 2)

**Tasks**:
1. Base button styles
   - [ ] `.btn` class with Orbitron font, letter-spacing, padding
   - [ ] Flexbox for icon + text alignment
   - [ ] Border-radius, transition

2. Variant styles
   - [ ] `.btn-primary` with cyan background and hover effects
   - [ ] `.btn-secondary` with border and hover effects
   - [ ] `.btn-ghost` with transparent background
   - [ ] `.btn-outline` with cyan border
   - [ ] `.btn-success` with green background and hover effects
   - [ ] `.btn-warning` with orange background and hover effects
   - [ ] `.btn-danger` with red background and hover effects

3. Size styles
   - [ ] `.btn-sm` with smaller padding and font-size
   - [ ] `.btn-lg` with larger padding and font-size
   - [ ] `.btn-xl` with extra-large padding and font-size

4. State styles
   - [ ] `:disabled` with opacity and cursor
   - [ ] `.loading` with transparent text and spinner
   - [ ] `:focus-visible` with outline

5. Icon-only styles
   - [ ] `.btn-icon-only` class for square dimensions
   - [ ] Size-specific width/height

6. Animations
   - [ ] `@keyframes spin` for loading spinner
   - [ ] Hover translateY and box-shadow

**Success Criteria**:
- All variants match design system visual specifications
- Hover effects work smoothly
- Focus indicators visible
- Loading spinner animates correctly
- Styles work across all sizes

---

### Phase 4: VrlIconButton Component (Day 2-3)

**Tasks**:
1. Implement VrlIconButton
   - [ ] Define TypeScript interfaces (Props, Emits)
   - [ ] Set up props with defaults
   - [ ] Wrap VrlButton component
   - [ ] Pass icon prop to VrlButton
   - [ ] Forward variant, size, disabled props
   - [ ] Force icon-only mode

2. Add tooltip support
   - [ ] Add tooltip prop
   - [ ] Add tooltipPosition prop
   - [ ] Integrate PrimeVue Tooltip directive
   - [ ] Use tooltip as aria-label if provided

3. Accessibility
   - [ ] Require ariaLabel or tooltip
   - [ ] Console warning if neither provided
   - [ ] Automatic aria-label from tooltip

**Success Criteria**:
- VrlIconButton renders as square button
- Icon centered correctly
- Tooltip displays on hover
- Accessibility requirements met
- No console errors or warnings

---

### Phase 5: Unit Tests (Day 3)

**Tasks**:
1. VrlButton tests
   - [ ] Write rendering tests (all variants, sizes, states)
   - [ ] Write props tests
   - [ ] Write event tests (click, disabled, loading)
   - [ ] Write slot tests
   - [ ] Write accessibility tests (aria-label, role, keyboard)
   - [ ] Write CSS class tests

2. VrlIconButton tests
   - [ ] Write rendering tests (square dimensions)
   - [ ] Write tooltip tests
   - [ ] Write accessibility tests (aria-label required)
   - [ ] Write event forwarding tests

3. Achieve coverage
   - [ ] Run coverage report: `npm run test:coverage`
   - [ ] Verify >90% code coverage
   - [ ] Add missing test cases

**Success Criteria**:
- All tests pass
- Code coverage >90%
- Tests are clear and maintainable
- Edge cases covered (disabled, loading, etc.)

---

### Phase 6: Integration & Documentation (Day 3-4)

**Tasks**:
1. Create demo/example usage
   - [ ] Add buttons to ComponentDemoView (if exists)
   - [ ] Show all variants
   - [ ] Show all sizes
   - [ ] Show states (disabled, loading)
   - [ ] Show icon buttons

2. Add usage documentation
   - [ ] Create `VrlButton.md` with usage examples
   - [ ] Document all props and events
   - [ ] Show code examples
   - [ ] Add accessibility guidelines

3. Export components
   - [ ] Export from `index.ts` (if exists)
   - [ ] Verify imports work: `import { VrlButton } from '@public/components/common/buttons'`

4. Integration testing
   - [ ] Use VrlButton in a real view (e.g., auth forms)
   - [ ] Use VrlIconButton in a real component (e.g., close buttons)
   - [ ] Verify styling matches design system
   - [ ] Test interactions (click, keyboard, focus)

**Success Criteria**:
- Components integrated into application
- Documentation complete and clear
- Import paths work correctly
- Visual match with design system confirmed

---

### Phase 7: Quality Assurance (Day 4)

**Tasks**:
1. Code quality
   - [ ] Run TypeScript type check: `npm run type-check`
   - [ ] Run linter: `npm run lint:public`
   - [ ] Run formatter: `npm run format:public`
   - [ ] Fix all errors and warnings

2. Browser testing
   - [ ] Test in Chrome (Windows, Mac)
   - [ ] Test in Firefox
   - [ ] Test in Safari (Mac)
   - [ ] Test in Edge
   - [ ] Fix any browser-specific issues

3. Accessibility testing
   - [ ] Run axe DevTools on demo page
   - [ ] Test keyboard navigation
   - [ ] Test screen reader (NVDA or VoiceOver)
   - [ ] Verify color contrast (WCAG AA)
   - [ ] Fix all accessibility issues

4. Performance testing
   - [ ] Verify no memory leaks
   - [ ] Check animation performance (60fps)
   - [ ] Verify CSS bundle size impact
   - [ ] Optimize if needed

**Success Criteria**:
- Zero TypeScript errors
- Zero linting errors
- All browsers work correctly
- All accessibility tests pass
- Performance is acceptable

---

### Phase 8: Final Review & Approval (Day 4-5)

**Tasks**:
1. Design review
   - [ ] Compare against design system specifications
   - [ ] Verify all variants match
   - [ ] Verify spacing, typography, colors
   - [ ] Get design approval

2. Code review
   - [ ] Self-review for code quality
   - [ ] Check for TODOs or commented code
   - [ ] Verify test coverage
   - [ ] Clean up console.logs

3. Documentation review
   - [ ] Verify README/docs are clear
   - [ ] Check code examples work
   - [ ] Verify prop descriptions accurate

4. Final testing
   - [ ] Run full test suite: `npm test`
   - [ ] Run build: `npm run build`
   - [ ] Test production build
   - [ ] Verify no build warnings

**Success Criteria**:
- Design team approval
- All tests pass
- Build successful
- Ready for production use

---

## Dependencies & Imports

### NPM Dependencies

**Required**:
- `vue` (^3.4.0) - Vue framework
- `primevue` (^4.x) - UI component library
- `@phosphor-icons/vue` (^2.x) - Icon library (if using Phosphor)

**Development**:
- `@vue/test-utils` (^2.4.0) - Component testing utilities
- `vitest` (^1.x) - Testing framework
- `@vitest/ui` (^1.x) - Testing UI
- `jsdom` (^22.x) - DOM simulation for tests

### Import Structure

**Component Imports**:
```typescript
// VrlButton.vue
import { computed } from 'vue';
import PrimeButton from 'primevue/button';
import type { Component } from 'vue';

// VrlIconButton.vue
import VrlButton from './VrlButton.vue';
import type { Component } from 'vue';
```

**Usage in Templates**:
```typescript
// In another component
import { VrlButton, VrlIconButton } from '@public/components/common/buttons';
import { PhosphorIconName } from '@phosphor-icons/vue';

// Or individual imports
import VrlButton from '@public/components/common/buttons/VrlButton.vue';
import VrlIconButton from '@public/components/common/buttons/VrlIconButton.vue';
```

### CSS Imports

**In `resources/public/css/app.css`**:
```css
/* Import Tailwind directives */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Import component styles */
@import './components/buttons.css';
```

**Or inline in `app.css`**:
```css
/* ... Tailwind directives ... */

/* Button components */
.btn { /* ... */ }
.btn-primary { /* ... */ }
/* ... rest of button styles ... */
```

### Path Aliases

**Verify in `vite.config.ts`**:
```typescript
resolve: {
  alias: {
    '@public': '/resources/public/js',
  }
}
```

**Verify in `tsconfig.json`**:
```json
{
  "compilerOptions": {
    "paths": {
      "@public/*": ["./resources/public/js/*"]
    }
  }
}
```

---

## Success Criteria

### Functional Requirements
- ✅ VrlButton renders with all 7 variants (primary, secondary, ghost, outline, success, warning, danger)
- ✅ VrlButton renders with all 4 sizes (sm, default, lg, xl)
- ✅ VrlButton handles disabled state
- ✅ VrlButton handles loading state with spinner
- ✅ VrlButton supports icons (left, right, icon-only)
- ✅ VrlButton emits click events correctly
- ✅ VrlIconButton renders as square button
- ✅ VrlIconButton displays tooltip
- ✅ VrlIconButton has aria-label

### Design Requirements
- ✅ Orbitron font applied to all buttons
- ✅ Letter-spacing 1px
- ✅ Border-radius 6px
- ✅ Correct padding for all sizes
- ✅ Hover effects: translateY(-2px) and box-shadow (primary, success, warning, danger)
- ✅ Color palette matches Velocity design system
- ✅ Loading spinner 16px, 2px border, 0.8s spin

### Accessibility Requirements
- ✅ All buttons keyboard navigable
- ✅ Focus indicators visible (2px cyan outline, 2px offset)
- ✅ All buttons have accessible names (label or aria-label)
- ✅ Disabled buttons not in tab order
- ✅ Loading state announced to screen readers
- ✅ Color contrast meets WCAG AA standards

### Code Quality Requirements
- ✅ Zero TypeScript errors
- ✅ Zero linting errors
- ✅ Code formatted with Prettier
- ✅ >90% test coverage
- ✅ All unit tests pass
- ✅ Props fully typed with interfaces
- ✅ Events fully typed with interfaces

### Performance Requirements
- ✅ Hover animations run at 60fps
- ✅ No memory leaks
- ✅ CSS bundle size impact <5KB (gzipped)
- ✅ Component renders in <16ms

### Browser Compatibility
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ No browser-specific bugs

### Documentation Requirements
- ✅ Component usage documented
- ✅ All props documented with types and defaults
- ✅ All events documented
- ✅ Code examples provided
- ✅ Accessibility guidelines included

---

## Notes & Considerations

### PrimeVue Integration

**Mapping Strategy**:
- VRL `variant` → PrimeVue `severity` + CSS classes
- VRL `size` → PrimeVue `size` + CSS classes
- VRL `loading` → PrimeVue `loading`
- VRL `disabled` → PrimeVue `disabled`
- VRL `type` → PrimeVue `type`

**Why Wrap PrimeVue?**
- Accessibility features (keyboard, ARIA, focus management)
- Consistent behavior across components
- Loading state built-in
- We only customize visual styles, not behavior

### Icon Library Choice

**Recommended**: Phosphor Icons
- Consistent with design system (if already in use)
- Large icon set with multiple weights
- Vue 3 components
- TypeScript support

**Alternative**: PrimeIcons (PrimeVue default)
- Smaller set, may lack some icons
- Already included with PrimeVue
- Less flexibility

**Implementation**: Use `Component` type for icon prop, allowing any icon library.

### Loading State Implementation

**PrimeVue Default**:
- Shows spinner next to label
- Uses PrimeIcons spinner

**VRL Custom**:
- Hides label (text transparent)
- Shows custom spinner (pseudo-element)
- 16px, 2px border, currentColor

**Decision**: Override PrimeVue loading spinner with CSS to match design system.

### Hover Effect Performance

**Transform vs Margin**:
- Use `transform: translateY(-2px)` (GPU accelerated)
- Do NOT use `margin-top: -2px` (causes layout reflow)

**Box Shadow**:
- Use `box-shadow` with rgba for glow effect
- Animate shadow with `transition: all 0.3s ease`

**Performance**:
- These properties are GPU accelerated
- Should achieve 60fps on modern devices

### Dark Mode Considerations

**Current Design**: Dark theme only (no light mode)

**Future**: If light mode added later:
- Use CSS custom properties for all colors
- Define light/dark variants
- Use `prefers-color-scheme` or class-based theme switching

### Component Composition

**VrlIconButton = VrlButton wrapper**:
- Simpler than duplicating logic
- Reuses all button functionality
- Only adds tooltip and enforces square dimensions
- Clearer API for consumers

### Error Handling

**Missing aria-label on VrlIconButton**:
- Console warning (development only)
- Provide fallback aria-label: "Icon button"
- Document requirement in prop comments

**Invalid variant**:
- TypeScript prevents invalid values
- Runtime: Fall back to 'secondary'

### Testing Challenges

**Hover state testing**:
- Vitest/JSDOM cannot test CSS hover effects
- Visual regression tests recommended (Playwright)
- Manual testing required

**Animation testing**:
- Spinner animation cannot be fully tested in Vitest
- Verify animation exists, but not visual smoothness
- Manual testing required

### Performance Optimization

**CSS Purging**:
- Ensure Tailwind purge configuration includes button classes
- Use static class names (not dynamic concatenation)

**Tree Shaking**:
- Import PrimeVue components individually: `import Button from 'primevue/button'`
- Do NOT import all of PrimeVue

**Bundle Size**:
- Monitor impact: `npm run build -- --report`
- Expected: ~2-5KB (gzipped) for button CSS

---

## Timeline Estimate

**Total Time**: 4-5 days (assuming dedicated work)

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| 1. Foundation Setup | 0.5 day | None |
| 2. VrlButton Component | 1 day | Phase 1 |
| 3. Button CSS Styling | 1 day | Phase 2 |
| 4. VrlIconButton Component | 0.5 day | Phases 2-3 |
| 5. Unit Tests | 1 day | Phases 2-4 |
| 6. Integration & Docs | 0.5 day | Phase 5 |
| 7. Quality Assurance | 0.5 day | Phase 6 |
| 8. Final Review | 0.5 day | Phase 7 |

**Milestones**:
- Day 2: VrlButton complete with CSS
- Day 3: VrlIconButton complete with tests
- Day 4: Integration and QA complete
- Day 5: Final review and approval

---

## Risk Assessment

### Low Risk
- ✅ PrimeVue Button wrapper (well-documented, stable API)
- ✅ CSS implementation (straightforward, no complex animations)
- ✅ TypeScript interfaces (clear requirements)

### Medium Risk
- ⚠️ Loading spinner customization (may conflict with PrimeVue styles)
  - **Mitigation**: Use `!important` if needed, test thoroughly
- ⚠️ Icon-only button implementation (centering, sizing)
  - **Mitigation**: Use flexbox, test all icon sizes
- ⚠️ Browser compatibility (hover effects, animations)
  - **Mitigation**: Test early on all browsers, use autoprefixer

### High Risk
- ❌ None identified

---

## Approvals

**Design Approval**: Required before Phase 6
**Code Review**: Required before Phase 8
**QA Sign-off**: Required before production deployment

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-18 | Claude Code | Initial plan creation |

---

## Appendix

### Example Usage

#### Basic Button
```vue
<VrlButton variant="primary" @click="handleClick">
  Click Me
</VrlButton>
```

#### Button with Icon (Left)
```vue
<VrlButton
  variant="primary"
  :icon="PhRocket"
  @click="handleLaunch"
>
  Launch Race
</VrlButton>
```

#### Button with Icon (Right)
```vue
<VrlButton
  variant="outline"
  :icon="PhArrowRight"
  icon-pos="right"
  @click="handleNext"
>
  Next
</VrlButton>
```

#### Small Danger Button
```vue
<VrlButton
  variant="danger"
  size="sm"
  @click="handleDelete"
>
  Delete
</VrlButton>
```

#### Loading State
```vue
<VrlButton
  variant="primary"
  :loading="isSubmitting"
  @click="handleSubmit"
>
  Submit
</VrlButton>
```

#### Disabled State
```vue
<VrlButton
  variant="secondary"
  :disabled="!isValid"
  @click="handleContinue"
>
  Continue
</VrlButton>
```

#### Icon-Only Button
```vue
<VrlButton
  variant="ghost"
  :icon="PhX"
  aria-label="Close dialog"
  @click="handleClose"
/>
```

#### Icon Button (VrlIconButton)
```vue
<VrlIconButton
  :icon="PhGear"
  variant="secondary"
  tooltip="Settings"
  @click="openSettings"
/>
```

#### Icon Button (Large, Primary)
```vue
<VrlIconButton
  :icon="PhPlus"
  variant="primary"
  size="lg"
  aria-label="Add new item"
  @click="handleAdd"
/>
```

### CSS Class Reference

```css
/* Base */
.btn

/* Variants */
.btn-primary
.btn-secondary
.btn-ghost
.btn-outline
.btn-success
.btn-warning
.btn-danger

/* Sizes */
.btn-sm
.btn-lg
.btn-xl

/* States */
.btn:disabled
.btn.loading

/* Icon Button */
.btn-icon
.btn-icon.btn-sm
.btn-icon.btn-lg

/* Modifiers (internal) */
.btn--icon-only
```

---

**End of Plan**
