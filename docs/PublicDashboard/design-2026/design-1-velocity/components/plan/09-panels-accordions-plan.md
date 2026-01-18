# VRL Velocity Design System - Panels & Accordions Component Plan

**Component Category**: Data Display / Collapsible Containers
**Priority**: High
**Estimated Complexity**: Medium
**Dependencies**: Base styles, transitions, keyboard navigation utilities

---

## Overview

This plan outlines the implementation of **Panels** and **Accordions** components for the VRL Velocity Design System. These components provide collapsible content containers that allow users to organize and reveal information progressively.

### Component Hierarchy

```
Panels:
├── VrlPanel.vue (main container)
├── VrlPanelHeader.vue (header with toggle)
└── VrlPanelContent.vue (collapsible content)

Accordions:
├── VrlAccordion.vue (container providing context)
├── VrlAccordionItem.vue (individual accordion panel)
├── VrlAccordionHeader.vue (item header with toggle)
└── VrlAccordionContent.vue (item content)
```

---

## Design Reference Analysis

### Design System Specifications

From `/var/www/docs/PublicDashboard/design-2026/design-1-velocity/components/index.html`:

**Panel Styles (lines 1391-1431)**:
- Background: `var(--bg-card)` (#1c2128)
- Border: `1px solid var(--border)` (#30363d)
- Border radius: `var(--radius-lg)` (12px)
- Header background: `var(--bg-panel)` (#161b22)
- Header hover: `var(--bg-elevated)` (#21262d)
- Header padding: `1rem 1.25rem`
- Content padding: `1.25rem`
- Toggle icon rotation: `180deg` when expanded
- Transition: `all 0.3s ease`

**Accordion Styles (lines 1434-1470)**:
- Container gap: `0.5rem` between items
- Item background: `var(--bg-card)` (#1c2128)
- Item border: `1px solid var(--border)` (#30363d)
- Item border radius: `var(--radius)` (6px)
- Header padding: `1rem 1.25rem`
- Content padding: `0 1.25rem 1.25rem` (asymmetric top padding)
- Title font: `var(--font-display)` (Orbitron)
- Title size: `0.85rem`
- Content color: `var(--text-secondary)` (#8b949e)
- Content font size: `0.9rem`

---

## Existing Implementation Analysis

### App Dashboard Pattern (PrimeVue Wrappers)

**BasePanel.vue** (`/var/www/resources/app/js/components/common/panels/BasePanel.vue`):
- ✅ Wraps PrimeVue Panel component
- ✅ Supports v-model:collapsed
- ✅ Props: `collapsed`, `toggleable`, `header`, `contentClass`, `footerClass`
- ✅ Emits: `toggle`, `update:collapsed`
- ✅ Provides slots: `header`, `icons`, `default`, `footer`
- ✅ Uses PrimeVue pass-through API for customization

**PanelHeader.vue** (`/var/www/resources/app/js/components/common/panels/PanelHeader.vue`):
- ✅ Presentational component for panel headers
- ✅ Props: `icon`, `title`, `description`, `gradient`, `halfWidth`, `borderRight`
- ✅ Integrates Phosphor icons
- ✅ Supports gradient backgrounds for visual hierarchy
- ✅ Optimized for grid layouts

**TechnicalAccordion.vue** (`/var/www/resources/app/js/components/common/accordions/TechnicalAccordion.vue`):
- ✅ Wraps PrimeVue Accordion
- ✅ Props: `modelValue`, `multiple`, `gap`, `nested`
- ✅ Configurable gap spacing (GAP_MAP pattern)
- ✅ Uses pass-through API for styling

**TechnicalAccordionPanel.vue** (`/var/www/resources/app/js/components/common/accordions/TechnicalAccordionPanel.vue`):
- ✅ Wraps PrimeVue AccordionPanel
- ✅ Props: `value`, `disabled`
- ✅ Injects accordion context for active state
- ✅ Hover and active state styling with CSS variables
- ✅ Transition support

### Key Learnings from App Dashboard

1. **PrimeVue Integration**: App uses PrimeVue as base with custom pass-through styling
2. **Composition Pattern**: Separate header/content/footer components for flexibility
3. **CSS Variables**: Uses custom properties for theming (`--accordion-border`, `--accordion-bg`, etc.)
4. **Context Injection**: Accordion provides context to child panels for state management
5. **Gap Configuration**: Reusable gap mapping pattern (`GAP_MAP`)
6. **Accessibility**: Focus states and hover transitions

---

## Public Dashboard Implementation Strategy

### Approach: Custom Components (Not PrimeVue Wrappers)

**Rationale**:
1. Public dashboard has different design requirements (Velocity theme vs. technical theme)
2. Simpler use cases (no nested accordions, fewer customization needs)
3. Smaller bundle size (no PrimeVue dependency for basic collapsible)
4. Full control over animations and interactions
5. Learning opportunity for custom Vue composition patterns

**When to Consider PrimeVue**:
- If complex accordion features are needed later (lazy loading, async content)
- If integration with PrimeVue forms is required
- If advanced accessibility features are needed beyond our implementation

---

## Component Specifications

### 1. VrlPanel.vue

**Purpose**: Standalone collapsible panel with header and content.

**File Path**: `/var/www/resources/public/js/components/common/panels/VrlPanel.vue`

#### Props Interface

```typescript
interface VrlPanelProps {
  /** Panel title displayed in header */
  title?: string;

  /** Whether panel can be collapsed/expanded */
  collapsible?: boolean;

  /** Initial expanded state (uncontrolled mode) */
  defaultExpanded?: boolean;

  /** Controlled expanded state (use with v-model:expanded) */
  expanded?: boolean;

  /** Custom CSS class for root element */
  class?: string;

  /** Custom CSS class for header */
  headerClass?: string;

  /** Custom CSS class for content wrapper */
  contentClass?: string;
}
```

#### Emits

```typescript
interface VrlPanelEmits {
  /** Emitted when panel is toggled */
  (event: 'toggle', expanded: boolean): void;

  /** For v-model:expanded support */
  (event: 'update:expanded', expanded: boolean): void;
}
```

#### Slots

```typescript
slots: {
  /** Custom header content (overrides title prop) */
  header?: (props: { expanded: boolean; toggle: () => void }) => VNode;

  /** Header actions (buttons, badges, etc.) */
  actions?: () => VNode;

  /** Panel content */
  default?: () => VNode;
}
```

#### State Management

```typescript
// Internal state (uncontrolled mode)
const isExpanded = ref<boolean>(props.defaultExpanded ?? true);

// Computed for controlled/uncontrolled mode
const expanded = computed({
  get: () => props.expanded !== undefined ? props.expanded : isExpanded.value,
  set: (value: boolean) => {
    isExpanded.value = value;
    emit('update:expanded', value);
    emit('toggle', value);
  }
});

// Toggle function exposed to slots
const toggle = () => {
  if (props.collapsible) {
    expanded.value = !expanded.value;
  }
};
```

#### Styling Classes

```css
/* Root panel container */
.vrl-panel {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all 0.3s ease;
}

/* Hover effect (when collapsible) */
.vrl-panel.collapsible {
  cursor: default;
}

.vrl-panel.collapsible:hover {
  border-color: var(--cyan);
}
```

#### Keyboard Navigation

- **Enter/Space**: Toggle panel (when collapsible and header focused)
- **Tab**: Navigate to header or actions
- **Shift+Tab**: Reverse navigation

#### Accessibility

```html
<div
  class="vrl-panel-header"
  :role="collapsible ? 'button' : undefined"
  :aria-expanded="collapsible ? expanded : undefined"
  :aria-controls="collapsible ? headerId : undefined"
  :tabindex="collapsible ? 0 : undefined"
  @click="toggle"
  @keydown.enter.prevent="toggle"
  @keydown.space.prevent="toggle"
>
```

#### Usage Examples

```vue
<!-- Basic panel (always expanded) -->
<VrlPanel title="League Settings">
  <p>Panel content here</p>
</VrlPanel>

<!-- Collapsible panel (uncontrolled) -->
<VrlPanel
  title="Advanced Options"
  collapsible
  :default-expanded="false"
>
  <p>Advanced settings...</p>
</VrlPanel>

<!-- Controlled panel with v-model -->
<VrlPanel
  v-model:expanded="isPanelExpanded"
  title="Statistics"
  collapsible
>
  <StatsChart />
</VrlPanel>

<!-- Custom header with actions -->
<VrlPanel collapsible>
  <template #header="{ expanded, toggle }">
    <div class="flex items-center gap-2">
      <PhChartLine :size="20" />
      <span>Performance Metrics</span>
    </div>
  </template>
  <template #actions>
    <VrlButton size="sm" variant="ghost">Export</VrlButton>
  </template>
  <p>Metrics content...</p>
</VrlPanel>
```

---

### 2. VrlPanelHeader.vue

**Purpose**: Header component for VrlPanel with toggle indicator.

**File Path**: `/var/www/resources/public/js/components/common/panels/VrlPanelHeader.vue`

#### Props Interface

```typescript
interface VrlPanelHeaderProps {
  /** Whether panel is expanded */
  expanded: boolean;

  /** Whether header is clickable/interactive */
  clickable?: boolean;

  /** Custom CSS class */
  class?: string;
}
```

#### Emits

```typescript
interface VrlPanelHeaderEmits {
  /** Emitted when header is clicked (if clickable) */
  (event: 'click', e: MouseEvent): void;
}
```

#### Slots

```typescript
slots: {
  /** Title content */
  title?: () => VNode;

  /** Action buttons/badges */
  actions?: () => VNode;
}
```

#### Styling

```css
.vrl-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border);
  transition: background 0.3s ease;
}

.vrl-panel-header.clickable {
  cursor: pointer;
}

.vrl-panel-header.clickable:hover {
  background: var(--bg-elevated);
}

.vrl-panel-title {
  font-family: var(--font-display);
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: var(--text-primary);
}

.vrl-panel-toggle {
  color: var(--text-muted);
  transition: transform 0.3s ease;
  user-select: none;
}

.vrl-panel-toggle.expanded {
  transform: rotate(180deg);
}
```

#### Template Structure

```vue
<template>
  <div
    :class="[
      'vrl-panel-header',
      { 'clickable': clickable }
    ]"
    @click="handleClick"
  >
    <div class="vrl-panel-title">
      <slot name="title" />
    </div>

    <div class="flex items-center gap-2">
      <slot name="actions" />
      <span
        v-if="clickable"
        :class="['vrl-panel-toggle', { 'expanded': expanded }]"
      >
        ▼
      </span>
    </div>
  </div>
</template>
```

---

### 3. VrlPanelContent.vue

**Purpose**: Collapsible content wrapper with smooth transitions.

**File Path**: `/var/www/resources/public/js/components/common/panels/VrlPanelContent.vue`

#### Props Interface

```typescript
interface VrlPanelContentProps {
  /** Whether content is visible */
  show: boolean;

  /** Custom CSS class */
  class?: string;
}
```

#### Slots

```typescript
slots: {
  /** Panel content */
  default?: () => VNode;
}
```

#### Animation Strategy

**Option 1: Vue Transition with max-height**
```vue
<Transition name="panel-collapse">
  <div v-show="show" class="vrl-panel-content">
    <slot />
  </div>
</Transition>
```

```css
.panel-collapse-enter-active,
.panel-collapse-leave-active {
  transition: max-height 0.3s ease, opacity 0.3s ease;
  overflow: hidden;
}

.panel-collapse-enter-from,
.panel-collapse-leave-to {
  max-height: 0;
  opacity: 0;
}

.panel-collapse-enter-to,
.panel-collapse-leave-from {
  max-height: 500px; /* Estimated max content height */
  opacity: 1;
}
```

**Option 2: JavaScript hooks for dynamic height**
```typescript
const contentRef = ref<HTMLElement>();

const onBeforeEnter = (el: Element) => {
  (el as HTMLElement).style.height = '0';
  (el as HTMLElement).style.opacity = '0';
};

const onEnter = (el: Element) => {
  (el as HTMLElement).style.height = `${el.scrollHeight}px`;
  (el as HTMLElement).style.opacity = '1';
};

const onAfterEnter = (el: Element) => {
  (el as HTMLElement).style.height = 'auto';
};
```

**Recommendation**: Use **Option 1** for simplicity, with a configurable max-height prop if needed.

#### Styling

```css
.vrl-panel-content {
  padding: 1.25rem;
  background: var(--bg-card);
}

/* Reduced padding for nested content */
.vrl-panel-content.nested {
  padding: 0.75rem 1.25rem;
}
```

---

### 4. VrlAccordion.vue

**Purpose**: Container for multiple accordion items with mutual exclusivity control.

**File Path**: `/var/www/resources/public/js/components/common/accordions/VrlAccordion.vue`

#### Props Interface

```typescript
interface VrlAccordionProps {
  /** Currently active item value(s) */
  modelValue?: string | string[];

  /** Allow multiple items to be open simultaneously */
  multiple?: boolean;

  /** Gap between accordion items */
  gap?: 'none' | 'sm' | 'md' | 'lg';

  /** Custom CSS class */
  class?: string;
}
```

#### Emits

```typescript
interface VrlAccordionEmits {
  /** For v-model support */
  (event: 'update:modelValue', value: string | string[] | undefined): void;
}
```

#### Provide/Inject Pattern

```typescript
// Types
interface AccordionContext {
  activeValue: Ref<string | string[] | undefined>;
  multiple: boolean;
  toggleItem: (value: string) => void;
}

// Provide context to child AccordionItem components
const activeValue = ref<string | string[] | undefined>(props.modelValue);

const toggleItem = (value: string) => {
  if (props.multiple) {
    // Multiple mode: toggle item in array
    const current = Array.isArray(activeValue.value) ? activeValue.value : [];
    const index = current.indexOf(value);

    if (index > -1) {
      activeValue.value = current.filter(v => v !== value);
    } else {
      activeValue.value = [...current, value];
    }
  } else {
    // Single mode: toggle or set active
    activeValue.value = activeValue.value === value ? undefined : value;
  }

  emit('update:modelValue', activeValue.value);
};

provide<AccordionContext>('vrl-accordion', {
  activeValue,
  multiple: props.multiple ?? false,
  toggleItem
});
```

#### Gap Mapping

```typescript
const GAP_MAP = {
  none: '0',
  sm: '0.25rem',
  md: '0.5rem',
  lg: '1rem'
} as const;

type AccordionGap = keyof typeof GAP_MAP;
```

#### Styling

```css
.vrl-accordion {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.vrl-accordion.gap-none { gap: 0; }
.vrl-accordion.gap-sm { gap: 0.25rem; }
.vrl-accordion.gap-md { gap: 0.5rem; }
.vrl-accordion.gap-lg { gap: 1rem; }
```

#### Usage Examples

```vue
<!-- Single mode (default) -->
<VrlAccordion v-model="activeItem">
  <VrlAccordionItem value="general" title="General Information">
    <p>General content...</p>
  </VrlAccordionItem>
  <VrlAccordionItem value="scoring" title="Scoring System">
    <p>Scoring content...</p>
  </VrlAccordionItem>
</VrlAccordion>

<!-- Multiple mode -->
<VrlAccordion v-model="activeItems" multiple>
  <VrlAccordionItem value="1" title="Section 1">...</VrlAccordionItem>
  <VrlAccordionItem value="2" title="Section 2">...</VrlAccordionItem>
</VrlAccordion>

<!-- Custom gap -->
<VrlAccordion gap="lg">
  <VrlAccordionItem value="1" title="Item 1">...</VrlAccordionItem>
</VrlAccordion>
```

---

### 5. VrlAccordionItem.vue

**Purpose**: Individual accordion panel within VrlAccordion.

**File Path**: `/var/www/resources/public/js/components/common/accordions/VrlAccordionItem.vue`

#### Props Interface

```typescript
interface VrlAccordionItemProps {
  /** Unique identifier for this item */
  value: string | number;

  /** Item title */
  title?: string;

  /** Whether item is disabled */
  disabled?: boolean;

  /** Custom CSS class */
  class?: string;
}
```

#### Inject Context

```typescript
const accordion = inject<AccordionContext>('vrl-accordion');

const isActive = computed(() => {
  if (!accordion?.activeValue.value) return false;

  if (Array.isArray(accordion.activeValue.value)) {
    return accordion.activeValue.value.includes(String(props.value));
  }

  return accordion.activeValue.value === String(props.value);
});

const toggle = () => {
  if (!props.disabled && accordion) {
    accordion.toggleItem(String(props.value));
  }
};
```

#### Slots

```typescript
slots: {
  /** Custom header content (overrides title prop) */
  header?: (props: { active: boolean; toggle: () => void }) => VNode;

  /** Item content */
  default?: () => VNode;
}
```

#### Styling

```css
.vrl-accordion-item {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  transition: all 0.2s ease;
}

.vrl-accordion-item:hover:not(.disabled) {
  border-color: var(--cyan);
}

.vrl-accordion-item.active {
  background: var(--bg-elevated);
  border-color: var(--cyan);
}

.vrl-accordion-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

#### Template Structure

```vue
<template>
  <div
    :class="[
      'vrl-accordion-item',
      { 'active': isActive, 'disabled': disabled }
    ]"
  >
    <VrlAccordionHeader
      :active="isActive"
      :disabled="disabled"
      @click="toggle"
    >
      <template #title>
        <slot name="header" :active="isActive" :toggle="toggle">
          {{ title }}
        </slot>
      </template>
    </VrlAccordionHeader>

    <VrlAccordionContent :show="isActive">
      <slot />
    </VrlAccordionContent>
  </div>
</template>
```

---

### 6. VrlAccordionHeader.vue

**Purpose**: Header for accordion items with toggle indicator.

**File Path**: `/var/www/resources/public/js/components/common/accordions/VrlAccordionHeader.vue`

#### Props Interface

```typescript
interface VrlAccordionHeaderProps {
  /** Whether item is active/expanded */
  active: boolean;

  /** Whether header is disabled */
  disabled?: boolean;

  /** Custom CSS class */
  class?: string;
}
```

#### Emits

```typescript
interface VrlAccordionHeaderEmits {
  (event: 'click', e: MouseEvent): void;
}
```

#### Slots

```typescript
slots: {
  /** Title content */
  title?: () => VNode;

  /** Custom icon (overrides default toggle arrow) */
  icon?: (props: { active: boolean }) => VNode;
}
```

#### Styling

```css
.vrl-accordion-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  cursor: pointer;
  transition: background 0.3s ease;
  user-select: none;
}

.vrl-accordion-header:hover:not(.disabled) {
  background: var(--bg-elevated);
}

.vrl-accordion-header.disabled {
  cursor: not-allowed;
}

.vrl-accordion-title {
  font-family: var(--font-display);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 0.3px;
}

.vrl-accordion-toggle {
  color: var(--text-muted);
  font-size: 0.75rem;
  transition: transform 0.3s ease, color 0.3s ease;
}

.vrl-accordion-toggle.active {
  transform: rotate(180deg);
  color: var(--cyan);
}
```

#### Accessibility

```html
<div
  class="vrl-accordion-header"
  role="button"
  :aria-expanded="active"
  :aria-disabled="disabled"
  :tabindex="disabled ? -1 : 0"
  @click="!disabled && emit('click', $event)"
  @keydown.enter.prevent="!disabled && emit('click', $event)"
  @keydown.space.prevent="!disabled && emit('click', $event)"
>
```

---

### 7. VrlAccordionContent.vue

**Purpose**: Collapsible content for accordion items.

**File Path**: `/var/www/resources/public/js/components/common/accordions/VrlAccordionContent.vue`

#### Props Interface

```typescript
interface VrlAccordionContentProps {
  /** Whether content is visible */
  show: boolean;

  /** Custom CSS class */
  class?: string;
}
```

#### Slots

```typescript
slots: {
  /** Accordion item content */
  default?: () => VNode;
}
```

#### Styling

```css
.vrl-accordion-content {
  padding: 0 1.25rem 1.25rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.6;
}

/* Transition classes */
.accordion-collapse-enter-active,
.accordion-collapse-leave-active {
  transition: max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease;
  overflow: hidden;
}

.accordion-collapse-enter-from,
.accordion-collapse-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.accordion-collapse-enter-to,
.accordion-collapse-leave-from {
  max-height: 800px;
  opacity: 1;
}
```

---

## CSS Additions Required

### File: `/var/www/resources/public/css/app.css`

Add the following section:

```css
/* ================================================================
   PANELS & ACCORDIONS
   ================================================================ */

/* Panel Base Styles */
.vrl-panel {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all 0.3s ease;
}

.vrl-panel.collapsible:hover {
  border-color: var(--cyan);
}

.vrl-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border);
  transition: background 0.3s ease;
}

.vrl-panel-header.clickable {
  cursor: pointer;
}

.vrl-panel-header.clickable:hover {
  background: var(--bg-elevated);
}

.vrl-panel-title {
  font-family: var(--font-display);
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: var(--text-primary);
}

.vrl-panel-toggle {
  color: var(--text-muted);
  transition: transform 0.3s ease;
  user-select: none;
}

.vrl-panel-toggle.expanded {
  transform: rotate(180deg);
}

.vrl-panel-content {
  padding: 1.25rem;
  background: var(--bg-card);
}

.vrl-panel-content.nested {
  padding: 0.75rem 1.25rem;
}

/* Panel Collapse Transition */
.panel-collapse-enter-active,
.panel-collapse-leave-active {
  transition: max-height 0.3s ease, opacity 0.3s ease;
  overflow: hidden;
}

.panel-collapse-enter-from,
.panel-collapse-leave-to {
  max-height: 0;
  opacity: 0;
}

.panel-collapse-enter-to,
.panel-collapse-leave-from {
  max-height: 500px;
  opacity: 1;
}

/* Accordion Base Styles */
.vrl-accordion {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.vrl-accordion.gap-none { gap: 0; }
.vrl-accordion.gap-sm { gap: 0.25rem; }
.vrl-accordion.gap-md { gap: 0.5rem; }
.vrl-accordion.gap-lg { gap: 1rem; }

.vrl-accordion-item {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  transition: all 0.2s ease;
}

.vrl-accordion-item:hover:not(.disabled) {
  border-color: var(--cyan);
  box-shadow: 0 0 0 1px var(--cyan-dim);
}

.vrl-accordion-item.active {
  background: var(--bg-elevated);
  border-color: var(--cyan);
}

.vrl-accordion-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.vrl-accordion-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  cursor: pointer;
  transition: background 0.3s ease;
  user-select: none;
}

.vrl-accordion-header:hover:not(.disabled) {
  background: var(--bg-elevated);
}

.vrl-accordion-header.disabled {
  cursor: not-allowed;
}

.vrl-accordion-header:focus-visible {
  outline: 2px solid var(--cyan);
  outline-offset: -2px;
}

.vrl-accordion-title {
  font-family: var(--font-display);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 0.3px;
}

.vrl-accordion-toggle {
  color: var(--text-muted);
  font-size: 0.75rem;
  transition: transform 0.3s ease, color 0.3s ease;
}

.vrl-accordion-toggle.active {
  transform: rotate(180deg);
  color: var(--cyan);
}

.vrl-accordion-content {
  padding: 0 1.25rem 1.25rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.6;
}

/* Accordion Collapse Transition */
.accordion-collapse-enter-active,
.accordion-collapse-leave-active {
  transition: max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease;
  overflow: hidden;
}

.accordion-collapse-enter-from,
.accordion-collapse-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.accordion-collapse-enter-to,
.accordion-collapse-leave-from {
  max-height: 800px;
  opacity: 1;
}

/* Focus and Keyboard Navigation */
.vrl-panel-header:focus-visible,
.vrl-accordion-header:focus-visible {
  outline: 2px solid var(--cyan);
  outline-offset: -2px;
}

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  .vrl-panel,
  .vrl-panel-header,
  .vrl-panel-toggle,
  .vrl-accordion-item,
  .vrl-accordion-header,
  .vrl-accordion-toggle,
  .panel-collapse-enter-active,
  .panel-collapse-leave-active,
  .accordion-collapse-enter-active,
  .accordion-collapse-leave-active {
    transition: none;
  }
}
```

---

## Implementation Phases

### Phase 1: Foundation Components (Priority: High)

**Deliverables**:
1. `VrlPanel.vue` - Core panel component
2. `VrlPanelHeader.vue` - Panel header
3. `VrlPanelContent.vue` - Panel content with transitions
4. Base CSS styles for panels
5. Unit tests for VrlPanel

**Success Criteria**:
- ✅ Panel renders correctly
- ✅ Collapsible functionality works (controlled & uncontrolled)
- ✅ Smooth transitions
- ✅ Keyboard navigation (Enter/Space)
- ✅ ARIA attributes for accessibility
- ✅ All tests passing

**Estimated Time**: 4-6 hours

---

### Phase 2: Accordion System (Priority: High)

**Deliverables**:
1. `VrlAccordion.vue` - Accordion container
2. `VrlAccordionItem.vue` - Accordion item
3. `VrlAccordionHeader.vue` - Item header
4. `VrlAccordionContent.vue` - Item content
5. Provide/inject context implementation
6. CSS styles for accordions
7. Unit tests for all accordion components

**Success Criteria**:
- ✅ Single mode works (one item open at a time)
- ✅ Multiple mode works (multiple items open)
- ✅ Disabled items cannot be toggled
- ✅ Gap configuration works
- ✅ Keyboard navigation functional
- ✅ Provide/inject context working correctly
- ✅ All tests passing

**Estimated Time**: 6-8 hours

---

### Phase 3: Documentation & Examples (Priority: Medium)

**Deliverables**:
1. Component documentation (JSDoc comments)
2. Usage examples in `/docs`
3. Storybook stories (if applicable)
4. Integration examples with other components

**Success Criteria**:
- ✅ All props documented
- ✅ All slots documented
- ✅ Usage examples clear and comprehensive
- ✅ Edge cases documented

**Estimated Time**: 2-3 hours

---

### Phase 4: Polish & Optimization (Priority: Low)

**Deliverables**:
1. Animation performance optimization
2. Reduced motion support
3. Edge case handling
4. Cross-browser testing

**Success Criteria**:
- ✅ Smooth 60fps animations
- ✅ Works in all supported browsers
- ✅ Respects `prefers-reduced-motion`
- ✅ No console warnings/errors

**Estimated Time**: 2-3 hours

---

## Testing Strategy

### Unit Tests (Vitest + Vue Test Utils)

#### VrlPanel.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlPanel from '../VrlPanel.vue';

describe('VrlPanel', () => {
  it('renders title prop', () => {
    const wrapper = mount(VrlPanel, {
      props: { title: 'Test Panel' }
    });
    expect(wrapper.text()).toContain('Test Panel');
  });

  it('renders slot content', () => {
    const wrapper = mount(VrlPanel, {
      slots: { default: '<p>Test Content</p>' }
    });
    expect(wrapper.html()).toContain('Test Content');
  });

  it('starts expanded by default', () => {
    const wrapper = mount(VrlPanel, {
      props: { collapsible: true }
    });
    const content = wrapper.find('.vrl-panel-content');
    expect(content.exists()).toBe(true);
  });

  it('starts collapsed when defaultExpanded is false', () => {
    const wrapper = mount(VrlPanel, {
      props: {
        collapsible: true,
        defaultExpanded: false
      }
    });
    const content = wrapper.find('.vrl-panel-content');
    expect(content.isVisible()).toBe(false);
  });

  it('toggles on header click when collapsible', async () => {
    const wrapper = mount(VrlPanel, {
      props: {
        collapsible: true,
        title: 'Test'
      }
    });

    const header = wrapper.find('.vrl-panel-header');
    await header.trigger('click');

    expect(wrapper.emitted('toggle')).toBeTruthy();
    expect(wrapper.emitted('toggle')![0]).toEqual([false]);
  });

  it('does not toggle when not collapsible', async () => {
    const wrapper = mount(VrlPanel, {
      props: {
        collapsible: false,
        title: 'Test'
      }
    });

    const header = wrapper.find('.vrl-panel-header');
    await header.trigger('click');

    expect(wrapper.emitted('toggle')).toBeFalsy();
  });

  it('supports v-model:expanded', async () => {
    const wrapper = mount(VrlPanel, {
      props: {
        collapsible: true,
        expanded: true,
        'onUpdate:expanded': (value: boolean) =>
          wrapper.setProps({ expanded: value })
      }
    });

    const header = wrapper.find('.vrl-panel-header');
    await header.trigger('click');

    expect(wrapper.emitted('update:expanded')).toBeTruthy();
    expect(wrapper.emitted('update:expanded')![0]).toEqual([false]);
  });

  it('handles keyboard navigation (Enter key)', async () => {
    const wrapper = mount(VrlPanel, {
      props: {
        collapsible: true,
        title: 'Test'
      }
    });

    const header = wrapper.find('.vrl-panel-header');
    await header.trigger('keydown.enter');

    expect(wrapper.emitted('toggle')).toBeTruthy();
  });

  it('handles keyboard navigation (Space key)', async () => {
    const wrapper = mount(VrlPanel, {
      props: {
        collapsible: true,
        title: 'Test'
      }
    });

    const header = wrapper.find('.vrl-panel-header');
    await header.trigger('keydown.space');

    expect(wrapper.emitted('toggle')).toBeTruthy();
  });

  it('has correct ARIA attributes when collapsible', () => {
    const wrapper = mount(VrlPanel, {
      props: {
        collapsible: true,
        title: 'Test'
      }
    });

    const header = wrapper.find('.vrl-panel-header');
    expect(header.attributes('role')).toBe('button');
    expect(header.attributes('aria-expanded')).toBe('true');
    expect(header.attributes('tabindex')).toBe('0');
  });

  it('does not have ARIA button role when not collapsible', () => {
    const wrapper = mount(VrlPanel, {
      props: {
        collapsible: false,
        title: 'Test'
      }
    });

    const header = wrapper.find('.vrl-panel-header');
    expect(header.attributes('role')).toBeUndefined();
  });
});
```

#### VrlAccordion.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlAccordion from '../VrlAccordion.vue';
import VrlAccordionItem from '../VrlAccordionItem.vue';

describe('VrlAccordion', () => {
  it('renders accordion items', () => {
    const wrapper = mount(VrlAccordion, {
      slots: {
        default: `
          <VrlAccordionItem value="1" title="Item 1">Content 1</VrlAccordionItem>
          <VrlAccordionItem value="2" title="Item 2">Content 2</VrlAccordionItem>
        `
      },
      global: {
        components: { VrlAccordionItem }
      }
    });

    expect(wrapper.findAll('.vrl-accordion-item')).toHaveLength(2);
  });

  it('opens only one item in single mode', async () => {
    const wrapper = mount(VrlAccordion, {
      props: {
        multiple: false,
        modelValue: '1'
      },
      slots: {
        default: `
          <VrlAccordionItem value="1" title="Item 1">Content 1</VrlAccordionItem>
          <VrlAccordionItem value="2" title="Item 2">Content 2</VrlAccordionItem>
        `
      },
      global: {
        components: { VrlAccordionItem }
      }
    });

    const items = wrapper.findAll('.vrl-accordion-item');
    expect(items[0].classes()).toContain('active');
    expect(items[1].classes()).not.toContain('active');
  });

  it('opens multiple items in multiple mode', async () => {
    const wrapper = mount(VrlAccordion, {
      props: {
        multiple: true,
        modelValue: ['1', '2']
      },
      slots: {
        default: `
          <VrlAccordionItem value="1" title="Item 1">Content 1</VrlAccordionItem>
          <VrlAccordionItem value="2" title="Item 2">Content 2</VrlAccordionItem>
        `
      },
      global: {
        components: { VrlAccordionItem }
      }
    });

    const items = wrapper.findAll('.vrl-accordion-item');
    expect(items[0].classes()).toContain('active');
    expect(items[1].classes()).toContain('active');
  });

  it('emits update:modelValue when item is toggled', async () => {
    const wrapper = mount(VrlAccordion, {
      props: {
        modelValue: undefined
      },
      slots: {
        default: `
          <VrlAccordionItem value="1" title="Item 1">Content 1</VrlAccordionItem>
        `
      },
      global: {
        components: { VrlAccordionItem }
      }
    });

    const header = wrapper.find('.vrl-accordion-header');
    await header.trigger('click');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['1']);
  });

  it('applies correct gap class', () => {
    const wrapper = mount(VrlAccordion, {
      props: { gap: 'lg' }
    });

    expect(wrapper.classes()).toContain('gap-lg');
  });

  it('provides context to child items', () => {
    const wrapper = mount(VrlAccordion, {
      props: {
        modelValue: '1',
        multiple: false
      },
      slots: {
        default: `
          <VrlAccordionItem value="1" title="Item 1">Content 1</VrlAccordionItem>
        `
      },
      global: {
        components: { VrlAccordionItem }
      }
    });

    // Context is provided via provide/inject
    // Child component should receive activeValue and toggleItem
    expect(wrapper.vm).toBeDefined();
  });
});
```

#### VrlAccordionItem.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { provide, ref } from 'vue';
import VrlAccordionItem from '../VrlAccordionItem.vue';

describe('VrlAccordionItem', () => {
  it('renders title prop', () => {
    const wrapper = mount(VrlAccordionItem, {
      props: {
        value: '1',
        title: 'Test Item'
      },
      global: {
        provide: {
          'vrl-accordion': {
            activeValue: ref(undefined),
            multiple: false,
            toggleItem: () => {}
          }
        }
      }
    });

    expect(wrapper.text()).toContain('Test Item');
  });

  it('renders content slot', () => {
    const wrapper = mount(VrlAccordionItem, {
      props: { value: '1' },
      slots: {
        default: '<p>Test Content</p>'
      },
      global: {
        provide: {
          'vrl-accordion': {
            activeValue: ref('1'),
            multiple: false,
            toggleItem: () => {}
          }
        }
      }
    });

    expect(wrapper.html()).toContain('Test Content');
  });

  it('is active when value matches activeValue', () => {
    const wrapper = mount(VrlAccordionItem, {
      props: {
        value: '1',
        title: 'Test'
      },
      global: {
        provide: {
          'vrl-accordion': {
            activeValue: ref('1'),
            multiple: false,
            toggleItem: () => {}
          }
        }
      }
    });

    expect(wrapper.classes()).toContain('active');
  });

  it('is not active when value does not match', () => {
    const wrapper = mount(VrlAccordionItem, {
      props: {
        value: '1',
        title: 'Test'
      },
      global: {
        provide: {
          'vrl-accordion': {
            activeValue: ref('2'),
            multiple: false,
            toggleItem: () => {}
          }
        }
      }
    });

    expect(wrapper.classes()).not.toContain('active');
  });

  it('calls toggleItem when clicked', async () => {
    const toggleItem = vi.fn();
    const wrapper = mount(VrlAccordionItem, {
      props: {
        value: '1',
        title: 'Test'
      },
      global: {
        provide: {
          'vrl-accordion': {
            activeValue: ref(undefined),
            multiple: false,
            toggleItem
          }
        }
      }
    });

    const header = wrapper.find('.vrl-accordion-header');
    await header.trigger('click');

    expect(toggleItem).toHaveBeenCalledWith('1');
  });

  it('does not toggle when disabled', async () => {
    const toggleItem = vi.fn();
    const wrapper = mount(VrlAccordionItem, {
      props: {
        value: '1',
        title: 'Test',
        disabled: true
      },
      global: {
        provide: {
          'vrl-accordion': {
            activeValue: ref(undefined),
            multiple: false,
            toggleItem
          }
        }
      }
    });

    const header = wrapper.find('.vrl-accordion-header');
    await header.trigger('click');

    expect(toggleItem).not.toHaveBeenCalled();
  });

  it('has disabled class when disabled', () => {
    const wrapper = mount(VrlAccordionItem, {
      props: {
        value: '1',
        disabled: true
      },
      global: {
        provide: {
          'vrl-accordion': {
            activeValue: ref(undefined),
            multiple: false,
            toggleItem: () => {}
          }
        }
      }
    });

    expect(wrapper.classes()).toContain('disabled');
  });
});
```

### Integration Tests

Test scenarios:
1. **Panel within accordion**: Nesting panels inside accordion items
2. **Multiple accordions on page**: Ensure independent state management
3. **Form elements inside panels**: Ensure form interactions work correctly
4. **Dynamic content**: Test with async-loaded content
5. **Responsive behavior**: Test on different screen sizes

---

## Accessibility Requirements

### WCAG 2.1 Level AA Compliance

#### Keyboard Navigation

| Component | Key | Action |
|-----------|-----|--------|
| VrlPanel (collapsible) | Enter/Space | Toggle panel |
| VrlPanel | Tab | Focus header |
| VrlAccordionItem | Enter/Space | Toggle item |
| VrlAccordionItem | Tab | Focus next item |
| VrlAccordionItem | Shift+Tab | Focus previous item |
| VrlAccordionItem | Home | Focus first item (optional) |
| VrlAccordionItem | End | Focus last item (optional) |

#### ARIA Attributes

**VrlPanel**:
```html
<div class="vrl-panel-header"
  role="button"
  aria-expanded="true"
  aria-controls="panel-content-id"
  tabindex="0"
>
```

**VrlAccordionItem**:
```html
<div class="vrl-accordion-header"
  role="button"
  aria-expanded="false"
  aria-controls="accordion-content-id"
  aria-disabled="false"
  tabindex="0"
>
```

#### Focus Management

- Focus indicators must be visible (2px outline with `--cyan` color)
- Focus order follows DOM order
- Focus is not trapped unless intentionally (e.g., modal panel)

#### Screen Reader Support

- Announce state changes ("expanded", "collapsed")
- Announce disabled state
- Provide meaningful labels for headers
- Use `aria-label` when title is not descriptive enough

---

## Performance Considerations

### Animation Performance

1. **Use CSS transforms over layout properties**:
   - ✅ `transform: rotate(180deg)` for toggle icon
   - ❌ Avoid animating `height` directly
   - ✅ Use `max-height` with estimated values

2. **GPU Acceleration**:
   ```css
   .vrl-panel-toggle {
     will-change: transform;
     transform: translateZ(0); /* Force GPU layer */
   }
   ```

3. **Reduced Motion**:
   ```css
   @media (prefers-reduced-motion: reduce) {
     .vrl-panel-toggle,
     .panel-collapse-enter-active,
     .panel-collapse-leave-active {
       transition: none;
     }
   }
   ```

### Bundle Size

- Estimated size per component: ~2-3 KB (minified + gzipped)
- Total bundle impact: ~15-20 KB for all 7 components
- No external dependencies (pure Vue 3)

### Lazy Loading

For large accordions (>10 items), consider:
```typescript
// Lazy render content only when expanded
const renderContent = computed(() => isActive.value);
```

---

## Migration Path from App Dashboard

If PrimeVue-based panels/accordions are needed later:

1. **Create adapter components**:
   ```typescript
   // VrlPanelPrime.vue
   import BasePanel from '@app/components/common/panels/BasePanel.vue';
   export default BasePanel; // Re-export with public-specific defaults
   ```

2. **Maintain consistent API**:
   - Keep prop names compatible
   - Emit same events
   - Use same slot names

3. **Feature parity checklist**:
   - [ ] Collapsible functionality
   - [ ] v-model support
   - [ ] Keyboard navigation
   - [ ] Custom headers/actions
   - [ ] Transitions
   - [ ] Accessibility

---

## Known Limitations & Future Enhancements

### Current Limitations

1. **Max-height animation**:
   - Requires estimated max height (may cut off very tall content)
   - Alternative: Use JavaScript hooks for dynamic height

2. **No nested accordion support**:
   - Nested accordions within accordion items not tested
   - May require additional context isolation

3. **No lazy loading**:
   - All content rendered in DOM (hidden with CSS)
   - Consider virtual scrolling for very large lists

### Future Enhancements

**Phase 5** (Post-MVP):
1. **VrlPanelGroup.vue**: Multiple panels with mutual exclusivity
2. **Drag-to-reorder**: Sortable accordion items
3. **Async content loading**: Skeleton loaders for accordion content
4. **Animation presets**: Multiple transition styles (fade, slide, zoom)
5. **Persistence**: Remember expanded state in localStorage
6. **Analytics**: Track which panels/items are most used

---

## Questions for Design Review

1. **Toggle Icon**: Should we support custom icons (e.g., Phosphor icons) instead of unicode arrows?
2. **Nested Panels**: Do we need panels inside accordion items?
3. **Animation Duration**: Is 300ms transition too slow? Should it be configurable?
4. **Max Height**: What's the tallest expected content? (impacts animation)
5. **Gap Customization**: Is 4 gap sizes enough, or do we need arbitrary values?
6. **Header Actions**: Should panel headers support right-aligned action buttons?
7. **Badge Support**: Should accordion items support badges/counts in headers?
8. **Loading States**: Do we need skeleton loaders for async content?

---

## Success Metrics

### Code Quality
- [ ] TypeScript strict mode compliance
- [ ] 100% test coverage for core functionality
- [ ] No console warnings/errors
- [ ] ESLint/Prettier compliance

### Performance
- [ ] <100ms time to interactive
- [ ] 60fps animations
- [ ] <20KB total bundle size (all components)

### Accessibility
- [ ] WCAG 2.1 Level AA compliant
- [ ] Keyboard navigation functional
- [ ] Screen reader tested (NVDA/JAWS)
- [ ] Focus indicators visible

### Documentation
- [ ] All props documented with JSDoc
- [ ] All slots documented
- [ ] Usage examples provided
- [ ] Edge cases documented

---

## Dependencies

### Required Before Implementation
- [x] Base CSS variables (already in design system)
- [x] Transition utilities (Vue 3 built-in)
- [ ] Icon components (if using custom toggle icons)

### Nice to Have
- [ ] Storybook setup for component showcase
- [ ] Visual regression testing (Percy/Chromatic)
- [ ] Accessibility testing tools (axe-core)

---

## File Structure

```
resources/public/js/components/common/
├── panels/
│   ├── VrlPanel.vue
│   ├── VrlPanelHeader.vue
│   ├── VrlPanelContent.vue
│   └── __tests__/
│       ├── VrlPanel.test.ts
│       ├── VrlPanelHeader.test.ts
│       └── VrlPanelContent.test.ts
└── accordions/
    ├── VrlAccordion.vue
    ├── VrlAccordionItem.vue
    ├── VrlAccordionHeader.vue
    ├── VrlAccordionContent.vue
    ├── types.ts (for AccordionContext, GAP_MAP)
    └── __tests__/
        ├── VrlAccordion.test.ts
        ├── VrlAccordionItem.test.ts
        ├── VrlAccordionHeader.test.ts
        └── VrlAccordionContent.test.ts
```

---

## Conclusion

This plan provides a comprehensive roadmap for implementing Panels and Accordions components for the VRL Velocity Design System. The approach prioritizes:

1. **Simplicity**: Custom components without PrimeVue dependency
2. **Flexibility**: Controlled/uncontrolled modes, multiple customization points
3. **Accessibility**: Full keyboard navigation and ARIA support
4. **Performance**: Smooth 60fps animations with GPU acceleration
5. **Testability**: Comprehensive unit tests with high coverage

The implementation follows Vue 3 Composition API best practices and maintains consistency with the Velocity design language. Total estimated effort is **14-20 hours** across all phases.

---

**Document Version**: 1.0
**Last Updated**: 2026-01-18
**Author**: Claude (VRL Design System Architect)
**Status**: Ready for Implementation
