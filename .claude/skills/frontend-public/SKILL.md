---
name: frontend-public
description: Specialized frontend development for the public dashboard (resources/public) using Vue 3, TypeScript, and the Motorsport Editorial design system. Automatically invokes the dev-fe-public agent for comprehensive Vue expertise.
allowed-tools: Bash, Glob, Grep, Read, Edit, MultiEdit, Write, WebFetch, WebSearch, TodoWrite, Task, mcp__context7__resolve-library-id, mcp__context7__get-library-docs
---

# Public Dashboard Development Skill

This skill activates specialized public dashboard development mode using the `dev-fe-public` agent.

## Automatic Agent Invocation

When this skill is activated, **immediately invoke the dev-fe-public agent** using the Task tool:

```
Task(subagent_type: "dev-fe-public", prompt: "[user's request]")
```

The dev-fe-public agent is an elite Vue.js architect with expertise in:
- Vue 3 Composition API with `<script setup lang="ts">`
- TypeScript (strict mode)
- Custom VRL component library (Motorsport Editorial design system)
- Pinia state management
- Vue Router 4
- Vitest testing
- Tailwind CSS 4
- Phosphor Icons

## Working Directory

**Primary Focus**: `resources/public/`

All public dashboard development happens in this directory. Do not work outside without explicit permission.

## Import Alias

Always use `@public/` for imports within the public application:

```typescript
import MyComponent from '@public/components/MyComponent.vue';
import { useAuthStore } from '@public/stores/authStore';
import type { PublicLeague } from '@public/types/public';
```

## Subdomain Architecture

- **Subdomain**: `{DOMAIN}` (e.g., `virtualracingleagues.localhost`)
- **Blade Template**: `resources/views/public.blade.php`
- **Separate Application**: Completely independent from app and admin apps
- **Authentication**: Public-facing site with login/register flows
- **Post-Auth**: Redirects authenticated users to user dashboard (`app.{DOMAIN}`)

---

# VRL Public Dashboard - Design System

## Design Philosophy: "Motorsport Editorial"

The public dashboard uses a **Motorsport Editorial** design aesthetic that combines racing heritage with editorial clarity:

- **Premium racing aesthetic** - Carbon black backgrounds, championship gold accents, safety orange CTAs
- **Editorial typography** - Three-font system: Racing Sans One (display), Source Serif 4 (body), JetBrains Mono (data)
- **Data-driven UI** - Optimized for displaying standings, times, and statistics
- **Dark/light theme support** - Full theme system using CSS custom properties
- **Racing-inspired accents** - Angled clip-paths, racing stripes, checkered patterns

---

## Color System

### Theme Architecture

The design system uses **CSS custom properties** for theme switching. Both dark and light modes are fully supported.

**Theme Variable Pattern:**
```css
/* CSS Variables (defined in app.css) */
--bg-primary         /* Main background */
--bg-secondary       /* Cards, surfaces */
--bg-tertiary        /* Elevated surfaces */
--bg-elevated        /* Highest elevation */
--text-primary       /* Headings, important text */
--text-secondary     /* Body text */
--text-muted         /* Supporting text */
--text-dim           /* Labels, captions */
--accent-gold        /* Primary accent */
--accent-safety      /* CTA accent (orange) */
--border-primary     /* Standard borders */
--border-subtle      /* Subtle dividers */
```

### Color Palette - Dark Theme (Default)

