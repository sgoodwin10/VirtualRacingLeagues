# VRL Velocity Design System - FOUNDATION Layer Plan

**Version:** 1.0
**Date:** 2026-01-18
**Status:** Planning
**Target File:** `resources/public/css/app.css`

---

## Overview

This document outlines the implementation plan for the FOUNDATION layer of the VRL Velocity Design System. The foundation layer establishes the core design tokens, CSS variables, Tailwind v4 theme configuration, typography system, and utility classes that will be used throughout the public-facing VRL application.

**Design Philosophy:** "Velocity" - A technical blueprint aesthetic featuring dark backgrounds, grid patterns, the Orbitron display font, and cyan-to-purple accent colors for a modern racing platform.

---

## 1. CSS Variables (`:root` scope)

Add the following CSS custom properties to the `:root` selector in `resources/public/css/app.css`. These variables will be available globally via `var()` syntax and will also map to Tailwind utilities.

### 1.1 Background Colors
```css
/* Background Colors - Progressive depth layers */
--bg-dark: #0d1117;        /* Base/body background */
--bg-panel: #161b22;       /* Panel/container background */
--bg-card: #1c2128;        /* Card background */
--bg-elevated: #21262d;    /* Elevated elements (hover states, dropdowns) */
--bg-highlight: #272d36;   /* Highlighted/active states */
```

**Usage:**
- `--bg-dark`: Main body background, deepest layer
- `--bg-panel`: Navigation panels, sidebars, header/footer
- `--bg-card`: Content cards, data containers
- `--bg-elevated`: Hover states, elevated UI elements
- `--bg-highlight`: Active/selected states, tooltips

### 1.2 Text Colors
```css
/* Text Colors - Hierarchy from primary to muted */
--text-primary: #e6edf3;   /* Primary body text, headings */
--text-secondary: #8b949e; /* Secondary text, labels */
--text-muted: #6e7681;     /* Tertiary text, placeholders, disabled states */
```

**Usage:**
- `--text-primary`: Main content, headings, important text
- `--text-secondary`: Supporting text, labels, metadata
- `--text-muted`: Placeholders, disabled text, de-emphasized content

### 1.3 Border Colors
```css
/* Border Colors */
--border: #30363d;         /* Default borders */
--border-muted: #21262d;   /* Subtle borders, dividers */
```

**Usage:**
- `--border`: Standard component borders, cards, inputs
- `--border-muted`: Subtle dividers, internal borders

### 1.4 Accent Colors
```css
/* Accent Colors - Brand and semantic colors */
--cyan: #58a6ff;    /* Primary accent, links, info */
--green: #7ee787;   /* Success states */
--orange: #f0883e;  /* Warning states */
--red: #f85149;     /* Error/danger states */
--purple: #bc8cff;  /* Special highlights */
--yellow: #d29922;  /* Podium/first place highlights */
```

**Usage:**
- `--cyan`: Primary brand color, links, interactive elements
- `--green`: Success messages, positive indicators
- `--orange`: Warnings, pending states
- `--red`: Errors, destructive actions
- `--purple`: Special features, gradients
- `--yellow`: Podium highlighting, achievements

### 1.5 Dim Variants (15% opacity)
```css
/* Dim Variants - Transparent backgrounds for badges, highlights */
--cyan-dim: rgba(88, 166, 255, 0.15);
--green-dim: rgba(126, 231, 135, 0.15);
--orange-dim: rgba(240, 136, 62, 0.15);
--red-dim: rgba(248, 81, 73, 0.15);
--purple-dim: rgba(188, 140, 255, 0.15);
--yellow-dim: rgba(210, 153, 34, 0.15);
```

**Usage:**
- Badge backgrounds
- Focus states
- Hover highlights
- Alert backgrounds
- Subtle status indicators

### 1.6 Typography
```css
/* Typography - Font families */
--font-display: 'Orbitron', sans-serif;  /* Headings, labels, display text */
--font-body: 'Inter', sans-serif;        /* Body text, paragraphs */
```

