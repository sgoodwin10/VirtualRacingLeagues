# VRL Velocity Design System - CARDS Components Plan

**Date**: 2026-01-18
**Status**: Planning Phase
**Component Category**: Cards & Data Display

## Overview

This document provides a comprehensive implementation plan for all CARDS components in the VRL Velocity Design System for the public dashboard. The cards category includes content containers, metric displays, alerts, and informational boxes used throughout the application.

## Reference Materials

- **Design Reference**: `/var/www/docs/PublicDashboard/design-2026/design-1-velocity/components/index.html` (CARDS section, lines 2002-2134)
- **Existing App Cards**: `/var/www/resources/app/js/components/common/cards/`
- **CSS Styles**: Inline styles in `index.html` (lines 656-879)

## Components to Implement

### 1. VrlCard.vue
**File**: `resources/public/js/components/common/cards/VrlCard.vue`

#### Purpose
Base card component for grouping related content with optional header, body, and footer sections.

#### Props Interface
```typescript
interface VrlCardProps {
  /**
   * Card title displayed in the header
   */
  title?: string;

  /**
   * Whether the card should have hover effect
   * @default false
   */
  hoverable?: boolean;

  /**
   * Whether to show the card header
   * @default true if title is provided
   */
  showHeader?: boolean;

  /**
   * Whether to apply default padding to the card body
   * @default true
   */
  bodyPadding?: boolean;

  /**
   * Additional CSS classes for the card container
   */
  class?: string;
}
```

#### Slots
- `header`: Custom header content (replaces title)
- `default` / `body`: Card body content
- `footer`: Card footer content
- `actions`: Header right-side actions (badges, buttons)

#### Styling Requirements
- **Background**: `var(--bg-card)`
- **Border**: `1px solid var(--border)`
- **Border Radius**: `var(--radius-lg)` (12px)
- **Overflow**: `hidden`
- **Transition**: `var(--transition)` (all 0.3s ease)

**Hover Effect (when `hoverable` is true)**:
- Border color: `var(--cyan)`
- Box shadow: `0 10px 30px rgba(0, 0, 0, 0.3)`

**Header**:
- Padding: `1.25rem 1.5rem`
- Border bottom: `1px solid var(--border)`
- Display: `flex`, `items-center`, `justify-between`
- Title font: Orbitron, 1rem, 600 weight, 0.5px letter-spacing

**Body**:
- Padding: `1.5rem` (if `bodyPadding` is true)

**Footer**:
- Padding: `1rem 1.5rem`
- Border top: `1px solid var(--border)`
- Background: `var(--bg-panel)`

#### Accessibility
- `role="region"`
- `aria-label`: Use title or "Card"

#### Test Coverage
- Renders without props
- Renders title when provided
- Shows/hides header based on `showHeader` prop
- Renders header, body, footer slots
- Applies `hoverable` class correctly
- Applies custom classes
- Correct accessibility attributes

---

### 2. VrlCardHeader.vue
**File**: `resources/public/js/components/common/cards/VrlCardHeader.vue`

#### Purpose
Standalone card header component with optional icon, title, description, and actions.

#### Props Interface
```typescript
interface VrlCardHeaderProps {
  /**
   * Header title text
   */
  title?: string;

  /**
   * Additional CSS classes for the header
   */
  class?: string;
}
```

#### Slots
- `default`: Custom header content (replaces title)
- `actions`: Right-side action buttons or badges

#### Styling Requirements
- Padding: `1.25rem 1.5rem`
- Display: `flex`, `items-center`, `justify-between`
- Border bottom: `1px solid var(--border)`
- Title font: Orbitron, 1rem, 600 weight, 0.5px letter-spacing

#### Test Coverage
- Renders title when provided
- Renders default slot content
- Renders actions slot content
- Applies custom classes
- Correct layout classes

---

### 3. VrlCardBody.vue
**File**: `resources/public/js/components/common/cards/VrlCardBody.vue`

#### Purpose
Standalone card body component with configurable padding.

#### Props Interface
```typescript
interface VrlCardBodyProps {
  /**
   * Remove default padding from the card body
   * Useful for tables or custom layouts
   * @default false
   */
  noPadding?: boolean;

  /**
   * Additional CSS classes for the body
   */
  class?: string;
}
```

#### Slots
- `default`: Body content

#### Styling Requirements
- Padding: `1.5rem` (unless `noPadding` is true, then `0`)