| Name | Hex | CSS Variable | Tailwind Class | Usage |
|------|-----|--------------|----------------|-------|
| **Backgrounds** |
| Carbon | `#0a0a0a` | `--bg-primary` | `bg-racing-carbon` | Primary background |
| Asphalt | `#1a1a1a` | `--bg-secondary` | `bg-racing-asphalt` | Cards, secondary surfaces |
| Tarmac | `#2d2d2d` | `--bg-tertiary` | `bg-racing-tarmac` | Tertiary surfaces, inputs |
| Pit Lane | `#3d3d3d` | `--bg-elevated` | `bg-racing-pit-lane` | Elevated elements |
| **Accents** |
| Championship Gold | `#d4a853` | `--accent-gold` | `text-racing-gold` | Primary accent, highlights |
| Gold Bright | `#f5c866` | `--accent-gold-bright` | `text-racing-gold-bright` | Hover states |
| Gold Muted | `#a08040` | `--accent-gold-muted` | `text-racing-gold-muted` | Subtle accents |
| Safety Orange | `#ff6b35` | `--accent-safety` | `bg-racing-safety` | Primary CTAs |
| Safety Bright | `#ff8a5c` | `--accent-safety-bright` | `bg-racing-safety-bright` | Hover states |
| **Text** |
| Pit White | `#fafafa` | `--text-primary` | `theme-text-primary` | Headings, primary text |
| Concrete | `#e5e5e5` | `--text-secondary` | `theme-text-secondary` | Body text |
| Barrier | `#9ca3af` | `--text-muted` | `theme-text-muted` | Supporting text |
| Gravel | `#6b7280` | `--text-dim` | `theme-text-dim` | Labels, captions |

### Color Palette - Light Theme

| Name | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Paper | `#f8f7f4` | `--bg-primary` | Primary background |
| White | `#ffffff` | `--bg-secondary` | Cards |
| Warm Gray | `#f0efe8` | `--bg-tertiary` | Tertiary surfaces |
| Muted | `#e8e6df` | `--bg-elevated` | Elevated elements |
| Carbon | `#0a0a0a` | `--text-primary` | Primary text |
| Asphalt | `#1a1a1a` | `--text-secondary` | Body text |

### Semantic Colors

| Name | Hex | Tailwind Class | Usage |
|------|-----|----------------|-------|
| Success | `#22c55e` | `text-racing-success` | Success states |
| Warning | `#f59e0b` | `text-racing-warning` | Warnings |
| Danger | `#ef4444` | `text-racing-danger` | Errors, destructive actions |
| Info | `#3b82f6` | `text-racing-info` | Information |

### Position Colors (Racing)

| Position | Hex | Tailwind Class | Usage |
|----------|-----|----------------|-------|
| 1st (Pole) | `#d4a853` | `text-racing-pole` | First place |
| 2nd (Silver) | `#c0c0c0` | `text-racing-podium-2` | Second place |
| 3rd (Bronze) | `#cd7f32` | `text-racing-podium-3` | Third place |
| Fastest Lap | `#a855f7` | `text-racing-fastest-lap` | Fastest lap indicator |
| DNF | `#ef4444` | `text-racing-dnf` | Did Not Finish |
| DNS | `#6b7280` | `text-racing-dns` | Did Not Start |

---

## Typography System

### Font Families

```css
--font-display: 'Racing Sans One', cursive;    /* Headings, navigation, UI labels */
--font-body: 'Source Serif 4', Georgia, serif; /* Body text, descriptions */
--font-data: 'JetBrains Mono', monospace;      /* Statistics, times, data */
```

**Font Loading** (already included in `app.css`):
```css
@import url('https://fonts.googleapis.com/css2?family=Racing+Sans+One&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;0,8..60,600;0,8..60,700;1,8..60,400&family=JetBrains+Mono:wght@400;500;600&display=swap');
```

### Typography Scale

| Type | Class | Font | Size | Transform | Usage |
|------|-------|------|------|-----------|-------|
| Hero Title | `font-display text-5xl uppercase tracking-wide` | Racing Sans One | 3rem | Uppercase | Landing page hero |
| Section Title | `font-display text-3xl uppercase tracking-wide` | Racing Sans One | 1.875rem | Uppercase | Section headings |
| Card Title | `font-display text-lg uppercase tracking-wide` | Racing Sans One | 1.125rem | Uppercase | Card headers |
| Body Large | `font-body text-lg leading-relaxed` | Source Serif 4 | 1.125rem | None | Paragraphs |
| Body | `font-body text-base` | Source Serif 4 | 1rem | None | Secondary text |
| Data Large | `font-data text-3xl font-semibold` | JetBrains Mono | 1.875rem | None | Large stats |
| Data | `font-data text-sm` | JetBrains Mono | 0.875rem | None | Table data |
| Label | `font-display text-xs uppercase tracking-[0.15em]` | Racing Sans One | 0.75rem | Uppercase | UI labels |
| Caption | `font-data text-[10px] uppercase tracking-wider` | JetBrains Mono | 10px | Uppercase | Metadata |

