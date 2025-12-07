---
name: frontend-public
description: Specialized frontend development for the app and public dashboards (resources/app and rssources/public) using Vue 3, TypeScript, PrimeVue, and Pinia. Automatically invokes the dev-fe-app or dev-fe-public agent for comprehensive Vue expertise.
allowed-tools: Bash, Glob, Grep, Read, Edit, MultiEdit, Write, WebFetch, WebSearch, TodoWrite, Task, mcp__context7__resolve-library-id, mcp__context7__get-library-docs
---

# User Dashboard Development Skill

This skill activates specialized user dashboard development mode using the `dev-fe-public` agent.

## Automatic Agent Invocation

When this skill is activated, **immediately invoke the dev-fe-app or dev-fe-public agent** using the Task tool, depending on the working directory:

```
Task(subagent_type: "dev-fe-app", prompt: "[user's request]")
```

The dev-fe-app agent is an elite Vue.js architect with expertise in:
- Vue 3 Composition API with `<script setup lang="ts">`
- TypeScript (strict mode)
- PrimeVue 4 components
- Pinia state management
- Vue Router 4
- Vitest testing
- Tailwind CSS 4

## Working Directory

**Primary Focus**: `resources/public/`

All user dashboard development happens in this directory. Do not work outside without explicit permission.

## Import Alias

Always use `@public/` for imports within the user application:

```typescript
import MyComponent from '@public/components/MyComponent.vue';
import { useAuthStore } from '@public/stores/auth';
import type { User } from '@public/types/user';
```

## Subdomain Architecture

- **Subdomain**: `public.{PUBLIC_DOMAIN}` (e.g., `public.virtualracingleagues.localhost`)
- **Blade Template**: `resources/views/public.blade.php`
- **Separate Application**: Completely independent from app and admin apps
- **Authentication**: All routes require authentication (users redirected to public site if not logged in)

## Key Development Workflows

### 1. Adding a New View
1. Create view in `resources/public/js/views/`
2. Add route in `resources/public/js/router/index.ts` with `requiresAuth: true` meta
3. Create tests in `resources/public/js/views/__tests__/`
4. Use PrimeVue components for UI

### 2. Adding a Component
1. Create in `resources/public/js/components/`
2. Use Composition API with `<script setup lang="ts">`
3. Add props/emits with TypeScript types
4. Create Vitest tests

### 3. Adding a Composable
1. Create in `resources/public/js/composables/`
2. Prefix with `use` (e.g., `useUserProfile.ts`)
3. Return reactive refs and methods
4. Write unit tests

### 4. Adding API Integration
1. Create service in `resources/public/js/services/`
2. Use axios with TypeScript types
3. Handle errors with toast notifications
4. Update Pinia store if needed

## PrimeVue Integration

Always use **PrimeVue 4** (latest version). For documentation, use Context7 MCP tools:

```typescript
// Resolve library
mcp__context7__resolve-library-id(libraryName: "primevue")

// Get docs for specific component
mcp__context7__get-library-docs(
  context7CompatibleLibraryID: "/primefaces/primevue",
  topic: "DataTable"
)
```

Common components:
- Forms: `InputText`, `Dropdown`, `Calendar`, `Checkbox`, `InputSwitch`
- Data: `DataTable`, `DataView`, `Timeline`
- Overlays: `Dialog`, `Sidebar`, `Toast`, `ConfirmDialog`
- Navigation: `Menu`, `Menubar`, `Breadcrumb`, `TabView`
- Buttons: `Button`, `SplitButton`

## Quality Gates (MANDATORY Before Completion)

Before marking any task as complete, ALL of the following must pass 100%:

### 1. Vitest Tests
```bash
npm run test:public
```
All tests must pass. Create tests for all new components, composables, and views.

### 2. TypeScript Checks
```bash
npm run type-check
```
No TypeScript errors allowed.

### 3. Linting
```bash
npm run lint:public
```
ESLint must pass with no errors.

### 4. Formatting
```bash
npm run format:public
```
Code must be properly formatted with Prettier.

### Run All Checks
```bash
npm run type-check && npm run lint:public && npm run format:public && npm run test:public
```

## Essential Guides

Refer to these comprehensive guides for detailed patterns and examples:

- **[PrimeVue Usage Guide](./.claude/guides/design/app-public/primevue-usage.md)** - Local PrimeVue reference