#### Test Coverage
- Renders slot content
- Applies padding by default
- Removes padding when `noPadding` is true
- Applies custom classes

---

### 4. VrlCardFooter.vue
**File**: `resources/public/js/components/common/cards/VrlCardFooter.vue`

#### Purpose
Standalone card footer component with elevated background.

#### Props Interface
```typescript
interface VrlCardFooterProps {
  /**
   * Additional CSS classes for the footer
   */
  class?: string;
}
```

#### Slots
- `default`: Footer content

#### Styling Requirements
- Padding: `1rem 1.5rem`
- Border top: `1px solid var(--border)`
- Background: `var(--bg-panel)`

#### Test Coverage
- Renders slot content
- Applies correct padding and border
- Correct background color
- Applies custom classes

---

### 5. VrlFeatureCard.vue
**File**: `resources/public/js/components/common/cards/VrlFeatureCard.vue`

#### Purpose
Promotional/marketing card with icon, title, description, and animated gradient top border on hover.

#### Props Interface
```typescript
interface VrlFeatureCardProps {
  /**
   * Icon component (Phosphor Icons)
   */
  icon?: Component;

  /**
   * Icon as emoji or text
   */
  iconText?: string;

  /**
   * Card title
   */
  title: string;

  /**
   * Card description
   */
  description: string;

  /**
   * Additional CSS classes for the card
   */
  class?: string;
}
```

#### Slots
- `icon`: Custom icon content
- `title`: Custom title content
- `description`: Custom description content
- `default`: Additional content below description

#### Styling Requirements
**Card**:
- Background: `var(--bg-card)`
- Border: `1px solid var(--border)`
- Border radius: `var(--radius-lg)` (12px)
- Padding: `2rem`
- Position: `relative`
- Overflow: `hidden`
- Transition: `var(--transition)`

**Animated Gradient Top Border (::before pseudo-element)**:
- Position: `absolute`
- Top: `0`, Left: `0`, Right: `0`
- Height: `3px`
- Background: `linear-gradient(90deg, var(--cyan), var(--purple))`
- Transform: `scaleX(0)` (default), `scaleX(1)` (hover)
- Transition: `transform 0.3s ease`

**Hover Effect**:
- Transform: `translateY(-5px)`
- Border color: `var(--cyan)`
- Box shadow: `0 20px 40px rgba(88, 166, 255, 0.1)`
- ::before scaleX(1)

**Icon Container**:
- Width: `60px`
- Height: `60px`
- Background: `var(--cyan-dim)`
- Border radius: `var(--radius-lg)`
- Display: `flex`, `items-center`, `justify-center`
- Margin bottom: `1.5rem`
- Font size: `1.5rem` (for emoji)

**Title**:
- Font: Orbitron, 1.1rem, 600 weight
- Margin bottom: `0.75rem`
- Letter spacing: `0.5px`

**Description**:
- Color: `var(--text-secondary)`
- Font size: `0.9rem`
- Line height: `1.7`

#### Test Coverage
- Renders with icon prop
- Renders with iconText prop
- Renders icon slot
- Renders title and description
- Applies hover effect classes
- Gradient border animation on hover
- Applies custom classes

---

### 6. VrlMetricCard.vue
**File**: `resources/public/js/components/common/cards/VrlMetricCard.vue`

#### Purpose
Display key metrics with large values, optional icon, left accent stripe, and change indicators.

#### Props Interface
```typescript
type AccentColor = 'cyan' | 'green' | 'orange' | 'purple';
type ChangeDirection = 'positive' | 'negative' | 'neutral';

interface VrlMetricCardProps {
  /**
   * Metric label (e.g., "Active Drivers")
   */
  label: string;

  /**
   * Metric value (e.g., "247", "1,842")
   */
  value: string | number;

  /**
   * Change indicator text (e.g., "↑ 12% from last month")
   */
  change?: string;

  /**
   * Icon component (Phosphor Icons)
   */
  icon?: Component;

  /**
   * Accent color for left stripe
   * @default 'cyan'
   */
  accentColor?: AccentColor;

  /**
   * Change direction affects color
   * @default 'neutral'
   */
  changeDirection?: ChangeDirection;

  /**
   * Additional CSS classes for the card
   */
  class?: string;
}
```

#### Slots
- `label`: Custom label content
- `value`: Custom value content
- `icon`: Custom icon content
- `change`: Custom change indicator content

