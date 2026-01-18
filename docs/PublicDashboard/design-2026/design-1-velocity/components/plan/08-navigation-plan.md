# VRL Velocity Design System - NAVIGATION Components Plan

## Overview
This document outlines the implementation plan for the VRL Velocity Design System navigation components for the public dashboard. These components provide wayfinding and page navigation functionality including breadcrumbs, tabs, and navigation links.

**Component Family**: Navigation
**Total Components**: 5 (3 main + 2 sub-components)
**Design Reference**: `/var/www/docs/PublicDashboard/design-2026/design-1-velocity/components/index.html` (lines 2441-2484)
**Existing Reference**: `/var/www/resources/app/js/components/common/Breadcrumbs.vue`

---

## Component Architecture

### 1. VrlBreadcrumbs.vue
**Path**: `resources/public/js/components/common/navigation/VrlBreadcrumbs.vue`
**Purpose**: Display hierarchical navigation path showing user's current location within the site structure

#### Props
```typescript
interface BreadcrumbItem {
  label: string;           // Display text for the breadcrumb
  href?: string;           // Regular link (for external or non-router links)
  to?: RouteLocationRaw;   // Vue Router location object
}

interface Props {
  items: BreadcrumbItem[]; // Array of breadcrumb items (1-5 items recommended)
}
```

#### Slots
```typescript
{
  separator?: () => VNode; // Custom separator (default: "/")
}
```

#### Key Features
- **Smart Navigation**: Supports both `href` (regular links) and `to` (Vue Router) props
- **Active State**: Last item is automatically styled as active and non-clickable
- **Accessibility**: Uses `aria-current="page"` for the active item, `aria-label="Breadcrumb"` for nav
- **Responsive**: Horizontal layout with flexible gap spacing
- **Validation**: Warns if more than 5 items (maintains usability)

#### Styling Specifications
```css
.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 0.5rem;              /* 8px spacing between items */
  font-size: 0.85rem;       /* ~13.6px */
}

.breadcrumb-item {
  color: var(--text-secondary);
  text-decoration: none;
  transition: var(--transition);
}

.breadcrumb-item:hover {
  color: var(--cyan);
}

.breadcrumb-item.active {
  color: var(--text-primary);
  pointer-events: none;    /* Prevent interaction with active/last item */
}

.breadcrumb-separator {
  color: var(--text-muted);
}
```

#### Implementation Notes
- Render as `<nav>` with semantic `<ol>` list structure
- Each item wrapped in `<li>` for proper semantics
- Use `VrlBreadcrumbItem` sub-component for individual items
- Separator should be `aria-hidden="true"` to avoid screen reader verbosity
- Consider truncating very long labels with ellipsis on mobile

#### Testing Requirements
- Render with 1, 3, and 5 items
- Verify last item is non-clickable and styled as active
- Test both `href` and `to` navigation
- Verify `aria-current="page"` on last item
- Test custom separator slot
- Verify warning when > 5 items provided
- Test keyboard navigation (Tab order)

---

### 2. VrlBreadcrumbItem.vue
**Path**: `resources/public/js/components/common/navigation/VrlBreadcrumbItem.vue`
**Purpose**: Individual breadcrumb item (internal sub-component)

#### Props
```typescript
interface Props {
  href?: string;           // Regular link
  to?: RouteLocationRaw;   // Vue Router link
  active?: boolean;        // Whether this is the active/current item
}
```

#### Slots
```typescript
{
  default: () => VNode;    // Breadcrumb label text
}
```

#### Key Features
- **Conditional Rendering**: Renders `<a>` for `href`, `<RouterLink>` for `to`, or `<span>` for active
- **State Management**: Active items are non-interactive
- **Hover Effects**: Smooth color transition on hover (non-active items)

#### Implementation Notes
- This is an internal component used by `VrlBreadcrumbs`
- Could be exported for advanced use cases
- Should not be directly used in most scenarios

---

### 3. VrlTabs.vue
**Path**: `resources/public/js/components/common/navigation/VrlTabs.vue`
**Purpose**: Segmented control for switching between different views/sections of content