## Development Commands

```bash
# Development
npm run dev                    # Start Vite dev server with HMR

# Testing
npm run test:public              # Run user dashboard tests
npm run test:public -- --ui      # Run with Vitest UI
npm run test:public -- --coverage  # Generate coverage report

# Quality Checks
npm run type-check            # TypeScript type checking
npm run lint:public              # ESLint
npm run lint:public -- --fix     # Auto-fix linting issues
npm run format:public            # Prettier formatting

# Build
npm run build                 # Production build (runs type-check + vite build)
```

## Best Practices

1. **Keep Components Focused**: Under 200-300 lines
2. **Extract Logic to Composables**: Don't bloat components
3. **Use TypeScript Strictly**: Full type safety everywhere
4. **Write Tests First**: TDD when possible
5. **Accessibility Matters**: ARIA labels, keyboard navigation, screen readers
6. **Responsive Design**: Mobile-first with Tailwind utilities
7. **Error Handling**: Always use try/catch and show user-friendly messages
8. **Loading States**: Show loading indicators for async operations
9. **Optimistic Updates**: Update UI immediately, rollback on error
10. **Code Reusability**: Create composables for shared logic

## Tailwind Specific Conventions

- **Text Size**: Only add if design deviates from `text-base`
- **Font Color**: Only change if design requires it (use default otherwise)
- **Utility-First**: Prefer Tailwind classes over scoped styles
- **Scoped Styles**: Only use when absolutely necessary

## Authentication Context

The user dashboard is **authenticated-only**:
- Users must be logged in to access any routes
- Authentication state managed by `auth` store
- Session shared from public site login via subdomain cookies
- Unauthenticated users redirected to public site login page

## Remember

- This is a **separate Vue application** from public and admin dashboards
- Components are **NOT shared** between applications
- Each app has its **own Pinia instance**
- Use the `dev-fe-public` agent for all Vue/TypeScript/PrimeVue work
- Never compromise on quality gates - all checks must pass 100%
- This is the **user-facing** application, not the admin dashboard



# VRL Public Design System - Style Guide

> **Motorsport Editorial Design System**
> A premium, editorial-style interface inspired by motorsport heritage with championship gold accents.
> Supports both dark and light modes.

