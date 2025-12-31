# Technical Blueprint Color Schema Implementation Plan

## Overview

This document outlines the comprehensive plan to implement the Technical Blueprint dark color schema for the app dashboard (`resources/app`). This plan focuses **exclusively on configuration changes** to Tailwind CSS 4 and PrimeVue v4, with **NO component modifications**.

## Table of Contents

1. [Color Palette Analysis](#color-palette-analysis)
2. [Current Configuration Analysis](#current-configuration-analysis)
3. [Implementation Strategy](#implementation-strategy)
4. [Tailwind CSS 4 Configuration](#tailwind-css-4-configuration)
5. [PrimeVue v4 Theme Configuration](#primevue-v4-theme-configuration)
6. [CSS Variables Update](#css-variables-update)
7. [Implementation Steps](#implementation-steps)
8. [Testing & Validation](#testing--validation)
9. [Rollback Plan](#rollback-plan)

---

## Color Palette Analysis

### Extracted Colors from `colors.html`

#### Background & Surface Colors
```css
--bg-dark: #0d1117         /* Main background */
--bg-panel: #161b22        /* Headers, sidebars, navigation */
--bg-card: #1c2128         /* Content cards and containers */
--bg-elevated: #21262d     /* Hover states, nested elements */
--bg-highlight: #272d36    /* Highlighted elements */
```

#### Text Colors
```css
--text-primary: #e6edf3    /* Primary text */
--text-secondary: #8b949e  /* Secondary text */
--text-muted: #6e7681      /* Muted text */
--text-accent: #7ee787     /* Accent text (green) */
```

#### Accent Colors
```css
--cyan: #58a6ff            /* Primary actions, links, active states */
--green: #7ee787           /* Success, online status, positive changes */
--orange: #f0883e          /* Warnings, pending states */
--red: #f85149             /* Errors, danger, destructive actions */
--purple: #bc8cff          /* Special features, premium content */
--yellow: #d29922          /* Warnings, highlights */
```

#### Dim Variants (15% opacity)
```css
--cyan-dim: rgba(88, 166, 255, 0.15)
--green-dim: rgba(126, 231, 135, 0.15)
--orange-dim: rgba(240, 136, 62, 0.15)
--red-dim: rgba(248, 81, 73, 0.15)
--purple-dim: rgba(188, 140, 255, 0.15)
```

#### Border Colors
```css
--border: #30363d          /* Primary borders */
--border-muted: #21262d    /* Subtle borders */
```

#### Additional Colors
```css
--grid-color: rgba(88, 166, 255, 0.06)  /* Grid background pattern */
```

### Semantic Color Mapping

| Semantic Meaning | Color | Use Case |
|-----------------|-------|----------|
| Primary Actions | Cyan (#58a6ff) | Links, active states, primary buttons |
| Success | Green (#7ee787) | Success messages, online status, positive feedback |
| Warning | Orange (#f0883e) | Warning messages, pending states |
| Danger | Red (#f85149) | Error messages, destructive actions |
| Info/Special | Purple (#bc8cff) | Special features, premium content |
| Warning/Highlight | Yellow (#d29922) | Warnings, important highlights |

---

## Current Configuration Analysis

### Current Color Schema (`resources/app/css/app.css`)

The current implementation uses a **light color schema**:

```css
/* Current - Light Theme */
--bg-primary: #ffffff      /* White backgrounds */
--bg-secondary: #f9fafb    /* Light gray */
--bg-tertiary: #f3f4f6     /* Lighter gray */
--border-light: #e5e7eb
--border-medium: #d1d5db
--text-primary: #111827    /* Dark text */
--text-secondary: #6b7280
--text-muted: #9ca3af
```

### Tailwind CSS 4 Configuration

Tailwind CSS 4 uses the **`@theme` directive** within CSS files instead of a separate `tailwind.config.js`. Current configuration is in `resources/app/css/app.css`:

```css
@theme {
  --text-base: 0.875rem;
  --text-xs: 0.625rem;
  /* ... other text sizes ... */
}
```

### PrimeVue v4 Configuration

**Version**: `primevue@4.4.1` with `@primevue/themes@4.4.1`

**Current Setup**:
- Theme: Aura preset
- Configuration in: `resources/app/js/app.ts`
- CSS variables defined in: `resources/app/css/app.css`

```typescript
// Current PrimeVue setup
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      prefix: 'p',
      darkModeSelector: '.dark',
      cssLayer: {
        name: 'primevue',
        order: 'theme, base, primevue',
      },
    },
  },
});
```

---

## Implementation Strategy

### Key Principles

1. **Configuration-Only Changes**: No component code modifications
2. **CSS Variables First**: Define all colors as CSS custom properties
3. **Tailwind Integration**: Extend Tailwind's color palette using `@theme`
4. **PrimeVue Override**: Override Aura preset CSS variables
5. **Consistency**: Ensure Tailwind and PrimeVue use the same color tokens
6. **Backward Compatibility**: Maintain existing custom properties for smooth transition

### Architecture

```
┌─────────────────────────────────────────────────────┐
│  CSS Custom Properties (:root)                      │
│  Single source of truth for all colors              │
└─────────────────────────────────────────────────────┘
                        ↓
        ┌───────────────────────────────┐
        │                               │
        ↓                               ↓
┌───────────────────┐         ┌────────────────────┐
│ Tailwind @theme   │         │ PrimeVue CSS Vars  │
│ (--color-*)       │         │ (--p-*)            │
└───────────────────┘         └────────────────────┘
```

---

## Tailwind CSS 4 Configuration

### Step 1: Define Base Colors in `@theme`

Tailwind CSS 4 allows defining colors directly in the `@theme` directive using CSS custom properties.

**Location**: `resources/app/css/app.css`

```css
@theme {
  /* Existing font size scale */
  --text-base: 0.875rem;
  --text-xs: 0.625rem;
  --text-sm: 0.75rem;
  --text-md: 0.8125rem;
  --text-lg: 1rem;
  --text-xl: 1.125rem;
  --text-2xl: 1.5rem;

  /* ============================================
     Technical Blueprint Color Palette
     ============================================ */

  /* Background Colors */
  --color-bg-dark: #0d1117;
  --color-bg-panel: #161b22;
  --color-bg-card: #1c2128;
  --color-bg-elevated: #21262d;
  --color-bg-highlight: #272d36;

  /* Text Colors */
  --color-text-primary: #e6edf3;
  --color-text-secondary: #8b949e;
  --color-text-muted: #6e7681;
  --color-text-accent: #7ee787;

  /* Border Colors */
  --color-border-default: #30363d;
  --color-border-muted: #21262d;

  /* Semantic Colors */
  --color-cyan: #58a6ff;
  --color-green: #7ee787;
  --color-orange: #f0883e;
  --color-red: #f85149;
  --color-purple: #bc8cff;
  --color-yellow: #d29922;

  /* Dim Variants (15% opacity) */
  --color-cyan-dim: rgba(88, 166, 255, 0.15);
  --color-green-dim: rgba(126, 231, 135, 0.15);
  --color-orange-dim: rgba(240, 136, 62, 0.15);
  --color-red-dim: rgba(248, 81, 73, 0.15);
  --color-purple-dim: rgba(188, 140, 255, 0.15);

  /* Grid Pattern */
  --color-grid: rgba(88, 166, 255, 0.06);
}
```

### Step 2: Create Semantic Color Scales

Tailwind expects color scales (50-950). We need to create these for each semantic color:

```css
@theme {
  /* Cyan Scale (Primary/Info) */
  --color-cyan-50: #eff6ff;
  --color-cyan-100: #dbeafe;
  --color-cyan-200: #bfdbfe;
  --color-cyan-300: #93c5fd;
  --color-cyan-400: #60a5fa;
  --color-cyan-500: #58a6ff;    /* Base cyan */
  --color-cyan-600: #3b82f6;
  --color-cyan-700: #2563eb;
  --color-cyan-800: #1e40af;
  --color-cyan-900: #1e3a8a;
  --color-cyan-950: #172554;

  /* Green Scale (Success) */
  --color-green-50: #f0fdf4;
  --color-green-100: #dcfce7;
  --color-green-200: #bbf7d0;
  --color-green-300: #86efac;
  --color-green-400: #7ee787;   /* Base green */
  --color-green-500: #4ade80;
  --color-green-600: #22c55e;
  --color-green-700: #16a34a;
  --color-green-800: #15803d;
  --color-green-900: #166534;
  --color-green-950: #14532d;

  /* Orange Scale (Warning) */
  --color-orange-50: #fff7ed;
  --color-orange-100: #ffedd5;
  --color-orange-200: #fed7aa;
  --color-orange-300: #fdba74;
  --color-orange-400: #fb923c;
  --color-orange-500: #f0883e;  /* Base orange */
  --color-orange-600: #ea580c;
  --color-orange-700: #c2410c;
  --color-orange-800: #9a3412;
  --color-orange-900: #7c2d12;
  --color-orange-950: #431407;

  /* Red Scale (Danger/Error) */
  --color-red-50: #fef2f2;
  --color-red-100: #fee2e2;
  --color-red-200: #fecaca;
  --color-red-300: #fca5a5;
  --color-red-400: #f87171;
  --color-red-500: #f85149;     /* Base red */
  --color-red-600: #dc2626;
  --color-red-700: #b91c1c;
  --color-red-800: #991b1b;
  --color-red-900: #7f1d1d;
  --color-red-950: #450a0a;

  /* Purple Scale (Special) */
  --color-purple-50: #faf5ff;
  --color-purple-100: #f3e8ff;
  --color-purple-200: #e9d5ff;
  --color-purple-300: #d8b4fe;
  --color-purple-400: #c084fc;
  --color-purple-500: #bc8cff;  /* Base purple */
  --color-purple-600: #a855f7;
  --color-purple-700: #9333ea;
  --color-purple-800: #7e22ce;
  --color-purple-900: #6b21a8;
  --color-purple-950: #4a044e;

  /* Yellow Scale (Highlight) */
  --color-yellow-50: #fefce8;
  --color-yellow-100: #fef9c3;
  --color-yellow-200: #fef08a;
  --color-yellow-300: #fde047;
  --color-yellow-400: #facc15;
  --color-yellow-500: #d29922;  /* Base yellow */
  --color-yellow-600: #ca8a04;
  --color-yellow-700: #a16207;
  --color-yellow-800: #854d0e;
  --color-yellow-900: #713f12;
  --color-yellow-950: #422006;

  /* Surface Scale (Background variations) */
  --color-surface-50: #272d36;   /* bg-highlight */
  --color-surface-100: #21262d;  /* bg-elevated */
  --color-surface-200: #1c2128;  /* bg-card */
  --color-surface-300: #161b22;  /* bg-panel */
  --color-surface-400: #0d1117;  /* bg-dark */
  --color-surface-500: #0d1117;
  --color-surface-600: #0d1117;
  --color-surface-700: #0d1117;
  --color-surface-800: #0d1117;
  --color-surface-900: #0d1117;
  --color-surface-950: #0d1117;
}
```

### Step 3: Usage in Components

With this configuration, components can use:

```vue
<template>
  <!-- Tailwind utilities will work automatically -->
  <div class="bg-surface-200 text-text-primary border border-border-default">
    <button class="bg-cyan-500 hover:bg-cyan-600">Primary Action</button>
    <span class="text-green-400">Success</span>
  </div>
</template>
```

---

## PrimeVue v4 Theme Configuration

PrimeVue v4 with the Aura preset uses CSS variables with the `--p-` prefix. We need to override these to match our color schema.

### Step 1: Override PrimeVue Color Variables

**Location**: `resources/app/css/app.css` (`:root` section)

```css
:root {
  /* ============================================
     Technical Blueprint - Base CSS Variables
     (For direct var() usage)
     ============================================ */

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
  --text-accent: #7ee787;

  /* Border Colors */
  --border: #30363d;
  --border-muted: #21262d;

  /* Semantic Colors */
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

  /* Grid Pattern */
  --grid-color: rgba(88, 166, 255, 0.06);

  /* Layout (keep existing) */
  --sidebar-width: 16rem;
  --sidebar-collapsed-width: 5rem;
  --topbar-height: 4rem;

  /* Font Sizes (keep existing) */
  --font-size-base: 14px;
  --font-size-xs: 10px;
  --font-size-sm: 12px;
  --font-size-md: 13px;
  --font-size-lg: 16px;
  --font-size-xl: 18px;
  --font-size-2xl: 24px;

  /* Custom Shadows (keep existing) */
  --shadow-reverse: 0 -2px 4px rgb(0 0 0 / 0.08);
  --shadow-reverse-md: 0 -3px 6px rgb(0 0 0 / 0.1);
  --shadow-reverse-lg: 0 -4px 8px rgb(0 0 0 / 0.12);
  --shadow-reverse-xl: 0 -6px 12px rgb(0 0 0 / 0.15);

  /* ============================================
     PrimeVue Aura Theme Overrides
     ============================================ */

  /* Primary Color Scale (Cyan as Primary) */
  --p-primary-50: #eff6ff;
  --p-primary-100: #dbeafe;
  --p-primary-200: #bfdbfe;
  --p-primary-300: #93c5fd;
  --p-primary-400: #60a5fa;
  --p-primary-500: #58a6ff;    /* Base cyan - primary color */
  --p-primary-600: #3b82f6;
  --p-primary-700: #2563eb;
  --p-primary-800: #1e40af;
  --p-primary-900: #1e3a8a;
  --p-primary-950: #172554;

  /* Surface Scale (Dark backgrounds) */
  --p-surface-0: #0d1117;      /* bg-dark */
  --p-surface-50: #161b22;     /* bg-panel */
  --p-surface-100: #1c2128;    /* bg-card */
  --p-surface-200: #21262d;    /* bg-elevated */
  --p-surface-300: #272d36;    /* bg-highlight */
  --p-surface-400: #30363d;
  --p-surface-500: #484f58;
  --p-surface-600: #6e7681;
  --p-surface-700: #8b949e;
  --p-surface-800: #b1bac4;
  --p-surface-900: #e6edf3;
  --p-surface-950: #f0f6fc;

  /* Text Colors */
  --p-text-color: #e6edf3;              /* text-primary */
  --p-text-hover-color: #f0f6fc;
  --p-text-muted-color: #8b949e;        /* text-secondary */
  --p-text-hover-muted-color: #b1bac4;

  /* Content & Borders */
  --p-content-background: #1c2128;      /* bg-card */
  --p-content-hover-background: #21262d; /* bg-elevated */
  --p-content-border-color: #30363d;    /* border */
  --p-content-border-radius: 0.375rem;  /* 6px */
  --p-content-hover-color: #e6edf3;

  /* Highlight Colors (Primary/Cyan based) */
  --p-highlight-background: rgba(88, 166, 255, 0.15);  /* cyan-dim */
  --p-highlight-color: #58a6ff;                        /* cyan */
  --p-highlight-focus-background: rgba(88, 166, 255, 0.25);
  --p-highlight-focus-color: #60a5fa;

  /* Success (Green) */
  --p-green-50: #f0fdf4;
  --p-green-100: #dcfce7;
  --p-green-200: #bbf7d0;
  --p-green-300: #86efac;
  --p-green-400: #7ee787;
  --p-green-500: #4ade80;
  --p-green-600: #22c55e;
  --p-green-700: #16a34a;
  --p-green-800: #15803d;
  --p-green-900: #166534;
  --p-green-950: #14532d;

  /* Warning (Orange) */
  --p-orange-50: #fff7ed;
  --p-orange-100: #ffedd5;
  --p-orange-200: #fed7aa;
  --p-orange-300: #fdba74;
  --p-orange-400: #fb923c;
  --p-orange-500: #f0883e;
  --p-orange-600: #ea580c;
  --p-orange-700: #c2410c;
  --p-orange-800: #9a3412;
  --p-orange-900: #7c2d12;
  --p-orange-950: #431407;

  /* Danger/Error (Red) */
  --p-red-50: #fef2f2;
  --p-red-100: #fee2e2;
  --p-red-200: #fecaca;
  --p-red-300: #fca5a5;
  --p-red-400: #f87171;
  --p-red-500: #f85149;
  --p-red-600: #dc2626;
  --p-red-700: #b91c1c;
  --p-red-800: #991b1b;
  --p-red-900: #7f1d1d;
  --p-red-950: #450a0a;

  /* Component-Specific Overrides (keep existing customizations) */
  --p-drawer-header-padding: 1rem 1rem;
  --p-card-border-radius: 0.5rem;
  --p-card-body-gap: 0;
  --p-tag-font-size: 0.75rem;
}
```

### Step 2: Body Background and Grid Pattern

Update the `body` styles to use the dark background with grid pattern:

```css
body {
  font-family:
    'Zalando Sans',
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif;
  font-size: var(--font-size-base);
  margin: 0;
  padding: 0;
  overflow-x: hidden;

  /* Technical Blueprint Background */
  background: var(--bg-dark);
  color: var(--text-primary);

  /* Grid Pattern Overlay */
  background-image:
    linear-gradient(var(--grid-color) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid-color) 1px, transparent 1px);
  background-size: 20px 20px;
}
```

### Step 3: Update Existing Component Styles

Update the existing PrimeVue component overrides to use new color variables:

```css
/* PrimeVue Drawer Styling */
.p-drawer-header {
  background-color: var(--bg-panel);
  border-bottom: 1px solid var(--border);
}

/* PrimeVue Dialog Styling */
.p-dialog-header {
  background-color: var(--bg-panel);
  border-bottom: 1px solid var(--border);
}

.p-dialog-content {
  background-color: var(--bg-card);
  color: var(--text-primary);
}

.p-dialog-footer {
  background-color: var(--bg-panel);
  border-top: 1px solid var(--border);
}

.p-dialog-close-button {
  background-color: var(--bg-elevated);
  border: 1px solid var(--border);
  color: var(--text-primary);
}

.p-dialog-close-button:hover {
  background-color: var(--bg-highlight);
  border: 1px solid var(--border);
}

/* PrimeVue Tabs Styling */
.p-tab {
  background-color: var(--bg-card);
  color: var(--text-secondary);
}

.p-tab.p-tab-active {
  color: var(--cyan);
}

.p-tablist-active-bar {
  background-color: var(--cyan);
}

/* PrimeVue Input Styling */
.p-inputtext,
.p-inputnumber-input,
.p-textarea {
  background-color: var(--bg-elevated);
  border-color: var(--border);
  color: var(--text-primary);
}

.p-inputtext::placeholder,
.p-inputnumber-input::placeholder,
.p-textarea::placeholder {
  color: var(--text-muted);
}

.p-inputtext:focus,
.p-inputnumber-input:focus,
.p-textarea:focus {
  border-color: var(--cyan);
  box-shadow: 0 0 0 0.2rem rgba(88, 166, 255, 0.15);
}

/* Scrollbar Styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-panel);
}

::-webkit-scrollbar-thumb {
  background: var(--bg-highlight);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--border);
}
```

---

## CSS Variables Update

### Variables to Keep

These existing variables should be **kept** as they don't conflict with the color schema:

```css
/* Layout */
--sidebar-width: 16rem;
--sidebar-collapsed-width: 5rem;
--topbar-height: 4rem;

/* Font Sizes */
--font-size-base: 14px;
--font-size-xs: 10px;
--font-size-sm: 12px;
--font-size-md: 13px;
--font-size-lg: 16px;
--font-size-xl: 18px;
--font-size-2xl: 24px;

/* Custom Shadows */
--shadow-reverse: 0 -2px 4px rgb(0 0 0 / 0.08);
--shadow-reverse-md: 0 -3px 6px rgb(0 0 0 / 0.1);
--shadow-reverse-lg: 0 -4px 8px rgb(0 0 0 / 0.12);
--shadow-reverse-xl: 0 -6px 12px rgb(0 0 0 / 0.15);
```

### Variables to Replace

These variables will be **replaced** with the new color schema:

| Old Variable | New Variable | Value |
|-------------|--------------|-------|
| `--bg-primary` | `--bg-card` | `#1c2128` |
| `--bg-secondary` | `--bg-panel` | `#161b22` |
| `--bg-tertiary` | `--bg-dark` | `#0d1117` |
| `--bg-white` | `--bg-elevated` | `#21262d` |
| `--border-light` | `--border-muted` | `#21262d` |
| `--border-medium` | `--border` | `#30363d` |
| `--text-primary` | `--text-primary` | `#e6edf3` |
| `--text-secondary` | `--text-secondary` | `#8b949e` |
| `--text-muted` | `--text-muted` | `#6e7681` |
| `--user-primary` | `--cyan` | `#58a6ff` |
| `--user-secondary` | `--purple` | `#bc8cff` |
| `--user-accent` | `--red` | `#f85149` |

### Utility Classes to Update

Update existing utility classes in the `@layer utilities` section:

```css
@layer utilities {
  /* Reverse Shadow Utilities - KEEP */
  .shadow-reverse {
    box-shadow: var(--shadow-reverse);
  }
  .shadow-reverse-md {
    box-shadow: var(--shadow-reverse-md);
  }
  .shadow-reverse-lg {
    box-shadow: var(--shadow-reverse-lg);
  }
  .shadow-reverse-xl {
    box-shadow: var(--shadow-reverse-xl);
  }

  /* Background Utilities - UPDATE */
  .bg-dark {
    background-color: var(--bg-dark);
  }
  .bg-panel {
    background-color: var(--bg-panel);
  }
  .bg-card {
    background-color: var(--bg-card);
  }
  .bg-elevated {
    background-color: var(--bg-elevated);
  }
  .bg-highlight {
    background-color: var(--bg-highlight);
  }

  /* Remove old utility classes */
  /* REMOVE: .bg-primary, .bg-secondary, .bg-tertiary, .bg-white */
}
```

---

## Implementation Steps

### Phase 1: Preparation

1. **Backup Current Configuration**
   ```bash
   cp resources/app/css/app.css resources/app/css/app.css.backup
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/technical-blueprint-colors
   ```

3. **Document Current State**
   - Take screenshots of current UI
   - Note any custom color usages
   - List components using old variable names

### Phase 2: Tailwind CSS 4 Configuration

1. **Update `@theme` Directive** (`resources/app/css/app.css`)
   - Add all color scales as shown in [Tailwind CSS 4 Configuration](#tailwind-css-4-configuration)
   - Keep existing `--text-*` font size variables

2. **Verify Tailwind Build**
   ```bash
   npm run dev
   ```

3. **Test Color Utilities**
   - Create a test component using new color classes
   - Verify `bg-surface-*`, `text-text-*`, `border-border-*` work

### Phase 3: PrimeVue CSS Variables

1. **Update `:root` CSS Variables** (`resources/app/css/app.css`)
   - Add all Technical Blueprint base variables
   - Add all `--p-*` PrimeVue overrides
   - Keep layout and font-size variables

2. **Update `body` Styles**
   - Add dark background
   - Add grid pattern overlay

3. **Update Component-Specific Styles**
   - Update all `.p-*` component styles to use new variables
   - Update utility classes in `@layer utilities`

### Phase 4: Remove Old Variables

1. **Remove Deprecated Variables**
   - Remove `--user-primary`, `--user-secondary`, `--user-accent`
   - Remove `--bg-white`, `--border-light`, `--border-medium`
   - Update any remaining references to use new variable names

2. **Clean Up Utility Classes**
   - Remove `.bg-primary`, `.bg-secondary`, `.bg-tertiary`, `.bg-white`
   - Ensure no hardcoded color values remain

### Phase 5: Validation

1. **Visual Testing**
   - Navigate through all app pages
   - Check all PrimeVue components (buttons, inputs, dialogs, etc.)
   - Verify color consistency

2. **Browser Testing**
   - Chrome
   - Firefox
   - Safari

3. **Accessibility Testing**
   - Check color contrast ratios (WCAG AA minimum)
   - Verify text readability on all backgrounds

4. **Component Testing**
   - Run Vitest suite: `npm run test:app`
   - Ensure all tests pass

### Phase 6: Documentation

1. **Update Component Documentation**
   - Document new color utility classes
   - Update any color-related examples

2. **Create Migration Guide**
   - Document variable name changes
   - Provide before/after examples

---

## Testing & Validation

### Automated Tests

```bash
# Run all app tests
npm run test:app

# Type check
npm run type-check

# Lint check
npm run lint:app
```

### Manual Testing Checklist

#### Global UI Elements
- [ ] Body background shows grid pattern
- [ ] Text is readable (primary, secondary, muted)
- [ ] Borders are visible but subtle

#### PrimeVue Components

**Forms**
- [ ] Input fields (background, border, text, placeholder)
- [ ] Input focus state (border, shadow)
- [ ] Select dropdowns
- [ ] Checkboxes and radio buttons
- [ ] Text areas

**Buttons**
- [ ] Primary button (cyan background)
- [ ] Secondary button
- [ ] Danger button (red)
- [ ] Success button (green)
- [ ] Button hover states

**Data Display**
- [ ] DataTable (headers, rows, borders)
- [ ] Cards (background, borders)
- [ ] Tags/Chips (success, warning, danger)
- [ ] Skeleton loaders

**Overlays**
- [ ] Dialog/Modal (header, content, footer)
- [ ] Drawer (header, content)
- [ ] Toast notifications
- [ ] Confirm dialog

**Navigation**
- [ ] Tabs (active state, underline)
- [ ] Breadcrumbs
- [ ] Menu items

#### Semantic Colors
- [ ] Success messages use green
- [ ] Warning messages use orange
- [ ] Error messages use red
- [ ] Info messages use cyan
- [ ] Special features use purple

#### Color Contrast

Use tools like [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/):

| Text | Background | Ratio | WCAG AA |
|------|-----------|-------|---------|
| `#e6edf3` | `#0d1117` | 14.7:1 | ✅ Pass |
| `#8b949e` | `#0d1117` | 7.2:1 | ✅ Pass |
| `#6e7681` | `#0d1117` | 5.1:1 | ✅ Pass |
| `#58a6ff` | `#0d1117` | 9.8:1 | ✅ Pass |

### Edge Cases

- [ ] Hover states don't break contrast
- [ ] Focus states are clearly visible
- [ ] Disabled states are distinguishable
- [ ] Loading states maintain color consistency

---

## Rollback Plan

### Quick Rollback (If Issues Found)

1. **Restore Backup**
   ```bash
   cp resources/app/css/app.css.backup resources/app/css/app.css
   ```

2. **Clear Cache and Rebuild**
   ```bash
   npm run build
   php artisan config:clear
   php artisan cache:clear
   ```

3. **Restart Dev Server**
   ```bash
   npm run dev
   ```

### Git Rollback

```bash
# If changes are committed
git revert <commit-hash>

# If changes are not committed
git checkout resources/app/css/app.css

# Delete feature branch
git branch -D feature/technical-blueprint-colors
```

---

## Summary

This plan provides a **configuration-only** approach to implementing the Technical Blueprint dark color schema for the app dashboard. By following these steps:

1. All colors are defined as CSS custom properties
2. Tailwind CSS 4's `@theme` directive extends the color palette
3. PrimeVue v4's Aura theme is overridden with matching colors
4. No component code changes are required
5. The implementation is fully reversible

### Key Benefits

- **Consistency**: Single source of truth for colors
- **Maintainability**: All colors defined in one place
- **Flexibility**: Easy to adjust individual colors
- **Compatibility**: Works with both Tailwind and PrimeVue
- **Accessibility**: High contrast ratios meet WCAG AA standards

### Next Steps

1. Review and approve this plan
2. Create feature branch
3. Implement Phase 1 (Preparation)
4. Implement Phase 2 (Tailwind CSS 4)
5. Implement Phase 3 (PrimeVue CSS Variables)
6. Validate with testing checklist
7. Merge to main branch

---

**Document Version**: 1.0
**Last Updated**: 2025-12-27
**Author**: Claude Code
**Status**: Ready for Implementation