### Typography Guidelines

1. **Display Font (Racing Sans One):**
   - Always uppercase
   - Use for all headings, navigation, buttons, and UI labels
   - Include `tracking-wide` or `tracking-[0.15em]` for proper spacing

2. **Body Font (Source Serif 4):**
   - Use for editorial content, descriptions, and paragraphs
   - Provides readable, premium feel
   - Use `leading-relaxed` for better readability

3. **Data Font (JetBrains Mono):**
   - All numerical data: lap times, points, statistics
   - Metadata: timestamps, counts, IDs
   - Features tabular numbers with `font-feature-settings: 'tnum' 1`

---

## Spacing & Layout

### Spacing Scale

```css
--space-xs: 0.25rem;   /* 4px */
--space-sm: 0.5rem;    /* 8px */
--space-md: 1rem;      /* 16px */
--space-lg: 1.5rem;    /* 24px */
--space-xl: 2rem;      /* 32px */
--space-2xl: 3rem;     /* 48px */
--space-3xl: 4rem;     /* 64px */
--space-4xl: 6rem;     /* 96px */
```

### Container System

```css
--max-width: 1400px;
--header-height: 80px;  /* 60px when scrolled */
```

**Container class:**
```html
<div class="container-racing">
  <!-- Max width 1400px, auto margins, responsive padding -->
</div>
```

### Common Layout Patterns

**Stats Grid:**
```html
<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
```

**Card Grid:**
```html
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
```

**Section Padding:**
```html
<section class="section-padding">
  <!-- Vertical padding: 3rem (48px) -->
</section>
```

---

## Component Library

### VRL Components (Custom)

The public dashboard has its own custom component library. **Do NOT use PrimeVue components** - use the VRL components instead.

#### Location
All components are in `/var/www/resources/public/js/components/common/`

#### Component Categories

**Buttons:**
- `VrlButton` - Primary button component with variants (primary, secondary, ghost, text, danger, danger-outline, social)
- `VrlIconButton` - Icon-only buttons

**Forms:**
- `VrlInput` - Text input with label and validation
- `VrlTextarea` - Multi-line text input
- `VrlSelect` - Dropdown select
- `VrlCheckbox` - Checkbox input
- `VrlRadio` - Radio button
- `VrlToggle` - Toggle switch
- `VrlSearchBar` - Search input with icon
- `VrlFilterChips` - Filter chips/tags

**Cards:**
- `VrlCard` - Versatile card component (variants: default, league, stats, feature)
- `VrlLeagueCard` - League-specific card with header image
- `VrlStatsCard` - Statistics display card

**Typography:**
- `VrlHeading` - Heading component with levels and variants
- `VrlLabel` - Label component for forms and UI

**Badges:**
- `VrlBadge` - Status badges and tags

**Navigation:**
- `VrlTabs` - Tab navigation
- `VrlBreadcrumbs` - Breadcrumb navigation

**Data Display:**
- `VrlTable` - Data table component
- `VrlStandingsTable` - Racing standings table
- `VrlPagination` - Pagination controls

**Overlays:**
- `VrlModal` - Modal dialog (sizes: sm, md, lg, xl, full)
- `VrlDialog` - Alert/confirmation dialog
- `VrlDrawer` - Side drawer panel
- `VrlToast` - Toast notification

**Layout:**
- `PublicHeader` - Main navigation header
- `PublicFooter` - Footer component
- `PageHeader` - Page title with breadcrumbs

### VrlButton Usage

```vue
<script setup lang="ts">
import VrlButton from '@public/components/common/buttons/VrlButton.vue';
</script>

<template>
  <!-- Primary CTA -->
  <VrlButton variant="primary" size="lg" @click="handleClick">
    Get Started Free
  </VrlButton>

  <!-- Secondary outline -->
  <VrlButton variant="secondary" size="md" icon="plus" icon-pos="left">
    Browse Leagues
  </VrlButton>

  <!-- Ghost button -->
  <VrlButton variant="ghost" size="sm">
    Cancel
  </VrlButton>

  <!-- Loading state -->
  <VrlButton variant="primary" :loading="isLoading">
    Submit
  </VrlButton>

  <!-- Danger button -->
  <VrlButton variant="danger" icon="trash" @click="handleDelete">
    Delete
  </VrlButton>
</template>
```