#### Props
```typescript
interface TabItem {
  key: string;             // Unique identifier
  label: string;           // Display text
  disabled?: boolean;      // Optional disabled state
  icon?: string;           // Optional Phosphor icon name
}

interface Props {
  modelValue: string;      // Currently active tab key (v-model)
  tabs: TabItem[];         // Array of tab definitions
  variant?: 'default' | 'minimal'; // Visual style variant
}
```

#### Emits
```typescript
{
  'update:modelValue': (key: string) => void; // v-model update
  'change': (key: string) => void;             // Tab changed event
}
```

#### Slots
```typescript
{
  'tab-label'?: (props: { tab: TabItem }) => VNode; // Custom tab label rendering
}
```

#### Key Features
- **v-model Support**: Two-way binding for active tab
- **Keyboard Navigation**: Arrow keys to navigate between tabs, Enter/Space to activate
- **Disabled State**: Support for disabled tabs
- **Icon Support**: Optional icons alongside labels
- **Visual Variants**: Default (elevated container) and minimal styles

#### Styling Specifications
```css
.tabs {
  display: flex;
  gap: 0.5rem;              /* 8px between tabs */
  background: var(--bg-elevated);
  padding: 0.5rem;          /* 8px container padding */
  border-radius: var(--radius); /* Outer container radius */
}

.tab {
  padding: 0.5rem 1rem;     /* 8px vertical, 16px horizontal */
  font-family: var(--font-display); /* Orbitron */
  font-size: 0.75rem;       /* 12px */
  font-weight: 600;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm); /* Inner tab radius (4px) */
  cursor: pointer;
  transition: var(--transition);
}

.tab:hover:not(:disabled):not(.active) {
  color: var(--text-primary);
  background: var(--bg-card);
}

.tab.active {
  background: var(--cyan);
  color: var(--bg-dark);    /* Dark text for contrast on cyan */
  border-color: var(--cyan);
}

.tab:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

#### Accessibility
- **Role**: `role="tablist"` on container
- **Tab Elements**: `role="tab"`, `aria-selected="true|false"`, `aria-disabled="true"` when disabled
- **Tab IDs**: `id="tab-{key}"` for programmatic control
- **Keyboard**: Arrow keys for navigation, Home/End for first/last tab

#### Implementation Notes
- Use `VrlTab` sub-component for individual tabs
- Active tab should have `tabindex="0"`, inactive tabs `tabindex="-1"` (roving tabindex pattern)
- Emit both `update:modelValue` and `change` events
- Consider auto-scrolling tab container on mobile if tabs overflow

#### Testing Requirements
- Test v-model binding (active tab updates)
- Verify keyboard navigation (arrows, Enter, Space)
- Test disabled tabs (not clickable, not keyboard-navigable)
- Verify `aria-selected` toggles correctly
- Test with 2, 5, and 10 tabs
- Test tab slot for custom rendering
- Test variant prop ('default' vs 'minimal')

---

### 4. VrlTab.vue
**Path**: `resources/public/js/components/common/navigation/VrlTab.vue`
**Purpose**: Individual tab button (internal sub-component)

#### Props
```typescript
interface Props {
  active?: boolean;        // Whether this tab is currently active
  disabled?: boolean;      // Whether this tab is disabled
  icon?: string;           // Optional Phosphor icon name
}
```

#### Emits
```typescript
{
  click: () => void;       // Tab clicked event
}
```

#### Slots
```typescript
{
  default: () => VNode;    // Tab label content
}
```

#### Key Features
- **Visual States**: Default, hover, active, disabled
- **Icon Support**: Renders icon before label text
- **Click Handling**: Emits click event unless disabled

#### Implementation Notes
- Render as `<button type="button">`
- Prevent click emission when disabled
- Use Phosphor Icons for icon rendering
- This is an internal component used by `VrlTabs`

---

### 5. VrlNavLink.vue
**Path**: `resources/public/js/components/common/navigation/VrlNavLink.vue`
**Purpose**: Styled navigation link with animated underline effect for headers and nav menus

#### Props
```typescript
interface Props {
  href?: string;           // Regular link
  to?: RouteLocationRaw;   // Vue Router link
  active?: boolean;        // Whether this is the active/current page
  external?: boolean;      // Open in new tab (for href links)
}
```

#### Slots
```typescript
{
  default: () => VNode;    // Link text content
}
```

#### Key Features
- **Animated Underline**: Smooth width transition on hover (0 to 100%)
- **Smart Navigation**: Supports both `href` and `to` props
- **Active State**: Persistent underline when active
- **External Links**: Optional `target="_blank" rel="noopener noreferrer"`

#### Styling Specifications
```css
.nav-link {
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;       /* ~14.4px */
  letter-spacing: 0.5px;
  transition: color 0.3s ease;
  position: relative;      /* For ::after positioning */
  display: inline-block;   /* Ensure ::after width works */
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -4px;            /* 4px below text */
  left: 0;
  width: 0;                /* Start hidden */
  height: 2px;
  background: var(--cyan);
  transition: width 0.3s ease;
}