**Reference:** See [`component-library.html`](.claude/guides/design/app-public/component-library.html) for interactive examples.

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Components](#components)
6. [Patterns & Effects](#patterns--effects)
7. [Responsive Design](#responsive-design)
8. [Accessibility](#accessibility)
9. [Theme Switching](#theme-switching)

---

## Design Philosophy

The VRL design system follows a **Motorsport Editorial** aesthetic that combines:

- **Racing heritage** - Carbon black backgrounds, championship gold accents, safety orange CTAs
- **Editorial clarity** - Clean typography hierarchy using serif and display fonts
- **Data precision** - Monospace fonts for statistics, times, and numerical data
- **Premium feel** - Subtle gradients, glass effects, and refined animations

### Key Principles

1. **Dark-first design** with full light mode support
2. **Data-driven UI** optimized for displaying standings, times, and statistics
3. **Racing-inspired accents** including angled clip-paths and racing stripes
4. **Accessible contrast** ratios maintained across both themes

---

## Color System

### Background & Surface Colors (Dark Theme - Default)

| Name | Hex | CSS Variable | Tailwind Class | Usage |
|------|-----|--------------|----------------|-------|
| Carbon | `#0a0a0a` | `--bg-primary` | `bg-racing-carbon` | Primary background |
| Asphalt | `#1a1a1a` | `--bg-secondary` | `bg-racing-asphalt` | Card backgrounds, secondary surfaces |
| Tarmac | `#2d2d2d` | `--bg-tertiary` | `bg-racing-tarmac` | Tertiary surfaces, input backgrounds |
| Pit Lane | `#3d3d3d` | `--bg-elevated` | `bg-racing-pit-lane` | Elevated elements, hover states |
| Pit White | `#fafafa` | `--text-primary` | `bg-racing-pit-white` | Primary text (dark mode) |

### Background & Surface Colors (Light Theme)

| Name | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Paper | `#f8f7f4` | `--bg-primary` | Primary background |
| White | `#ffffff` | `--bg-secondary` | Card backgrounds |
| Warm Gray | `#f0efe8` | `--bg-tertiary` | Tertiary surfaces |
| Muted | `#e8e6df` | `--bg-elevated` | Elevated elements |

### Accent Colors

| Name | Hex | Tailwind Class | Usage |
|------|-----|----------------|-------|
| **Championship Gold** | `#d4a853` | `racing-gold` | Primary accent, highlights, active states |
| Gold Bright | `#f5c866` | `racing-gold-bright` | Hover states for gold elements |
| Gold Muted | `#a08040` | `racing-gold-muted` | Subtle gold accents |
| **Safety Orange** | `#ff6b35` | `racing-safety` | Primary CTA buttons |
| Safety Bright | `#ff8a5c` | `racing-safety-bright` | Hover state for CTAs |
| Safety Dark | `#e55a2b` | `racing-safety-dark` | Active/pressed states |

### Semantic Colors

| Name | Hex | Tailwind Class | Usage |
|------|-----|----------------|-------|
| Success | `#22c55e` | `racing-success` | Success states, confirmations |
| Warning | `#f59e0b` | `racing-warning` | Warnings, cautions |
| Danger | `#ef4444` | `racing-danger` | Errors, destructive actions |
| Info | `#3b82f6` | `racing-info` | Information, tips |

### Position Colors (Podium)

| Position | Hex | Tailwind Class | Usage |
|----------|-----|----------------|-------|
| 1st (Pole) | `#d4a853` | `racing-pole` | Championship winner |
| 2nd (Silver) | `#c0c0c0` | `racing-podium-2` | Second place |
| 3rd (Bronze) | `#cd7f32` | `racing-podium-3` | Third place |
| Fastest Lap | `#a855f7` | `racing-fastest-lap` | Fastest lap indicator |
| DNF | `#ef4444` | `racing-dnf` | Did Not Finish |
| DNS | `#6b7280` | `racing-dns` | Did Not Start |

### Text Hierarchy

| Level | Dark Mode | Light Mode | CSS Variable | Usage |
|-------|-----------|------------|--------------|-------|
| Primary | `#fafafa` | `#0a0a0a` | `--text-primary` | Headings, important text |
| Secondary | `#e5e5e5` | `#1a1a1a` | `--text-secondary` | Body text |
| Muted | `#9ca3af` | `#6b7280` | `--text-muted` | Supporting text |
| Dim | `#6b7280` | `#9ca3af` | `--text-dim` | Labels, captions |

---

## Typography

### Font Families

```css
--font-display: 'Racing Sans One', cursive;  /* Headings, navigation, labels */
--font-body: 'Source Serif 4', Georgia, serif; /* Body text, paragraphs */
--font-data: 'JetBrains Mono', monospace;      /* Statistics, times, data */
```

### Font Loading

```html
<link href="https://fonts.googleapis.com/css2?family=Racing+Sans+One&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;0,8..60,600;0,8..60,700;1,8..60,400&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

### Typography Scale

| Type | Class | Font | Size | Weight | Letter Spacing | Usage |
|------|-------|------|------|--------|----------------|-------|
| Hero Title | `font-display text-5xl uppercase tracking-wide` | Racing Sans One | 3rem (48px) | Normal | Wide | Landing page hero |
| Section Title | `font-display text-3xl uppercase tracking-wide` | Racing Sans One | 1.875rem (30px) | Normal | Wide | Section headings |
| Card Title | `font-display text-lg uppercase tracking-wide` | Racing Sans One | 1.125rem (18px) | Normal | Wide | Card headers |
| Body Text | `font-body text-lg leading-relaxed` | Source Serif 4 | 1.125rem (18px) | Normal | Normal | Paragraphs |
| Body Small | `font-body text-base` | Source Serif 4 | 1rem (16px) | Normal | Normal | Secondary text |
| Data Large | `font-data text-3xl font-semibold` | JetBrains Mono | 1.875rem (30px) | 600 | Normal | Lap times, scores |
| Data Medium | `font-data text-sm` | JetBrains Mono | 0.875rem (14px) | Normal | Normal | Table data |
| Label | `font-display text-xs tracking-[0.15em] uppercase` | Racing Sans One | 0.75rem (12px) | Normal | 0.15em | UI labels |
| Caption | `font-data text-[10px] uppercase tracking-wider` | JetBrains Mono | 10px | Normal | Wider | Section labels |

### Typography Usage Guidelines

1. **Display Font (Racing Sans One):**
   - Always uppercase
   - Use for all headings, navigation, and UI labels
   - Include `tracking-wide` for proper letter spacing

2. **Body Font (Source Serif 4):**
   - Use for editorial content and descriptions
   - Provides readable, premium feel
   - Use `leading-relaxed` for better readability

3. **Data Font (JetBrains Mono):**
   - All numerical data: times, points, statistics
   - UI metadata: timestamps, counts
   - Color codes and technical information

---

## Spacing & Layout

### Spacing Scale

| Name | Value | Usage |
|------|-------|-------|
| xs | 0.25rem (4px) | Minimal gaps |
| sm | 0.5rem (8px) | Tight spacing |
| md | 1rem (16px) | Standard spacing |
| lg | 1.5rem (24px) | Section spacing |
| xl | 2rem (32px) | Large gaps |
| 2xl | 3rem (48px) | Section separators |

### Container Widths

```css
max-width: 1200px;  /* Main content container */
padding: 0 1rem;    /* Mobile (sm) */
padding: 0 2rem;    /* Tablet (sm:) */
padding: 0 3rem;    /* Desktop (lg:) */
```

### Grid Patterns

**Stats Grid:**
```html
<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
```

**Card Grid:**
```html
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
```

---

## Components

### Buttons

#### Button Sizes

| Size | Height | Padding | Font Size | Class Example |
|------|--------|---------|-----------|---------------|
| XS | 28px | `px-2.5 py-1.5` | 9px | `text-[9px]` |
| SM | 34px | `px-3.5 py-2` | 10px | `text-[10px]` |
| MD | 40px | `px-5 py-2.5` | 12px | `text-xs` |
| LG | 48px | `px-6 py-3` | 14px | `text-sm` |
| XL | 56px | `px-8 py-4` | 16px | `text-base` |

#### Button Variants

**Primary (Safety Orange):**
```html
<button class="inline-flex items-center gap-2 px-6 py-3 bg-racing-safety text-racing-pit-white font-display text-sm uppercase tracking-wider hover:bg-racing-safety-bright transition-all shadow-lg shadow-racing-safety/30 btn-shine" style="clip-path: polygon(0 0, 100% 0, 95% 100%, 0% 100%);">
    <i class="ph-bold ph-plus"></i>
    Get Started
</button>
```

**Secondary (Gold Outline):**
```html
<button class="inline-flex items-center gap-2 px-6 py-3 bg-transparent text-racing-gold font-display text-sm uppercase tracking-wider border border-racing-gold hover:bg-racing-gold/10 transition-all" style="clip-path: polygon(5% 0, 100% 0, 100% 100%, 0% 100%);">
    Browse Leagues
</button>
```

**Ghost/Text:**
```html
<button class="inline-flex items-center gap-2 px-4 py-2.5 bg-transparent font-display text-xs uppercase tracking-wider hover:text-racing-gold transition-all" style="color: var(--text-muted);">
    More Options
</button>
```

**Danger:**
```html
<button class="inline-flex items-center gap-2 px-6 py-3 bg-racing-danger text-racing-pit-white font-display text-sm uppercase tracking-wider hover:bg-red-500 transition-all shadow-lg shadow-racing-danger/20">
    Delete
</button>
```

#### Icon-Only Buttons

| Size | Dimensions | Icon Size |
|------|------------|-----------|
| SM | 28px | `text-xs` |
| MD | 36px | `text-sm` |
| LG | 40px | `text-base` |
| XL | 48px | `text-lg` |

**Angled Icon Button:**
```html
<button class="w-10 h-10 flex items-center justify-center bg-racing-safety text-racing-pit-white hover:bg-racing-safety-bright" style="clip-path: polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%);">
    <i class="ph-bold ph-plus"></i>
</button>
```

**Circular Icon Button:**
```html
<button class="w-10 h-10 flex items-center justify-center bg-racing-safety text-racing-pit-white rounded-full shadow-md shadow-racing-safety/20">
    <i class="ph-bold ph-plus"></i>
</button>
```

### Cards

#### Racing Card (Standard)
```html
<div class="card-racing rounded overflow-hidden">
    <!-- Card content -->
</div>
```

CSS for `card-racing`:
```css
.card-racing {
    background: var(--bg-secondary);
    border: 1px solid var(--border-primary);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.card-racing:hover {
    border-color: var(--card-hover-border);
    transform: translateY(-4px);
    box-shadow: var(--shadow-card);
}
```

#### Stats Card
```html
<div class="gradient-border card-racing rounded p-5 text-center transition-all">
    <div class="flex items-center justify-center gap-4">
        <div class="w-12 h-12 bg-racing-gold/10 rounded flex items-center justify-center">
            <i class="ph-fill ph-flag-checkered text-xl text-racing-gold"></i>
        </div>
        <div class="text-left">
            <div class="font-display text-3xl leading-none" style="color: var(--text-primary);">6</div>
            <div class="font-data text-[9px] uppercase tracking-wider mt-1" style="color: var(--text-dim);">Competitions</div>
        </div>
    </div>
</div>
```

#### Feature Card (with hover accent)
```html
<div class="card-racing rounded p-6 relative group">
    <div class="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-racing-gold to-racing-safety transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform"></div>
    <!-- Card content -->
</div>
```

### Form Elements

#### Input Sizes

| Size | Height | Padding | Font Size |
|------|--------|---------|-----------|
| SM | 32px | `px-3 py-1.5` | `text-xs` |
| MD | 40px | `px-4 py-2.5` | `text-sm` |
| LG | 48px | `px-5 py-3` | `text-base` |

#### Text Input
```html
<div>
    <label class="block mb-2 font-display text-[10px] uppercase tracking-wider" style="color: var(--text-dim);">
        League Name <span class="text-racing-safety">*</span>
    </label>
    <input type="text" placeholder="Enter league name" class="w-full px-4 py-3 text-sm font-body transition-all min-h-[44px]" style="background: var(--bg-secondary); border: 1px solid var(--border-primary); color: var(--text-primary);" />
</div>
```

#### Select Dropdown
```html
<select class="w-full px-4 py-2.5 text-sm font-body h-10 appearance-none cursor-pointer" style="background: var(--bg-secondary) url('data:image/svg+xml;...') no-repeat right 12px center; border: 1px solid var(--border-primary); color: var(--text-primary);">
    <option>Select option</option>
</select>
```

#### Toggle Switch

**Sizes:**
- Small: 36x20px
- Medium: 44x24px (default)
- Large: 52x28px

```html
<div class="toggle-switch active" onclick="this.classList.toggle('active')">
    <div class="toggle-indicator"></div>
</div>
```

### Badges & Tags

#### Status Badges
```html
<!-- Active -->
<span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-racing-success/10 text-racing-success font-display text-[10px] uppercase tracking-wider rounded-full">
    <span class="w-1.5 h-1.5 bg-racing-success rounded-full animate-pulse"></span>
    Active
</span>

<!-- Featured -->
<span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-racing-gold/10 text-racing-gold font-display text-[10px] uppercase tracking-wider rounded-full">
    <i class="ph-fill ph-star text-xs"></i>
    Featured
</span>
```

#### Race Status Tags
```html
<span class="px-2 py-1 bg-racing-danger/20 text-racing-danger font-display text-[10px] uppercase tracking-wider rounded">DNF</span>
<span class="px-2 py-1 bg-racing-fastest-lap/20 text-racing-fastest-lap font-display text-[10px] uppercase tracking-wider rounded">Fastest Lap</span>
```

#### Platform Tags
```html
<span class="px-3 py-1.5 bg-racing-gold text-racing-carbon font-display text-[10px] uppercase tracking-wider">GT7</span>
```

### Tables

#### Championship Standings Table
```html
<table style="width: 100%; border-collapse: collapse;">
    <thead>
        <tr style="background: var(--bg-primary);">
            <th style="color: var(--text-dim); border-bottom: 1px solid var(--border-primary); padding: 12px 16px; font-family: 'Racing Sans One'; font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em;">Pos</th>
            <!-- More columns -->
        </tr>
    </thead>
    <tbody style="font-family: 'JetBrains Mono'; font-size: 14px;">
        <tr style="border-bottom: 1px solid var(--border-subtle);">
            <td style="padding: 12px 16px; text-align: center;">
                <span style="font-family: 'Racing Sans One'; font-size: 20px; color: #d4a853;">1</span>
            </td>
            <!-- More cells -->
        </tr>
    </tbody>
</table>
```

### Modals

**Sizes:**
| Size | Width |
|------|-------|
| SM | 400px |
| MD | 500px |
| LG | 700px |
| XL | 900px |
| Full | calc(100vw - 2rem) |

**Structure:**
```html
<div class="modal-overlay">
    <div class="modal-content rounded w-[500px]">
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4" style="border-bottom: 1px solid var(--border-primary);">
            <h3 class="font-display text-sm uppercase tracking-wide">Title</h3>
            <button class="w-8 h-8 flex items-center justify-center hover:text-racing-gold rounded" style="background: var(--bg-tertiary);">
                <i class="ph ph-x"></i>
            </button>
        </div>
        <!-- Body -->
        <div class="px-5 py-5">Content</div>
        <!-- Footer -->
        <div class="flex items-center justify-end gap-3 px-5 py-4" style="border-top: 1px solid var(--border-primary); background: var(--bg-primary);">
            <button>Cancel</button>
            <button>Submit</button>
        </div>
    </div>
</div>
```

### Drawers

**Width:** 400px (max 90vw on mobile)

**Positions:**
- Right: Detail views, settings panels
- Left: Navigation menus, filters

### Alert Dialogs

**Variants:**
| Type | Icon Color | Button Color |
|------|------------|--------------|
| Success | `text-racing-success` | `bg-racing-success` |
| Warning | `text-racing-warning` | `bg-racing-warning` |
| Danger | `text-racing-danger` | `bg-racing-danger` |
| Info | `text-racing-info` | `bg-racing-info` |

### Toast Notifications

```html
<div class="flex items-center gap-3 px-4 py-3 rounded" style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3);">
    <i class="ph-fill ph-check-circle text-lg text-racing-success"></i>
    <span class="text-sm flex-1">Message</span>
    <button><i class="ph ph-x text-sm"></i></button>
</div>
```

**Auto-dismiss:** 5 seconds

### Pagination

**Standard pagination item:**
```css
.pagination-item {
    min-width: 40px;
    height: 40px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    border: 1px solid var(--border-primary);
    background: var(--bg-secondary);
    color: var(--text-muted);
}
.pagination-item.active {
    background: var(--accent-gold);
    border-color: var(--accent-gold);
    color: var(--bg-primary);
    font-weight: 600;
}
```

**Racing-styled (angled):**
```html
<button class="pagination-item" style="clip-path: polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%);">1</button>
```

---

## Patterns & Effects

### Racing Stripe
Vertical gradient accent on left edge:
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

### Gradient Border
Subtle top-left corner accent:
```css
.gradient-border::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(135deg, var(--card-hover-border), transparent 50%);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
}
```

### Button Shine Effect
Hover sweep animation:
```css
.btn-shine::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
        to bottom right,
        rgba(255, 255, 255, 0) 40%,
        rgba(255, 255, 255, 0.15) 50%,
        rgba(255, 255, 255, 0) 60%
    );
    transform: rotate(45deg);
    transition: transform 0.5s ease;
}
.btn-shine:hover::after {
    transform: rotate(45deg) translateY(-100%);
}
```

### Glass Effect
Frosted glass for navigation:
```css
.glass {
    background: var(--bg-glass);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
}
```

### Checkered Pattern
Racing flag pattern for backgrounds:
```css
.pattern-checkered {
    background-image:
        linear-gradient(45deg, var(--pattern-checkered-color) 25%, transparent 25%),
        linear-gradient(-45deg, var(--pattern-checkered-color) 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, var(--pattern-checkered-color) 75%),
        linear-gradient(-45deg, transparent 75%, var(--pattern-checkered-color) 75%);
    background-size: 20px 20px;
}
```

### Ambient Background Gradient
Subtle gold glow at top:
```css
.ambient-bg {
    background: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(212, 168, 83, 0.1) 0%, transparent 50%), var(--bg-primary);
}
```

### Clip-Path Shapes

**Angled button (right):**
```css
clip-path: polygon(0 0, 100% 0, 95% 100%, 0% 100%);
```

**Angled button (left):**
```css
clip-path: polygon(5% 0, 100% 0, 100% 100%, 0% 100%);
```

**Angled icon button:**
```css
clip-path: polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%);
```

---

## Responsive Design

### Breakpoints

| Name | Min Width | Usage |
|------|-----------|-------|
| sm | 640px | Small tablets |
| md | 768px | Tablets |
| lg | 1024px | Desktop |
| xl | 1280px | Large desktop |

### Responsive Patterns

**Mobile stack pattern:**
```html
<div class="flex flex-col sm:flex-row gap-4">
```

**Mobile full-width:**
```html
<button class="w-full sm:w-auto">
```

**Responsive text sizes:**
```html
<h1 class="text-2xl sm:text-3xl lg:text-5xl">
```

**Responsive padding:**
```html
<div class="px-4 sm:px-8 lg:px-12">
```

### Touch Target Sizes

Minimum touch target: **44x44px** for mobile accessibility

```html
<input class="min-h-[44px]" />
<button class="min-h-[44px]">
```

---

## Accessibility

### Contrast Requirements

- All text meets WCAG AA contrast ratios
- Light theme colors adjusted for proper contrast on light backgrounds
- Focus states use gold accent with sufficient visibility

### Focus States

```css
input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: var(--accent-gold);
    box-shadow: 0 0 0 3px rgba(212, 168, 83, 0.12), 0 0 0 1px var(--accent-gold);
}
```

### Keyboard Navigation

- All interactive elements are keyboard accessible
- Modals/drawers close on Escape key
- Tab order follows visual hierarchy

### Screen Reader Considerations

- Use semantic HTML elements
- Include ARIA labels for icon-only buttons
- Announce dynamic content changes

---

## Theme Switching

### CSS Variables Structure

The design system uses CSS custom properties for theme switching:

```css
:root {
    /* Dark theme (default) */
    --bg-primary: #0a0a0a;
    --bg-secondary: #1a1a1a;
    --text-primary: #fafafa;
    --accent-gold: #d4a853;
    /* ... */
}

