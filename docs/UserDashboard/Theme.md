# User Dashboard Theme & Color Schema

Complete guide to the user dashboard color system and customization options.

## Table of Contents

- [Overview](#overview)
- [Current Color System Architecture](#current-color-system-architecture)
- [Current Color Palette](#current-color-palette)
- [How to Customize Colors](#how-to-customize-colors)
- [Dark Mode Support](#dark-mode-support)
- [Quick Reference](#quick-reference)
- [Recommended Workflow](#recommended-workflow)
- [Important Notes](#important-notes)

## Overview

The user dashboard uses a **three-layer color system** that combines:

1. **CSS Custom Properties** (CSS variables) for brand-specific colors
2. **PrimeVue Aura Theme** for component styling
3. **Tailwind CSS v4** with PrimeUI plugin for utility-first styling

This architecture provides flexibility, consistency, and type-safe customization.

## Current Color System Architecture

### Layer 1: Custom CSS Variables
**File**: `resources/app/css/app.css` (lines 9-26)

Custom variables for brand colors, backgrounds, borders, and text colors. These have the highest priority for custom styling.

### Layer 2: PrimeVue Aura Theme
**File**: `resources/app/js/app.ts` (lines 25-37)

PrimeVue components use CSS variables prefixed with `--p-*`. Currently configured with:
- **Primary**: Emerald palette
- **Surface**: Slate palette (light mode)

### Layer 3: Tailwind CSS v4 with PrimeUI Plugin
Tailwind utilities extended with PrimeVue color tokens via the `tailwindcss-primeui` plugin. Changes to PrimeVue theme automatically reflect in Tailwind utilities.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Component Templates                         │
│  <div class="bg-white text-blue-600 bg-primary">               │
└────────────────────┬───────────────────┬────────────────────────┘
                     │                   │
        ┌────────────▼────────┐   ┌──────▼──────────────────────┐
        │  Tailwind Utilities │   │  Custom CSS Variables       │
        │  - bg-white         │   │  - .bg-primary              │
        │  - text-blue-600    │   │  - var(--user-primary)      │
        │  - color-primary-*  │   │  - var(--bg-secondary)      │
        └────────────┬────────┘   └─────────────────────────────┘
                     │
        ┌────────────▼─────────────────────────────────────────┐
        │         tailwindcss-primeui Plugin                   │
        │  Maps PrimeVue tokens to Tailwind utilities          │
        │  --p-primary-500 → --color-primary                   │
        └────────────┬─────────────────────────────────────────┘
                     │
        ┌────────────▼─────────────────────────────────────────┐
        │         PrimeVue Aura Theme                          │
        │  Component styling via --p-* CSS variables           │
        │  Primary: Emerald (default)                          │
        │  Surface: Slate (light) / Zinc (dark)                │
        └──────────────────────────────────────────────────────┘
```

## Current Color Palette

### 1. Custom CSS Variables

**File**: `resources/app/css/app.css` (lines 9-26)

```css
:root {
  /* Brand Colors */
  --user-primary: #3b82f6;      /* Blue-500 */
  --user-secondary: #8b5cf6;    /* Violet-500 */
  --user-accent: #ef4444;       /* Red-500 */

  /* Light grey/white color scheme */
  --bg-primary: #ffffff;        /* White */
  --bg-secondary: #f9fafb;      /* Gray-50 */
  --bg-tertiary: #f3f4f6;       /* Gray-100 */
  --bg-white: #ffffff;          /* White */

  /* Borders */
  --border-light: #e5e7eb;      /* Gray-200 */
  --border-medium: #d1d5db;     /* Gray-300 */

  /* Text Colors */
  --text-primary: #111827;      /* Gray-900 */
  --text-secondary: #6b7280;    /* Gray-500 */
  --text-muted: #9ca3af;        /* Gray-400 */
}
```

### 2. PrimeVue Aura Theme Colors

**Default Aura Primary Color (Emerald)**:
```javascript
primary: {
  50:  "#ecfdf5",
  100: "#d1fae5",
  200: "#a7f3d0",
  300: "#6ee7b7",
  400: "#34d399",
  500: "#10b981",  // Primary color
  600: "#059669",
  700: "#047857",
  800: "#065f46",
  900: "#064e3b",
  950: "#022c22"
}
```

**Surface Colors (Light Mode - Slate)**:
```javascript
surface: {
  0:   "#ffffff",
  50:  "#f8fafc",
  100: "#f1f5f9",
  200: "#e2e8f0",
  300: "#cbd5e1",
  400: "#94a3b8",
  500: "#64748b",
  600: "#475569",
  700: "#334155",
  800: "#1e293b",
  900: "#0f172a",
  950: "#020617"
}
```

### 3. Component Usage Patterns

Components typically use a mix of:
- Custom CSS variables (`bg-primary`, `var(--user-primary)`)
- Tailwind utilities (`bg-white`, `text-blue-600`, `text-gray-700`)
- PrimeVue component defaults (automatically styled by Aura theme)

## How to Customize Colors

### Method 1: Quick Brand Color Change (Easiest)

**Best for**: Changing brand colors quickly without affecting component library

**File**: `resources/app/css/app.css`
**Lines**: 9-26

**Steps**:
1. Open `resources/app/css/app.css`
2. Find the `:root` block (lines 9-26)
3. Change hex values for your colors
4. Save - Vite HMR will auto-refresh

**Example - Purple/Indigo Theme**:
```css
:root {
  /* Brand Colors */
  --user-primary: #6366f1;      /* Indigo-500 */
  --user-secondary: #8b5cf6;    /* Violet-500 */
  --user-accent: #f43f5e;       /* Rose-500 */

  /* Background Colors */
  --bg-primary: #ffffff;
  --bg-secondary: #faf5ff;      /* Purple-50 */
  --bg-tertiary: #f3e8ff;       /* Purple-100 */

  /* Text Colors */
  --text-primary: #1e1b4b;      /* Indigo-950 */
  --text-secondary: #6366f1;    /* Indigo-500 */
  --text-muted: #a5b4fc;        /* Indigo-300 */
}
```

**Benefits**:
- Quick and simple
- Changes apply globally to custom utilities
- Affects drawer headers, dialog headers, tab states
- No component file changes needed

---

### Method 2: Change PrimeVue Component Colors (Recommended)

**Best for**: Comprehensive theme changes affecting all PrimeVue components

**File**: `resources/app/js/app.ts`
**Lines**: 25-37

**Steps**:
1. Import `definePreset` from `@primevue/themes`
2. Create custom preset based on Aura
3. Override the primary color palette
4. Apply the preset in PrimeVue configuration

**Example - Change to Blue**:
```typescript
import { definePreset } from '@primevue/themes';
import Aura from '@primevue/themes/aura';

// Create custom preset
const MyPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50:  '{blue.50}',
      100: '{blue.100}',
      200: '{blue.200}',
      300: '{blue.300}',
      400: '{blue.400}',
      500: '{blue.500}',
      600: '{blue.600}',
      700: '{blue.700}',
      800: '{blue.800}',
      900: '{blue.900}',
      950: '{blue.950}'
    }
  }
});

app.use(PrimeVue, {
  theme: {
    preset: MyPreset,  // Use custom preset instead of Aura
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

**Available Built-in Color Palettes**:
- emerald (current default)
- green, lime, teal, cyan
- blue, sky, indigo, violet, purple
- red, orange, amber, yellow
- pink, rose, fuchsia
- slate, gray, zinc, neutral, stone

**Benefits**:
- Changes all PrimeVue component colors (buttons, inputs, tables, etc.)
- Automatically affects Tailwind utilities via PrimeUI plugin
- Type-safe with full TypeScript support
- Consistent across entire component library

---

### Method 3: Custom Color Palette (Advanced)

**Best for**: Brand-specific colors that don't match built-in palettes

**File**: `resources/app/js/app.ts`

**Steps**:
1. Define your complete color scale (50-950)
2. Create preset with custom hex values
3. Apply the preset

**Example - Completely Custom Brand Colors**:
```typescript
import { definePreset } from '@primevue/themes';
import Aura from '@primevue/themes/aura';

const MyPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50:  '#fef2f4',
      100: '#fde6e9',
      200: '#fbd0d9',
      300: '#f7aab9',
      400: '#f27a93',
      500: '#e8486d',   // Your exact brand color
      600: '#d4285b',
      700: '#b11e4b',
      800: '#941c46',
      900: '#7e1b41',
      950: '#460a20'
    },
    colorScheme: {
      light: {
        primary: {
          color: '{primary.500}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.600}',
          activeColor: '{primary.700}'
        }
      }
    }
  }
});

app.use(PrimeVue, {
  theme: {
    preset: MyPreset,
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

**Color Scale Generator**: Use tools like [UI Colors](https://uicolors.app/) or [Tailwind Shades](https://www.tints.dev/) to generate a full 50-950 scale from your brand color.

**Benefits**:
- Complete control over exact brand colors
- Maintains consistency across all shade levels
- Professional color scale with proper contrast ratios

---

### Method 4: Add Custom Tailwind Colors

**Best for**: Adding new color utilities beyond primary/secondary

**File**: `resources/app/css/app.css`

**Steps**:
1. Add `@theme` directive with custom colors
2. Define color variables following Tailwind v4 convention
3. Use in component templates

**Example**:
```css
@theme {
  /* Custom brand colors */
  --color-brand-light: #e0f2fe;
  --color-brand-DEFAULT: #0ea5e9;
  --color-brand-dark: #0c4a6e;

  /* Custom accent colors */
  --color-accent-50: #fef2f2;
  --color-accent-500: #ef4444;
  --color-accent-900: #7f1d1d;
}
```

**Usage in components**:
```vue
<template>
  <div class="bg-brand text-brand-dark">
    Brand colored element
  </div>
  <button class="bg-accent-500 hover:bg-accent-900">
    Accent button
  </button>
</template>
```

**Benefits**:
- Extends Tailwind's utility classes
- Works seamlessly with existing Tailwind utilities
- No additional imports needed

---

## Dark Mode Support

The application is configured for dark mode but not currently active.

**Configuration** (`resources/app/js/app.ts` line 30):
```typescript
darkModeSelector: '.dark'
```

### Enabling Dark Mode

**Option A: Manual Toggle**

Add the `dark` class to the root element:
```html
<html class="dark">
```

**Option B: Define Dark Mode Variables**

Add dark mode color overrides in `resources/app/css/app.css`:

```css
:root.dark {
  /* Dark backgrounds */
  --bg-primary: #18181b;        /* Zinc-900 */
  --bg-secondary: #27272a;      /* Zinc-800 */
  --bg-tertiary: #3f3f46;       /* Zinc-700 */
  --bg-white: #09090b;          /* Zinc-950 */

  /* Dark borders */
  --border-light: #3f3f46;      /* Zinc-700 */
  --border-medium: #52525b;     /* Zinc-600 */

  /* Dark text */
  --text-primary: #fafafa;      /* Zinc-50 */
  --text-secondary: #a1a1aa;    /* Zinc-400 */
  --text-muted: #71717a;        /* Zinc-500 */

  /* Dark brand colors (optional - adjust for dark mode) */
  --user-primary: #60a5fa;      /* Blue-400 (lighter for dark) */
  --user-secondary: #a78bfa;    /* Violet-400 */
}
```

**Option C: Implement Dark Mode Toggle**

Create a composable or component to toggle the `dark` class:

```typescript
// composables/useDarkMode.ts
import { ref, watch, onMounted } from 'vue';

export function useDarkMode() {
  const isDark = ref(false);

  const toggleDark = () => {
    isDark.value = !isDark.value;
    document.documentElement.classList.toggle('dark', isDark.value);
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
  };

  onMounted(() => {
    const savedTheme = localStorage.getItem('theme');
    isDark.value = savedTheme === 'dark';
    document.documentElement.classList.toggle('dark', isDark.value);
  });

  return { isDark, toggleDark };
}
```

### PrimeVue Dark Mode

PrimeVue Aura theme automatically provides dark mode variants for all components when the `.dark` class is present. No additional configuration needed.

---

## Quick Reference

### Files to Modify

| Goal | File | Location | What to Change |
|------|------|----------|----------------|
| **Change custom brand colors** | `resources/app/css/app.css` | Lines 9-26 | CSS variables in `:root` block |
| **Change PrimeVue component colors** | `resources/app/js/app.ts` | Lines 25-37 | Theme preset configuration |
| **Add custom Tailwind colors** | `resources/app/css/app.css` | Add new section | `@theme` directive with `--color-*` variables |
| **Customize component styles** | `resources/app/css/app.css` | Lines 86-170 | PrimeVue component overrides |
| **Enable dark mode** | `resources/app/css/app.css` | Add new section | `:root.dark` block with dark colors |
| **Change font** | `resources/app/css/app.css` | Lines 2, 46 | Google Fonts import and body font-family |

### Color Variable Usage

| Variable | Purpose | Default Value | Used In |
|----------|---------|---------------|---------|
| `--user-primary` | Main brand color | `#3b82f6` (Blue-500) | Buttons, links, active states |
| `--user-secondary` | Secondary brand color | `#8b5cf6` (Violet-500) | Accents, highlights |
| `--user-accent` | Accent/alert color | `#ef4444` (Red-500) | Errors, warnings, critical actions |
| `--bg-primary` | Primary background | `#ffffff` (White) | Main content areas |
| `--bg-secondary` | Secondary background | `#f9fafb` (Gray-50) | Panels, cards |
| `--bg-tertiary` | Tertiary background | `#f3f4f6` (Gray-100) | Headers, sidebars, drawers |
| `--text-primary` | Primary text | `#111827` (Gray-900) | Headings, body text |
| `--text-secondary` | Secondary text | `#6b7280` (Gray-500) | Captions, labels |
| `--text-muted` | Muted text | `#9ca3af` (Gray-400) | Placeholders, disabled text |
| `--border-light` | Light borders | `#e5e7eb` (Gray-200) | Dividers, card borders |
| `--border-medium` | Medium borders | `#d1d5db` (Gray-300) | Input borders, stronger dividers |

---

## Recommended Workflow

### Quick Brand Color Update (5-10 minutes)

1. **Update CSS Variables**
   - Open `resources/app/css/app.css`
   - Modify `:root` variables (lines 9-26)
   - Change `--user-primary`, `--user-secondary`, `--user-accent`

2. **Test in Browser**
   - Vite HMR will auto-refresh
   - Check buttons, links, active states

3. **Verify Consistency**
   - Check all major views (dashboard, tables, forms)
   - Ensure colors work well together

### Comprehensive Theme Customization (30-60 minutes)

1. **Plan Your Color Palette**
   - Choose primary color family (blue, purple, green, etc.)
   - Generate full color scale (50-950) using [UI Colors](https://uicolors.app/)
   - Define surface/background colors
   - Ensure WCAG 2.1 AA contrast ratios

2. **Update PrimeVue Theme**
   - Open `resources/app/js/app.ts`
   - Create custom preset with `definePreset()`
   - Set primary colors to your palette
   - Test with PrimeVue components

3. **Update CSS Variables**
   - Open `resources/app/css/app.css`
   - Align custom variables with your palette
   - Update background, border, text colors
   - Add dark mode variables if needed

4. **Test All Components**
   - Buttons (primary, secondary, text)
   - Form inputs (text, dropdown, checkbox)
   - Data tables
   - Dialogs and drawers
   - Navigation elements
   - Toast notifications

5. **Verify Accessibility**
   - Check color contrast ratios ([WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/))
   - Test with screen readers if possible
   - Verify focus states are visible

6. **Run Quality Checks**
   ```bash
   npm run type-check  # TypeScript validation
   npm run lint:user   # ESLint check
   npm run format:user # Prettier formatting
   npm run test:user   # Run tests
   ```

7. **Test Dark Mode** (if implemented)
   - Toggle dark mode on/off
   - Verify all components in both modes
   - Check contrast ratios in dark mode

---

## Important Notes

### Tailwind CSS v4
This project uses **Tailwind CSS v4**, which **does not use `tailwind.config.js`**. All configuration is done via:
- CSS `@theme` directive in `app.css`
- CSS custom properties
- PrimeUI plugin integration

### PrimeUI Plugin Auto-Sync
The `tailwindcss-primeui` plugin automatically synchronizes PrimeVue color tokens with Tailwind utilities. Changes to PrimeVue theme colors will automatically affect Tailwind utility classes like `color-primary-*`.

### CSS Variable Scope
Custom CSS variables defined in `:root` have global scope and can be used anywhere in the application via `var(--variable-name)`.

### Component Consistency
When changing colors, ensure you update:
1. CSS variables (`:root` block)
2. PrimeVue theme preset (if needed)
3. Any hardcoded Tailwind utilities in components (if needed)

### Accessibility Standards
Always verify color contrast ratios meet **WCAG 2.1 AA** standards:
- **Normal text**: 4.5:1 minimum contrast ratio
- **Large text** (18pt+ or 14pt+ bold): 3:1 minimum contrast ratio
- **UI components**: 3:1 minimum contrast ratio

Use [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) to verify.

### Font Customization
The application currently uses **Zalando Sans** from Google Fonts. To change:
1. Update `@import` on line 2 of `resources/app/css/app.css`
2. Update `font-family` on line 46

Example:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}
```

---

## Additional Resources

### Official Documentation
- [PrimeVue Theming](https://primevue.org/theming/)
- [PrimeVue Aura Theme](https://primevue.org/themes/aura/)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs/v4-beta)
- [Vue 3 Style Guide](https://vuejs.org/style-guide/)

### Color Tools
- [UI Colors](https://uicolors.app/) - Generate Tailwind color scales
- [Tailwind Shades](https://www.tints.dev/) - Color palette generator
- [Coolors](https://coolors.co/) - Color scheme generator
- [Adobe Color](https://color.adobe.com/) - Color wheel and harmony rules

### Accessibility Tools
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Accessible Colors](https://accessible-colors.com/)
- [Color Contrast Analyzer](https://www.tpgi.com/color-contrast-checker/)

### Design Resources
- [Material Design Color System](https://m2.material.io/design/color/)
- [Refactoring UI](https://www.refactoringui.com/) - Design tips
- [Laws of UX](https://lawsofux.com/) - Design principles

---

## Summary

The user dashboard theme system is architected with three independent but integrated layers:

1. **Custom CSS Variables** - Quick brand customization and overrides
2. **PrimeVue Aura Theme** - Component library styling (Emerald primary, Slate surfaces)
3. **Tailwind CSS v4 with PrimeUI Plugin** - Utility-first styling with auto-sync

**For most customization needs**, you can:
- Modify CSS variables in `app.css` for quick brand color changes
- Create a custom PrimeVue preset in `app.ts` for comprehensive theme updates

Both approaches are **type-safe**, **maintainable**, and support **dark mode** out of the box.