.nav-link:hover {
  color: var(--text-primary);
}

.nav-link:hover::after,
.nav-link.active::after {
  width: 100%;             /* Expand to full width */
}

.nav-link.active {
  color: var(--text-primary);
}
```

#### Accessibility
- **Active State**: Use `aria-current="page"` when active
- **External Links**: Screen reader announcement for new tab behavior
- **Keyboard**: Standard link keyboard navigation (Tab, Enter)

#### Implementation Notes
- Render as `<a>` for `href` or `<RouterLink>` for `to`
- Use `router-link-active` class from Vue Router for automatic active state
- Consider removing underline animation on touch devices (performance)

#### Testing Requirements
- Test hover underline animation
- Test active state (persistent underline)
- Test both `href` and `to` navigation
- Test external link behavior (new tab)
- Verify `aria-current="page"` when active
- Test in different contexts (header, footer, sidebar)

---

## CSS Architecture

### CSS File Location
**Path**: `resources/public/css/components/_navigation.css`

### CSS Variables Used
```css
/* Colors */
--text-primary
--text-secondary
--text-muted
--cyan
--bg-dark
--bg-card
--bg-elevated
--border

/* Spacing */
--radius      /* 8px - outer container radius */
--radius-sm   /* 4px - inner tab radius */
--radius-lg   /* 12px - not used in navigation */

/* Typography */
--font-display  /* Orbitron for tabs */

/* Transitions */
--transition    /* Standard 0.2s ease-in-out */
```

### Component Classes
```css
/* Breadcrumbs */
.breadcrumbs
.breadcrumb-item
.breadcrumb-item:hover
.breadcrumb-item.active
.breadcrumb-separator

/* Tabs */
.tabs
.tab
.tab:hover
.tab.active
.tab:disabled

/* Navigation Links */
.nav-link
.nav-link::after
.nav-link:hover
.nav-link:hover::after
.nav-link.active
.nav-link.active::after
```

### Responsive Considerations
```css
/* Mobile (<640px) */
- Breadcrumbs: Consider horizontal scroll or truncation for long paths
- Tabs: Horizontal scroll for overflow, prevent wrapping
- Nav links: Stack vertically in mobile nav, maintain horizontal spacing in header

/* Tablet (640px-1024px) */
- Maintain horizontal layouts
- Slightly reduced spacing acceptable

/* Desktop (>1024px) */
- Full spacing and sizing as designed
```

---

## TypeScript Types

### Shared Types File
**Path**: `resources/public/js/types/navigation.ts`

```typescript
import type { RouteLocationRaw } from 'vue-router';

/**
 * Breadcrumb item configuration
 */
export interface BreadcrumbItem {
  /** Display text for the breadcrumb */
  label: string;

  /** Regular link href (for external or non-router links) */
  href?: string;

  /** Vue Router route location */
  to?: RouteLocationRaw;

  /** Optional icon (Phosphor icon name) */
  icon?: string;
}

/**
 * Tab item configuration
 */
export interface TabItem {
  /** Unique identifier for the tab */
  key: string;

  /** Display text */
  label: string;

  /** Whether the tab is disabled */
  disabled?: boolean;

  /** Optional icon (Phosphor icon name) */
  icon?: string;