**Available Variants:**
- `primary` - Safety orange with angled clip-path (default)
- `secondary` - Gold outline with angled edge
- `ghost` - Transparent with hover effect
- `text` - Minimal text-only
- `danger` - Red for destructive actions
- `danger-outline` - Red outline variant
- `social` - For social media links

**Available Sizes:**
- `xs` - 28px height
- `sm` - 34px height
- `md` - 40px height (default)
- `lg` - 48px height
- `xl` - 56px height

**Available Icons:**
- `plus`, `eye`, `trash`, `dots-three`, `pencil-simple`, `gear`, `share-network`, `x`, `star`, `discord-logo`, `twitter-logo`, `youtube-logo`

### VrlInput Usage

```vue
<script setup lang="ts">
import VrlInput from '@public/components/common/forms/VrlInput.vue';
import { ref } from 'vue';

const email = ref('');
const emailError = ref(false);
</script>

<template>
  <VrlInput
    v-model="email"
    type="email"
    label="Email Address"
    placeholder="Enter your email"
    size="md"
    :required="true"
    :invalid="emailError"
    error-message="Email is required"
  />
</template>
```

**Supported Types:**
- `text`, `email`, `password`, `number`, `tel`, `url`

**Sizes:**
- `sm` - 32px height
- `md` - 40px height (default)
- `lg` - 48px height

### VrlCard Usage

```vue
<script setup lang="ts">
import VrlCard from '@public/components/common/cards/VrlCard.vue';
</script>

<template>
  <!-- Basic card -->
  <VrlCard variant="default">
    <p>Card content</p>
  </VrlCard>

  <!-- Card with header and footer -->
  <VrlCard variant="default">
    <template #header>
      <h3>Card Title</h3>
    </template>
    <p>Card body content</p>
    <template #footer>
      <VrlButton>Action</VrlButton>
    </template>
  </VrlCard>

  <!-- Feature card with icon -->
  <VrlCard variant="feature">
    <template #icon>
      <PhTrophy :size="24" weight="duotone" class="text-racing-gold" />
    </template>
    <h4>Feature Title</h4>
    <p>Feature description</p>
  </VrlCard>

  <!-- Stats card with gradient border -->
  <VrlCard variant="stats">
    <VrlStatsCard label="Total Races" value="42" />
  </VrlCard>
</template>
```

**Variants:**
- `default` - Standard card
- `league` - League header image optimized
- `stats` - Gradient border effect
- `feature` - Animated top border on hover with icon support

### VrlModal Usage

```vue
<script setup lang="ts">
import VrlModal from '@public/components/common/overlays/modals/VrlModal.vue';
import VrlButton from '@public/components/common/buttons/VrlButton.vue';
import { ref } from 'vue';

const showModal = ref(false);
</script>

<template>
  <VrlButton @click="showModal = true">Open Modal</VrlButton>

  <VrlModal
    v-model="showModal"
    title="Modal Title"
    size="md"
    :closable="true"
    :close-on-escape="true"
  >
    <p>Modal content goes here</p>

    <template #footer>
      <VrlButton variant="ghost" @click="showModal = false">Cancel</VrlButton>
      <VrlButton variant="primary" @click="handleSubmit">Submit</VrlButton>
    </template>
  </VrlModal>
</template>
```

**Sizes:**
- `sm` - 400px
- `md` - 500px (default)
- `lg` - 700px
- `xl` - 900px
- `full` - calc(100vw - 2rem)

---

## Racing-Specific UI Patterns

### Clip-Path Shapes (Angled Edges)

**Primary button (right angle):**
```css
clip-path: polygon(0 0, 100% 0, 95% 100%, 0% 100%);
```

**Secondary button (left angle):**
```css
clip-path: polygon(5% 0, 100% 0, 100% 100%, 0% 100%);
```

**Icon button (both angles):**
```css
clip-path: polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%);
```

