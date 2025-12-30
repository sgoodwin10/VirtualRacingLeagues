# TechnicalAccordion Component Specification

## Overview

The TechnicalAccordion component system provides a fully-styled accordion matching the Technical Blueprint design system. It wraps PrimeVue's Accordion components while applying consistent styling and adding enhanced features.

## Component Architecture

```
TechnicalAccordion (wrapper)
├── TechnicalAccordionPanel
│   ├── TechnicalAccordionHeader
│   │   ├── AccordionStatusIndicator (optional)
│   │   ├── AccordionIcon (optional)
│   │   ├── Title Group (title + subtitle)
│   │   ├── AccordionBadge (optional)
│   │   └── Chevron
│   └── TechnicalAccordionContent
│       └── [slot content]
```

---

## TechnicalAccordion.vue

### Props

```typescript
interface TechnicalAccordionProps {
  /** Currently active panel values */
  modelValue?: string | string[];
  /** Allow multiple panels to be open */
  multiple?: boolean;
  /** Gap between panels: 'none' | 'sm' | 'md' | 'lg' */
  gap?: 'none' | 'sm' | 'md' | 'lg';
  /** Nested accordion styling (lighter backgrounds) */
  nested?: boolean;
}
```

### Emits

```typescript
defineEmits<{
  'update:modelValue': [value: string | string[]];
}>();
```

### Slots

```typescript
defineSlots<{
  default(): VNode[];
}>();
```

### Usage

```vue
<TechnicalAccordion
  v-model="activePanel"
  :multiple="true"
  gap="md"
>
  <TechnicalAccordionPanel value="panel1">
    <!-- ... -->
  </TechnicalAccordionPanel>
</TechnicalAccordion>
```

---

## TechnicalAccordionPanel.vue

### Props

```typescript
interface TechnicalAccordionPanelProps {
  /** Unique panel identifier */
  value: string | number;
  /** Disable the panel */
  disabled?: boolean;
}
```

### Slots

```typescript
defineSlots<{
  default(): VNode[];
}>();
```

---

## TechnicalAccordionHeader.vue

### Props

```typescript
interface TechnicalAccordionHeaderProps {
  /** Main title text */
  title: string;
  /** Subtitle/description text */
  subtitle?: string;
  /** Status indicator type */
  status?: 'active' | 'upcoming' | 'completed' | 'pending' | 'inactive';
  /** Icon component (Phosphor icon) */
  icon?: Component;
  /** Icon color variant */
  iconVariant?: 'cyan' | 'green' | 'orange' | 'purple' | 'red';
  /** Badge text */
  badge?: string;
  /** Badge severity */
  badgeSeverity?: 'success' | 'info' | 'warning' | 'danger' | 'muted';
  /** Hide the chevron indicator */
  hideChevron?: boolean;
  /** Custom header padding */
  padding?: 'sm' | 'md' | 'lg';
}
```

### Slots

```typescript
defineSlots<{
  /** Custom content before title group */
  prefix?(): VNode[];
  /** Custom title content (replaces title prop) */
  title?(): VNode[];
  /** Custom subtitle content (replaces subtitle prop) */
  subtitle?(): VNode[];
  /** Custom content after title group, before badge */
  suffix?(): VNode[];
  /** Custom actions (right side, before chevron) */
  actions?(): VNode[];
}>();
```

### Usage Examples

**Basic Header:**
```vue
<TechnicalAccordionHeader
  title="System Overview"
  subtitle="General system configuration and status"
/>
```

**With Status Indicator:**
```vue
<TechnicalAccordionHeader
  title="Production Deployment"
  subtitle="Currently running — v2.4.1"
  status="active"
  badge="ACTIVE"
  badge-severity="success"
/>
```

**With Icon:**
```vue
<TechnicalAccordionHeader
  title="Dashboard Analytics"
  subtitle="Real-time metrics and insights"
  :icon="PhChartBar"
  icon-variant="cyan"
  badge="12 WIDGETS"
  badge-severity="info"
/>
```