**Note:** Fonts must be loaded via `resources/views/public.blade.php`:
```html
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
```

### 1.7 Border Radius
```css
/* Border Radius - Consistent rounding scale */
--radius-sm: 4px;
--radius: 6px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-pill: 100px;  /* Fully rounded (badges, pills) */
```

**Usage:**
- `--radius-sm`: Tags, small badges
- `--radius`: Buttons, inputs, cards (default)
- `--radius-md`: Medium cards
- `--radius-lg`: Large cards, modals
- `--radius-xl`: Hero sections, feature cards
- `--radius-pill`: Badges, status indicators

### 1.8 Transitions
```css
/* Transitions - Consistent animation timing */
--transition: all 0.3s ease;
```

**Usage:** Apply to all interactive elements (buttons, cards, links) for smooth state transitions.

---

## 2. Tailwind v4 @theme Configuration

Add the following `@theme` block to map CSS variables to Tailwind v4 utilities. This enables usage like `bg-cyan-500`, `text-primary`, etc.

```css
@theme {
  /* ============================================
     Font Families
     ============================================ */
  --font-display: 'Orbitron', sans-serif;
  --font-body: 'Inter', sans-serif;

  /* Map to Tailwind font utilities */
  --font-family-display: var(--font-display);
  --font-family-sans: var(--font-body);

  /* ============================================
     Color Scales
     ============================================ */

  /* Cyan Scale (Primary/Info) */
  --color-cyan-50: #eff6ff;
  --color-cyan-100: #dbeafe;
  --color-cyan-200: #bfdbfe;
  --color-cyan-300: #93c5fd;
  --color-cyan-400: #60a5fa;
  --color-cyan-500: #58a6ff;  /* Main cyan */
  --color-cyan-600: #3b82f6;
  --color-cyan-700: #2563eb;
  --color-cyan-800: #1e40af;
  --color-cyan-900: #1e3a8a;

  /* Green Scale (Success) */
  --color-green-50: #f0fdf4;
  --color-green-100: #dcfce7;
  --color-green-200: #bbf7d0;
  --color-green-300: #86efac;
  --color-green-400: #7ee787;  /* Main green */
  --color-green-500: #4ade80;
  --color-green-600: #22c55e;
  --color-green-700: #16a34a;
  --color-green-800: #15803d;
  --color-green-900: #166534;

  /* Orange Scale (Warning) */
  --color-orange-50: #fff7ed;
  --color-orange-100: #ffedd5;
  --color-orange-200: #fed7aa;
  --color-orange-300: #fdba74;
  --color-orange-400: #fb923c;
  --color-orange-500: #f0883e;  /* Main orange */
  --color-orange-600: #ea580c;
  --color-orange-700: #c2410c;
  --color-orange-800: #9a3412;
  --color-orange-900: #7c2d12;

  /* Red Scale (Error/Danger) */
  --color-red-50: #fef2f2;
  --color-red-100: #fee2e2;
  --color-red-200: #fecaca;
  --color-red-300: #fca5a5;
  --color-red-400: #f87171;
  --color-red-500: #f85149;  /* Main red */
  --color-red-600: #dc2626;
  --color-red-700: #b91c1c;
  --color-red-800: #991b1b;
  --color-red-900: #7f1d1d;

  /* Purple Scale (Special) */
  --color-purple-50: #faf5ff;
  --color-purple-100: #f3e8ff;
  --color-purple-200: #e9d5ff;
  --color-purple-300: #d8b4fe;
  --color-purple-400: #c084fc;
  --color-purple-500: #bc8cff;  /* Main purple */
  --color-purple-600: #a855f7;
  --color-purple-700: #9333ea;
  --color-purple-800: #7e22ce;
  --color-purple-900: #6b21a8;

  /* Yellow Scale (Highlight) */
  --color-yellow-50: #fefce8;
  --color-yellow-100: #fef9c3;
  --color-yellow-200: #fef08a;
  --color-yellow-300: #fde047;
  --color-yellow-400: #facc15;
  --color-yellow-500: #d29922;  /* Main yellow */
  --color-yellow-600: #ca8a04;
  --color-yellow-700: #a16207;
  --color-yellow-800: #854d0e;
  --color-yellow-900: #713f12;

  /* Surface Scale (Background variations) */
  --color-surface-50: #272d36;   /* Lightest background */
  --color-surface-100: #21262d;
  --color-surface-200: #1c2128;
  --color-surface-300: #161b22;
  --color-surface-400: #0d1117;  /* Darkest background */
  --color-surface-500: #0d1117;
  --color-surface-600: #0d1117;
  --color-surface-700: #0d1117;
  --color-surface-800: #0d1117;
  --color-surface-900: #0d1117;

  /* Text color tokens */
  --color-text-primary: #e6edf3;
  --color-text-secondary: #8b949e;
  --color-text-muted: #6e7681;

  /* Border color tokens */
  --color-border-default: #30363d;
  --color-border-muted: #21262d;
}
```