#### Styling Requirements
**Card**:
- Background: `var(--bg-card)`
- Border: `1px solid var(--border)`
- Border radius: `var(--radius-lg)` (12px)
- Padding: `1.5rem`
- Position: `relative`
- Overflow: `hidden`

**Left Accent Stripe (::before pseudo-element)**:
- Position: `absolute`
- Top: `0`, Left: `0`
- Width: `4px`
- Height: `100%`
- Background color by accent:
  - `cyan`: `var(--cyan)`
  - `green`: `var(--green)`
  - `orange`: `var(--orange)`
  - `purple`: `var(--purple)`

**Label**:
- Font size: `0.8rem`
- Color: `var(--text-secondary)`
- Margin bottom: `0.5rem`

**Value**:
- Font: Orbitron, 2rem, 700 weight
- Color: Based on `accentColor` (e.g., `text-cyan`, `text-green`)
- Margin bottom: `0.25rem`

**Change Indicator**:
- Font size: `0.75rem`
- Display: `flex`, `items-center`, `gap: 0.25rem`
- Color by direction:
  - `positive`: `var(--green)`
  - `negative`: `var(--red)`
  - `neutral`: `var(--text-muted)`

#### Accessibility
- `role="region"`
- `aria-label`: `"${label}: ${value}"`

#### Test Coverage
- Renders label and value
- Applies correct accent color stripe
- Renders icon when provided
- Renders change indicator with correct color
- Change direction affects color correctly
- Formats number values with locale
- Applies custom classes
- Correct accessibility attributes

---

### 7. VrlAlert.vue
**File**: `resources/public/js/components/common/alerts/VrlAlert.vue`

#### Purpose
Notification banner with colored background, border, icon, title, and message. Supports dismissible functionality.

#### Props Interface
```typescript
type AlertType = 'info' | 'success' | 'warning' | 'error';

interface VrlAlertProps {
  /**
   * Alert type affects color and icon
   * @default 'info'
   */
  type?: AlertType;

  /**
   * Alert title
   */
  title: string;

  /**
   * Alert message/description
   */
  message?: string;

  /**
   * Whether the alert can be dismissed
   * @default false
   */
  dismissible?: boolean;

  /**
   * Custom icon component (Phosphor Icons)
   * If not provided, default icon for type will be used
   */
  icon?: Component;

  /**
   * Additional CSS classes for the alert
   */
  class?: string;
}
```

#### Emits
```typescript
interface VrlAlertEmits {
  /**
   * Emitted when the alert is dismissed
   */
  (e: 'dismiss'): void;
}
```

#### Slots
- `icon`: Custom icon content
- `title`: Custom title content
- `default` / `message`: Custom message content

#### Styling Requirements
**Alert Container**:
- Padding: `1rem 1.25rem`
- Border radius: `var(--radius)` (6px)
- Display: `flex`, `items-start`, `gap: 0.75rem`
- Border: `1px solid`
- Margin bottom: `1rem` (optional, for spacing)

**Type Variants**:
- **info**:
  - Background: `var(--cyan-dim)`
  - Border color: `rgba(88, 166, 255, 0.3)`
  - Color: `var(--cyan)`
  - Icon: `PhInfo`

- **success**:
  - Background: `var(--green-dim)`
  - Border color: `rgba(126, 231, 135, 0.3)`
  - Color: `var(--green)`
  - Icon: `PhCheckCircle`

- **warning**:
  - Background: `var(--orange-dim)`
  - Border color: `rgba(240, 136, 62, 0.3)`
  - Color: `var(--orange)`
  - Icon: `PhWarning`

- **error**:
  - Background: `var(--red-dim)`
  - Border color: `rgba(248, 81, 73, 0.3)`
  - Color: `var(--red)`
  - Icon: `PhXCircle`

**Icon**:
- Font size: `1.25rem` (or icon size 18-20px)
- Flex shrink: `0`

**Content**:
- Flex: `1`

**Title**:
- Font: Orbitron, 0.85rem, 600 weight
- Margin bottom: `0.25rem`

**Message**:
- Font size: `0.85rem`
- Opacity: `0.9`

**Dismiss Button (if dismissible)**:
- Flex shrink: `0`
- Padding: `0.25rem`
- Hover: opacity `0.7`
- Icon: `PhX` (size 16px)