### Racing Stripe

Vertical gradient accent on card/section left edge:

```html
<div class="racing-stripe relative">
  <!-- Content -->
</div>
```

```css
.racing-stripe::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, var(--accent-gold) 0%, var(--accent-safety) 100%);
}
```

### Checkered Pattern

Racing flag pattern:

```html
<div class="pattern-checkered opacity-10 absolute inset-0"></div>
```

### Glass Effect

Frosted glass for navigation:

```html
<header class="nav-racing glass">
  <!-- Navigation content -->
</header>
```

```css
.glass {
  background: var(--bg-glass);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
```

### Button Shine Effect

Hover sweep animation for primary buttons:

```html
<button class="btn btn-primary btn-shine">
  Get Started
</button>
```

CSS already defined in `app.css` for `.btn-shine`.

---

## Theme System

### Theme Switching with `useTheme()`

```typescript
import { useTheme } from '@public/composables/useTheme';

const { theme, toggleTheme, setTheme } = useTheme();

// Current theme: 'dark' | 'light'
console.log(theme.value);

// Toggle between dark/light
toggleTheme();

// Set specific theme
setTheme('light');
```

**Features:**
- Persists to localStorage (`vrl-theme`)
- Respects system preference on first visit
- Applies `data-theme` attribute to `<html>`
- Adds `.dark` class for PrimeVue compatibility (not used in public dashboard)

### Using Theme Variables in Components

**Always use CSS variables** for colors:

```vue
<style scoped>
.my-component {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}

.my-component:hover {
  background: var(--bg-hover);
  border-color: var(--border-hover);
}
</style>
```

**Or use theme utility classes:**

```html
<div class="theme-bg-secondary theme-text-primary theme-border">
  Content
</div>
```

---

## Icons - Phosphor Icons

The design system uses **Phosphor Icons Vue** (imported via `@phosphor-icons/vue`).

### Common Usage

```vue
<script setup lang="ts">
import {
  PhFlag,
  PhUsers,
  PhTimer,
  PhTrophy,
  PhStar,
  PhGear,
  PhPlus,
  PhX,
  PhCaretRight,
  PhFlagCheckered,
  PhWarning
} from '@phosphor-icons/vue';
</script>

<template>
  <!-- Basic icon -->
  <PhFlag :size="24" />

  <!-- Icon with weight -->
  <PhTrophy :size="32" weight="fill" />

  <!-- Icon with color -->
  <PhStar :size="20" weight="bold" class="text-racing-gold" />

  <!-- Duotone for illustrations -->
  <PhFlagCheckered :size="48" weight="duotone" class="text-racing-gold" />
</template>
```

### Icon Weights

- `regular` - Default
- `bold` - Buttons, emphasis
- `fill` - Active states, indicators
- `duotone` - Feature illustrations, larger icons

### Common Icons

| Icon | Usage |
|------|-------|
| `PhFlagCheckered` | Competitions, racing |
| `PhUsers` | Drivers, teams |
| `PhTimer` | Lap times |
| `PhTrophy` | Championships |
| `PhStar` | Featured, favorites |
| `PhGear` | Settings |
| `PhPlus` | Add actions |
| `PhX` | Close, remove |
| `PhCaretRight`, `PhCaretLeft` | Navigation |

---

## Composables

### Available Composables

**`useTheme()`** - Theme management
```typescript
import { useTheme } from '@public/composables/useTheme';
const { theme, toggleTheme, setTheme } = useTheme();
```

**`useToast()`** - Toast notifications
```typescript
import { useToast } from '@public/composables/useToast';
const toast = useToast();

toast.success('League created successfully!');
toast.error('Failed to save changes');
toast.warning('This action cannot be undone');
toast.info('New feature available');
```

**`usePublicLeagues()`** - Public leagues data fetching
```typescript
import { usePublicLeagues } from '@public/composables/usePublicLeagues';
const { leagues, isLoading, error, fetchLeagues } = usePublicLeagues();
```

---

## Routing

### Routes

The public dashboard includes the following routes:

- `/` - Home (landing page)
- `/login` - Login view
- `/register` - Registration view
- `/forgot-password` - Forgot password view
- `/reset-password` - Reset password view
- `/verify-email` - Email verification view
- `/verify-email-result` - Email verification result
- `/leagues` - Public leagues listing
- `/leagues/:slug` - League detail view
- `/leagues/:slug/seasons/:seasonSlug` - Season detail view
- `/component-demo` - Component demo (development only)

### Navigation Guard Behavior

**Authenticated users** accessing auth routes (`/login`, `/register`, etc.) are automatically redirected to the user dashboard (`app.{DOMAIN}`).

**Page titles** are automatically set based on route meta.

**Logout redirects** from the user dashboard include `?logout=1` query parameter and clear auth state.

---

## State Management

### Pinia Stores

**Auth Store** - `@public/stores/authStore.ts`

```typescript
import { useAuthStore } from '@public/stores/authStore';

const authStore = useAuthStore();

// State
authStore.isAuthenticated  // boolean
authStore.user            // User object or null
authStore.userName        // string or null

// Actions
await authStore.login({ email, password, remember });
await authStore.logout();
authStore.clearAuth();
```

**Note:** Auth store is persisted to localStorage and shared across instances.

---

## Development Workflows

### 1. Adding a New View

```bash
# 1. Create view file
# /var/www/resources/public/js/views/MyView.vue

# 2. Add route
# /var/www/resources/public/js/router/index.ts

# 3. Create test
# /var/www/resources/public/js/views/__tests__/MyView.test.ts
```

**Example View:**
```vue
<script setup lang="ts">
import VrlButton from '@public/components/common/buttons/VrlButton.vue';
import VrlHeading from '@public/components/common/typography/VrlHeading.vue';
</script>

<template>
  <div class="min-h-screen pattern-carbon">
    <div class="container-racing section-padding">
      <VrlHeading :level="1" variant="hero">
        Page Title
      </VrlHeading>

      <p class="font-body text-lg theme-text-secondary mt-4">
        Page description
      </p>

      <VrlButton variant="primary" size="lg" class="mt-8">
        Call to Action
      </VrlButton>
    </div>
  </div>
</template>
```

### 2. Adding a Custom Component

```bash
# 1. Create component
# /var/www/resources/public/js/components/common/[category]/MyComponent.vue

# 2. Add TypeScript types in component
# 3. Create test
# /var/www/resources/public/js/components/common/[category]/__tests__/MyComponent.test.ts
```

**Component Template:**
```vue
<script setup lang="ts">
/**
 * MyComponent - Brief description
 *
 * @component
 * @example
 * ```vue
 * <MyComponent prop1="value" @event="handler" />
 * ```
 */
import { computed } from 'vue';

interface Props {
  /** Prop description */
  prop1: string;
  /** Optional prop */
  prop2?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  prop2: false,
});

const emit = defineEmits<{
  event: [value: string];
}>();
</script>

<template>
  <div class="my-component">
    <!-- Component markup -->
  </div>
</template>

<style scoped>
.my-component {
  background: var(--bg-secondary);
  color: var(--text-primary);
}
</style>
```

### 3. Adding a Composable

```typescript
// /var/www/resources/public/js/composables/useMyFeature.ts
import { ref, computed } from 'vue';

export function useMyFeature() {
  const state = ref(false);

  const toggle = () => {
    state.value = !state.value;
  };

  const isActive = computed(() => state.value);

  return {
    state,
    isActive,
    toggle,
  };
}
```

---

## Quality Gates (MANDATORY Before Completion)

Before marking any task as complete, ALL of the following must pass 100%:

### 1. TypeScript Checks
```bash
npm run type-check
```
No TypeScript errors allowed.

### 2. Vitest Tests
```bash
npm run test:public
```
All tests must pass. Create tests for all new components, composables, and views.

### 3. ESLint
```bash
npm run lint:public
```
ESLint must pass with no errors.

### 4. Prettier
```bash
npm run format:public
```
Code must be properly formatted.

### Run All Checks
```bash
npm run type-check && npm run lint:public && npm run format:public && npm run test:public
```

---

## Best Practices

### Component Development