  /** Optional badge count */
  badge?: number | string;
}

/**
 * Tab variant types
 */
export type TabVariant = 'default' | 'minimal';

/**
 * Navigation link target types
 */
export type NavLinkTarget = '_self' | '_blank' | '_parent' | '_top';
```

---

## Component Usage Examples

### VrlBreadcrumbs

```vue
<template>
  <!-- Basic breadcrumbs with router links -->
  <VrlBreadcrumbs
    :items="[
      { label: 'Home', to: { name: 'home' } },
      { label: 'Leagues', to: { name: 'leagues' } },
      { label: 'GT4 Pro League', to: { name: 'league-detail', params: { id: '123' } } },
      { label: 'Standings' } // Current page - no link
    ]"
  />

  <!-- With external links (href) -->
  <VrlBreadcrumbs
    :items="[
      { label: 'Docs', href: 'https://docs.example.com' },
      { label: 'Getting Started', href: 'https://docs.example.com/start' },
      { label: 'Installation' }
    ]"
  />

  <!-- With custom separator -->
  <VrlBreadcrumbs :items="breadcrumbs">
    <template #separator>
      <PhosphorIcon name="caret-right" :size="12" />
    </template>
  </VrlBreadcrumbs>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import VrlBreadcrumbs from '@public/components/common/navigation/VrlBreadcrumbs.vue';

// Dynamic breadcrumbs based on current route
const route = useRoute();
const breadcrumbs = computed(() => {
  const items = [{ label: 'Home', to: { name: 'home' } }];

  // Build breadcrumbs from route meta or path segments
  if (route.meta.breadcrumbs) {
    items.push(...route.meta.breadcrumbs);
  }

  return items;
});
</script>
```

### VrlTabs

```vue
<template>
  <!-- Basic tabs with v-model -->
  <VrlTabs
    v-model="activeTab"
    :tabs="[
      { key: 'standings', label: 'Standings' },
      { key: 'drivers', label: 'Drivers' },
      { key: 'teams', label: 'Teams' },
      { key: 'results', label: 'Results' },
      { key: 'settings', label: 'Settings', disabled: !isAdmin }
    ]"
    @change="handleTabChange"
  />

  <!-- Tabs with icons -->
  <VrlTabs
    v-model="activeTab"
    :tabs="[
      { key: 'overview', label: 'Overview', icon: 'house' },
      { key: 'analytics', label: 'Analytics', icon: 'chart-line' },
      { key: 'settings', label: 'Settings', icon: 'gear' }
    ]"
  />

  <!-- Minimal variant (no elevated background) -->
  <VrlTabs
    v-model="activeSection"
    :tabs="sections"
    variant="minimal"
  />

  <!-- Custom tab rendering -->
  <VrlTabs v-model="activeTab" :tabs="tabs">
    <template #tab-label="{ tab }">
      <span>{{ tab.label }}</span>
      <VrlBadge v-if="tab.badge" variant="cyan" size="sm">
        {{ tab.badge }}
      </VrlBadge>
    </template>
  </VrlTabs>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import VrlTabs from '@public/components/common/navigation/VrlTabs.vue';
import type { TabItem } from '@public/types/navigation';

const activeTab = ref('standings');
const isAdmin = ref(false);

const handleTabChange = (key: string) => {
  console.log('Tab changed to:', key);
  // Perform side effects (analytics, route change, etc.)
};

const sections: TabItem[] = [
  { key: 'info', label: 'Information' },
  { key: 'stats', label: 'Statistics' },
  { key: 'history', label: 'History' }
];
</script>
```

### VrlNavLink

```vue
<template>
  <!-- In header navigation -->
  <nav class="header-nav">
    <VrlNavLink to={{ name: 'features' }}>Features</VrlNavLink>
    <VrlNavLink to={{ name: 'pricing' }}>Pricing</VrlNavLink>
    <VrlNavLink to={{ name: 'leagues' }}>Browse Leagues</VrlNavLink>
    <VrlNavLink href="https://docs.example.com" external>Docs</VrlNavLink>
  </nav>

  <!-- Active state from router -->
  <VrlNavLink to={{ name: 'about' }} :active="$route.name === 'about'">
    About
  </VrlNavLink>

  <!-- In footer -->
  <div class="footer-links">
    <VrlNavLink to={{ name: 'privacy' }}>Privacy Policy</VrlNavLink>
    <VrlNavLink to={{ name: 'terms' }}>Terms of Service</VrlNavLink>
    <VrlNavLink href="mailto:support@example.com">Contact</VrlNavLink>
  </div>