#### Accessibility
- `role="alert"`
- `aria-live="assertive"` for error type
- `aria-live="polite"` for other types
- Dismiss button: `aria-label="Dismiss ${type} alert"`
- Icons: `aria-hidden="true"`

#### Test Coverage
- Renders title and message
- Applies correct type variant styles
- Shows default icon for each type
- Renders custom icon when provided
- Shows dismiss button when dismissible
- Emits dismiss event when clicked
- Correct accessibility attributes
- aria-live values correct for each type

---

### 8. VrlInfoBox.vue
**File**: `resources/public/js/components/common/cards/VrlInfoBox.vue`

#### Purpose
Informational callout box with left border accent, title, and message. Used for tips, notes, warnings.

#### Props Interface
```typescript
type InfoBoxType = 'info' | 'success' | 'warning' | 'danger';

interface VrlInfoBoxProps {
  /**
   * Info box type affects left border color
   * @default 'info'
   */
  type?: InfoBoxType;

  /**
   * Info box title (e.g., "Tip", "Important")
   */
  title: string;

  /**
   * Info box message/content
   */
  message?: string;

  /**
   * Additional CSS classes for the info box
   */
  class?: string;
}
```

#### Slots
- `title`: Custom title content
- `default`: Custom message content

#### Styling Requirements
**Info Box Container**:
- Padding: `1rem 1.25rem`
- Border radius: `var(--radius)` (6px)
- Background: `var(--bg-elevated)`
- Border left: `3px solid`
- Border right radius: `var(--radius)` (rounded right corners only)

**Type Variants (left border color)**:
- **info**: `var(--cyan)`
- **success**: `var(--green)`
- **warning**: `var(--orange)`
- **danger**: `var(--red)`

**Title**:
- Font: Orbitron, 0.85rem, 600 weight
- Margin bottom: `0.25rem`
- Color: Matches left border (e.g., `var(--cyan)` for info)

**Message**:
- Font size: `0.85rem`
- Color: `var(--text-secondary)`

#### Accessibility
- `role="note"`
- `aria-label`: Use title

#### Test Coverage
- Renders title and message
- Applies correct type border color
- Title color matches type
- Renders title slot content
- Renders default slot content
- Applies custom classes
- Correct accessibility attributes

---

## CSS Variables Required

All CSS variables are already defined in the design system:

```css
/* Background Colors */
--bg-dark: #0d1117;
--bg-panel: #161b22;
--bg-card: #1c2128;
--bg-elevated: #21262d;

/* Text Colors */
--text-primary: #e6edf3;
--text-secondary: #8b949e;
--text-muted: #6e7681;

/* Border Colors */
--border: #30363d;

/* Accent Colors */
--cyan: #58a6ff;
--green: #7ee787;
--orange: #f0883e;
--red: #f85149;
--purple: #bc8cff;

/* Dim Variants */
--cyan-dim: rgba(88, 166, 255, 0.15);
--green-dim: rgba(126, 231, 135, 0.15);
--orange-dim: rgba(240, 136, 62, 0.15);
--red-dim: rgba(248, 81, 73, 0.15);
--purple-dim: rgba(188, 140, 255, 0.15);

/* Typography */
--font-display: 'Orbitron', sans-serif;
--font-body: 'Inter', sans-serif;

/* Border Radius */
--radius: 6px;
--radius-lg: 12px;

/* Transitions */
--transition: all 0.3s ease;
```

## CSS Classes to Add

### Card Classes
```css
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: var(--transition);
}

.card:hover {
  border-color: var(--cyan);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.card-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.card-body {
  padding: 1.5rem;
}

.card-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border);
  background: var(--bg-panel);
}
```

### Feature Card Classes
```css
.feature-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 2rem;
  transition: var(--transition);
  position: relative;
  overflow: hidden;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--cyan), var(--purple));
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  border-color: var(--cyan);
  box-shadow: 0 20px 40px rgba(88, 166, 255, 0.1);
}

.feature-card:hover::before {
  transform: scaleX(1);
}

.feature-icon {
  width: 60px;
  height: 60px;
  background: var(--cyan-dim);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.feature-title {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  letter-spacing: 0.5px;
}

.feature-desc {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.7;
}
```

### Metric Card Classes
```css
.metric-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
}

.metric-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
}

.metric-card-cyan::before { background: var(--cyan); }
.metric-card-green::before { background: var(--green); }
.metric-card-orange::before { background: var(--orange); }
.metric-card-purple::before { background: var(--purple); }

.metric-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.metric-value {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.metric-change {
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.metric-change.positive { color: var(--green); }
.metric-change.negative { color: var(--red); }
.metric-change.neutral { color: var(--text-muted); }
```