[data-theme="light"] {
    --bg-primary: #f8f7f4;
    --bg-secondary: #ffffff;
    --text-primary: #0a0a0a;
    --accent-gold: #b8923f;
    /* ... */
}
```

### Theme Toggle Implementation

```javascript
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('vrl-theme', newTheme);
}

// Initialize from localStorage or system preference
function initTheme() {
    const savedTheme = localStorage.getItem('vrl-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
}
```

---

## Icons

The design system uses **Phosphor Icons** (v2.0.3):

```html
<script src="https://unpkg.com/@phosphor-icons/web@2.0.3"></script>
```

### Icon Weights

| Weight | Class | Usage |
|--------|-------|-------|
| Regular | `ph ph-*` | Default, interactive elements |
| Bold | `ph-bold ph-*` | Buttons, emphasis |
| Fill | `ph-fill ph-*` | Active states, important indicators |
| Duotone | `ph-duotone ph-*` | Feature illustrations |

### Common Icons

| Icon | Class | Usage |
|------|-------|-------|
| Flag Checkered | `ph-flag-checkered` | Competitions, racing |
| Users | `ph-users` | Drivers, teams |
| Timer | `ph-timer` | Lap times |
| Trophy | `ph-trophy` | Championships |
| Star | `ph-star` | Featured, favorites |
| Gear | `ph-gear` | Settings |
| Plus | `ph-plus` | Add actions |
| X | `ph-x` | Close, remove |
| Caret | `ph-caret-*` | Navigation arrows |

---

## Animation

### Transitions

**Standard transition:**
```css
transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
```

**Quick transition:**
```css
transition: all 0.2s ease;
```

### Keyframe Animations

**Fade In Up:**
```css
@keyframes fadeInUp {
    0% { opacity: 0; transform: translateY(20px); }
    100% { opacity: 1; transform: translateY(0); }
}
/* Usage: animation: fade-in-up 0.5s ease-out forwards; */
```

**Pulse Glow:**
```css
@keyframes pulseGlow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(212, 168, 83, 0.4); }
    50% { box-shadow: 0 0 0 6px rgba(212, 168, 83, 0.1); }
}
/* Usage: animation: pulse-glow 2s ease-in-out infinite; */
```

---

## Best Practices Summary

1. **Always use CSS variables** for colors to support theme switching
2. **Maintain consistent spacing** using the defined scale
3. **Use the correct font** for each content type (display/body/data)
4. **Include hover states** with gold accent color
5. **Ensure touch targets** are at least 44x44px
6. **Test in both themes** before shipping
7. **Use clip-path** sparingly for racing-styled accents
8. **Follow the component patterns** from the library for consistency

---

*Last updated: December 2024*
*Reference: [`component-library.html`](.claude/guides/design/app-public/component-library.html)*