**With Custom Content (RoundsPanel pattern):**
```vue
<TechnicalAccordionHeader title="" hide-chevron>
  <template #prefix>
    <div class="round-badge" :style="{ backgroundColor: color }">
      <span>Round</span>
      <span>{{ roundNumber }}</span>
    </div>
  </template>
  <template #title>
    <div class="flex flex-col">
      <span class="accordion-title">{{ trackName }}</span>
      <span class="accordion-subtitle">{{ location }}</span>
    </div>
  </template>
  <template #actions>
    <ToggleSwitch v-model="isCompleted" />
    <EditButton @click="onEdit" />
    <DeleteButton @click="onDelete" />
  </template>
</TechnicalAccordionHeader>
```

---

## TechnicalAccordionContent.vue

### Props

```typescript
interface TechnicalAccordionContentProps {
  /** Add inner content wrapper with elevated background */
  elevated?: boolean;
  /** Custom padding */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}
```

### Slots

```typescript
defineSlots<{
  default(): VNode[];
}>();
```

### Usage

```vue
<TechnicalAccordionContent elevated padding="md">
  <p>Content goes here</p>
</TechnicalAccordionContent>
```

---

## AccordionStatusIndicator.vue

### Props

```typescript
interface AccordionStatusIndicatorProps {
  /** Status type */
  status: 'active' | 'upcoming' | 'completed' | 'pending' | 'inactive';
  /** Height of the indicator */
  height?: string; // default: '40px'
}
```

### Status Styles