### Alert Classes
```css
.alert {
  padding: 1rem 1.25rem;
  border-radius: var(--radius);
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  border: 1px solid;
}

.alert-info {
  background: var(--cyan-dim);
  border-color: rgba(88, 166, 255, 0.3);
  color: var(--cyan);
}

.alert-success {
  background: var(--green-dim);
  border-color: rgba(126, 231, 135, 0.3);
  color: var(--green);
}

.alert-warning {
  background: var(--orange-dim);
  border-color: rgba(240, 136, 62, 0.3);
  color: var(--orange);
}

.alert-error {
  background: var(--red-dim);
  border-color: rgba(248, 81, 73, 0.3);
  color: var(--red);
}

.alert-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-family: var(--font-display);
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.alert-message {
  font-size: 0.85rem;
  opacity: 0.9;
}
```

### Info Box Classes
```css
.info-box {
  padding: 1rem 1.25rem;
  border-radius: var(--radius);
  background: var(--bg-elevated);
  border-left: 3px solid;
}

.info-box-info { border-left-color: var(--cyan); }
.info-box-success { border-left-color: var(--green); }
.info-box-warning { border-left-color: var(--orange); }
.info-box-danger { border-left-color: var(--red); }

.info-box-title {
  font-family: var(--font-display);
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.info-box-message {
  font-size: 0.85rem;
  color: var(--text-secondary);
}
```

## TypeScript Types File

**File**: `resources/public/js/components/common/cards/types.ts`

```typescript
import type { Component } from 'vue';

// Variant Types
export type AccentColor = 'cyan' | 'green' | 'orange' | 'purple';
export type ChangeDirection = 'positive' | 'negative' | 'neutral';
export type AlertType = 'info' | 'success' | 'warning' | 'error';
export type InfoBoxType = 'info' | 'success' | 'warning' | 'danger';

// Component Props Interfaces
export interface VrlCardProps {
  title?: string;
  hoverable?: boolean;
  showHeader?: boolean;
  bodyPadding?: boolean;
  class?: string;
}

export interface VrlCardHeaderProps {
  title?: string;
  class?: string;
}

export interface VrlCardBodyProps {
  noPadding?: boolean;
  class?: string;
}

export interface VrlCardFooterProps {
  class?: string;
}

export interface VrlFeatureCardProps {
  icon?: Component;
  iconText?: string;
  title: string;
  description: string;
  class?: string;
}

export interface VrlMetricCardProps {
  label: string;
  value: string | number;
  change?: string;
  icon?: Component;
  accentColor?: AccentColor;
  changeDirection?: ChangeDirection;
  class?: string;
}

export interface VrlAlertProps {
  type?: AlertType;
  title: string;
  message?: string;
  dismissible?: boolean;
  icon?: Component;
  class?: string;
}

export interface VrlAlertEmits {
  (e: 'dismiss'): void;
}

export interface VrlInfoBoxProps {
  type?: InfoBoxType;
  title: string;
  message?: string;
  class?: string;
}
```

## Phosphor Icons Required

All components use Phosphor Icons from `@phosphor-icons/vue`:

```typescript
import {
  PhCheckCircle,  // Alert success
  PhWarning,      // Alert warning
  PhXCircle,      // Alert error
  PhInfo,         // Alert info
  PhX,            // Dismiss button
  // Additional icons as needed for metric cards
} from '@phosphor-icons/vue';
```

## Implementation Workflow

### Phase 1: Foundation Components (Base Cards)
1. Create `types.ts` file with all interfaces
2. Implement `VrlCard.vue` with comprehensive tests
3. Implement `VrlCardHeader.vue` with tests
4. Implement `VrlCardBody.vue` with tests
5. Implement `VrlCardFooter.vue` with tests

**Deliverables**:
- 4 component files
- 1 types file
- 4 test files
- All tests passing

### Phase 2: Feature & Metric Cards
1. Implement `VrlFeatureCard.vue` with tests
2. Implement `VrlMetricCard.vue` with tests
3. Test gradient animations and hover effects
4. Test accent stripe variants

**Deliverables**:
- 2 component files
- 2 test files
- All tests passing