</template>

<script setup lang="ts">
import VrlNavLink from '@public/components/common/navigation/VrlNavLink.vue';
</script>

<style scoped>
.header-nav {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.footer-links {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
</style>
```

---

## Integration Points

### Vue Router Integration
- **VrlBreadcrumbs**: Use `route.meta.breadcrumbs` for automatic breadcrumb generation
- **VrlTabs**: Can sync with query parameters for shareable URLs
- **VrlNavLink**: Automatic active state via `router-link-active` class

### Layout Integration
- **PublicHeader.vue**: Use `VrlNavLink` for main navigation
- **PublicFooter.vue**: Use `VrlNavLink` for footer links
- **Page Templates**: Use `VrlBreadcrumbs` for hierarchical navigation
- **Content Sections**: Use `VrlTabs` for segmented content views

### State Management
```typescript
// Composable for breadcrumb generation
export function useBreadcrumbs() {
  const route = useRoute();

  const breadcrumbs = computed(() => {
    // Generate from route meta, path, or custom logic
    return buildBreadcrumbsFromRoute(route);
  });

  return { breadcrumbs };
}

// Composable for tab state with URL sync
export function useTabs(defaultTab: string) {
  const route = useRoute();
  const router = useRouter();

  const activeTab = computed({
    get: () => (route.query.tab as string) || defaultTab,
    set: (value) => {
      router.push({ query: { ...route.query, tab: value } });
    }
  });

  return { activeTab };
}
```

---

## Accessibility Requirements

### WCAG 2.1 Level AA Compliance

#### Keyboard Navigation
- **Breadcrumbs**: Standard Tab navigation through links
- **Tabs**: Arrow keys (Left/Right) to navigate, Enter/Space to activate, Home/End for first/last
- **Nav Links**: Standard Tab navigation, Enter to activate

#### Screen Reader Support
- **Breadcrumbs**:
  - `<nav aria-label="Breadcrumb">`
  - `aria-current="page"` on last item
  - Separators hidden with `aria-hidden="true"`
- **Tabs**:
  - `role="tablist"` on container
  - `role="tab"` on each tab
  - `aria-selected="true|false"` for active state
  - `aria-disabled="true"` for disabled tabs
  - Associated tab panels with `aria-labelledby`
- **Nav Links**:
  - `aria-current="page"` when active
  - External links announce new window behavior

#### Focus Indicators
- All interactive elements must have visible focus outline
- Use `:focus-visible` for keyboard-only focus styles
- Maintain sufficient contrast (3:1 minimum for focus indicators)

#### Color Contrast
- Text-secondary on bg-card: Verify ≥4.5:1 ratio
- Cyan on bg-dark (active tab): Verify ≥7:1 ratio
- Hover states must maintain minimum contrast

---

## Testing Strategy

### Unit Tests (Vitest)

#### VrlBreadcrumbs.test.ts
```typescript
describe('VrlBreadcrumbs', () => {
  it('renders all breadcrumb items', () => { /* ... */ });
  it('renders last item as non-clickable', () => { /* ... */ });
  it('supports both href and to props', () => { /* ... */ });
  it('renders custom separator slot', () => { /* ... */ });
  it('applies aria-current to last item', () => { /* ... */ });
  it('warns when more than 5 items provided', () => { /* ... */ });
  it('handles empty items array gracefully', () => { /* ... */ });
});
```

#### VrlTabs.test.ts
```typescript
describe('VrlTabs', () => {
  it('renders all tabs', () => { /* ... */ });
  it('marks active tab with aria-selected', () => { /* ... */ });
  it('emits update:modelValue on tab click', () => { /* ... */ });
  it('prevents interaction with disabled tabs', () => { /* ... */ });
  it('supports keyboard navigation with arrow keys', () => { /* ... */ });
  it('renders custom tab-label slot', () => { /* ... */ });
  it('applies variant class correctly', () => { /* ... */ });
});
```

#### VrlNavLink.test.ts
```typescript
describe('VrlNavLink', () => {
  it('renders as anchor with href', () => { /* ... */ });
  it('renders as RouterLink with to', () => { /* ... */ });
  it('shows animated underline on hover', () => { /* ... */ });
  it('shows persistent underline when active', () => { /* ... */ });
  it('opens external links in new tab', () => { /* ... */ });
  it('applies aria-current when active', () => { /* ... */ });
});
```

### Visual Regression Tests
- Breadcrumbs with 1, 3, 5 items
- Tabs in default and minimal variants
- Nav links in default, hover, and active states
- Dark mode vs light mode rendering

### Accessibility Tests
- Axe-core automated scanning
- Keyboard navigation flow testing
- Screen reader announcement testing (manual)
- Focus indicator visibility testing

---

## Performance Considerations

### Optimization Strategies
1. **Lazy Loading**: Navigation components are lightweight, no lazy loading needed
2. **Event Handlers**: Use passive event listeners where applicable
3. **Animations**: Use CSS transforms (GPU-accelerated) for underline animation
4. **Re-renders**: Memoize computed breadcrumbs to avoid unnecessary recalculations
5. **Accessibility**: Limit number of breadcrumbs/tabs to maintain usability

### Bundle Size Impact
- **VrlBreadcrumbs**: ~1.5KB gzipped
- **VrlTabs**: ~2KB gzipped
- **VrlNavLink**: ~1KB gzipped
- **Total**: ~4.5KB gzipped (minimal impact)

---

## Migration Path

### From Existing Components

#### App Breadcrumbs.vue → VrlBreadcrumbs.vue
```typescript
// Old: resources/app/js/components/common/Breadcrumbs.vue
<Breadcrumbs :items="breadcrumbs" />

// New: resources/public/js/components/common/navigation/VrlBreadcrumbs.vue
<VrlBreadcrumbs :items="breadcrumbs" />
// API is compatible, minimal changes needed
```

### For New Implementations
1. Import components from `@public/components/common/navigation/`
2. Use TypeScript types from `@public/types/navigation`
3. Follow usage examples in this document
4. Ensure accessibility requirements are met

---

## Design Tokens Reference

### Spacing Scale
```css
--spacing-xs: 0.25rem;   /* 4px */
--spacing-sm: 0.5rem;    /* 8px - gap in breadcrumbs, tabs */
--spacing-md: 1rem;      /* 16px - tab horizontal padding */
--spacing-lg: 1.5rem;    /* 24px */
--spacing-xl: 2rem;      /* 32px - nav link spacing */
```

### Typography Scale
```css
--text-xs: 0.75rem;      /* 12px - tab labels */
--text-sm: 0.85rem;      /* 13.6px - breadcrumbs */
--text-base: 0.9rem;     /* 14.4px - nav links */
```

### Border Radius
```css
--radius-sm: 4px;        /* Inner tab radius */
--radius: 8px;           /* Outer tabs container */
```

### Transitions
```css
--transition-fast: 0.15s ease-in-out;
--transition-base: 0.2s ease-in-out;   /* Breadcrumb hover */
--transition-slow: 0.3s ease;          /* Nav link underline */
```

---

## Development Workflow

### Implementation Order
1. **Phase 1**: Create shared types (`navigation.ts`)
2. **Phase 2**: Implement `VrlBreadcrumbItem` and `VrlBreadcrumbs`
3. **Phase 3**: Implement `VrlTab` and `VrlTabs`
4. **Phase 4**: Implement `VrlNavLink`
5. **Phase 5**: Create CSS file (`_navigation.css`)
6. **Phase 6**: Write unit tests for all components
7. **Phase 7**: Integration testing and documentation
8. **Phase 8**: Visual regression testing
9. **Phase 9**: Accessibility audit

### Definition of Done
- [ ] All components implemented with TypeScript
- [ ] All props, emits, and slots documented with TSDoc
- [ ] CSS matches design specifications exactly
- [ ] Unit tests written with >90% coverage
- [ ] Accessibility requirements met (WCAG 2.1 AA)
- [ ] Visual regression tests passing
- [ ] Component usage examples documented
- [ ] Integration with Vue Router tested
- [ ] Keyboard navigation fully functional
- [ ] Screen reader testing completed (manual)
- [ ] Performance benchmarks met (<5KB total gzipped)
- [ ] Dark mode support verified

---

## Future Enhancements

### Potential Features (Post-MVP)
1. **VrlBreadcrumbs**:
   - Collapsed breadcrumb mode (show first, last, and dropdown for middle items)
   - Icon support for breadcrumb items
   - Mobile responsive mode with truncation

2. **VrlTabs**:
   - Vertical tab orientation
   - Tab groups/categories
   - Tab badges for counts/notifications
   - Scrollable tabs with navigation arrows

3. **VrlNavLink**:
   - Multiple underline animation styles (slide-in, fade, grow)
   - Icon support (prefix/suffix)
   - Badge support for notifications

4. **New Components**:
   - `VrlStepper` - Multi-step progress navigation
   - `VrlPagination` - Page number navigation
   - `VrlSideNav` - Sidebar navigation component

---

## Related Documentation

### Design System Docs
- [Typography Plan](./03-typography-plan.md) - Font families, sizes, weights
- [Colors Plan](./02-colors-plan.md) - Color palette and usage
- [Layout Plan](./01-layout-plan.md) - Spacing and grid system
- [Buttons Plan](./05-buttons-plan.md) - Interactive element patterns

### Technical Docs
- [Vue Router Documentation](https://router.vuejs.org/)
- [ARIA Authoring Practices - Breadcrumbs](https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/)
- [ARIA Authoring Practices - Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)

### Internal References
- `/var/www/resources/app/js/components/common/Breadcrumbs.vue` - Existing implementation
- `/var/www/docs/PublicDashboard/design-2026/design-1-velocity/components/index.html` - Design reference

---

## Questions & Decisions

### Open Questions
1. Should breadcrumbs support schema.org structured data for SEO?
2. Should tabs sync with URL query parameters by default or opt-in?
3. Should VrlNavLink have a `pill` variant with background on hover?
4. What's the maximum number of tabs before we recommend a different UI pattern?

### Design Decisions Made
1. **Breadcrumbs**: Use "/" separator by default (configurable via slot)
2. **Tabs**: Default variant has elevated background, minimal variant is transparent
3. **Navigation Links**: Underline animation from left to right (0 to 100% width)
4. **Icons**: Optional in all components, use Phosphor Icons library
5. **Router Integration**: Support both `href` and `to` for maximum flexibility

---

## Implementation Checklist

### Component Files
- [ ] `resources/public/js/types/navigation.ts`
- [ ] `resources/public/js/components/common/navigation/VrlBreadcrumbs.vue`
- [ ] `resources/public/js/components/common/navigation/VrlBreadcrumbItem.vue`
- [ ] `resources/public/js/components/common/navigation/VrlTabs.vue`
- [ ] `resources/public/js/components/common/navigation/VrlTab.vue`
- [ ] `resources/public/js/components/common/navigation/VrlNavLink.vue`

### Styles
- [ ] `resources/public/css/components/_navigation.css`
- [ ] Import in main CSS file

### Tests
- [ ] `VrlBreadcrumbs.test.ts`
- [ ] `VrlTabs.test.ts`
- [ ] `VrlNavLink.test.ts`

### Documentation
- [ ] Component usage examples
- [ ] Accessibility guidelines
- [ ] Integration patterns
- [ ] Migration guide (if replacing existing components)

### Quality Assurance
- [ ] TypeScript type checking passing
- [ ] All unit tests passing
- [ ] Visual regression tests passing
- [ ] Accessibility audit completed
- [ ] Performance benchmarks met
- [ ] Code review completed
- [ ] Design review completed

---

**Document Version**: 1.0
**Last Updated**: 2026-01-18
**Status**: Planning Complete - Ready for Implementation