**Tailwind Usage Examples:**
- `bg-cyan-500` → `#58a6ff`
- `text-green-400` → `#7ee787`
- `border-border-default` → `#30363d`
- `font-display` → Orbitron font
- `font-sans` → Inter font

---

## 3. Base Styles

Apply foundational styles to HTML elements to establish the Velocity design aesthetic.

### 3.1 Body Element
```css
body {
  font-family: var(--font-body);
  background: var(--bg-dark);
  color: var(--text-primary);
  line-height: 1.6;
  margin: 0;
  padding: 0;
}
```

### 3.2 Grid Pattern Background
Add a subtle grid pattern overlay to create the "technical blueprint" aesthetic:

```css
body {
  /* Grid Pattern Overlay */
  background-image:
    linear-gradient(rgba(88, 166, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(88, 166, 255, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
}
```

**Alternative:** Create a utility class for reusable grid backgrounds:
```css
.bg-grid {
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(rgba(88, 166, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(88, 166, 255, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
  z-index: 0;
}
```

### 3.3 Heading Typography
```css
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display);
  color: var(--text-primary);
  font-weight: 600;
  letter-spacing: 0.5px;
  line-height: 1.2;
}

h1 {
  font-size: 3rem;      /* 48px - Hero titles */
  font-weight: 800;
  letter-spacing: 2px;
}

h2 {
  font-size: 2rem;      /* 32px - Section headers */
  font-weight: 700;
  letter-spacing: 1px;
}

h3 {
  font-size: 1.5rem;    /* 24px - Subsection headers */
  font-weight: 600;
  letter-spacing: 1px;
}

h4 {
  font-size: 1.25rem;   /* 20px - Card titles */
  font-weight: 600;
  letter-spacing: 0.5px;
}

h5 {
  font-size: 1rem;      /* 16px */
  font-weight: 600;
}

h6 {
  font-size: 0.875rem;  /* 14px */
  font-weight: 600;
}
```