### Phase 3: Alerts & Info Boxes
1. Implement `VrlAlert.vue` with tests
2. Implement `VrlInfoBox.vue` with tests
3. Test dismissible functionality
4. Test all variant types

**Deliverables**:
- 2 component files (in `alerts/` and `cards/` directories)
- 2 test files
- All tests passing

### Phase 4: CSS Integration
1. Add all card-related CSS classes to `resources/public/css/app.css`
2. Ensure CSS variables are available
3. Test all components render with correct styles
4. Test responsive behavior

**Deliverables**:
- Updated `app.css` with card classes
- Visual verification of all components

### Phase 5: Documentation & Examples
1. Create usage examples in storybook or demo page
2. Document all props, slots, and emits
3. Add accessibility documentation
4. Create integration examples

**Deliverables**:
- Component usage documentation
- Demo page with all variants
- Accessibility checklist

## Testing Strategy

### Unit Tests
Each component must have comprehensive unit tests covering:

1. **Props Testing**:
   - All prop combinations
   - Default values
   - Prop validation
   - Type checking

2. **Slots Testing**:
   - All slot variations
   - Slot fallback content
   - Multiple slots together

3. **Events Testing**:
   - Emit events (dismiss, etc.)
   - Event payload validation

4. **Styling Tests**:
   - CSS class application
   - Variant class application
   - Conditional class rendering

5. **Accessibility Tests**:
   - ARIA attributes
   - Role attributes
   - Keyboard navigation (for dismissible components)

### Integration Tests
- Test card compositions (header + body + footer)
- Test multiple cards in grids
- Test responsive layouts

### Visual Regression Tests
- Capture screenshots of all variants
- Test hover states
- Test animations

## Accessibility Requirements

### General Requirements
- All cards must have appropriate ARIA roles
- Interactive elements must be keyboard accessible
- Color contrast must meet WCAG AA standards
- Focus indicators must be visible

### Component-Specific
- **VrlCard**: `role="region"`, `aria-label`
- **VrlAlert**: `role="alert"`, `aria-live`, dismiss button with `aria-label`
- **VrlInfoBox**: `role="note"`, `aria-label`
- **VrlMetricCard**: `role="region"`, `aria-label` with value
- Icons: All decorative icons must have `aria-hidden="true"`

### Keyboard Support
- **Dismissible alerts**: `Enter` or `Space` to dismiss
- Focus trap not required (these are static components)

## File Structure

```
resources/public/js/components/common/
├── cards/
│   ├── VrlCard.vue
│   ├── VrlCardHeader.vue
│   ├── VrlCardBody.vue
│   ├── VrlCardFooter.vue
│   ├── VrlFeatureCard.vue
│   ├── VrlMetricCard.vue
│   ├── VrlInfoBox.vue
│   ├── types.ts
│   └── __tests__/
│       ├── VrlCard.test.ts
│       ├── VrlCardHeader.test.ts
│       ├── VrlCardBody.test.ts
│       ├── VrlCardFooter.test.ts
│       ├── VrlFeatureCard.test.ts
│       ├── VrlMetricCard.test.ts
│       └── VrlInfoBox.test.ts
└── alerts/
    ├── VrlAlert.vue
    └── __tests__/
        └── VrlAlert.test.ts
```

## Design Considerations

### Component Composition
- **Monolithic approach**: `VrlCard` with slots for header, body, footer
- **Compositional approach**: Separate `VrlCardHeader`, `VrlCardBody`, `VrlCardFooter` components
- **Recommendation**: Support both approaches for maximum flexibility

Example monolithic:
```vue
<VrlCard title="Card Title" hoverable>
  <template #actions>
    <VrlBadge>Badge</VrlBadge>
  </template>
  <p>Card content</p>
  <template #footer>
    <VrlButton>Action</VrlButton>
  </template>
</VrlCard>
```

Example compositional:
```vue
<VrlCard>
  <VrlCardHeader title="Card Title">
    <template #actions>
      <VrlBadge>Badge</VrlBadge>
    </template>
  </VrlCardHeader>
  <VrlCardBody>
    <p>Card content</p>
  </VrlCardBody>
  <VrlCardFooter>
    <VrlButton>Action</VrlButton>
  </VrlCardFooter>
</VrlCard>
```

### Responsive Design
- Cards should be fluid width by default
- Use CSS Grid or Flexbox for card layouts
- Mobile: Stack cards vertically
- Tablet: 2-column grid
- Desktop: 3-4 column grid
- Consider adding responsive props or CSS utilities