1. **Keep Components Focused** - Under 200-300 lines
2. **Extract Logic to Composables** - Don't bloat components
3. **Use TypeScript Strictly** - Full type safety everywhere
4. **Write Tests First** - TDD when possible
5. **Document Props/Emits** - JSDoc comments for complex components
6. **Use VRL Components** - Don't reinvent wheels, use existing components

### Styling

1. **Always Use CSS Variables** - For theme switching support
2. **Prefer Utility Classes** - Use Tailwind when possible
3. **Scoped Styles Only When Necessary** - Keep styles minimal
4. **Use Theme Utilities** - `theme-bg-primary`, `theme-text-primary`, etc.
5. **Racing Sans One = Uppercase** - Always uppercase display font
6. **Maintain Font Hierarchy** - Display for UI, Body for content, Data for numbers

### Accessibility

1. **ARIA Labels** - All icon-only buttons need `aria-label`
2. **Keyboard Navigation** - All interactive elements accessible via keyboard
3. **Focus States** - Visible focus indicators (gold accent)
4. **Semantic HTML** - Use correct heading levels, lists, etc.
5. **Color Contrast** - Both themes maintain WCAG AA contrast ratios
6. **Touch Targets** - Minimum 44x44px for mobile

### Performance

1. **Lazy Loading** - Use dynamic imports for large views
2. **Optimize Images** - Use appropriate formats and sizes
3. **Minimize Watchers** - Use computed properties when possible
4. **Cleanup Side Effects** - Always cleanup in `onUnmounted`

---

## Common Patterns

### Landing Page Hero

```vue
<template>
  <section class="hero gradient-hero">
    <div class="hero-background">
      <div class="pattern-stripes absolute inset-0 opacity-50"></div>
      <div class="racing-line"></div>
    </div>

    <div class="container-racing">
      <div class="hero-content animate-fade-in-up">
        <div class="hero-tagline">
          <span>Feature Tagline</span>
        </div>

        <VrlHeading :level="1" variant="hero" class="hero-title">
          Main Title
          <span class="highlight">Accent Text</span>
        </VrlHeading>

        <p class="hero-description">
          Supporting description text
        </p>

        <div class="hero-cta">
          <VrlButton variant="primary" size="lg">Primary CTA</VrlButton>
          <VrlButton variant="secondary" size="lg">Secondary CTA</VrlButton>
        </div>
      </div>
    </div>
  </section>
</template>
```

### Section with Feature Grid

```vue
<template>
  <section class="section-padding pattern-carbon">
    <div class="container-racing">
      <div class="section-header">
        <VrlLabel class="section-label">Section Label</VrlLabel>
        <VrlHeading :level="2" variant="section" class="section-title">
          Section Title
        </VrlHeading>
      </div>

      <div class="feature-grid">
        <VrlCard variant="feature" class="p-4 sm:p-6">
          <template #icon>
            <PhFlag :size="26" weight="duotone" class="text-racing-gold" />
          </template>
          <VrlHeading :level="3" variant="card">Feature Title</VrlHeading>
          <p class="feature-description">Feature description</p>
        </VrlCard>
        <!-- More cards -->
      </div>
    </div>
  </section>
</template>

<style scoped>
.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-lg);
}

.feature-description {
  font-size: 0.875rem;
  color: var(--text-muted);
  line-height: 1.6;
}
</style>
```

### Authentication Form

```vue
<template>
  <div class="min-h-screen flex items-center justify-center pattern-carbon p-4 md:p-8">
    <div class="w-full max-w-md">
      <div class="card-racing p-8 md:p-10">
        <div class="text-center mb-8">
          <h1 class="font-display text-3xl md:text-4xl mb-3 text-racing-gold uppercase tracking-wider">
            Form Title
          </h1>
          <p class="font-body theme-text-muted">Subtitle</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <VrlInput
            v-model="email"
            type="email"
            label="Email Address"
            placeholder="Enter email"
            :required="true"
            :invalid="!!emailError"
            :error-message="emailError"
          />

          <VrlInput
            v-model="password"
            type="password"
            label="Password"
            placeholder="Enter password"
            :required="true"
            :invalid="!!passwordError"
            :error-message="passwordError"
          />

          <VrlButton type="submit" variant="primary" size="md" class="w-full">
            Submit
          </VrlButton>
        </form>
      </div>
    </div>
  </div>
</template>
```