| Status | Color | Effect |
|--------|-------|--------|
| `active` | `--green` (#7ee787) | Glow effect |
| `upcoming` | `--cyan` (#58a6ff) | None |
| `completed` | `--text-muted` (#6e7681) | None |
| `pending` | `--orange` (#f0883e) | None |
| `inactive` | `--border` (#30363d) | None |

---

## AccordionIcon.vue

### Props

```typescript
interface AccordionIconProps {
  /** Phosphor icon component */
  icon: Component;
  /** Color variant */
  variant?: 'cyan' | 'green' | 'orange' | 'purple' | 'red';
  /** Size */
  size?: 'sm' | 'md' | 'lg';
}
```

### Variant Styles

| Variant | Background | Color |
|---------|------------|-------|
| `cyan` | `rgba(88, 166, 255, 0.15)` | `#58a6ff` |
| `green` | `rgba(126, 231, 135, 0.15)` | `#7ee787` |
| `orange` | `rgba(240, 136, 62, 0.15)` | `#f0883e` |
| `purple` | `rgba(188, 140, 255, 0.15)` | `#bc8cff` |
| `red` | `rgba(248, 81, 73, 0.15)` | `#f85149` |

---

## AccordionBadge.vue

### Props

```typescript
interface AccordionBadgeProps {
  /** Badge text */
  text: string;
  /** Severity/color variant */
  severity?: 'success' | 'info' | 'warning' | 'danger' | 'muted';
}
```

### Severity Styles

| Severity | Background | Color |
|----------|------------|-------|
| `success` | `rgba(126, 231, 135, 0.15)` | `#7ee787` |
| `info` | `rgba(88, 166, 255, 0.15)` | `#58a6ff` |
| `warning` | `rgba(240, 136, 62, 0.15)` | `#f0883e` |
| `danger` | `rgba(248, 81, 73, 0.15)` | `#f85149` |
| `muted` | `var(--bg-highlight)` | `var(--text-muted)` |

---

## CSS Variables

Add to `resources/app/css/components/accordion.css`:

```css
/* Technical Blueprint Accordion Variables */
:root {
  /* Backgrounds */
  --accordion-bg: #1c2128;
  --accordion-bg-elevated: #21262d;
  --accordion-bg-highlight: #272d36;
  --accordion-bg-active: #21262d;

  /* Borders */
  --accordion-border: #30363d;
  --accordion-border-active: #58a6ff;

  /* Text */
  --accordion-text-primary: #e6edf3;
  --accordion-text-secondary: #8b949e;
  --accordion-text-muted: #6e7681;

  /* Accents */
  --accordion-accent-cyan: #58a6ff;
  --accordion-accent-green: #7ee787;
  --accordion-accent-orange: #f0883e;
  --accordion-accent-red: #f85149;
  --accordion-accent-purple: #bc8cff;

  /* Typography */
  --accordion-font-mono: 'IBM Plex Mono', 'SF Mono', monospace;
  --accordion-font-sans: 'Inter', -apple-system, sans-serif;

  /* Spacing */
  --accordion-gap-sm: 4px;
  --accordion-gap-md: 8px;
  --accordion-gap-lg: 12px;
  --accordion-padding-header: 16px 20px;
  --accordion-padding-content: 20px;

  /* Animation */
  --accordion-transition: all 0.2s ease;
  --accordion-hover-translate: translateX(4px);

  /* Radius */
  --accordion-radius: 6px;
}
```

---

## Animation Specifications

### Hover Animation
```css
.accordion-item:hover {
  border-color: var(--accordion-border-active);
  transform: translateX(4px);
  transition: all 0.2s ease;
}

.accordion-item.active:hover {
  transform: translateX(0);
}
```

### Chevron Rotation
```css
.accordion-chevron {
  transition: transform 0.2s ease;
}

.accordion-item.active .accordion-chevron {
  transform: rotate(180deg);
  color: var(--accordion-accent-cyan);
}
```

### Content Expand/Collapse
```css
.accordion-content {
  transition: max-height 0.3s ease, opacity 0.2s ease;
}
```

---

## Accessibility

1. **Keyboard Navigation**
   - `Enter`/`Space`: Toggle panel
   - `ArrowDown`: Move to next header
   - `ArrowUp`: Move to previous header
   - `Home`: Move to first header
   - `End`: Move to last header

2. **ARIA Attributes**
   - `aria-expanded`: True when panel is open
   - `aria-controls`: Points to content panel ID
   - `role="button"` on headers
   - `role="region"` on content

3. **Focus Indicators**
   - Visible focus ring using `--accordion-accent-cyan`
   - High contrast focus states

---

## TypeScript Types

```typescript
// types/accordion.ts

export type AccordionStatus = 'active' | 'upcoming' | 'completed' | 'pending' | 'inactive';

export type AccordionIconVariant = 'cyan' | 'green' | 'orange' | 'purple' | 'red';

export type AccordionBadgeSeverity = 'success' | 'info' | 'warning' | 'danger' | 'muted';

export type AccordionGap = 'none' | 'sm' | 'md' | 'lg';

export type AccordionPadding = 'none' | 'sm' | 'md' | 'lg';

export interface AccordionPanelData {
  value: string | number;
  title: string;
  subtitle?: string;
  status?: AccordionStatus;
  icon?: Component;
  iconVariant?: AccordionIconVariant;
  badge?: string;
  badgeSeverity?: AccordionBadgeSeverity;
  disabled?: boolean;
  content?: string | VNode;
}
```

---

## File Structure

```
resources/app/js/components/common/accordions/
├── TechnicalAccordion.vue
├── TechnicalAccordionPanel.vue
├── TechnicalAccordionHeader.vue
├── TechnicalAccordionContent.vue
├── AccordionStatusIndicator.vue
├── AccordionBadge.vue
├── AccordionIcon.vue
├── types.ts
├── index.ts
└── __tests__/
    ├── TechnicalAccordion.test.ts
    ├── TechnicalAccordionPanel.test.ts
    ├── TechnicalAccordionHeader.test.ts
    ├── TechnicalAccordionContent.test.ts
    ├── AccordionStatusIndicator.test.ts
    ├── AccordionBadge.test.ts
    └── AccordionIcon.test.ts
```

---

## Index Export

```typescript
// index.ts
export { default as TechnicalAccordion } from './TechnicalAccordion.vue';
export { default as TechnicalAccordionPanel } from './TechnicalAccordionPanel.vue';
export { default as TechnicalAccordionHeader } from './TechnicalAccordionHeader.vue';
export { default as TechnicalAccordionContent } from './TechnicalAccordionContent.vue';
export { default as AccordionStatusIndicator } from './AccordionStatusIndicator.vue';
export { default as AccordionBadge } from './AccordionBadge.vue';
export { default as AccordionIcon } from './AccordionIcon.vue';

export * from './types';
```