### 3.4 Scrollbar Styling
```css
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

### 3.5 Focus States (Accessibility)
```css
:focus-visible {
  outline: 2px solid var(--cyan);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
```

### 3.6 Selection Highlight
```css
::selection {
  background: var(--cyan-dim);
  color: var(--cyan);
}
```

---

## 4. Typography Utility Classes

Create semantic typography classes for consistent text styling across the application.

### 4.1 Display Headings
```css
@layer utilities {
  /* Display H1 - Hero/Page titles */
  .text-display-h1 {
    font-family: var(--font-display);
    font-size: 3rem;        /* 48px */
    font-weight: 800;
    letter-spacing: 2px;
    line-height: 1.1;
    color: var(--text-primary);
  }

  /* Display H2 - Major section headers */
  .text-display-h2 {
    font-family: var(--font-display);
    font-size: 2rem;        /* 32px */
    font-weight: 700;
    letter-spacing: 1px;
    line-height: 1.2;
    color: var(--text-primary);
  }

  /* Display H3 - Subsection headers */
  .text-display-h3 {
    font-family: var(--font-display);
    font-size: 1.5rem;      /* 24px */
    font-weight: 600;
    letter-spacing: 1px;
    line-height: 1.3;
    color: var(--text-primary);
  }
}
```

### 4.2 Section & Card Titles
```css
@layer utilities {
  /* Section Title */
  .text-section-title {
    font-family: var(--font-display);
    font-size: 1.25rem;     /* 20px */
    font-weight: 600;
    letter-spacing: 0.5px;
    color: var(--text-primary);
  }

  /* Card Title */
  .text-card-title {
    font-family: var(--font-display);
    font-size: 1rem;        /* 16px */
    font-weight: 600;
    letter-spacing: 0.5px;
    color: var(--text-primary);
  }
}
```

### 4.3 Body Text
```css
@layer utilities {
  /* Body Text - Primary */
  .text-body {
    font-family: var(--font-body);
    font-size: 1rem;        /* 16px */
    font-weight: 400;
    line-height: 1.6;
    color: var(--text-primary);
  }

  /* Body Text - Secondary */
  .text-body-secondary {
    font-family: var(--font-body);
    font-size: 0.9rem;      /* 14.4px */
    font-weight: 400;
    line-height: 1.6;
    color: var(--text-secondary);
  }

  /* Small Text */
  .text-small {
    font-family: var(--font-body);
    font-size: 0.85rem;     /* 13.6px */
    font-weight: 400;
    line-height: 1.5;
    color: var(--text-muted);
  }
}
```

### 4.4 Label Text
```css
@layer utilities {
  /* Label - Uppercase, tracked */
  .text-label {
    font-family: var(--font-display);
    font-size: 0.75rem;     /* 12px */
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--cyan);
  }
}
```

### 4.5 Gradient Text
```css
@layer utilities {
  /* Gradient Text - Cyan to Purple */
  .text-gradient {
    background: linear-gradient(135deg, var(--cyan), var(--purple));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}
```

**Usage:**
```html
<h1 class="text-display-h1 text-gradient">VRL Racing League</h1>
```

---

## 5. Color Utility Classes

Create utility classes for applying accent colors to text and backgrounds.

### 5.1 Text Color Utilities
```css
@layer utilities {
  .text-cyan { color: var(--cyan); }
  .text-green { color: var(--green); }
  .text-orange { color: var(--orange); }
  .text-red { color: var(--red); }
  .text-purple { color: var(--purple); }
  .text-yellow { color: var(--yellow); }

  .text-primary { color: var(--text-primary); }
  .text-secondary { color: var(--text-secondary); }
  .text-muted { color: var(--text-muted); }
}
```

### 5.2 Background Color Utilities
```css
@layer utilities {
  /* Solid Backgrounds */
  .bg-dark { background-color: var(--bg-dark); }
  .bg-panel { background-color: var(--bg-panel); }
  .bg-card { background-color: var(--bg-card); }
  .bg-elevated { background-color: var(--bg-elevated); }
  .bg-highlight { background-color: var(--bg-highlight); }

  /* Dim (Transparent) Backgrounds */
  .bg-cyan-dim { background-color: var(--cyan-dim); }
  .bg-green-dim { background-color: var(--green-dim); }
  .bg-orange-dim { background-color: var(--orange-dim); }
  .bg-red-dim { background-color: var(--red-dim); }
  .bg-purple-dim { background-color: var(--purple-dim); }
  .bg-yellow-dim { background-color: var(--yellow-dim); }
}
```

### 5.3 Border Color Utilities
```css
@layer utilities {
  .border-default { border-color: var(--border); }
  .border-muted { border-color: var(--border-muted); }
  .border-cyan { border-color: var(--cyan); }
  .border-green { border-color: var(--green); }
  .border-orange { border-color: var(--orange); }
  .border-red { border-color: var(--red); }
}
```

---

## 6. Font Family Utilities

```css
@layer utilities {
  .font-display { font-family: var(--font-display); }
  .font-body { font-family: var(--font-body); }
}
```

**Usage:**
```html
<h2 class="font-display">Championship Standings</h2>
<p class="font-body">Race results for Round 5.</p>
```

---

## 7. Grid Pattern Background Utility

Create a reusable grid pattern background for sections/components.

```css
@layer utilities {
  .bg-grid {
    background-image:
      linear-gradient(rgba(88, 166, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(88, 166, 255, 0.03) 1px, transparent 1px);
    background-size: 40px 40px;
  }
}
```

**Alternative Fixed Grid:**
```css
@layer utilities {
  .bg-grid-fixed {
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(88, 166, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(88, 166, 255, 0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    z-index: -1;
  }
}
```

**Usage:**
```html
<div class="bg-grid-fixed"></div>
<section class="bg-panel bg-grid">
  <!-- Content -->
</section>
```

---

## 8. Implementation Checklist

### Phase 1: Setup & Variables
- [ ] Add Google Fonts link to `resources/views/public.blade.php`
- [ ] Create `:root` CSS variables in `resources/public/css/app.css`
- [ ] Verify variable naming matches design HTML exactly

### Phase 2: Tailwind Theme Configuration
- [ ] Add `@theme` block with color scales
- [ ] Map font families to Tailwind utilities
- [ ] Test Tailwind utilities (`bg-cyan-500`, `text-primary`, etc.)

### Phase 3: Base Styles
- [ ] Style `body` element with background, font, grid pattern
- [ ] Style headings (`h1`-`h6`) with Orbitron font
- [ ] Add scrollbar styling
- [ ] Add focus states for accessibility
- [ ] Add selection highlight

### Phase 4: Typography Utilities
- [ ] Create display heading classes (`.text-display-h1`, etc.)
- [ ] Create section/card title classes
- [ ] Create body text classes
- [ ] Create label text class
- [ ] Create gradient text class
- [ ] Test typography across sample components

### Phase 5: Color & Background Utilities
- [ ] Create text color utilities
- [ ] Create background utilities (solid + dim)
- [ ] Create border color utilities
- [ ] Create font family utilities
- [ ] Create grid background utility

### Phase 6: Testing & Validation
- [ ] Build CSS with Vite (`npm run build`)
- [ ] Test all utilities in browser
- [ ] Verify color contrast (WCAG AA compliance)
- [ ] Test responsive behavior
- [ ] Test dark mode consistency
- [ ] Validate against design HTML reference

---

## 9. File Structure

```
resources/public/css/
├── app.css                      # Main entry point
│   ├── @import 'tailwindcss'
│   ├── @plugin 'tailwindcss-primeui'
│   ├── :root { ... }            # CSS variables
│   ├── @theme { ... }           # Tailwind v4 theme
│   ├── body { ... }             # Base styles
│   ├── h1, h2, ... { ... }      # Heading styles
│   ├── ::-webkit-scrollbar { ... }  # Scrollbar
│   ├── @layer utilities { ... } # Custom utilities
```

---

## 10. Design Tokens Reference

### Color Palette
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-dark` | `#0d1117` | Body background |
| `--bg-panel` | `#161b22` | Panels, sidebars |
| `--bg-card` | `#1c2128` | Cards, containers |
| `--bg-elevated` | `#21262d` | Hover, elevated elements |
| `--bg-highlight` | `#272d36` | Active, selected states |
| `--text-primary` | `#e6edf3` | Primary text |
| `--text-secondary` | `#8b949e` | Secondary text |
| `--text-muted` | `#6e7681` | Muted text, placeholders |
| `--border` | `#30363d` | Default borders |
| `--border-muted` | `#21262d` | Subtle borders |
| `--cyan` | `#58a6ff` | Primary accent, links |
| `--green` | `#7ee787` | Success |
| `--orange` | `#f0883e` | Warning |
| `--red` | `#f85149` | Error |
| `--purple` | `#bc8cff` | Special |
| `--yellow` | `#d29922` | Podium/highlight |

### Typography Scale
| Class | Font | Size | Weight | Tracking |
|-------|------|------|--------|----------|
| `.text-display-h1` | Orbitron | 48px | 800 | 2px |
| `.text-display-h2` | Orbitron | 32px | 700 | 1px |
| `.text-display-h3` | Orbitron | 24px | 600 | 1px |
| `.text-section-title` | Orbitron | 20px | 600 | 0.5px |
| `.text-card-title` | Orbitron | 16px | 600 | 0.5px |
| `.text-body` | Inter | 16px | 400 | 0 |
| `.text-body-secondary` | Inter | 14.4px | 400 | 0 |
| `.text-small` | Inter | 13.6px | 400 | 0 |
| `.text-label` | Orbitron | 12px | 600 | 2px (uppercase) |

### Border Radius Scale
| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Tags, badges |
| `--radius` | 6px | Buttons, inputs, default |
| `--radius-md` | 8px | Medium cards |
| `--radius-lg` | 12px | Large cards, modals |
| `--radius-xl` | 16px | Hero sections |
| `--radius-pill` | 100px | Fully rounded badges |

---

## 11. Next Steps (Not in This Phase)

The following will be implemented in subsequent phases:
- Component styles (buttons, cards, forms, tables, etc.)
- Layout utilities (containers, grids, flexbox)
- Animation/transition utilities
- Responsive breakpoints
- PrimeVue component overrides
- Dark mode variants (if applicable)

---

## 12. Validation Criteria

Before marking this phase as complete:
1. All CSS variables defined and match design HTML exactly
2. Tailwind `@theme` configuration maps all color scales correctly
3. Base styles applied to `body`, headings, scrollbars, focus states
4. All typography utility classes created and tested
5. All color utility classes created and tested
6. Grid background pattern works correctly
7. No console errors or warnings in browser
8. CSS builds successfully with Vite
9. All fonts load from Google Fonts CDN
10. Design matches reference HTML (`index.html`) for foundation elements

---

## 13. Notes & Considerations

### Font Loading
- Fonts loaded via `<link>` in `resources/views/public.blade.php`
- Alternative: Self-host fonts in `public/fonts/` for better performance
- Consider font-display: swap for faster initial render

### CSS Variable Naming
- Follow exact naming from design HTML for consistency
- Use `--bg-*` for backgrounds, `--text-*` for text, `--border-*` for borders
- Use `--color-*` prefix for Tailwind theme tokens

### Tailwind v4 Compatibility
- Use `@theme` directive instead of `tailwind.config.js`
- Use `@layer utilities` for custom utilities
- Leverage CSS variables for dynamic theming

### Accessibility
- Ensure color contrast ratios meet WCAG AA standards (4.5:1 for normal text)
- Test focus states with keyboard navigation
- Verify screen reader compatibility

### Performance
- Minimize CSS custom properties for better browser performance
- Use Tailwind's JIT mode for optimal bundle size
- Consider critical CSS extraction for above-the-fold content

### Browser Support
- Target modern browsers (Chrome 90+, Firefox 88+, Safari 14+)
- CSS variables have 96%+ global support
- Test scrollbar styling in Firefox (uses different syntax)

---

## 14. References

- **Design HTML:** `/var/www/docs/PublicDashboard/design-2026/design-1-velocity/components/index.html`
- **App CSS Reference:** `/var/www/resources/app/css/app.css`
- **Tailwind v4 Docs:** https://tailwindcss.com/docs (v4 beta)
- **Google Fonts:** https://fonts.google.com/
- **Orbitron Font:** https://fonts.google.com/specimen/Orbitron
- **Inter Font:** https://fonts.google.com/specimen/Inter

---

**End of Foundation Plan**