---

## File Structure

```
resources/public/
├── css/
│   └── app.css                    # Main stylesheet with design system
├── js/
│   ├── app.ts                     # Entry point
│   ├── router/
│   │   └── index.ts               # Vue Router configuration
│   ├── stores/
│   │   └── authStore.ts           # Pinia auth store
│   ├── views/
│   │   ├── HomeView.vue           # Landing page
│   │   ├── ComponentDemoView.vue  # Component demo
│   │   ├── auth/                  # Authentication views
│   │   │   ├── LoginView.vue
│   │   │   ├── RegisterView.vue
│   │   │   ├── ForgotPasswordView.vue
│   │   │   └── ResetPasswordView.vue
│   │   └── leagues/               # Public leagues views
│   │       ├── PublicLeaguesView.vue
│   │       ├── LeagueDetailView.vue
│   │       └── SeasonView.vue
│   ├── components/
│   │   ├── App.vue                # Root component
│   │   ├── layout/
│   │   │   ├── PublicHeader.vue   # Header/navigation
│   │   │   └── PublicFooter.vue   # Footer
│   │   └── common/                # Reusable components
│   │       ├── buttons/
│   │       │   ├── VrlButton.vue
│   │       │   └── VrlIconButton.vue
│   │       ├── forms/
│   │       │   ├── VrlInput.vue
│   │       │   ├── VrlTextarea.vue
│   │       │   ├── VrlSelect.vue
│   │       │   ├── VrlCheckbox.vue
│   │       │   ├── VrlRadio.vue
│   │       │   ├── VrlToggle.vue
│   │       │   ├── VrlSearchBar.vue
│   │       │   └── VrlFilterChips.vue
│   │       ├── cards/
│   │       │   ├── VrlCard.vue
│   │       │   ├── VrlLeagueCard.vue
│   │       │   └── VrlStatsCard.vue
│   │       ├── typography/
│   │       │   ├── VrlHeading.vue
│   │       │   └── VrlLabel.vue
│   │       ├── badges/
│   │       │   └── VrlBadge.vue
│   │       ├── navigation/
│   │       │   ├── VrlTabs.vue
│   │       │   └── VrlBreadcrumbs.vue
│   │       ├── data-display/
│   │       │   ├── VrlTable.vue
│   │       │   ├── VrlStandingsTable.vue
│   │       │   └── VrlPagination.vue
│   │       └── overlays/
│   │           ├── modals/
│   │           │   ├── VrlModal.vue
│   │           │   └── modalState.ts
│   │           ├── dialogs/
│   │           │   └── VrlDialog.vue
│   │           ├── drawers/
│   │           │   └── VrlDrawer.vue
│   │           └── toasts/
│   │               └── VrlToast.vue
│   ├── composables/
│   │   ├── useTheme.ts            # Theme management
│   │   ├── useToast.ts            # Toast notifications
│   │   └── usePublicLeagues.ts    # Public leagues data
│   └── types/
│       ├── auth.ts                # Auth types
│       ├── user.ts                # User types
│       ├── public.ts              # Public league types
│       └── errors.ts              # Error handling types
```

---

## Design System Reference Files

- **Main CSS**: `/var/www/resources/public/css/app.css` - Complete design system with theme variables
- **Component Demo**: `/var/www/resources/public/js/views/ComponentDemoView.vue` - Live component examples
- **Interactive Reference**: `.claude/guides/design/app-public/component-library.html` - Visual component library

---

## Remember

- This is a **separate Vue application** from the app and admin dashboards
- Components are **NOT shared** between applications
- Each app has its **own Pinia instance**
- Use the `dev-fe-public` agent for all Vue/TypeScript work
- **Never compromise on quality gates** - all checks must pass 100%
- This is the **public-facing** marketing/auth site, not the user dashboard
- **Do NOT use PrimeVue** - use the custom VRL component library
- Always use **CSS custom properties** for colors to support theme switching
- **Racing Sans One = Uppercase** for all display text
- Minimum **44x44px touch targets** for accessibility

---

*Last updated: December 2024*