### Animation Performance
- Use `transform` and `opacity` for animations (GPU accelerated)
- Avoid animating `height`, `width`, `padding`
- Use `will-change` sparingly
- Test on low-end devices

### Edge Cases
- **Empty states**: Handle missing title, description, icon
- **Long content**: Text overflow, truncation, wrapping
- **Icon fallbacks**: Handle missing icons gracefully
- **Number formatting**: Large numbers, decimals, currencies

## Performance Considerations

### Bundle Size
- Tree-shake unused Phosphor icons
- Lazy load card components if not needed on initial page load
- Use dynamic imports for heavy cards (charts, etc.)

### Rendering Performance
- Use `v-once` for static content
- Memoize computed properties
- Avoid unnecessary re-renders
- Use `shallowRef` for large data objects

### CSS Performance
- Minimize pseudo-element usage
- Use CSS containment where appropriate
- Avoid expensive filters (blur, etc.)
- Use CSS custom properties for themeable values

## Dependencies

### Required Packages
- `vue` (^3.5.13)
- `@phosphor-icons/vue` (^2.2.1)

### Dev Dependencies
- `@vue/test-utils` (^2.4.6)
- `vitest` (^2.1.8)
- `jsdom` (^24.1.3)

## Quality Checklist

Before marking this component category as complete:

- [ ] All 8 components implemented
- [ ] All components have TypeScript types
- [ ] All components have comprehensive unit tests
- [ ] All tests pass (100% coverage)
- [ ] All components follow Vue 3 Composition API best practices
- [ ] All components use `<script setup lang="ts">`
- [ ] All CSS classes added to `app.css`
- [ ] All CSS variables defined and used
- [ ] All accessibility requirements met
- [ ] All Phosphor icons imported correctly
- [ ] All hover/animation effects working
- [ ] All variants tested (info, success, warning, error/danger)
- [ ] All slots tested and documented
- [ ] All emits tested and documented
- [ ] TypeScript strict mode passes
- [ ] ESLint passes (no warnings)
- [ ] Prettier formatting applied
- [ ] Component documentation complete
- [ ] Usage examples created
- [ ] Visual regression tests pass
- [ ] Responsive design tested
- [ ] Browser compatibility tested

## Notes

### Differences from App Dashboard Cards
The public dashboard cards have these differences from the app dashboard:
1. **Hover effects**: Public cards emphasize interactivity with hover animations
2. **Feature cards**: Public includes promotional feature cards not in app
3. **Metric cards**: Public uses left accent stripe instead of top accent bar
4. **Alert placement**: Public places alerts in `alerts/` directory
5. **Styling approach**: Public uses more CSS classes vs. Tailwind utilities

### Design System Alignment
- All spacing uses the design system scale (0.25rem increments)
- All colors use CSS variables from the Velocity palette
- Typography uses Orbitron (display) and Inter (body)
- Border radius uses predefined values (6px, 12px)
- Transitions use consistent duration (0.3s ease)

### Future Enhancements
- **Collapsible cards**: Add expand/collapse functionality
- **Loading states**: Skeleton loaders for async content
- **Empty states**: Styled empty state illustrations
- **Card actions**: Dropdown menu, more actions button
- **Card badges**: Status badges, notification dots
- **Card stats**: Enhanced metric displays with charts
- **Theme variants**: Light mode support

## Related Documentation

- [VRL Velocity Design System - Components](../index.html)
- [Typography Plan](./01-typography-plan.md)
- [Buttons Plan](./02-buttons-plan.md)
- [Badges Plan](./03-badges-plan.md)
- [App Dashboard Cards Reference](/var/www/resources/app/js/components/common/cards/)

## Conclusion

This plan provides a comprehensive roadmap for implementing all card components in the VRL Velocity Design System. The phased approach ensures systematic development, thorough testing, and proper documentation. All components prioritize accessibility, performance, and maintainability while adhering to Vue 3 best practices and the established design system patterns.

**Estimated Implementation Time**: 12-16 hours
- Phase 1: 4-5 hours
- Phase 2: 3-4 hours
- Phase 3: 2-3 hours
- Phase 4: 1-2 hours
- Phase 5: 2-3 hours

**Priority**: High (cards are fundamental UI building blocks)

**Dependencies**: Typography components, Badge components (for card headers)

---

*This is a PLANNING document only. No code implementation is included.*
